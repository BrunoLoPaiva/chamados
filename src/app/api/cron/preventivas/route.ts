import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { gerarCodigoChamado } from "@/app/actions/tickets";
import { calcularDataVencimentoSLA } from "@/app/actions/feriados"; // <-- NOVA IMPORTAÇÃO

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
    const errors = [];

    let sistemaUser = await prisma.usuario.findFirst({
      where: { login: "sistema" },
    });

    if (!sistemaUser) {
      sistemaUser = await prisma.usuario.findFirst({ where: { ativo: true } });
    }

    if (!sistemaUser) {
      return NextResponse.json(
        { error: "Nenhum usuário válido encontrado para criar o chamado." },
        { status: 500 },
      );
    }

    const criadorId = sistemaUser.id;

    for (const prev of preventivasParaRodar) {
      try {
        await prisma.$transaction(async (tx: any) => {
          let codigo = await gerarCodigoChamado();
          let existe = await tx.chamado.findUnique({ where: { codigo } });
          while (existe) {
            codigo = await gerarCodigoChamado();
            existe = await tx.chamado.findUnique({ where: { codigo } });
          }

          const horas = prev.tipo?.tempoSlaHoras || 24;

          // <-- NOVA REGRA INTELIGENTE APLICADA AQUI
          const dataVencimento = await calcularDataVencimentoSLA(
            new Date(),
            horas,
          );

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

          const acoesPadrao = await tx.acao.findMany({
            where: { tipoId: prev.tipoId, ativo: true },
          });
          if (acoesPadrao.length > 0) {
            await tx.chamadoAcao.createMany({
              data: acoesPadrao.map((acao: any) => ({
                chamadoId: ticket.id,
                acaoId: acao.id,
                realizado: false,
              })),
            });
          }

          const novaData = new Date(prev.proximaExecucao);
          novaData.setDate(novaData.getDate() + prev.frequenciaDias);

          await tx.preventiva.update({
            where: { id: prev.id },
            data: { proximaExecucao: novaData },
          });

          processedCount++;
        });
      } catch (innerError: any) {
        console.error(`Falha na Preventiva ID ${prev.id}:`, innerError.message);
        errors.push({
          preventivaId: prev.id,
          titulo: prev.titulo,
          erro: "Falha de chave estrangeira. Verifique se o Local, Tipo ou Departamento não foram excluídos do sistema.",
        });
      }
    }

    return NextResponse.json({
      processed: processedCount,
      failed: errors.length,
      errors: errors,
    });
  } catch (error: any) {
    console.error("ERRO CRITICO NO CRON DE PREVENTIVAS:", error);
    return NextResponse.json(
      { error: "Falha geral", message: error.message },
      { status: 500 },
    );
  }
}
