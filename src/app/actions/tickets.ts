"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

  if (isPreventiva) {
    if (!frequenciaDias || frequenciaDias <= 0 || !tecnicoId) {
      throw new Error("Para preventivas, a frequência de dias e o técnico são obrigatórios.");
    }
  }

  const anexoFile = formData.get("anexo") as File | null;
  let anexoData = null;
  if (anexoFile && anexoFile.size > 0) {
    const buffer = Buffer.from(await anexoFile.arrayBuffer());
    const fs = await import("fs");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeName = anexoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    anexoData = {
      nomeArquivo: anexoFile.name,
      tipo: anexoFile.type,
      base64: `/uploads/${filename}`,
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

  const ticket = await prisma.chamado.findUnique({ where: { codigo } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const userId = Number((session.user as any).id);
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true }
  });
  
  if (!user) throw new Error("Usuário não encontrado");

  const isAdmin = user.perfil === "ADMIN";
  const isMembro = user.departamentos.some(d => d.id === ticket.departamentoDestinoId);
  
  if (!isAdmin && !isMembro) {
    throw new Error("Acesso negado. Você não pertence ao departamento deste chamado.");
  }

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

export async function fecharChamado(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");

  const codigo = formData.get("codigo") as string;
  const solucao = formData.get("solucao") as string;

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
    const fs = await import("fs");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeName = anexoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    anexoData = {
      nomeArquivo: anexoFile.name,
      tipo: anexoFile.type,
      base64: `/uploads/${filename}`,
    };
  }

  const ticket = await prisma.chamado.findUnique({ where: { codigo } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const userId = Number((session.user as any).id);
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true }
  });
  
  if (!user) throw new Error("Usuário não encontrado");

  const isAdmin = user.perfil === "ADMIN";
  const isMembro = user.departamentos.some(d => d.id === ticket.departamentoDestinoId);
  
  if (!isAdmin && !isMembro) {
    throw new Error("Acesso negado. Você não pertence ao departamento deste chamado.");
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.chamado.update({
      where: { codigo },
      data: {
        status: "FECHADO",
        solucao,
        dataAtendimento: new Date(),
      },
    });

    if (acoesIds.length > 0) {
      await tx.chamadoAcao.updateMany({
        where: {
          chamadoId: ticket.id,
          id: { in: acoesIds },
        },
        data: { realizado: true },
      });
    }

    if (anexoData) {
      await tx.anexo.create({
        data: { chamadoId: ticket.id, ...anexoData },
      });
    }
  });

  revalidatePath(`/chamado/${codigo}`);
  revalidatePath("/dashboard");
}

export async function bulkAtribuir(ids: number[], tecnicoAlvoId: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");
  if (!ids || ids.length === 0) return;

  const targetUser = await prisma.usuario.findUnique({
    where: { id: tecnicoAlvoId },
    include: { departamentos: true }
  });

  if (!targetUser) throw new Error("Técnico alvo não encontrado");

  const chamados = await prisma.chamado.findMany({
    where: { id: { in: ids } },
    select: { id: true, departamentoDestinoId: true }
  });

  const deptosIdsAlvo = targetUser.departamentos.map(d => d.id);
  const isAdmin = targetUser.perfil === "ADMIN";

  if (!isAdmin) {
    for (const c of chamados) {
      if (!deptosIdsAlvo.includes(c.departamentoDestinoId)) {
        throw new Error("Ação negada: O técnico selecionado não faz parte do departamento exigido por um dos chamados.");
      }
    }
  }

  await prisma.chamado.updateMany({
    where: { id: { in: ids } },
    data: { tecnicoId: tecnicoAlvoId, status: "EM_ATENDIMENTO" },
  });

  revalidatePath("/dashboard");
}

export async function bulkUpdateStatus(ids: number[], status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");
  if (!ids || ids.length === 0) return;

  // CORREÇÃO DO BUG: Bloqueio de segurança que impede que a requisição POST faça um "bypass" do form de preenchimento.
  if (status === "FECHADO") {
    throw new Error(
      "Fechamento em lote não é permitido. Acesse o chamado para preencher a solução obrigatória.",
    );
  }

  const data: any = { status };

  await prisma.chamado.updateMany({
    where: { id: { in: ids } },
    data,
  });

  revalidatePath("/dashboard");
}

export async function bulkEncerrar(ids: number[], solucao: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Usuário não autenticado");
  if (!ids || ids.length === 0) return;

  const acoesPendentes = await prisma.chamadoAcao.findFirst({
    where: {
      chamadoId: { in: ids },
      realizado: false
    },
    include: { chamado: true }
  });

  if (acoesPendentes) {
    throw new Error(`Não é possível fechar em lote pois o chamado #${acoesPendentes.chamado.codigo} possui checklists obrigatórios pendentes.`);
  }

  await prisma.chamado.updateMany({
    where: { id: { in: ids } },
    data: {
      status: "FECHADO",
      solucao,
      dataAtendimento: new Date(),
    },
  });

  revalidatePath("/dashboard");
}
