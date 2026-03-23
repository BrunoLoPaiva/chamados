/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any).id);
  
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";

  // Obter totais
  const totalLocais = isGlobalAdmin ? await prisma.local.count() : 0;
  const totalDepartamentos = isGlobalAdmin ? await prisma.departamento.count() : usuarioLogado?.departamentos.length;
  const totalUsuarios = await prisma.usuario.count();
  const totalTipos = await prisma.tipoChamado.count({
    where: isGlobalAdmin ? undefined : {
      deptoTipos: {
        some: {
          departamentoId: {
            in: usuarioLogado?.departamentos.map((d: any) => d.id) || []
          }
        }
      }
    }
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight mb-2">Painel de Configurações</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        Módulos disponíveis para a sua conta: {isGlobalAdmin ? "Administrador Global" : "Administrador de Departamento"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <Link href="/admin/usuarios" className="block">
          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-md p-6 transition-transform hover:-translate-y-1 h-full">
            <h3 className="text-purple-800 dark:text-purple-400 font-bold mb-1">Usuários</h3>
            <p className="text-3xl font-black text-purple-900 dark:text-purple-300">{totalUsuarios}</p>
          </div>
        </Link>
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md p-6 transition-transform hover:-translate-y-1">
          <Link href="/admin/locais" className="block w-full h-full">
            <h3 className="text-blue-800 dark:text-blue-400 font-bold mb-1">Locais / Unidades</h3>
            <p className="text-3xl font-black text-blue-900 dark:text-blue-300">{totalLocais}</p>
          </Link>
        </div>
        {isGlobalAdmin && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md p-6 transition-transform hover:-translate-y-1">
            <Link href="/admin/departamentos" className="block w-full h-full">
              <h3 className="text-emerald-800 dark:text-emerald-400 font-bold mb-1">Departamentos</h3>
              <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300">{totalDepartamentos}</p>
            </Link>
          </div>
        )}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-md p-6 transition-transform hover:-translate-y-1">
          <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-1">Tipos de Chamado</h3>
          <p className="text-3xl font-black text-amber-900 dark:text-amber-300">{totalTipos}</p>
        </div>
      </div>
    </div>
  );
}
