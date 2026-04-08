"use client";

import { useTransition, useOptimistic, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ColaboradoresManager from "./ColaboradoresManager";
import FormFecharChamado from "@/app/chamado/[id]/FormFecharChamado";
import {
  X,
  User,
  Building2,
  UserCog,
  Paperclip,
  Trash2,
  Expand,
  PlayCircle,
  PauseCircle,
  Zap,
  UserPlus,
} from "lucide-react";
import {
  atribuirChamado,
  excluirChamado,
  pausarChamado,
  retomarChamado,
} from "@/app/actions/tickets";
import TicketTimeline from "./TicketTimeline";

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
  tipo: { nome: string; prioridade: string };
  local: { nome: string };
  departamentoDestino?: { nome: string; usuarios: any[] } | null;
  anexos: any[];
  acoes: any[];
  interacoes: any[];
  colaboradores?: { id: number; nome: string }[];
};

interface Props {
  chamado: ChamadoCompleto;
  currentUserId: number;
  isAdmin: boolean;
  meusDeptosIds: number[];
  usuarios: { id: number; nome: string }[];
}

export default function TicketDetailsPanel({
  chamado,
  currentUserId,
  isAdmin,
  meusDeptosIds,
  usuarios,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isMembroDepto = meusDeptosIds.includes(chamado.departamentoDestinoId);
  const podeAtribuir = isAdmin || isMembroDepto;
  const [optStatus, setOptStatus] = useOptimistic(chamado.status);
  const [optTecnicoId, setOptTecnicoId] = useOptimistic(chamado.tecnicoId);

  // Estados do Formulário de Pausa
  const [isPausarOpen, setIsPausarOpen] = useState(false);
  const [pausarJustificativa, setPausarJustificativa] = useState("");
  const [pausarDataLimite, setPausarDataLimite] = useState("");

  // Estados do Formulário de Atribuição (NOVO)
  const [isAtribuirOpen, setIsAtribuirOpen] = useState(false);
  const [atribuirTecnicoId, setAtribuirTecnicoId] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closePanel = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("activeTicket");
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleAtribuirSubmit = () => {
    if (!atribuirTecnicoId) {
      alert("Por favor, selecione um técnico.");
      return;
    }
    const tecId = Number(atribuirTecnicoId);
    setOptTecnicoId(tecId);
    if (optStatus !== "EM_ATENDIMENTO") setOptStatus("EM_ATENDIMENTO");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("codigo", chamado.codigo);
        formData.append("tecnicoId", String(tecId));
        await atribuirChamado(formData);
        setIsAtribuirOpen(false);
        setAtribuirTecnicoId("");
      } catch (error) {
        alert("Erro ao atribuir chamado.");
      }
    });
  };

  const handlePausarSubmit = () => {
    if (!pausarJustificativa.trim() || !pausarDataLimite) {
      alert("Preencha a justificativa e a data limite para pausar.");
      return;
    }
    setOptStatus("PENDENTE");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("codigo", chamado.codigo);
        formData.append("justificativa", pausarJustificativa);
        formData.append("dataLimite", pausarDataLimite);
        await pausarChamado(formData);
        setIsPausarOpen(false);
        setPausarJustificativa("");
        setPausarDataLimite("");
      } catch (error: any) {
        alert(error.message || "Erro ao pausar chamado.");
      }
    });
  };

  const handleRetomar = () => {
    setOptStatus("EM_ATENDIMENTO");
    startTransition(async () => {
      try {
        await retomarChamado(chamado.codigo);
      } catch (error: any) {
        alert(error.message || "Erro ao retomar chamado.");
      }
    });
  };

  const isTecnicoPrincipal = optTecnicoId === currentUserId;
  const isColaborador = chamado.colaboradores?.some(
    (c: any) => c.id === currentUserId,
  );
  const podeFechar =
    optStatus === "EM_ATENDIMENTO" &&
    (isTecnicoPrincipal || isColaborador || isAdmin);

  const handleExcluirChamado = () => {
    if (!confirm("Tem certeza ABSOLUTA que deseja excluir este chamado?"))
      return;
    startTransition(async () => {
      try {
        await excluirChamado(chamado.codigo);
        closePanel();
      } catch (error: any) {
        alert(error.message || "Erro ao excluir o chamado.");
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-neutral-200 flex flex-col max-h-[calc(100vh-6rem)] sticky top-6 animate-in fade-in slide-in-from-right-4 duration-300 min-w-0">
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-neutral-200 bg-white rounded-t-lg shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Tag Prioridade */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${chamado.tipo.prioridade === "Alta" ? "bg-red-600 text-white   border border-red-700 shadow-sm" : chamado.tipo.prioridade === "Media" ? "bg-brand-yellow text-white   border border-brand-yellow shadow-sm" : "bg-neutral-100 text-neutral-700   border border-neutral-200 "}`}
          >
            {chamado.tipo.prioridade}
          </span>
          {/* Tag Status */}
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${optStatus === "SOLICITADO" ? "bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/50" : optStatus === "FECHADO" ? "bg-brand-green/10 text-brand-green border border-brand-green/50" : optStatus === "EM_ATENDIMENTO" ? "bg-brand-navy text-white shadow-sm border border-brand-navy" : "bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/50"}`}
          >
            {optStatus.replace("_", " ")}
          </span>
          <span className="text-xs font-mono tabular-nums text-neutral-500 ml-1">
            #{chamado.codigo}
          </span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <Link
            href={`/chamado/${chamado.codigo}`}
            title="Expandir para tela cheia"
            className="p-1.5 text-neutral-400 hover:text-brand-navy hover:bg-brand-navy/10 rounded-md transition-colors"
          >
            <Expand className="w-4 h-4" />
          </Link>
          <button
            onClick={closePanel}
            title="Fechar painel"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
        <div className="flex flex-col lg:flex-row min-h-full min-w-0">
          <div className="flex-1 p-5 lg:border-r border-neutral-100 min-w-0">
            <h2 className="text-2xl font-bold text-neutral-900 0 mb-6 leading-snug break-words">
              {chamado.titulo}
            </h2>
            <h3 className="text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">
              Descrição
            </h3>
            <div className="text-sm text-neutral-700 bg-neutral-50 /30 p-4 rounded-md border border-neutral-100 mb-6 leading-relaxed">
              {(chamado.descricao || "")
                .split("\n")
                .map((linha: string, i: number) => (
                  <p key={i} className="mb-2 last:mb-0 min-h-[1rem]">
                    {linha}
                  </p>
                ))}
            </div>

            {chamado.anexos.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">
                  Anexos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {chamado.anexos.map((anexo: any) => (
                    <a
                      key={anexo.id}
                      href={
                        anexo.base64?.startsWith("/uploads/")
                          ? anexo.base64
                          : `data:${anexo.tipo};base64,${anexo.base64}`
                      }
                      download={anexo.nomeArquivo}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg hover:border-brand-navy hover:text-brand-navy transition-colors text-xs font-semibold shadow-sm"
                    >
                      <Paperclip className="w-3 h-3 text-neutral-400" />
                      {anexo.nomeArquivo}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">
              Histórico da Solicitação
            </h3>
            <TicketTimeline chamado={chamado} />
            {podeFechar && (
              <div className="mt-8 border-t border-neutral-100 pt-6">
                <FormFecharChamado chamado={chamado} />
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col min-w-0">
            {/* AÇÕES RÁPIDAS */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] md:relative md:p-5 md:bg-neutral-50/50 md:border-t-0 md:border-l md:border-neutral-100 md:shadow-none md:z-auto">
              {optStatus !== "FECHADO" && (
                <div className="flex flex-col gap-2 p-0 md:p-4 md:bg-white md:border md:border-neutral-200 md:rounded-md md:shadow-sm">
                  <span className="hidden md:flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 pb-2 border-b border-neutral-100">
                    <Zap className="w-4 h-4 text-brand-navy" /> Ações Rápidas
                  </span>

                  {podeAtribuir && optStatus !== "FECHADO" && (
                    <>
                      <button
                        onClick={() => {
                          setIsAtribuirOpen(!isAtribuirOpen);
                          if (isPausarOpen) setIsPausarOpen(false);
                        }}
                        disabled={isPending}
                        className={`flex items-center justify-center gap-2 w-full py-3 md:py-2 text-sm font-bold rounded-lg md:rounded-md transition-all focus:ring-2 focus:outline-none disabled:opacity-50 ${isAtribuirOpen ? "bg-neutral-100 text-neutral-900 shadow-inner" : !optTecnicoId ? "bg-brand-navy text-white shadow-md md:shadow-sm hover:bg-brand-navy/90" : "bg-white border border-neutral-300 text-neutral-700 shadow-md md:shadow-sm hover:bg-neutral-50 hover:text-neutral-900"}`}
                      >
                        <UserPlus className="w-5 h-5 md:w-4 md:h-4" />
                        {!optTecnicoId
                          ? "Atribuir Chamado"
                          : "Transferir Chamado"}
                      </button>

                      {isAtribuirOpen && (
                        <div className="mt-1 p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-700">
                              Selecione o Técnico
                            </label>
                            <select
                              value={atribuirTecnicoId}
                              onChange={(e) =>
                                setAtribuirTecnicoId(e.target.value)
                              }
                              className="w-full text-sm px-3 py-2 rounded-md bg-white border border-neutral-300 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none"
                            >
                              <option value="">Selecione...</option>
                              {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.nome}{" "}
                                  {u.id === currentUserId ? "(Eu)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200/60 mt-1">
                            <button
                              onClick={() => setIsAtribuirOpen(false)}
                              className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/50 rounded-md transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleAtribuirSubmit}
                              disabled={!atribuirTecnicoId || isPending}
                              className="px-4 py-1.5 text-xs font-bold bg-brand-navy text-white shadow-sm rounded-md hover:bg-brand-navy/90 transition-all disabled:opacity-50"
                            >
                              Confirmar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {optTecnicoId &&
                    podeAtribuir &&
                    optStatus === "EM_ATENDIMENTO" && (
                      <>
                        <button
                          onClick={() => {
                            setIsPausarOpen(!isPausarOpen);
                            if (isAtribuirOpen) setIsAtribuirOpen(false);
                          }}
                          disabled={isPending}
                          className={`flex items-center justify-center gap-2 w-full py-3 md:py-2 text-sm font-bold rounded-lg md:rounded-md transition-all focus:ring-2 focus:outline-none disabled:opacity-50 ${isPausarOpen ? "bg-neutral-100 text-neutral-900 shadow-inner" : "bg-white border border-neutral-300 text-neutral-700 shadow-md md:shadow-sm hover:bg-neutral-50 hover:text-neutral-900"}`}
                        >
                          <PauseCircle className="w-5 h-5 md:w-4 md:h-4" />
                          Pausar Atendimento
                        </button>

                        {isPausarOpen && (
                          <div className="mt-1 p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-neutral-700">
                                Justificativa da Pausa
                              </label>
                              <textarea
                                value={pausarJustificativa}
                                onChange={(e) =>
                                  setPausarJustificativa(e.target.value)
                                }
                                placeholder="Informe o motivo..."
                                className="w-full text-sm px-3 py-2 rounded-md bg-white border border-neutral-300 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none resize-none transition-all"
                                rows={2}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-neutral-700">
                                Retomar até (SLA)
                              </label>
                              <input
                                type="date"
                                value={pausarDataLimite}
                                onChange={(e) =>
                                  setPausarDataLimite(e.target.value)
                                }
                                className="w-full text-sm px-3 py-2 rounded-md bg-white border border-neutral-300 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200/60 mt-1">
                              <button
                                onClick={() => setIsPausarOpen(false)}
                                className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200/50 rounded-md transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handlePausarSubmit}
                                disabled={isPending}
                                className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-white shadow-sm rounded-md hover:bg-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                              >
                                Confirmar Pausa
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  {optTecnicoId && podeAtribuir && optStatus === "PENDENTE" && (
                    <button
                      onClick={handleRetomar}
                      disabled={isPending}
                      className="flex items-center justify-center gap-2 w-full py-3 md:py-2 bg-brand-navy text-white text-sm font-bold rounded-lg md:rounded-md shadow-md md:shadow-sm hover:bg-brand-navy/90 transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-5 h-5 md:w-4 md:h-4" />
                      Retomar Atendimento
                    </button>
                  )}

                  {isAdmin && (
                    <div
                      className={`${podeAtribuir ? "pt-3 mt-1 border-t border-neutral-100" : ""}`}
                    >
                      <button
                        onClick={handleExcluirChamado}
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 w-full py-3 md:py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-lg md:rounded-md shadow-md md:shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        Excluir Definitivamente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* METADADOS / DETALHES */}
            <div className="p-5 bg-neutral-50/50 border-l border-neutral-100 pb-32 md:pb-5">
              <h3 className="text-xs font-bold text-neutral-900 mb-4 uppercase tracking-wider">
                Detalhes
              </h3>
              <div className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200 ">
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium">
                    Solicitante
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                    <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">
                      {chamado.usuarioCriacao?.nome || "Sistema"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium">
                    Departamento
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">
                      {chamado.departamentoDestino?.nome || "—"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium">
                    Local
                  </span>
                  <span className="text-sm font-semibold text-neutral-800 text-right truncate max-w-[160px]">
                    {chamado.local.nome}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium">
                    Categoria
                  </span>
                  <span className="text-sm font-semibold text-neutral-800 text-right truncate max-w-[160px]">
                    {chamado.tipo.nome}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium">
                    Técnico
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                    <UserCog className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate max-w-[140px] xl:max-w-[160px]">
                      {optTecnicoId ? (
                        optTecnicoId === currentUserId ? (
                          "Eu (Você)"
                        ) : (
                          usuarios.find((u) => u.id === optTecnicoId)?.nome ||
                          chamado.tecnico?.nome
                        )
                      ) : (
                        <span className="text-amber-500 font-normal italic">
                          Aguardando...
                        </span>
                      )}
                    </span>
                  </div>
                  <ColaboradoresManager
                    chamadoCodigo={chamado.codigo}
                    tecnicoPrincipalId={optTecnicoId}
                    colaboradores={chamado.colaboradores || []}
                    todosUsuarios={usuarios}
                    podeAdicionar={
                      isTecnicoPrincipal && optStatus !== "FECHADO"
                    }
                  />
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                    Abertura
                  </span>
                  <span className="text-xs font-mono text-neutral-700 tabular-nums text-right">
                    {mounted
                      ? new Date(chamado.dataCriacao).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                    Vencimento
                  </span>
                  <span className="text-xs font-mono text-neutral-700 tabular-nums text-right pr-2">
                    {mounted && chamado.dataVencimento
                      ? new Date(chamado.dataVencimento).toLocaleString(
                          "pt-BR",
                          { dateStyle: "short", timeStyle: "short" },
                        )
                      : "—"}
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
