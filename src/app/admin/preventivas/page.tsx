import { prisma } from "@/lib/prisma";
import PreventivasClient from "./PreventivasClient";

export const dynamic = "force-dynamic";

export default async function PreventivasPage() {
  // Busca todas as preventivas e seus relacionamentos
  const preventivas = await prisma.preventiva.findMany({
    include: {
      departamentoDestino: true,
      local: true,
      tipo: true,
      tecnico: true,
    },
    orderBy: { proximaExecucao: "asc" },
  });

  // Busca as listas auxiliares para montar as "options" no Form do SlidePanel
  const departamentos = await prisma.departamento.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  const locais = await prisma.local.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  const tipos = await prisma.tipoChamado.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <PreventivasClient
      preventivas={preventivas}
      departamentos={departamentos}
      locais={locais}
      tipos={tipos}
      usuarios={usuarios}
    />
  );
}
