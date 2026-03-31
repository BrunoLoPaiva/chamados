"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function verifyGlobalAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Não autenticado");

    const userId = Number((session.user as { id?: string | number }).id);
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

export async function updateLocalParent(formData: FormData) {
    await verifyGlobalAdmin();
    const id = Number(formData.get("id"));
    const parentId = formData.get("parentId") as string;

    await prisma.local.update({
        where: { id },
        data: { parentId: parentId ? parseInt(parentId, 10) : null },
    });

    revalidatePath("/admin/locais");
    revalidatePath("/admin/tipos");
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
    const prioridade = formData.get("prioridade") as string || "Media";
    const tempoSlaHoras = Number(formData.get("tempoSlaHoras")) || 24;

    const departamentosIds = formData.getAll("departamentos").map(String).map(Number).filter(Boolean);

    // "locais" = IDs de locais-pai SEM filhos (seleção direta do local inteiro)
    const locaisIds = formData.getAll("locais").map(String).map(Number).filter(Boolean);

    // "sublocais" = strings "paiId_filhoId" (sempre referenciando um sub-local específico)
    const subLocaisRaw = formData.getAll("sublocais").map(String).filter(Boolean);

    if (departamentosIds.length === 0) {
        return;
    }

    const deptoTiposData: { departamentoId: number; localId: number | null; subLocalId: number | null }[] = [];

    for (const deptoId of departamentosIds) {
        const hasAnyLocation = locaisIds.length > 0 || subLocaisRaw.length > 0;

        if (!hasAnyLocation) {
            // Nenhum local selecionado → vale para qualquer localidade
            deptoTiposData.push({ departamentoId: deptoId, localId: null, subLocalId: null });
        } else {
            // Locais-pai sem filhos: registra como (localId, null) para indicar "local inteiro"
            for (const locId of locaisIds) {
                deptoTiposData.push({ departamentoId: deptoId, localId: locId, subLocalId: null });
            }

            // Sub-locais específicos: registra como (localPaiId, filhoId)
            for (const subRaw of subLocaisRaw) {
                const parts = subRaw.split("_");
                if (parts.length === 2) {
                    deptoTiposData.push({
                        departamentoId: deptoId,
                        localId: Number(parts[0]),
                        subLocalId: Number(parts[1]),
                    });
                }
            }
        }
    }

    await prisma.tipoChamado.create({
        data: {
            nome,
            prioridade,
            tempoSlaHoras,
            deptoTipos: {
                create: deptoTiposData,
            },
        },
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
