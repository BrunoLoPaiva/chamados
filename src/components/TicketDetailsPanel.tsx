"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  X, User, Building2, UserCog, Paperclip, Hand, Expand
} from "lucide-react";
import FormFecharChamado from "@/app/chamado/[id]/FormFecharChamado";
import { atribuirChamado, bulkUpdateStatus } from "@/app/actions/tickets";
import TicketTimeline from "./TicketTimeline";

// ──────────────────────────────────────────────
// Types (matching the Prisma include)
// ──────────────────────────────────────────────
type ChamadoCompleto = {
  id: number;
  codigo: string;
  titulo: string;
  descricao: string;
  status: string;
  dataCriacao: Date | string;
  dataVencimento?: Date | string | null;
  dataAtendimento?: Date | string | null;
  solucao?: string | null;
  tecnicoId: number | null;
  departamentoDestinoId: number;
  usuarioCriacao?: { nome: string } | null;
  tecnico?: { nome: string; id: number } | null;
  tipo: { nome: string, prioridade: string };
  local: { nome: string };
  departamentoDestino?: { nome: string, usuarios: any[] } | null;
  anexos: any[];
  acoes: any[];
  interacoes: any[];
};

interface Props {
  chamado: ChamadoCompleto;
  currentUserId: number;
  isAdmin: boolean;
  meusDeptosIds: number[];
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function TicketDetailsPanel({ chamado, currentUserId, isAdmin, meusDeptosIds }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isMembroDepto = meusDeptosIds.includes(chamado.departamentoDestinoId);
  const podeAtribuir = isAdmin || isMembroDepto;
  const [optStatus, setOptStatus] = useState(chamado.status);
  const [optTecnicoId, setOptTecnicoId] = useState(chamado.tecnicoId);

  const [prevStatusProp, setPrevStatusProp] = useState(chamado.status);
  const [prevTecnicoProp, setPrevTecnicoProp] = useState(chamado.tecnicoId);

  if (chamado.status !== prevStatusProp) {
    setPrevStatusProp(chamado.status);
    setOptStatus(chamado.status);
  }
  if (chamado.tecnicoId !== prevTecnicoProp) {
    setPrevTecnicoProp(chamado.tecnicoId);
    setOptTecnicoId(chamado.tecnicoId);
  }

  const closePanel = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("activeTicket");
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleAssumirChamado = () => {
    // Optimistic UI updating
    setOptTecnicoId(currentUserId);
    if (optStatus !== "EM_ATENDIMENTO") {
      setOptStatus("EM_ATENDIMENTO");
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("codigo", chamado.codigo);
      formData.append("tecnicoId", String(currentUserId));
      await atribuirChamado(formData);
    });
  };

  const handleMudarStatus = (novoStatus: string) => {
    // Optimistic UI updating
    setOptStatus(novoStatus);

    startTransition(async () => {
      await bulkUpdateStatus([chamado.id], novoStatus);
    });
  };

  const podeFechar = optStatus === "EM_ATENDIMENTO" && (optTecnicoId === currentUserId || isAdmin);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col h-[calc(100vh-140px)] sticky top-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* ── Header: Actions & Close ── */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {/* Tag Prioridade */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
              chamado.tipo.prioridade === "Alta"
                ? "bg-red-600 text-white dark:bg-red-600 dark:text-white border border-red-700 shadow-sm"
                : chamado.tipo.prioridade === "Media"
                ? "bg-orange-500 text-white dark:bg-orange-500 dark:text-white border border-orange-600 shadow-sm"
                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {chamado.tipo.prioridade}
          </span>

          {/* Tag Status */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
              optStatus === "SOLICITADO"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20"
                : optStatus === "FECHADO"
                ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700"
                : optStatus === "EM_ATENDIMENTO"
                ? "bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-sm border border-blue-700 dark:border-blue-500"
                : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20"
            }`}
          >
            {optStatus.replace("_", " ")}
          </span>
          <span className="text-sm font-mono tabular-nums text-neutral-500 dark:text-neutral-400 ml-1">
            #{chamado.codigo}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/chamado/${chamado.codigo}`}
            title="Expandir para tela cheia"
            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <Expand className="w-4 h-4" />
          </Link>
          <button
            onClick={closePanel}
            title="Fechar painel"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Body with F-Pattern ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
        <div className="flex flex-col lg:flex-row min-h-full">
          
          {/* Main Content (Left, 70%) */}
          <div className="flex-1 p-6 lg:border-r border-neutral-100 dark:border-neutral-800">
            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-6 leading-snug">
              {chamado.titulo}
            </h2>

            {/* Descrição */}
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-wider">Descrição</h3>
            <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-md border border-neutral-100 dark:border-neutral-800 mb-6 leading-relaxed">
              {chamado.descricao.split("\n").map((linha: string, i: number) => (
                <p key={i} className="mb-2 last:mb-0 min-h-[1rem]">{linha}</p>
              ))}
            </div>

            {/* Anexos */}
            {chamado.anexos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-wider">Anexos</h3>
                <div className="flex flex-wrap gap-2">
                  {chamado.anexos.map((anexo: any) => (
                    <a
                      key={anexo.id}
                      href={`data:${anexo.tipo};base64,${anexo.base64}`}
                      download={anexo.nomeArquivo}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-xs font-semibold shadow-sm"
                    >
                      <Paperclip className="w-3 h-3 text-neutral-400" />
                      {anexo.nomeArquivo}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Unificada */}
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2 uppercase tracking-wider">Histórico da Solicitação</h3>
            <TicketTimeline chamado={chamado} />

            {/* Fechar Form */}
            {podeFechar && (
               <div className="mt-8 border-t border-neutral-100 dark:border-neutral-800 pt-6">
                 <FormFecharChamado chamado={chamado} />
               </div>
            )}
          </div>

          {/* Sidebar / Metadata (Right, 30%) */}
          <div className="w-full lg:w-[320px] xl:w-[360px] p-6 bg-neutral-50/50 dark:bg-neutral-800/20 flex flex-col gap-6">
            
            {/* ── Quick Actions Bar (One-Click) ── */}
            {optStatus !== "FECHADO" && (
              <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Ações Rápidas</span>
                
                {/* Assumir Chamado */}
                {!optTecnicoId && podeAtribuir && (
                   <button
                     onClick={handleAssumirChamado}
                     disabled={isPending}
                     className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                   >
                     <Hand className="w-4 h-4" />
                     {isPending ? "Processando..." : "Assumir Chamado"}
                   </button>
                )}

                {/* Quick Status changes se já atribuído */}
                {optTecnicoId && podeAtribuir && (
                   <>
                     {optStatus === "EM_ATENDIMENTO" && (
                        <button
                          onClick={() => handleMudarStatus("PENDENTE")}
                          disabled={isPending}
                          className="w-full py-2 text-sm font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                        >
                          Pausar (Pendente)
                        </button>
                     )}
                     {optStatus === "PENDENTE" && (
                        <button
                          onClick={() => handleMudarStatus("EM_ATENDIMENTO")}
                          disabled={isPending}
                          className="w-full py-2 text-sm font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                        >
                          Retomar Atendimento
                        </button>
                     )}
                   </>
                )}
              </div>
            )}

            {/* Compact Metadata List */}
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4 uppercase tracking-wider">Detalhes</h3>
              
              <div className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800/60 border-y border-neutral-200 dark:border-neutral-800/60">
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Solicitante</span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                    <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">{chamado.usuarioCriacao?.nome || "Sistema"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Departamento</span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">{chamado.departamentoDestino?.nome || "—"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Local</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right truncate max-w-[160px]">
                     {chamado.local.nome}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Categoria</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right truncate max-w-[160px]">
                     {chamado.tipo.nome}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Técnico</span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 text-right">
                    <UserCog className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">{optTecnicoId === currentUserId ? "Eu (Você)" : chamado.tecnico?.nome || <span className="text-amber-500 font-normal italic">Aguardando...</span>}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Abertura</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">
                    {new Date(chamado.dataCriacao).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Vencimento</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 relative pr-2 tabular-nums">
                    {chamado.dataVencimento ? new Date(chamado.dataVencimento).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
