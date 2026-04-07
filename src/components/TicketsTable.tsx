"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCheck,
  UserCheck,
  AlertCircle,
  X,
  AlignJustify,
  AlignCenter,
  AlignLeft,
  Calendar
} from "lucide-react";
import {
  bulkAtribuir,
  bulkUpdateStatus,
  bulkEncerrar,
} from "@/app/actions/tickets";
import { toast } from "sonner";

// [MANTÉM AS TIPAGENS E FUNCOES DE FORMATAÇÃO ORIGINAIS]
type Chamado = { id: number; codigo: string; titulo: string; status: string; dataCriacao: Date | string; dataVencimento?: Date | string | null; dataAtendimento?: Date | string | null; usuarioCriacao?: { nome: string } | null; tecnico?: { nome: string } | null; tipo?: { prioridade: string } | null; local?: { nome: string } | null; };
type SortField = "codigo" | "titulo" | "prioridade" | "local" | "solicitante" | "status" | "dataCriacao" | "dataVencimento";
type Density = "compact" | "default" | "comfortable";

interface Props {
  chamados: Chamado[]; sort: SortField; dir: "asc" | "desc"; isSplitView?: boolean; activeTicketCodigo?: string | null; usuarios?: { id: number; nome: string }[];
}

const STATUS_LABEL: Record<string, string> = { SOLICITADO: "Solicitado", EM_ATENDIMENTO: "Em Atendimento", PENDENTE: "Pendente", FECHADO: "Fechado" };
const STATUS_UI: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  SOLICITADO: { text: "text-neutral-600 ", dot: "bg-brand-yellow", bg: "bg-white ", border: "border-neutral-200 " },
  EM_ATENDIMENTO: { text: "text-brand-navy  font-bold", dot: "bg-brand-navy ", bg: "bg-brand-navy/5 ", border: "border-brand-navy/20 " },
  PENDENTE: { text: "text-brand-yellow  font-medium", dot: "bg-brand-yellow", bg: "bg-brand-yellow/5", border: "border-brand-yellow/20" },
  FECHADO: { text: "text-brand-green ", dot: "bg-brand-green", bg: "bg-brand-green/5", border: "border-brand-green/20" },
};
const PRIORITY_CLASS: Record<string, string> = { Alta: "text-red-600  font-bold", Media: "text-brand-yellow  font-semibold", Baixa: "text-neutral-500 " };
const DENSITY_ROW: Record<Density, string> = { compact: "py-1.5", default: "py-2", comfortable: "py-3" };
const DENSITY_ICONS = { compact: <AlignJustify className="w-3.5 h-3.5" />, default: <AlignCenter className="w-3.5 h-3.5" />, comfortable: <AlignLeft className="w-3.5 h-3.5" /> };
const DENSITY_LABEL: Record<Density, string> = { compact: "Compacto", default: "Padrão", comfortable: "Confortável" };

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function isSlaOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

function SortableHeader({ field, label, currentSort, currentDir, onSort }: { field: SortField; label: string; currentSort: SortField; currentDir: "asc" | "desc"; onSort: (f: SortField) => void; }) {
  const active = currentSort === field;
  return (
    <button className={`flex items-center gap-1 group ${active ? "text-brand-navy " : "text-neutral-500  hover:text-neutral-800 "} transition-colors`} onClick={() => onSort(field)}>
      <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{label}</span>
      {active ? (currentDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
    </button>
  );
}

export default function TicketsTable({ chamados, sort, dir, isSplitView, activeTicketCodigo, usuarios = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [density, setDensity] = useState<Density>("default");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatusVal, setBulkStatusVal] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [mounted, setMounted] = useState(false);

  const [modalOpen, setModalOpen] = useState<"status" | "atribuir" | "encerrar" | null>(null);
  const [bulkAtribuirVal, setBulkAtribuirVal] = useState("");
  const [bulkSolucaoVal, setBulkSolucaoVal] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // [MANTÉM O HOTKEY EFFECT EXATAMENTE COMO ESTAVA]
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;
      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, chamados.length - 1));
        scrollToRow(Math.min(focusedIndex + 1, chamados.length - 1));
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        scrollToRow(Math.max(focusedIndex - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const codigo = chamados[focusedIndex]?.codigo;
        if (codigo) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("activeTicket", codigo);
          router.push(`/dashboard?${params.toString()}`);
        }
      }
    };
    const scrollToRow = (idx: number) => {
      const row = document.getElementById(`ticket-row-${idx}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
        row.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, chamados, router, searchParams]);

  const handleSort = useCallback((field: SortField) => {
    const params = new URLSearchParams(searchParams.toString());
    const newDir = sort === field && dir === "asc" ? "desc" : "asc";
    params.set("sort", field);
    params.set("dir", newDir);
    params.set("p", "1");
    router.push(`/dashboard?${params.toString()}`);
  }, [router, searchParams, sort, dir]);

  const allIds = chamados.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) allIds.forEach((id) => next.delete(id));
      else allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRowClick = (e: React.MouseEvent, codigo: string) => {
    if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest("a") || (e.target as HTMLElement).closest("button")) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("activeTicket", codigo);
    router.push(`/dashboard?${params.toString()}`);
  };

  const clearSelection = () => setSelected(new Set());

  // [MANTÉM AS FUNÇÕES DE BULK SUBMIT COMO ESTAVAM]
  const handleBulkAtribuirSubmit = () => { if (!bulkAtribuirVal) return; startTransition(async () => { try { await bulkAtribuir(Array.from(selected), Number(bulkAtribuirVal)); toast.success("Chamados atribuídos!"); setModalOpen(null); clearSelection(); } catch (err: any) { toast.error(err.message || "Erro."); } }); };
  const handleBulkStatusSubmit = () => { if (!bulkStatusVal) return; startTransition(async () => { try { await bulkUpdateStatus(Array.from(selected), bulkStatusVal); toast.success("Status atualizado!"); setModalOpen(null); clearSelection(); } catch (err: any) { toast.error(err.message || "Erro."); } }); };
  const handleBulkEncerrarSubmit = () => { if (!bulkSolucaoVal.trim()) { toast.error("Resumo obrigatório."); return; } startTransition(async () => { try { await bulkEncerrar(Array.from(selected), bulkSolucaoVal.trim()); toast.success("Encerrados!"); setModalOpen(null); setBulkSolucaoVal(""); clearSelection(); } catch (err: any) { toast.error(err.message || "Erro."); } }); };

  const rowPy = DENSITY_ROW[density];
  const cellCls = `px-3 text-sm text-neutral-700  ${rowPy}`;

  return (
    <div className="relative">
      <div className="hidden md:flex items-center justify-end gap-1 mb-3">
        <span className="text-xs text-neutral-400 mr-2 font-medium">Densidade:</span>
        {(["compact", "default", "comfortable"] as Density[]).map((d) => (
          <button key={d} title={DENSITY_LABEL[d]} onClick={() => setDensity(d)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${density === d ? "bg-brand-navy/10 border-brand-navy/50 text-brand-navy" : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}>
            {DENSITY_ICONS[d]}{DENSITY_LABEL[d]}
          </button>
        ))}
      </div>

      {/* VIEW MOBILE: CARDS */}
      <div className={`flex flex-col gap-3 md:hidden animate-in fade-in duration-300 ${isSplitView ? "hidden" : ""}`}>
        {chamados.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 text-neutral-500 text-sm">
            Nenhum chamado listado.
          </div>
        )}
        
        {chamados.map((c) => {
          const isSelected = selected.has(c.id);
          const overdue = c.status !== "FECHADO" && isSlaOverdue(c.dataVencimento);
          
          return (
            <div 
              key={c.id}
              onClick={(e) => handleRowClick(e, c.codigo)}
              className={`relative flex flex-col p-4 bg-white rounded-xl border shadow-sm transition-all active:scale-[0.98] ${isSelected ? "border-brand-navy ring-1 ring-brand-navy/20" : "border-neutral-200"} ${c.status === "FECHADO" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Área de toque do checkbox ampliada pro dedo gordo */}
                  <div className="p-1 -ml-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(c.id)}
                      className="w-5 h-5 rounded border-neutral-300 accent-brand-navy cursor-pointer"
                    />
                  </div>
                  <span className="font-mono tabular-nums text-xs font-bold text-neutral-500">#{c.codigo}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap border ${STATUS_UI[c.status]?.bg || STATUS_UI["FECHADO"].bg} ${STATUS_UI[c.status]?.border || STATUS_UI["FECHADO"].border} ${STATUS_UI[c.status]?.text || STATUS_UI["FECHADO"].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_UI[c.status]?.dot || STATUS_UI["FECHADO"].dot}`}></span>
                  {STATUS_LABEL[c.status] || c.status}
                </span>
              </div>
              
              <h4 className="text-[15px] font-bold text-neutral-900 mb-2 leading-snug">{c.titulo}</h4>
              
              <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-3 border-t border-neutral-100">
                <span className={`text-[11px] uppercase font-bold tracking-wider ${PRIORITY_CLASS[c.tipo?.prioridade || ""] || PRIORITY_CLASS["Baixa"]}`}>
                  {c.tipo?.prioridade || "Sem Prioridade"}
                </span>
                
                <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                   <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                   {!mounted ? "—" : c.status === "FECHADO" ? (
                      <span className="text-brand-green font-medium">{fmtDateShort(c.dataAtendimento)}</span>
                    ) : overdue ? (
                      <span className="text-red-600 font-bold">{fmtDateShort(c.dataVencimento)}</span>
                    ) : (
                      <span className="text-neutral-500">{fmtDateShort(c.dataVencimento)}</span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW DESKTOP: TABELA (Oculta no mobile com hidden md:block) */}
      <div className={`hidden md:block w-full rounded-md border border-neutral-200 shadow-sm bg-white animate-in fade-in duration-300 overflow-x-auto ${isSplitView ? "" : "max-w-[100vw]"}`}>
        <table className="w-full text-left border-collapse table-auto min-w-[600px] md:min-w-full">
          {/* MANTÉM THEAD E TBODY EXATAMENTE IGUAIS, SÓ FECHEI PARA POUPAR ESPAÇO AQUI */}
          <thead className={isSplitView ? "hidden" : "bg-neutral-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"}>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className={`w-10 px-3 py-2 text-center ${isSplitView ? "hidden md:table-cell" : ""}`}><input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer" /></th>
              <th className="px-3 py-2 whitespace-nowrap"><SortableHeader field="codigo" label="Código" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>
              <th className="w-full px-3 py-2"><SortableHeader field="titulo" label="Título" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>
              {!isSplitView && <th className="w-[80px] px-3 py-2 hidden sm:table-cell"><SortableHeader field="prioridade" label="Prior." currentSort={sort} currentDir={dir} onSort={handleSort} /></th>}
              {!isSplitView && <th className="w-[120px] px-3 py-2 hidden lg:table-cell"><SortableHeader field="local" label="Local" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>}
              {!isSplitView && <th className="w-[120px] px-3 py-2 hidden md:table-cell"><SortableHeader field="solicitante" label="Solicitante" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>}
              <th className="px-3 py-2 whitespace-nowrap"><SortableHeader field="status" label="Status" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>
              {!isSplitView && <th className="w-[100px] px-3 py-2 hidden xl:table-cell"><SortableHeader field="dataCriacao" label="Abertura" currentSort={sort} currentDir={dir} onSort={handleSort} /></th>}
              <th className="w-[110px] px-3 py-2 hidden sm:table-cell"><SortableHeader field="dataVencimento" label="SLA / Venc." currentSort={sort} currentDir={dir} onSort={handleSort} /></th>
              <th className={`w-10 px-3 py-2 ${isSplitView ? "hidden" : ""}`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {chamados.map((c, index) => {
              const isSelected = selected.has(c.id);
              const isActive = activeTicketCodigo === c.codigo;
              const isFocused = focusedIndex === index;
              const overdue = c.status !== "FECHADO" && isSlaOverdue(c.dataVencimento);

              if (isSplitView) {
                return (
                  <tr
                    id={`ticket-row-${index}`}
                    key={c.id}
                    tabIndex={-1}
                    onClick={(e) => handleRowClick(e, c.codigo)}
                    className={`group transition-all cursor-pointer outline-none block border-b border-neutral-100 p-3 ${
                      isFocused ? "bg-brand-navy/5 ring-2 ring-inset ring-brand-navy/50" : ""
                    } ${
                      isActive ? "bg-brand-navy/10 border-l-4 border-l-brand-navy block" : isSelected ? "bg-brand-navy/5 border-l-4 border-l-transparent block" : "hover:bg-neutral-50 border-l-4 border-l-transparent block"
                    } ${c.status === "FECHADO" ? "opacity-60" : ""}`}
                  >
                    <td className="block border-none p-0 w-full min-w-0">
                      <div className="flex flex-col gap-1.5 w-full min-w-0">
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="font-mono tabular-nums text-xs font-bold text-neutral-500">#{c.codigo}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap border ${STATUS_UI[c.status]?.bg || STATUS_UI["FECHADO"].bg} ${STATUS_UI[c.status]?.border || STATUS_UI["FECHADO"].border} ${STATUS_UI[c.status]?.text || STATUS_UI["FECHADO"].text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_UI[c.status]?.dot || STATUS_UI["FECHADO"].dot}`}></span>{STATUS_LABEL[c.status] || c.status}
                          </span>
                        </div>
                        <span className={`block truncate w-full font-medium text-sm ${isActive ? "text-brand-navy font-bold" : "text-neutral-900"}`}>{c.titulo}</span>
                        <div className="flex items-center justify-between mt-1 min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase whitespace-nowrap ${PRIORITY_CLASS[c.tipo?.prioridade || ""] || PRIORITY_CLASS["Baixa"]}`}>{c.tipo?.prioridade || "—"}</span>
                          <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                            {!mounted ? "—" : c.status === "FECHADO" ? fmtDateShort(c.dataAtendimento) : overdue ? <span className="text-red-600 font-bold">{fmtDateShort(c.dataVencimento)}</span> : fmtDateShort(c.dataVencimento)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr id={`ticket-row-${index}`} key={c.id} tabIndex={-1} onClick={(e) => handleRowClick(e, c.codigo)} className={`group transition-all cursor-pointer outline-none ${isFocused ? "ring-2 ring-inset ring-brand-navy/50 bg-brand-navy/5 " : ""} ${isActive ? "bg-brand-navy/10 border-l-2 border-l-brand-navy" : isSelected ? "bg-brand-navy/5 border-l-2 border-l-transparent" : "hover:bg-neutral-50 border-l-2 border-l-transparent"} ${c.status === "FECHADO" ? "opacity-60" : ""}`}>
                  <td className={`${cellCls} text-center`}><input type="checkbox" checked={isSelected} onChange={() => toggleOne(c.id)} className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer" /></td>
                  <td className={cellCls}><span className={`font-mono tabular-nums text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${isActive ? "bg-white shadow-sm border border-brand-navy/30 text-brand-navy font-bold" : "text-neutral-500 bg-neutral-100 border border-neutral-200"}`}>#{c.codigo}</span></td>
                  <td className={`${cellCls} w-full max-w-0`}><span className={`block truncate font-medium transition-colors ${isActive ? "text-brand-navy font-bold" : "text-neutral-900 group-hover:text-brand-navy"}`} title={c.titulo}>{c.titulo}</span></td>
                  <td className={`${cellCls} hidden sm:table-cell`}><span className={`text-[11px] uppercase tracking-wider whitespace-nowrap ${PRIORITY_CLASS[c.tipo?.prioridade || ""] || PRIORITY_CLASS["Baixa"]}`}>{c.tipo?.prioridade === "Alta" && "↑ "}{c.tipo?.prioridade === "Baixa" && "↓ "}{c.tipo?.prioridade || "—"}</span></td>
                  {!isSplitView && <td className={`${cellCls} hidden lg:table-cell text-xs text-neutral-500`}><span className="block truncate max-w-[120px]" title={c.local?.nome}>{c.local?.nome || "—"}</span></td>}
                  {!isSplitView && <td className={`${cellCls} hidden md:table-cell text-xs text-neutral-500`}><span className="block truncate max-w-[120px]" title={c.usuarioCriacao?.nome}>{c.usuarioCriacao?.nome || "Sistema"}</span></td>}
                  <td className={cellCls}><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap border ${STATUS_UI[c.status]?.bg || STATUS_UI["FECHADO"].bg} ${STATUS_UI[c.status]?.border || STATUS_UI["FECHADO"].border} ${STATUS_UI[c.status]?.text || STATUS_UI["FECHADO"].text}`}><span className={`w-1.5 h-1.5 rounded-full ${STATUS_UI[c.status]?.dot || STATUS_UI["FECHADO"].dot}`}></span>{STATUS_LABEL[c.status] || c.status}</span></td>
                  {!isSplitView && <td className={`${cellCls} hidden xl:table-cell whitespace-nowrap text-xs text-neutral-500 tabular-nums font-mono`}>{mounted ? fmtDateShort(c.dataCriacao) : "—"}</td>}
                  <td className={`${cellCls} hidden sm:table-cell whitespace-nowrap font-mono tabular-nums`}>
                    {!mounted ? "—" : c.status === "FECHADO" ? <span className="text-brand-green flex items-center gap-1 text-xs font-medium"><CheckCheck className="w-3.5 h-3.5" />{fmtDateShort(c.dataAtendimento)}</span> : overdue ? <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm"><AlertCircle className="w-3.5 h-3.5" />{fmtDate(c.dataVencimento)}</span> : <span className="text-neutral-600 text-xs font-medium">{fmtDate(c.dataVencimento)}</span>}
                  </td>
                  <td className={`${cellCls} text-center`}><Link href={`/chamado/${c.codigo}`} className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-brand-navy hover:bg-brand-navy/10 transition-all" title="Abrir chamado em tela cheia"><ExternalLink className="w-3.5 h-3.5" /></Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {someSelected && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[45] animate-in fade-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center gap-3 bg-white  border border-neutral-200  shadow-2xl shadow-neutral-900/20 rounded-md px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800  pr-3 border-r border-neutral-200  min-w-max">
              <span className="bg-brand-navy text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center tabular-nums font-mono">
                {selected.size}
              </span>
              selecionado{selected.size !== 1 ? "s" : ""}
            </span>

            <button
              onClick={() => setModalOpen("atribuir")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4" /> Atribuir ({selected.size})
            </button>

            <button
              onClick={() => setModalOpen("status")}
              className="px-3 py-1.5 text-sm font-semibold rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors shrink-0"
            >
              Alterar Status
            </button>

            <button
              onClick={() => setModalOpen("encerrar")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Encerrar ({selected.size})
            </button>

            <button
              onClick={clearSelection}
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
              title="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAIS DE AÇÃO EM LOTE ── */}
      {modalOpen === "atribuir" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">
                Atribuir Chamados ({selected.size})
              </h3>
              <button
                onClick={() => setModalOpen(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-sm font-semibold text-neutral-700">
                Técnico Analista
              </label>
              <select
                value={bulkAtribuirVal}
                onChange={(e) => setBulkAtribuirVal(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white focus:ring-2 focus:ring-brand-navy/20 outline-none"
              >
                <option value="">Selecione o técnico alvo...</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(null)}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkAtribuirSubmit}
                disabled={!bulkAtribuirVal || isPending}
                className="px-4 py-2 text-sm font-bold bg-brand-navy text-white disabled:opacity-50 hover:bg-brand-navy/90 rounded-md flex items-center gap-2"
              >
                {isPending ? "Aplicando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen === "status" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">
                Alterar Status ({selected.size})
              </h3>
              <button
                onClick={() => setModalOpen(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-sm font-semibold text-neutral-700">
                Novo Status
              </label>
              <select
                value={bulkStatusVal}
                onChange={(e) => setBulkStatusVal(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white focus:ring-2 focus:ring-brand-navy/20 outline-none"
              >
                <option value="">Selecione o status...</option>
                <option value="SOLICITADO">SOLICITADO</option>
                <option value="EM_ATENDIMENTO">EM_ATENDIMENTO</option>
                {/* REMOVIDO PENDENTE AQUI PARA FORÇAR A JUSTIFICATIVA INDIVIDUAL */}
              </select>
            </div>
            <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(null)}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkStatusSubmit}
                disabled={!bulkStatusVal || isPending}
                className="px-4 py-2 text-sm font-bold bg-brand-navy text-white disabled:opacity-50 hover:bg-brand-navy/90 rounded-md flex items-center gap-2"
              >
                {isPending ? "Aplicando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen === "encerrar" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-brand-green flex items-center gap-2">
                <CheckCheck className="w-5 h-5" /> Encerramento em Lote (
                {selected.size})
              </h3>
              <button
                onClick={() => setModalOpen(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-md text-xs text-brand-yellow font-medium">
                Alerta: Caso algum dos chamados possua um checklist de ações
                obrigatório pendente, a operação inteira será bloqueada.
              </div>
              <label className="block text-sm font-semibold text-neutral-700">
                Resumo da Solução Aplicada a Todos
              </label>
              <textarea
                value={bulkSolucaoVal}
                onChange={(e) => setBulkSolucaoVal(e.target.value)}
                rows={4}
                placeholder="Descreva a solução comum finalizada para o lote..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-md bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none resize-none text-sm"
              />
            </div>
            <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(null)}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkEncerrarSubmit}
                disabled={!bulkSolucaoVal.trim() || isPending}
                className="px-4 py-2 text-sm font-bold bg-brand-green text-white disabled:opacity-50 hover:bg-brand-green/90 rounded-md flex items-center gap-2"
              >
                {isPending ? "Encerrando..." : "Encerrar Lote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
