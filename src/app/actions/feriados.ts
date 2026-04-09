"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Busca todos os feriados de um determinado ano e mês
export async function getFeriados(ano: number, mes: number) {
  const dataInicial = new Date(ano, mes, 1);
  const dataFinal = new Date(ano, mes + 1, 0);

  const feriados = await prisma.feriado.findMany({
    where: {
      data: {
        gte: dataInicial,
        lte: dataFinal,
      },
      ativo: true,
    },
    select: {
      data: true,
      descricao: true,
    },
  });

  // Retorna um array de strings no formato "YYYY-MM-DD" para facilitar no frontend
  return feriados.map((f) => f.data.toISOString().split("T")[0]);
}

// Alterna o status do feriado (se existe, deleta; se não existe, cria)
export async function toggleFeriado(
  dataString: string,
  descricao: string = "Feriado",
) {
  // Converte a string "YYYY-MM-DD" para Date considerando o fuso horário (meio-dia para evitar bugs de UTC)
  const [ano, mes, dia] = dataString.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);

  const existente = await prisma.feriado.findUnique({
    where: {
      data: data,
    },
  });

  if (existente) {
    await prisma.feriado.delete({
      where: { id: existente.id },
    });
  } else {
    await prisma.feriado.create({
      data: {
        data: data,
        descricao: descricao,
      },
    });
  }

  revalidatePath("/admin/feriados");
  return { success: true };
}
