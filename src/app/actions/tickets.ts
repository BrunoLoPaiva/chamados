"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Função para gerar o Hash Numérico de 10 dígitos
export async function gerarCodigoChamado() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function createTicket(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id)
    throw new Error("Usuário não autenticado");

  const titulo = formData.get("titulo") as string;
  const descricao = formData.get("descricao") as string;
  const tipoId = Number(formData.get("tipoId"));
  const localId = Number(formData.get("localId"));
  const departamentoDestinoId = Number(formData.get("departamentoDestinoId"));
  const usuarioId = Number((session.user as any).id);

  const isPreventiva = formData.get("isPreventiva") === "true";
  const frequenciaDias = Number(formData.get("frequenciaDias"));
  const tecnicoId = Number(formData.get("tecnicoId"));

  const anexoFile = formData.get("anexo") as File | null;
  let anexoData = null;
  if (anexoFile && anexoFile.size > 0) {
    const buffer = Buffer.from(await anexoFile.arrayBuffer());
    anexoData = {
      nomeArquivo: anexoFile.name,
      tipo: anexoFile.type,
      base64: buffer.toString("base64"),
    };
  }

  const tipo = await prisma.tipoChamado.findUnique({ where: { id: tipoId } });
  const horas = tipo?.tempoSlaHoras || 24;
  const dataVencimento = new Date();
  dataVencimento.setHours(dataVencimento.getHours() + horas);

  let codigo = await gerarCodigoChamado();
  let existe = await prisma.chamado.findUnique({ where: { codigo } });
  while (existe) {
    codigo = await gerarCodigoChamado();
    existe = await prisma.chamado.findUnique({ where: { codigo } });
  }

  const novoChamado = await prisma.$transaction(async (tx: any) => {
    if (isPreventiva && frequenciaDias > 0 && tecnicoId) {
      const dataProximaExecucao = new Date();
      dataProximaExecucao.setDate(
        dataProximaExecucao.getDate() + frequenciaDias,
      );

      await tx.preventiva.create({
        data: {
          titulo: `[PREVENTIVA] ${titulo}`,
          descricao,
          frequenciaDias,
          proximaExecucao: dataProximaExecucao,
          tecnicoId,
          tipoId,
          localId,
          departamentoDestinoId,
        },
      });
    }

    const ticket = await tx.chamado.create({
      data: {
        codigo,
        titulo: isPreventiva ? `[PREVENTIVA] ${titulo}` : titulo,
        descricao,
        tipoId,
        localId,
        departamentoDestinoId,
        status: isPreventiva ? "EM_ATENDIMENTO" : "SOLICITADO",
        usuarioCriacaoId: usuarioId,
        dataVencimento,
        tecnicoId: isPreventiva ? tecnicoId : null,
      },
    });

    if (anexoData) {
      await tx.anexo.create({
        data: { chamadoId: ticket.id, ...anexoData },
      });
    }

    // Copia as ações padrão do Tipo de Chamado para o ChamadoAcao
    const acoesPadrao = await tx.acao.findMany({
      where: { tipoId, ativo: true },
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

    return ticket;
  });

  revalidatePath("/dashboard");
  return { success: true, codigo: novoChamado.codigo };
}

export async function atribuirChamado(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");

  const codigo = formData.get("codigo") as string;
  const tecnicoId = Number(formData.get("tecnicoId"));

  if (!codigo || !tecnicoId) throw new Error("Dados inválidos");

  await prisma.chamado.update({
    where: { codigo },
    data: {
      tecnicoId: tecnicoId,
      status: "EM_ATENDIMENTO",
    },
  });

  revalidatePath(`/chamado/${codigo}`);
  revalidatePath("/dashboard");
}

// NOVA FUNÇÃO: Fechar o Chamado com Solução e Ações
export async function fecharChamado(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");

  const codigo = formData.get("codigo") as string;
  const solucao = formData.get("solucao") as string;

  // Busca quais checkboxes de ações foram marcados (o name deles é acao_ID)
  const acoesIds: number[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("acao_") && value === "on") {
      acoesIds.push(Number(key.replace("acao_", "")));
    }
  }

  const anexoFile = formData.get("anexo") as File | null;
  let anexoData = null;
  if (anexoFile && anexoFile.size > 0) {
    const buffer = Buffer.from(await anexoFile.arrayBuffer());
    anexoData = {
      nomeArquivo: anexoFile.name,
      tipo: anexoFile.type,
      base64: buffer.toString("base64"),
    };
  }

  const ticket = await prisma.chamado.findUnique({ where: { codigo } });
  if (!ticket) throw new Error("Chamado não encontrado");

  await prisma.$transaction(async (tx: any) => {
    // 1. Atualiza status e solução
    await tx.chamado.update({
      where: { codigo },
      data: {
        status: "FECHADO",
        solucao,
        dataAtendimento: new Date(),
      },
    });

    // 2. Marca as ações como realizadas
    if (acoesIds.length > 0) {
      await tx.chamadoAcao.updateMany({
        where: {
          chamadoId: ticket.id,
          id: { in: acoesIds },
        },
        data: { realizado: true },
      });
    }

    // 3. Salva anexo de evidência (se houver)
    if (anexoData) {
      await tx.anexo.create({
        data: { chamadoId: ticket.id, ...anexoData },
      });
    }
  });

  revalidatePath(`/chamado/${codigo}`);
  revalidatePath("/dashboard");
}

export async function bulkAtribuirParaMim(ids: number[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");
  const userId = Number((session.user as any).id);
  if (!ids || ids.length === 0) return;

  await prisma.chamado.updateMany({
    where: { id: { in: ids } },
    data: { tecnicoId: userId, status: "EM_ATENDIMENTO" },
  });

  revalidatePath("/dashboard");
}

export async function bulkUpdateStatus(ids: number[], status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");
  if (!ids || ids.length === 0) return;

  const data: any = { status };
  if (status === "FECHADO") {
    data.dataAtendimento = new Date();
  }

  await prisma.chamado.updateMany({
    where: { id: { in: ids } },
    data,
  });

  revalidatePath("/dashboard");
}
