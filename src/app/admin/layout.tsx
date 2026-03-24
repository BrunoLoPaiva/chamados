/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar se o usuário é ADMIN Global ou ADMIN de Departamento
  const userId = Number((session.user as any).id);
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  // Separando o Administrador Global e Administrador de Departamento
  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";
  const isDeptAdmin =
    usuarioLogado?.perfil === "ADMIN_DEPTO" &&
    usuarioLogado?.departamentos &&
    usuarioLogado.departamentos.length > 0;

  if (!isGlobalAdmin && !isDeptAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-200 flex justify-center transition-colors p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <main className="w-full max-w-6xl">{children}</main>
    </div>
  );
}
