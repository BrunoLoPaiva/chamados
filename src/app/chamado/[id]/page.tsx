/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { atribuirChamado } from "@/app/actions/tickets";
import FormFecharChamado from "./FormFecharChamado";
import { ArrowLeft, User, Building2, UserCog, Paperclip } from "lucide-react";
import TicketTimeline from "@/components/TicketTimeline";

export default async function ChamadoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = Number((session.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });
  const isAdmin = usuarioLogado?.perfil === "ADMIN";
  const meusDeptosIds = usuarioLogado?.departamentos.map((d: any) => d.id) || [];

  const chamado = await prisma.chamado.findUnique({
    where: { codigo: resolvedParams.id },
    include: {
      usuarioCriacao: true,
      tecnico: true,
      departamentoDestino: {
        include: { usuarios: true },
      },
      local: true,
      tipo: true,
      anexos: true,
      acoes: { include: { acao: true } },
      interacoes: { include: { usuario: true }, orderBy: { data: "asc" } },
    },
  });

  if (!chamado) return notFound();

  const isMembroDepto = meusDeptosIds.includes(chamado.departamentoDestinoId);
  const podeAtribuir = isAdmin || isMembroDepto;

  const podeFechar =
    chamado.status === "EM_ATENDIMENTO" &&
    (chamado.tecnicoId === userId || isAdmin);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6 lg:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-2 animate-in fade-in slide-in-from-left-4 duration-300">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-75 transition-colors">
          
          <div className="flex flex-col lg:flex-row min-h-full">
            {/* Main Content (Left, 70%) */}
            <div className="flex-1 p-6 md:p-10 lg:border-r border-neutral-100 dark:border-neutral-800">
              
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                <span className="text-sm font-mono tabular-nums text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 rounded-md tracking-wider transition-colors">
                  #{chamado.codigo}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border transition-colors ${chamado.tipo.prioridade === "Alta" ? "bg-red-600 text-white border-red-700 dark:bg-red-600 dark:text-white shadow-sm" : chamado.tipo.prioridade === "Media" ? "bg-orange-500 text-white border-orange-600 dark:bg-orange-500 dark:text-white shadow-sm" : "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"}`}
                >
                  {chamado.tipo.prioridade}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase transition-colors border ${chamado.status === "SOLICITADO" ? "bg-amber-100 text-amber-700 border-amber-200/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/20" : chamado.status === "FECHADO" ? "bg-neutral-100 text-neutral-600 border-neutral-200/50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700" : chamado.status === "EM_ATENDIMENTO" ? "bg-blue-600 text-white border-blue-700 dark:bg-blue-600 dark:text-white dark:border-blue-500 shadow-sm" : "bg-purple-100 text-purple-700 border-purple-200/50 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/20"}`}
                >
                  {chamado.status.replace("_", " ")}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-3 leading-tight transition-colors">
                {chamado.titulo}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium transition-colors mb-8">
                {chamado.tipo.nome} • {chamado.local.nome}
              </p>

              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-3 uppercase tracking-wider transition-colors">
                Descrição do Problema
              </h3>
              <div className="text-base text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/30 p-5 rounded-md border border-neutral-100 dark:border-neutral-800 transition-colors leading-relaxed mb-8">
                {chamado.descricao.split("\n").map((linha: string, i: number) => (
                  <p key={i} className="mb-2 last:mb-0 min-h-[1.5rem]">
                    {linha}
                  </p>
                ))}
              </div>

              {/* SEÇÃO DE ARQUIVOS ANEXADOS */}
              {chamado.anexos.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-3 uppercase tracking-wider transition-colors">
                    Arquivos Anexados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {chamado.anexos.map((anexo: any) => (
                      <a
                        key={anexo.id}
                        href={`data:${anexo.tipo};base64,${anexo.base64}`}
                        download={anexo.nomeArquivo}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-semibold"
                      >
                        <Paperclip className="w-4 h-4 text-neutral-400" />
                        {anexo.nomeArquivo}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMELINE UNIFICADA */}
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4 uppercase tracking-wider transition-colors">
                Histórico da Solicitação
              </h3>
              <TicketTimeline chamado={chamado} />

              {/* FORM DE FECHAMENTO */}
              {podeFechar && (
                 <div className="mt-10 border-t border-neutral-100 dark:border-neutral-800 pt-8">
                   <FormFecharChamado chamado={chamado} />
                 </div>
              )}
            </div>

            {/* Sidebar / Metadata (Right, 30%) */}
            <div className="w-full lg:w-[320px] xl:w-[360px] p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-800/20 flex flex-col gap-8">
              
              {/* Quick Actions (Server Form version) */}
              {chamado.status !== "FECHADO" && (
                 <div className="flex flex-col gap-2 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2">Ações Rápidas</span>
                    
                    {!chamado.tecnicoId && podeAtribuir && (
                      <form action={atribuirChamado}>
                        <input type="hidden" name="codigo" value={chamado.codigo} />
                        <input type="hidden" name="tecnicoId" value={String(userId)} />
                        {/* Server Action "Assumir Chamado" using form */}
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md shadow-sm transition-colors"
                        >
                          ✋ Assumir Chamado
                        </button>
                      </form>
                    )}

                    {chamado.tecnicoId && podeAtribuir && (
                       <form action={atribuirChamado}>
                         <div className="flex flex-col gap-2">
                           <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Reatribuir ticket:</span>
                           <input type="hidden" name="codigo" value={chamado.codigo} />
                           <select
                             name="tecnicoId"
                             required
                             defaultValue={chamado.tecnicoId.toString()}
                             className="text-sm px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm outline-none dark:bg-neutral-900 dark:text-neutral-100 bg-white transition-colors w-full"
                           >
                             <option value="">Selecione...</option>
                             {chamado.departamentoDestino?.usuarios.map((u: any) => (
                               <option key={u.id} value={u.id}>
                                 {u.nome}
                               </option>
                             ))}
                           </select>
                           <button type="submit" className="w-full py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                             Transferir
                           </button>
                         </div>
                       </form>
                    )}
                 </div>
              )}

              {/* Metadata Key-Values */}
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4 uppercase tracking-wider">Detalhes do Ticket</h3>
                
                <div className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800/60 border-y border-neutral-200 dark:border-neutral-800/60">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Solicitante</span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                      <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">{chamado.usuarioCriacao?.nome || "Sistema"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Departamento</span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                      <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">{chamado.departamentoDestino?.nome || "—"}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Técnico Atual</span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                      <UserCog className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">{chamado.tecnico?.nome || <span className="text-amber-500 font-normal italic">Aguardando...</span>}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Abertura</span>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
                      {new Date(chamado.dataCriacao).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">SLA / Vencimento</span>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 pr-1 tabular-nums">
                      {chamado.dataVencimento ? new Date(chamado.dataVencimento).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
