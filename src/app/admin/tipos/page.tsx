import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import TiposClient from "./TiposClient";

export default async function TiposPage() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = Number((session?.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";
  const deptoIds = usuarioLogado?.departamentos.map((d) => d.id) || [];

  if (!isGlobalAdmin && deptoIds.length === 0) {
    redirect("/admin");
  }

  const tipos = await prisma.tipoChamado.findMany({
    where: isGlobalAdmin
      ? { ativo: true }
      : {
          ativo: true,
          deptoTipos: {
            some: { departamentoId: { in: deptoIds } },
          },
        },
    include: {
      deptoTipos: {
        include: {
          departamento: true,
        },
      },
      _count: { select: { chamados: true, preventivas: true } },
    },
    orderBy: { nome: "asc" },
  });

  const tipoIds = tipos.map((t) => t.id);
  const acoes = await prisma.acao.findMany({
    where: {
      ativo: true,
      tipoId: { in: tipoIds },
    },
  });

  // Embutir as ações dentro de cada tipo para facilitar no Client
  const tiposComAcoes = tipos.map((tipo) => ({
    ...tipo,
    acoes: acoes.filter((a) => a.tipoId === tipo.id),
  }));

  const departamentosDisponiveis = await prisma.departamento.findMany({
    where: isGlobalAdmin ? {} : { id: { in: deptoIds } },
    orderBy: { nome: "asc" },
  });

  const locaisRaiz = await prisma.local.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { nome: "asc" },
  });

  const todosLocais = await prisma.local.findMany({
    select: { id: true, nome: true },
  });
  const locaisMap = Object.fromEntries(todosLocais.map((l) => [l.id, l.nome]));

  return (
    <TiposClient
      tipos={tiposComAcoes}
      departamentosDisponiveis={departamentosDisponiveis}
      locaisRaiz={locaisRaiz}
      locaisMap={locaisMap}
    />
  );
}
