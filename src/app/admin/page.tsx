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
  const totalDepartamentos = isGlobalAdmin
    ? await prisma.departamento.count()
    : usuarioLogado?.departamentos.length;
  const totalUsuarios = await prisma.usuario.count();
  const totalTipos = await prisma.tipoChamado.count({
    where: isGlobalAdmin
      ? undefined
      : {
          deptoTipos: {
            some: {
              departamentoId: {
                in: usuarioLogado?.departamentos.map((d: any) => d.id) || [],
              },
            },
          },
        },
  });

  return (
    <div className="bg-white  rounded-lg shadow-sm border border-neutral-200  p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-neutral-900 0 tracking-tight mb-2">
        Painel de Configurações
      </h1>
      <p className="text-neutral-500  mb-8">
        Módulos disponíveis para a sua conta:{" "}
        {isGlobalAdmin
          ? "Administrador Global"
          : "Administrador de Departamento"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <Link href="/admin/usuarios" className="block">
          <div className="bg-brand-navy/5  border border-brand-navy/20  rounded-md p-6 transition-transform hover:-translate-y-1 h-full">
            <h3 className="text-brand-navy  font-bold mb-1 uppercase tracking-wider text-xs">
              Usuários
            </h3>
            <p className="text-3xl font-black text-brand-navy ">
              {totalUsuarios}
            </p>
          </div>
        </Link>
        <div className="bg-neutral-50 /50 border border-neutral-200  rounded-md p-6 transition-transform hover:-translate-y-1">
          <Link href="/admin/locais" className="block w-full h-full">
            <h3 className="text-neutral-600  font-bold mb-1 uppercase tracking-wider text-xs">
              Locais / Unidades
            </h3>
            <p className="text-3xl font-black text-neutral-800 ">
              {totalLocais}
            </p>
          </Link>
        </div>
        {isGlobalAdmin && (
          <div className="bg-brand-green/5  border border-brand-green/20  rounded-md p-6 transition-transform hover:-translate-y-1">
            <Link href="/admin/departamentos" className="block w-full h-full">
              <h3 className="text-brand-green  font-bold mb-1 uppercase tracking-wider text-xs">
                Departamentos
              </h3>
              <p className="text-3xl font-black text-brand-green ">
                {totalDepartamentos}
              </p>
            </Link>
          </div>
        )}
        <div className="bg-brand-yellow/5  border border-brand-yellow/20  rounded-md p-6 transition-transform hover:-translate-y-1">
          <Link href="/admin/tipos" className="block w-full h-full">
            <h3 className="text-brand-yellow  font-bold mb-1 uppercase tracking-wider text-xs">
              Tipos de Chamado
            </h3>
            <p className="text-3xl font-black text-neutral-800 ">
              {totalTipos}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
