"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function atualizarUsuario(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado");

  const userId = Number((session.user as any).id);
  const loggedUser = await prisma.usuario.findUnique({ 
    where: { id: userId },
    include: { departamentos: true }
  });

  if (!loggedUser) throw new Error("Usuário logado não encontrado");

  const isGlobalAdmin = loggedUser.perfil === "ADMIN";
  const isDeptAdmin = loggedUser.perfil === "ADMIN_DEPTO" && loggedUser.departamentos.length > 0;

  if (!isGlobalAdmin && !isDeptAdmin) {
    throw new Error("Acesso negado. Ação restrita a administradores.");
  }

  const targetUserId = Number(formData.get("usuarioId"));
  const novoPerfil = formData.get("perfil") as string;
  const ativo = formData.get("ativo") === "true";
  
  const departamentosSelecionados = formData.getAll("departamentos").map(id => Number(id));

  const targetUser = await prisma.usuario.findUnique({
    where: { id: targetUserId },
    include: { departamentos: true }
  });

  if (!targetUser) throw new Error("Usuário alvo não encontrado");

  if (!isGlobalAdmin && targetUser.perfil === "ADMIN" && targetUserId !== userId) {
    throw new Error("Você não tem permissão para alterar os dados de um Administrador Global");
  }

  // Validations
  let perfilFinal = targetUser.perfil;
  
  if (novoPerfil) {
    if (isGlobalAdmin) {
      perfilFinal = novoPerfil;
    } else {
      // Dept Admin can set to ADMIN_DEPTO, TECNICO or USUARIO, cannot elevate to ADMIN
      if (novoPerfil === "ADMIN") {
        throw new Error("Administradores de departamento não podem conceder perfil Administrador Global");
      }
      perfilFinal = novoPerfil;
    }
  }

  // Handle department associations
  let deptoConnect: { id: number }[] = [];
  let deptoDisconnect: { id: number }[] = [];

  if (isGlobalAdmin) {
    // Global admin sets the exact list of departments
    const currentDeptIds = targetUser.departamentos.map(d => d.id);
    
    const toAdd = departamentosSelecionados.filter(id => !currentDeptIds.includes(id));
    const toRemove = currentDeptIds.filter(id => !departamentosSelecionados.includes(id));
    
    deptoConnect = toAdd.map(id => ({ id }));
    deptoDisconnect = toRemove.map(id => ({ id }));
  } else {
    // Dept admin can only add/remove from departments they manage
    const managedDeptIds = loggedUser.departamentos.map(d => d.id);
    const currentDeptIds = targetUser.departamentos.map(d => d.id);
    
    // Departments the user should be in (from the managed ones)
    // Only the checked ones that the admin has power over
    const intendedManagedDepts = departamentosSelecionados.filter(id => managedDeptIds.includes(id));
    
    // Of the ones they manage, which ones to add/remove?
    const toAdd = intendedManagedDepts.filter(id => !currentDeptIds.includes(id));
    
    // To remove: from the ones the admin manages, which ones the user currently has but wasn't selected
    const toRemove = currentDeptIds.filter(id => managedDeptIds.includes(id) && !departamentosSelecionados.includes(id));
    
    deptoConnect = toAdd.map(id => ({ id }));
    deptoDisconnect = toRemove.map(id => ({ id }));
  }

  await prisma.usuario.update({
    where: { id: targetUserId },
    data: {
      perfil: perfilFinal,
      ativo,
      departamentos: {
        connect: deptoConnect,
        disconnect: deptoDisconnect
      }
    }
  });

  revalidatePath("/admin/usuarios");
}
