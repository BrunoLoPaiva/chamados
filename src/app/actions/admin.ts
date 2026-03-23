"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function verifyGlobalAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Não autenticado");

    const userId = Number((session.user as any).id);
    const user = await prisma.usuario.findUnique({ where: { id: userId } });

    if (user?.perfil !== "ADMIN") {
        throw new Error("Acesso negado: Administrador Global requerido.");
    }
}

// -------------------------------------------------------------
// LOCAIS
// -------------------------------------------------------------

export async function createLocal(formData: FormData) {
    const nome = formData.get("nome") as string;
    const parentId = formData.get("parentId") as string;
    
    if (!nome || nome.trim() === "") return;

    await prisma.local.create({
        data: { 
            nome,
            parentId: parentId ? parseInt(parentId, 10) : null
        }
    });

    revalidatePath("/admin/locais");
    revalidatePath("/chamado/novo");
}

export async function deleteLocal(formData: FormData) {
    await verifyGlobalAdmin();
    const id = Number(formData.get("id"));

    // Opcional: verificar se existem chamados amarrados antes de excluir

    await prisma.local.update({
        where: { id },
        data: { ativo: false }
    });

    revalidatePath("/admin/locais");
    revalidatePath("/chamado/novo");
}

// -------------------------------------------------------------
// DEPARTAMENTOS
// -------------------------------------------------------------

export async function createDepartamento(formData: FormData) {
    await verifyGlobalAdmin();
    const nome = formData.get("nome") as string;

    await prisma.departamento.create({
        data: { nome }
    });

    revalidatePath("/admin/departamentos");
    revalidatePath("/chamado/novo");
}

export async function deleteDepartamento(formData: FormData) {
    await verifyGlobalAdmin();
    const id = Number(formData.get("id"));

    await prisma.departamento.update({
        where: { id },
        data: { ativo: false }
    });

    revalidatePath("/admin/departamentos");
    revalidatePath("/chamado/novo");
}

export async function addUsuarioDepartamento(formData: FormData) {
    await verifyGlobalAdmin();
    const departamentoId = Number(formData.get("departamentoId"));
    const usuarioId = Number(formData.get("usuarioId"));

    await prisma.departamento.update({
        where: { id: departamentoId },
        data: {
            usuarios: {
                connect: { id: usuarioId }
            }
        }
    });

    revalidatePath("/admin/departamentos");
}

export async function removeUsuarioDepartamento(formData: FormData) {
    await verifyGlobalAdmin();
    const departamentoId = Number(formData.get("departamentoId"));
    const usuarioId = Number(formData.get("usuarioId"));

    await prisma.departamento.update({
        where: { id: departamentoId },
        data: {
            usuarios: {
                disconnect: { id: usuarioId }
            }
        }
    });

    revalidatePath("/admin/departamentos");
}

// -------------------------------------------------------------
// TIPOS DE CHAMADO E AÇÕES
// -------------------------------------------------------------

export async function createTipoChamado(formData: FormData) {
    const nome = formData.get("nome") as string;
    const departamentoId = Number(formData.get("departamentoId"));
    const prioridade = formData.get("prioridade") as string || "Media";
    const tempoSlaHoras = Number(formData.get("tempoSlaHoras")) || 24;
    const localIdRaw = formData.get("localId") as string;
    const subLocalIdRaw = formData.get("subLocalId") as string;

    const localId = localIdRaw ? Number(localIdRaw) : null;
    const subLocalId = subLocalIdRaw ? Number(subLocalIdRaw) : null;

    await prisma.tipoChamado.create({
        data: {
            nome,
            prioridade,
            tempoSlaHoras,
            deptoTipos: {
                create: {
                    departamentoId,
                    localId,
                    subLocalId,
                }
            }
        }
    });

    revalidatePath("/admin/tipos");
    revalidatePath("/chamado/novo");
}

export async function deleteTipoChamado(formData: FormData) {
    const id = Number(formData.get("id"));

    await prisma.tipoChamado.update({
        where: { id },
        data: { ativo: false }
    });

    revalidatePath("/admin/tipos");
    revalidatePath("/chamado/novo");
}

export async function createAcaoParaTipo(formData: FormData) {
    const descricao = formData.get("descricao") as string;
    const tipoId = Number(formData.get("tipoId"));

    await prisma.acao.create({
        data: {
            descricao,
            tipoId
        }
    });

    revalidatePath("/admin/tipos");
}

export async function deleteAcao(formData: FormData) {
    const id = Number(formData.get("id"));

    await prisma.acao.update({
        where: { id },
        data: { ativo: false }
    });

    revalidatePath("/admin/tipos");
}
