/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import NovoChamadoForm from "./NovoChamadoForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function NovoChamadoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userId = Number((session.user as any).id);

  // Busca o usuário logado para sabermos de quais departamentos ele faz parte
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  // Busca os departamentos com seus tipos e usuários ativos (para a preventiva)
  const departamentos = await prisma.departamento.findMany({
    include: {
      deptoTipos: { 
        include: { 
          tipo: true,
        } 
      },
      usuarios: {
        where: { ativo: true }
      },
    },
    orderBy: { nome: "asc" },
  });

  const locais = await prisma.local.findMany({
    include: {
      children: true
    },
    where: { parentId: null }, // Somente locais raiz — os sub-locais virão via children
    orderBy: { nome: "asc" },
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-12 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            Novo Chamado
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Preencha os detalhes para abrir uma nova solicitação.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <NovoChamadoForm
            departamentos={departamentos}
            locais={locais}
            usuarioLogado={usuarioLogado}
          />
        </div>
      </div>
    </div>
  );
}
