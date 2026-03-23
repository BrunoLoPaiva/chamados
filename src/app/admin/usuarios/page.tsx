import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const userId = Number((session.user as any).id);
  const loggedUser = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true }
  });

  if (!loggedUser) redirect("/login");

  const isGlobalAdmin = loggedUser.perfil === "ADMIN";
  const isDeptAdmin = loggedUser.perfil === "ADMIN_DEPTO" && loggedUser.departamentos.length > 0;

  if (!isGlobalAdmin && !isDeptAdmin) {
    redirect("/dashboard");
  }

  // Fetch all users
  const todosUsuarios = await prisma.usuario.findMany({
    include: { departamentos: true },
    orderBy: { nome: "asc" }
  });

  // Fetch departments the admin can manage
  const departamentosGerenciados = isGlobalAdmin 
    ? await prisma.departamento.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } })
    : loggedUser.departamentos;

  return (
    <UsuariosClient 
      usuarios={todosUsuarios}
      departamentosPermitidos={departamentosGerenciados}
      isGlobalAdmin={isGlobalAdmin}
      loggedUserId={userId}
    />
  );
}
