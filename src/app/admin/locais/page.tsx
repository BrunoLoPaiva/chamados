import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LocaisClient from "./LocaisClient";

export default async function LocaisPage() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = Number((session?.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";
  const isDeptAdmin =
    usuarioLogado?.perfil === "ADMIN_DEPTO" &&
    usuarioLogado.departamentos &&
    usuarioLogado.departamentos.length > 0;

  if (!isGlobalAdmin && !isDeptAdmin) {
    redirect("/admin");
  }

  const locais = await prisma.local.findMany({
    where: { ativo: true },
    include: {
      _count: {
        select: { chamados: true, preventivas: true },
      },
      parent: true,
    },
    orderBy: { nome: "asc" },
  });

  // Organiza categorias (sem parent) e mapeia os filhos
  const categorias = locais.filter((l) => !l.parentId);
  const locaisPorCategoria = locais.reduce(
    (acc, local) => {
      if (local.parentId) {
        if (!acc[local.parentId]) acc[local.parentId] = [];
        acc[local.parentId].push(local);
      }
      return acc;
    },
    {} as Record<number, typeof locais>,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
          Locais e Categorias
        </h1>
        <p className="text-neutral-500 mt-1">
          Gerencie as categorias estruturais e as unidades de atendimento.
        </p>
      </div>

      {/* Aqui o Server passa os dados mastigados para o Client */}
      <LocaisClient
        categorias={categorias}
        locaisPorCategoria={locaisPorCategoria}
      />
    </div>
  );
}
