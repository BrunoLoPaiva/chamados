import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DepartamentosClient from "./DepartamentosClient";

export default async function DepartamentosPage() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = Number((session?.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
  });

  if (usuarioLogado?.perfil !== "ADMIN") redirect("/admin");

  const departamentos = await prisma.departamento.findMany({
    where: { ativo: true },
    include: {
      usuarios: { where: { ativo: true }, orderBy: { nome: "asc" } },
      _count: { select: { chamadosDestino: true, deptoTipos: true } },
    },
    orderBy: { nome: "asc" },
  });

  const todosUsuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <DepartamentosClient
      departamentos={departamentos}
      todosUsuarios={todosUsuarios}
    />
  );
}
