import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { gerarCodigoChamado } from "@/app/actions/tickets";

export async function GET(request: Request) {
  // Proteção simples: verificar um token na URL para evitar disparos acidentais
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== process.env.CRON_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hoje = new Date();

  const preventivasParaRodar = await prisma.preventiva.findMany({
    where: { proximaExecucao: { lte: hoje }, ativa: true },
    include: { tipo: true },
  });

  let processedCount = 0;

  for (const prev of preventivasParaRodar) {
    await prisma.$transaction(async (tx: any) => {
      // Create code
      let codigo = await gerarCodigoChamado();
      let existe = await tx.chamado.findUnique({ where: { codigo } });
      while (existe) {
        codigo = await gerarCodigoChamado();
        existe = await tx.chamado.findUnique({ where: { codigo } });
      }

      const horas = prev.tipo?.tempoSlaHoras || 24;
      const dataVencimento = new Date();
      dataVencimento.setHours(dataVencimento.getHours() + horas);

      // Search for "sistema" user to be the creator
      const sistemaUser = await tx.usuario.findFirst({ where: { login: "sistema" } });
      const criadorId = sistemaUser ? sistemaUser.id : 1;

      // 1. Cria o chamado baseado na preventiva
      const ticket = await tx.chamado.create({
        data: {
          codigo,
          titulo: prev.titulo,
          descricao: prev.descricao,
          tecnicoId: prev.tecnicoId,
          usuarioCriacaoId: criadorId,
          tipoId: prev.tipoId,
          localId: prev.localId,
          departamentoDestinoId: prev.departamentoDestinoId,
          status: "EM_ATENDIMENTO",
          dataVencimento,
        },
      });

      // Copia ações padrão
      const acoesPadrao = await tx.acao.findMany({ where: { tipoId: prev.tipoId, ativo: true } });
      if (acoesPadrao.length > 0) {
        await tx.chamadoAcao.createMany({
          data: acoesPadrao.map((acao: any) => ({
            chamadoId: ticket.id,
            acaoId: acao.id,
            realizado: false,
          })),
        });
      }

      // 2. Calcula a próxima data
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + prev.frequenciaDias);

      await tx.preventiva.update({
        where: { id: prev.id },
        data: { proximaExecucao: novaData },
      });

      processedCount++;
    });
  }

  return NextResponse.json({ processed: processedCount });
}
