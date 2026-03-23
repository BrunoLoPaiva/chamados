/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { createTipoChamado, deleteTipoChamado, createAcaoParaTipo, deleteAcao } from "@/app/actions/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import { X, Plus, MapPin } from "lucide-react";
import TipoFormClient from "./TipoFormClient";

export default async function TiposPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any).id);
  
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true }
  });

  const isGlobalAdmin = usuarioLogado?.perfil === "ADMIN";
  const deptoIds = usuarioLogado?.departamentos.map(d => d.id) || [];
  
  if (!isGlobalAdmin && deptoIds.length === 0) {
    redirect("/admin");
  }

  const tipos = await prisma.tipoChamado.findMany({
    where: isGlobalAdmin ? { ativo: true } : {
      ativo: true,
      deptoTipos: {
        some: { departamentoId: { in: deptoIds } }
      }
    },
    include: {
      deptoTipos: { 
        include: { 
          departamento: true
          // local e subLocal serão acessados via localId/subLocalId escalares
        } 
      },
      _count: { select: { chamados: true, preventivas: true } }
    },
    orderBy: { nome: "asc" }
  });

  const tipoIds = tipos.map(t => t.id);
  const acoes = await prisma.acao.findMany({
    where: { 
      ativo: true,
      tipoId: { in: tipoIds } 
    }
  });

  const departamentosDisponiveis = await prisma.departamento.findMany({
    where: isGlobalAdmin ? {} : { id: { in: deptoIds } },
    orderBy: { nome: "asc" }
  });

  // Busca todos os locais pais com seus filhos para o formulário
  const locaisRaiz = await prisma.local.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { nome: "asc" }
  });

  // Mapa de id -> nome de todos os locais para exibição nos cards
  const todosLocais = await prisma.local.findMany({ select: { id: true, nome: true } });
  const locaisMap = Object.fromEntries(todosLocais.map(l => [l.id, l.nome]));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">Tipos de Chamado e SLAs</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Defina os tipos de solicitação, SLAs, o Local/Sublocalização onde se aplica e os Checklists do técnico.
          </p>
        </div>
        
        {/* Formulário de criação — agora com Local/SubLocal (client component para o dinâmico) */}
        <TipoFormClient
          departamentos={departamentosDisponiveis.map(d => ({ id: d.id, nome: d.nome }))}
          locais={locaisRaiz.map(l => ({
            id: l.id,
            nome: l.nome,
            children: (l as any).children?.map((c: any) => ({ id: c.id, nome: c.nome })) || []
          }))}
          createAction={createTipoChamado}
        />
      </div>

      {/* Listagem dos Tipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tipos.map((tipo) => {
          const acoesTipo = acoes.filter(a => a.tipoId === tipo.id);
          
          return (
            <div key={tipo.id} className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col transition-colors">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 leading-tight pr-2">{tipo.nome}</h3>
                  <div className="shrink-0 -mt-1 -mr-1">
                    <DeleteButton 
                      action={deleteTipoChamado} 
                      id={tipo.id} 
                      disabled={tipo._count.chamados > 0 || tipo._count.preventivas > 0} 
                      title="Excluir Tipo"
                      text={`Deseja excluir o tipo de chamado "${tipo.nome}"? Isso não tem volta.`}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase ${tipo.prioridade === 'Alta' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : tipo.prioridade === 'Media' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                    {tipo.prioridade}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 font-bold transition-colors">
                    SLA: {tipo.tempoSlaHoras}h
                  </span>
                </div>

                {/* Departamento(s) e Local/SubLocal associados */}
                {tipo.deptoTipos.map((dt: any) => (
                  <div key={dt.id} className="space-y-1 mt-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold">Depto:</span> {dt.departamento.nome}
                    </p>
                    {dt.localId && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {locaisMap[dt.localId]}
                        {dt.subLocalId && <> → {locaisMap[dt.subLocalId]}</>}
                      </p>
                    )}
                    {!dt.localId && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">Válido em qualquer local</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-5 flex-1 bg-neutral-50/50 dark:bg-neutral-900/30 transition-colors">
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Checklist (Ações do Técnico)</h4>
                
                <ul className="space-y-2 mb-4">
                  {acoesTipo.map(acao => (
                    <li key={acao.id} className="flex justify-between items-center text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2 rounded-lg transition-colors group">
                      <span className="text-neutral-700 dark:text-neutral-300 truncate pr-2">{acao.descricao}</span>
                      <form action={deleteAcao} className="shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="hidden" name="id" value={acao.id} />
                        <button type="submit" className="text-neutral-400 hover:text-red-500 transition-colors" title="Remover Ação">
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    </li>
                  ))}
                  {acoesTipo.length === 0 && (
                    <li className="text-sm text-neutral-400 dark:text-neutral-500 italic">Sem checklist para este tipo.</li>
                  )}
                </ul>

                <form action={createAcaoParaTipo} className="flex gap-2">
                  <input type="hidden" name="tipoId" value={tipo.id} />
                  <input type="text" name="descricao" required placeholder="Nova ação..." className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors" />
                  <button type="submit" className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
