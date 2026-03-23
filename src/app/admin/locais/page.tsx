/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { createLocal, deleteLocal } from "@/app/actions/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";

export default async function LocaisPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any).id);
  
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true }
  });

  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";
  const isDeptAdmin = usuarioLogado?.perfil === "ADMIN_DEPTO" && usuarioLogado.departamentos && usuarioLogado.departamentos.length > 0;

  if (!isGlobalAdmin && !isDeptAdmin) {
    redirect("/admin");
  }

  const locais = await prisma.local.findMany({
    where: { ativo: true },
    include: {
      _count: {
        select: { chamados: true, preventivas: true }
      },
      parent: true
    },
    orderBy: { nome: "asc" }
  });

  // Organizar locais: Categorias (sem parent) primeiro, e mapear os filhos para renderizar debaixo do pai
  const categorias = locais.filter(l => !l.parentId);
  const locaisPorCategoria = locais.reduce((acc, local) => {
    if (local.parentId) {
      if (!acc[local.parentId]) acc[local.parentId] = [];
      acc[local.parentId].push(local);
    }
    return acc;
  }, {} as Record<number, typeof locais>);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">Locais e Categorias</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gerencie as categorias estruturais e as unidades.</p>
        </div>
        
        <form action={createLocal} className="flex gap-2 w-full md:w-auto">
          <select 
            name="parentId" 
            className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-48 text-neutral-600 dark:text-neutral-300 transition-colors"
          >
            <option value="">(Sem categoria pai)</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
          <input 
            type="text" 
            name="nome" 
            required 
            placeholder="Nome (ex: Praças ou P1)..." 
            className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
          />
          <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 shadow-sm transition-colors shrink-0">
            Adicionar Local
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">Nome da Unidade</th>
              <th className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">Chamados</th>
              <th className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100">Prevs.</th>
              <th className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(categoria => (
              <Fragment key={`cat-${categoria.id}`}>
                {/* Linha da Categoria / Local Master */}
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/10 hover:bg-neutral-100 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    {locaisPorCategoria[categoria.id]?.length > 0 && <span className="text-neutral-400">📂</span>}
                    {categoria.nome}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{(categoria as any)._count?.chamados || 0}</td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{(categoria as any)._count?.preventivas || 0}</td>
                  <td className="py-3 px-4 flex justify-end">
                    <DeleteButton 
                      action={deleteLocal} 
                      id={categoria.id} 
                      disabled={((categoria as any)._count?.chamados || 0) > 0 || ((categoria as any)._count?.preventivas || 0) > 0 || !!locaisPorCategoria[categoria.id]?.length} 
                      title="Excluir Categoria"
                      text={`Tem certeza que deseja remover a categoria "${categoria.nome}"?`}
                    />
                  </td>
                </tr>

                {/* Sub-locais da categoria */}
                {(locaisPorCategoria[categoria.id] || []).map(sub => (
                  <tr key={`sub-${sub.id}`} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="py-2.5 px-4 pl-12 font-medium text-neutral-700 dark:text-neutral-300 relative">
                      <div className="absolute left-6 top-1/2 -mt-px w-4 border-t border-neutral-300 dark:border-neutral-600"></div>
                      <div className="absolute left-6 top-0 bottom-1/2 border-l border-neutral-300 dark:border-neutral-600"></div>
                      {sub.nome}
                    </td>
                    <td className="py-2.5 px-4 text-sm text-neutral-500 dark:text-neutral-400">{(sub as any)._count?.chamados || 0}</td>
                    <td className="py-2.5 px-4 text-sm text-neutral-500 dark:text-neutral-400">{(sub as any)._count?.preventivas || 0}</td>
                    <td className="py-2.5 px-4 flex justify-end">
                      <DeleteButton 
                        action={deleteLocal} 
                        id={sub.id} 
                        disabled={((sub as any)._count?.chamados || 0) > 0 || ((sub as any)._count?.preventivas || 0) > 0} 
                        title="Excluir Sub-local"
                        text={`Tem certeza que deseja remover "${sub.nome}"?`}
                      />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            
            {locais.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                  Nenhum local cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
