/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import NovoChamadoForm from "./NovoChamadoForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { FilePlus2 } from "lucide-react";

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

  // Busca os departamentos com seus tipos e usuários ativos
  const departamentos = await prisma.departamento.findMany({
    where: { ativo: true },
    include: {
      deptoTipos: {
        include: {
          tipo: true,
        },
      },
      usuarios: {
        where: { ativo: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  const locais = await prisma.local.findMany({
    include: {
      children: true,
    },
    where: { parentId: null, ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-12 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho de Contexto */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-navy rounded-lg shadow-sm">
              <FilePlus2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Abertura de Chamado
            </h1>
          </div>
          <p className="text-neutral-500 ml-1">
            Informe os detalhes da ocorrência para que nossa equipe técnica
            possa atuar.
          </p>
        </div>

        {/* Container do Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <div className="p-6 md:p-10">
            <NovoChamadoForm
              departamentos={departamentos}
              locais={locais}
              usuarioLogado={usuarioLogado}
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          O SLA de atendimento inicia-se imediatamente após o registro deste
          formulário.
        </p>
      </div>
    </div>
  );
}
