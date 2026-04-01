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

  // Busca todos os locais ativos e constrói a árvore em memória.
  // Isso evita que locais filhos com parentId incorreto apareçam como raiz,
  // e garante que locais inativos não sejam exibidos em nenhum nível.
  const todosLocaisAtivos = await prisma.local.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, parentId: true },
    orderBy: { nome: "asc" },
  });

  const locaisMap = Object.fromEntries(
    todosLocaisAtivos.map((l) => [l.id, l.nome]),
  );

  // Conjunto de IDs de locais ativos para validar referências de parentId
  const idsAtivos = new Set(todosLocaisAtivos.map((l) => l.id));

  // Monta a árvore: apenas locais cujo parentId é null OU cujo pai também é ativo
  const childrenPorPai = new Map<number, { id: number; nome: string }[]>();
  for (const local of todosLocaisAtivos) {
    if (local.parentId !== null && idsAtivos.has(local.parentId)) {
      if (!childrenPorPai.has(local.parentId))
        childrenPorPai.set(local.parentId, []);
      childrenPorPai
        .get(local.parentId)!
        .push({ id: local.id, nome: local.nome });
    }
  }

  // Locais raiz: parentId null E que estão ativos
  const locaisRaiz = todosLocaisAtivos
    .filter((l) => l.parentId === null)
    .map((l) => ({
      id: l.id,
      nome: l.nome,
      children: childrenPorPai.get(l.id) ?? [],
    }));

  return (
    <TiposClient
      tipos={tiposComAcoes}
      departamentosDisponiveis={departamentosDisponiveis}
      locaisRaiz={locaisRaiz}
      locaisMap={locaisMap}
    />
  );
}
