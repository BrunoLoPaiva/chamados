"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  ExternalLink, CheckCheck, UserCheck, AlertCircle, X,
  AlignJustify, AlignCenter, AlignLeft,
} from "lucide-react";
import { bulkAtribuirParaMim, bulkUpdateStatus } from "@/app/actions/tickets";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type Chamado = {
  id: number;
  codigo: string;
  titulo: string;
  status: string;
  dataCriacao: Date | string;
  dataVencimento?: Date | string | null;
  dataAtendimento?: Date | string | null;
  usuarioCriacao?: { nome: string } | null;
  tecnico?: { nome: string } | null;
  tipo?: { prioridade: string } | null;
  local?: { nome: string } | null;
};

type SortField =
  | "codigo"
  | "titulo"
  | "prioridade"
  | "local"
  | "solicitante"
  | "status"
  | "dataCriacao"
  | "dataVencimento";

type Density = "compact" | "default" | "comfortable";

interface Props {
  chamados: Chamado[];
  sort: SortField;
  dir: "asc" | "desc";
  isSplitView?: boolean;
  activeTicketCodigo?: string | null;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  EM_ATENDIMENTO: "Em Atendimento",
  PENDENTE: "Pendente",
  FECHADO: "Fechado",
};

const STATUS_CLASS: Record<string, string> = {
  SOLICITADO:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20",
  EM_ATENDIMENTO:
    "bg-blue-600 text-white dark:bg-blue-600 dark:text-white shadow-sm border border-blue-700 dark:border-blue-500",
  PENDENTE:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20",
  FECHADO:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200/50 dark:border-neutral-700",
};

const PRIORITY_CLASS: Record<string, string> = {
  Alta:
    "bg-red-600 text-white dark:bg-red-600 dark:text-white shadow-sm border border-red-700",
  Media:
    "bg-orange-500 text-white dark:bg-orange-500 dark:text-white shadow-sm border border-orange-600",
  Baixa:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
};

const DENSITY_ROW: Record<Density, string> = {
  compact: "py-1.5",
  default: "py-3",
  comfortable: "py-5",
};

const DENSITY_ICONS = {
  compact: <AlignJustify className="w-3.5 h-3.5" />,
  default: <AlignCenter className="w-3.5 h-3.5" />,
  comfortable: <AlignLeft className="w-3.5 h-3.5" />,
};

const DENSITY_LABEL: Record<Density, string> = {
  compact: "Compacto",
  default: "Padrão",
  comfortable: "Confortável",
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function isSlaOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ──────────────────────────────────────────────
// Sub-component: Column Header
// ──────────────────────────────────────────────
function SortableHeader({
  field,
  label,
  currentSort,
  currentDir,
  onSort,
}: {
  field: SortField;
  label: string;
  currentSort: SortField;
  currentDir: "asc" | "desc";
  onSort: (f: SortField) => void;
}) {
  const active = currentSort === field;
  return (
    <button
      className={`flex items-center gap-1 group ${
        active
          ? "text-blue-600 dark:text-blue-400"
          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
      } transition-colors`}
      onClick={() => onSort(field)}
    >
      <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      {active ? (
        currentDir === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function TicketsTable({ chamados, sort, dir, isSplitView, activeTicketCodigo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Density
  const [density, setDensity] = useState<Density>("default");

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Bulk status dropdown
  const [bulkStatusVal, setBulkStatusVal] = useState("");

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, chamados, router, searchParams]);

  // ── Sort
  const handleSort = useCallback(
    (field: SortField) => {
      const params = new URLSearchParams(searchParams.toString());
      const newDir =
        sort === field && dir === "asc" ? "desc" : "asc";
      params.set("sort", field);
      params.set("dir", newDir);
      params.set("p", "1");
      router.push(`/dashboard?${params.toString()}`);
    },
    [router, searchParams, sort, dir]
  );

  // ── Selection helpers
  const allIds = chamados.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Row Click
  const handleRowClick = (e: React.MouseEvent, codigo: string) => {
    // If clicking on checkbox or its container, don't trigger row click
    if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("activeTicket", codigo);
    router.push(`/dashboard?${params.toString()}`);
  };

  const clearSelection = () => setSelected(new Set());

  // ── Bulk actions
  const handleBulkAtribuir = () => {
    startTransition(async () => {
      await bulkAtribuirParaMim(Array.from(selected));
      clearSelection();
    });
  };

  const handleBulkClose = () => {
    startTransition(async () => {
      await bulkUpdateStatus(Array.from(selected), "FECHADO");
      clearSelection();
    });
  };

  const handleBulkStatus = () => {
    if (!bulkStatusVal) return;
    startTransition(async () => {
      await bulkUpdateStatus(Array.from(selected), bulkStatusVal);
      setBulkStatusVal("");
      clearSelection();
    });
  };

  const rowPy = DENSITY_ROW[density];
  const cellCls = `px-3 text-sm text-neutral-700 dark:text-neutral-300 ${rowPy}`;

  return (
    <div className="relative">
      {/* ── Toolbar: Density Toggle */}
      <div className="flex items-center justify-end gap-1 mb-3">
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mr-2 font-medium">
          Densidade:
        </span>
        {(["compact", "default", "comfortable"] as Density[]).map((d) => (
          <button
            key={d}
            title={DENSITY_LABEL[d]}
            onClick={() => setDensity(d)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              density === d
                ? "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500 dark:text-blue-400"
                : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {DENSITY_ICONS[d]}
            {DENSITY_LABEL[d]}
          </button>
        ))}
      </div>

      {/* ── Table */}
      <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <table className="w-full text-left border-collapse">
          {/* ── Head */}
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700">
              {/* Checkbox */}
              <th className={`w-10 px-3 py-3 text-center ${isSplitView ? 'hidden md:table-cell' : ''}`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">
                <SortableHeader field="codigo" label="Código" currentSort={sort} currentDir={dir} onSort={handleSort} />
              </th>
              <th className="px-3 py-3 min-w-[220px]">
                <SortableHeader field="titulo" label="Título" currentSort={sort} currentDir={dir} onSort={handleSort} />
              </th>
              <th className="px-3 py-3">
                <SortableHeader field="prioridade" label="Prior." currentSort={sort} currentDir={dir} onSort={handleSort} />
              </th>
              {!isSplitView && (
                <th className="px-3 py-3">
                  <SortableHeader field="local" label="Local" currentSort={sort} currentDir={dir} onSort={handleSort} />
                </th>
              )}
              {!isSplitView && (
                <th className="px-3 py-3">
                  <SortableHeader field="solicitante" label="Solicitante" currentSort={sort} currentDir={dir} onSort={handleSort} />
                </th>
              )}
              <th className="px-3 py-3">
                <SortableHeader field="status" label="Status" currentSort={sort} currentDir={dir} onSort={handleSort} />
              </th>
              {!isSplitView && (
                <th className="px-3 py-3">
                  <SortableHeader field="dataCriacao" label="Abertura" currentSort={sort} currentDir={dir} onSort={handleSort} />
                </th>
              )}
              <th className="px-3 py-3">
                <SortableHeader field="dataVencimento" label="SLA / Venc." currentSort={sort} currentDir={dir} onSort={handleSort} />
              </th>
              {/* Link column */}
              <th className={`w-10 px-3 py-3 ${isSplitView ? 'hidden' : ''}`} />
            </tr>
          </thead>

          {/* ── Body */}
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {chamados.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-16 text-neutral-400 dark:text-neutral-500">
                  Nenhum chamado listado com estes critérios.
                </td>
              </tr>
            )}
            {chamados.map((c, index) => {
              const isSelected = selected.has(c.id);
              const isActive = activeTicketCodigo === c.codigo;
              const isFocused = focusedIndex === index;
              const overdue = c.status !== "FECHADO" && isSlaOverdue(c.dataVencimento);

              return (
                <tr
                  id={`ticket-row-${index}`}
                  key={c.id}
                  onClick={(e) => handleRowClick(e, c.codigo)}
                  className={`group transition-all cursor-pointer outline-none ${
                    isFocused ? "ring-2 ring-inset ring-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10" : ""
                  } ${
                    isActive
                      ? "bg-blue-50/80 dark:bg-blue-500/15 border-l-2 border-l-blue-600"
                      : isSelected
                      ? "bg-blue-50/40 dark:bg-blue-500/10 border-l-2 border-l-transparent"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border-l-2 border-l-transparent"
                  } ${c.status === "FECHADO" ? "opacity-60" : ""}`}
                >
                  {/* Checkbox */}
                  <td className={`${cellCls} text-center ${isSplitView ? 'hidden md:table-cell' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(c.id)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 accent-blue-600 cursor-pointer"
                    />
                  </td>

                  {/* Código */}
                  <td className={cellCls}>
                    <span className={`font-mono tabular-nums text-xs px-2 py-0.5 rounded-md whitespace-nowrap ${isActive ? 'bg-white dark:bg-neutral-900 shadow-sm border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold' : 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'}`}>
                      #{c.codigo}
                    </span>
                  </td>

                  {/* Título */}
                  <td className={`${cellCls} max-w-xs`}>
                    <span className={`font-medium line-clamp-1 transition-colors ${isActive ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                      {c.titulo}
                    </span>
                  </td>

                  {/* Prioridade */}
                  <td className={cellCls}>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                        PRIORITY_CLASS[c.tipo?.prioridade || ""] ||
                        PRIORITY_CLASS["Baixa"]
                      }`}
                    >
                      {c.tipo?.prioridade || "—"}
                    </span>
                  </td>

                  {/* Local */}
                  {!isSplitView && (
                    <td className={`${cellCls} whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400`}>
                      {c.local?.nome || "—"}
                    </td>
                  )}

                  {/* Solicitante */}
                  {!isSplitView && (
                    <td className={`${cellCls} whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400`}>
                      {c.usuarioCriacao?.nome || "Sistema"}
                    </td>
                  )}

                  {/* Status */}
                  <td className={cellCls}>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        STATUS_CLASS[c.status] || STATUS_CLASS["FECHADO"]
                      }`}
                    >
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>

                  {/* Abertura */}
                  {!isSplitView && (
                    <td className={`${cellCls} whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400 tabular-nums`}>
                      {fmtDateShort(c.dataCriacao)}
                    </td>
                  )}

                  {/* SLA / Vencimento */}
                  <td className={`${cellCls} whitespace-nowrap tabular-nums`}>
                    {c.status === "FECHADO" ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        {fmtDateShort(c.dataAtendimento)}
                      </span>
                    ) : overdue ? (
                      <span className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fmtDate(c.dataVencimento)}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {fmtDate(c.dataVencimento)}
                      </span>
                    )}
                  </td>

                  {/* Link */}
                  <td className={`${cellCls} text-center ${isSplitView ? 'hidden' : ''}`}>
                    <Link
                      href={`/chamado/${c.codigo}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                      title="Abrir chamado em tela cheia"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Sticky Bulk Action Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl shadow-neutral-900/20 rounded-lg px-5 py-3">
            {/* Counter */}
            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 pr-3 border-r border-neutral-200 dark:border-neutral-700 min-w-max">
              <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {selected.size}
              </span>
              selecionado{selected.size !== 1 ? "s" : ""}
            </span>

            {/* Atribuir a mim */}
            <button
              onClick={handleBulkAtribuir}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              title="Atribuir a mim e mover para Em Atendimento"
            >
              <UserCheck className="w-4 h-4" />
              Atribuir a Mim
            </button>

            {/* Alterar status */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkStatusVal}
                onChange={(e) => setBulkStatusVal(e.target.value)}
                className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Alterar Status…</option>
                <option value="SOLICITADO">Solicitado</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="PENDENTE">Pendente</option>
                <option value="FECHADO">Fechado</option>
              </select>
              <button
                onClick={handleBulkStatus}
                disabled={!bulkStatusVal || isPending}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              >
                Aplicar
              </button>
            </div>

            {/* Fechar em lote */}
            <button
              onClick={handleBulkClose}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              Fechar em Lote
            </button>

            {/* Clear */}
            <button
              onClick={clearSelection}
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
