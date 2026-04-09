// src/app/actions/feriados.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- FUNÇÕES DE GERENCIAMENTO DA TELA ---

export async function getFeriados(ano: number, mes: number) {
  const dataInicial = new Date(ano, mes, 1);
  const dataFinal = new Date(ano, mes + 1, 0);

  const feriados = await prisma.feriado.findMany({
    where: {
      data: { gte: dataInicial, lte: dataFinal },
      ativo: true,
    },
    select: { data: true },
  });

  // Como salvamos as datas sempre ao meio-dia, o toISOString().split('T')[0] é 100% seguro contra fuso horário
  return feriados.map((f) => f.data.toISOString().split("T")[0]);
}

export async function toggleFeriado(
  dataString: string,
  descricao: string = "Feriado",
) {
  const [ano, mes, dia] = dataString.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);

  const existente = await prisma.feriado.findUnique({
    where: { data: data },
  });

  if (existente) {
    await prisma.feriado.delete({ where: { id: existente.id } });
  } else {
    await prisma.feriado.create({
      data: { data: data, descricao: descricao },
    });
  }

  revalidatePath("/admin/feriados");
  return { success: true };
}

// --- MOTOR DE CÁLCULO DE SLA INTELIGENTE ---

export async function calcularDataVencimentoSLA(
  dataInicial: Date,
  slaHoras: number,
) {
  // 1. Busca todos os feriados cadastrados
  const feriadosDB = await prisma.feriado.findMany({ where: { ativo: true } });
  const feriadosSet = new Set(
    feriadosDB.map((f) => f.data.toISOString().split("T")[0]),
  );

  const current = new Date(dataInicial);
  let hoursRemaining = slaHoras;

  // 2. Adiciona hora por hora. Se cair em dia não-útil, não desconta do saldo de horas.
  while (hoursRemaining > 0) {
    current.setHours(current.getHours() + 1);

    const day = current.getDay();
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isFimDeSemana = day === 0 || day === 6;
    const isFeriado = feriadosSet.has(dateStr);

    // Só consome o SLA se for dia útil (seg a sex) e não for feriado
    if (!isFimDeSemana && !isFeriado) {
      hoursRemaining--;
    }
  }

  return current;
}

// --- AÇÃO DO BOTÃO "RECALCULAR TUDO" ---

export async function recalcularSLAsGlobais() {
  // Pega apenas chamados que ainda estão rodando (desconsidera os FECHADOS)
  const chamadosAbertos = await prisma.chamado.findMany({
    where: { status: { not: "FECHADO" } },
    include: { tipo: true },
  });

  let atualizados = 0;

  for (const chamado of chamadosAbertos) {
    if (!chamado.tipo?.tempoSlaHoras) continue;

    // Roda o motor de cálculo inteligente passando a data de criação original
    const novaDataVencimento = await calcularDataVencimentoSLA(
      new Date(chamado.dataCriacao),
      chamado.tipo.tempoSlaHoras,
    );

    await prisma.chamado.update({
      where: { id: chamado.id },
      data: { dataVencimento: novaDataVencimento },
    });

    atualizados++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/feriados");
  return { success: true, count: atualizados };
}
