"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  MapPin,
  User,
  UserCog,
  CalendarPlus,
  CalendarClock,
  CalendarCheck,
  FilterX,
  Check,
} from "lucide-react";

type LocalList = {
  id: number;
  nome: string;
  parentId: number | null;
};

type UsuarioList = {
  id: number;
  nome: string;
};

interface DashboardFiltersProps {
  locais: LocalList[];
  usuarios: UsuarioList[];
  tecnicos: UsuarioList[]; // <-- NOVA PROP
  isAdmin?: boolean;
  isDeptoAdmin?: boolean;
  currentUserId?: number;
}

export default function DashboardFilters({
  locais,
  usuarios,
  tecnicos, // <-- RECEBENDO A PROP AQUI
  isAdmin,
  isDeptoAdmin,
  currentUserId,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramsString = searchParams?.toString() || "";

  // Estados iniciais
  const [statusFilter, setStatusFilter] = useState(
    searchParams?.get("status") || "",
  );
  const [localId, setLocalId] = useState(searchParams?.get("localId") || "");
  const [criadorId, setCriadorId] = useState(
    searchParams?.get("criadorId") || "",
  );
  const [tecnicoId, setTecnicoId] = useState(
    searchParams?.get("tecnicoId") || "",
  );
  const [dtAberturaDe, setDtAberturaDe] = useState(
    searchParams?.get("dtAberturaDe") || "",
  );
  const [dtAberturaAte, setDtAberturaAte] = useState(
    searchParams?.get("dtAberturaAte") || "",
  );
  const [dtVencimentoDe, setDtVencimentoDe] = useState(
    searchParams?.get("dtVencimentoDe") || "",
  );
  const [dtVencimentoAte, setDtVencimentoAte] = useState(
    searchParams?.get("dtVencimentoAte") || "",
  );
  const [dtFechamentoDe, setDtFechamentoDe] = useState(
    searchParams?.get("dtFechamentoDe") || "",
  );
  const [dtFechamentoAte, setDtFechamentoAte] = useState(
    searchParams?.get("dtFechamentoAte") || "",
  );

  const [prevParamsString, setPrevParamsString] = useState(paramsString);

  if (paramsString !== prevParamsString) {
    setPrevParamsString(paramsString);
    setStatusFilter(searchParams?.get("status") || "");
    setLocalId(searchParams?.get("localId") || "");
    setCriadorId(searchParams?.get("criadorId") || "");
    setTecnicoId(searchParams?.get("tecnicoId") || "");
    setDtAberturaDe(searchParams?.get("dtAberturaDe") || "");
    setDtAberturaAte(searchParams?.get("dtAberturaAte") || "");
    setDtVencimentoDe(searchParams?.get("dtVencimentoDe") || "");
    setDtVencimentoAte(searchParams?.get("dtVencimentoAte") || "");
    setDtFechamentoDe(searchParams?.get("dtFechamentoDe") || "");
    setDtFechamentoAte(searchParams?.get("dtFechamentoAte") || "");
  }

  const handleApply = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (statusFilter) params.set("status", statusFilter);
    else params.delete("status");
    if (localId) params.set("localId", localId);
    else params.delete("localId");
    if (criadorId) params.set("criadorId", criadorId);
    else params.delete("criadorId");
    if (tecnicoId) params.set("tecnicoId", tecnicoId);
    else params.delete("tecnicoId");
    if (dtAberturaDe) params.set("dtAberturaDe", dtAberturaDe);
    else params.delete("dtAberturaDe");
    if (dtAberturaAte) params.set("dtAberturaAte", dtAberturaAte);
    else params.delete("dtAberturaAte");
    if (dtVencimentoDe) params.set("dtVencimentoDe", dtVencimentoDe);
    else params.delete("dtVencimentoDe");
    if (dtVencimentoAte) params.set("dtVencimentoAte", dtVencimentoAte);
    else params.delete("dtVencimentoAte");
    if (dtFechamentoDe) params.set("dtFechamentoDe", dtFechamentoDe);
    else params.delete("dtFechamentoDe");
    if (dtFechamentoAte) params.set("dtFechamentoAte", dtFechamentoAte);
    else params.delete("dtFechamentoAte");

    params.set("p", "1");
    params.set("filters", "closed");
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    params.delete("status");
    params.delete("localId");
    params.delete("criadorId");
    params.delete("tecnicoId");
    params.delete("dtAberturaDe");
    params.delete("dtAberturaAte");
    params.delete("dtVencimentoDe");
    params.delete("dtVencimentoAte");
    params.delete("dtFechamentoDe");
    params.delete("dtFechamentoAte");

    params.set("p", "1");
    params.set("filters", "closed");
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const locaisRaiz = locais.filter((l) => !l.parentId);

  const canFilterUsers = isAdmin || isDeptoAdmin;

  return (
    <div className="flex flex-col h-full gap-6 pb-20">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2">
          Geral
        </h3>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20 transition-colors"
          >
            <option value="">Abertos (Padrão)</option>
            <option value="ALL">Todos (Incluindo Fechados)</option>
            <option value="SOLICITADO">Sem técnico atribuído</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="FECHADO">Finalizados</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Localização
          </label>
          <select
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20 transition-colors"
          >
            <option value="">Qualquer local</option>
            {locaisRaiz.map((pai) => (
              <optgroup key={pai.id} label={pai.nome}>
                <option value={pai.id}>{pai.nome} (Geral)</option>
                {locais
                  .filter((l) => l.parentId === pai.id)
                  .map((filho) => (
                    <option key={filho.id} value={filho.id}>
                      ↳ {filho.nome}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        {canFilterUsers && (
          <>
            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Solicitante (Criador)
              </label>
              <select
                value={criadorId}
                onChange={(e) => setCriadorId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20 transition-colors"
              >
                <option value="">Qualquer solicitante</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 flex items-center gap-1.5">
                <UserCog className="w-3.5 h-3.5" /> Técnico Atribuído
              </label>
              <select
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20 transition-colors"
              >
                <option value="">Qualquer técnico</option>
                <option value="unassigned">Sem técnico (Não atribuídos)</option>
                {/* AQUI USAMOS A NOVA LISTA FILTRADA DE TÉCNICOS */}
                {tecnicos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <CalendarPlus className="w-4 h-4" /> Data de Abertura
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              De
            </label>
            <input
              type="date"
              value={dtAberturaDe}
              onChange={(e) => setDtAberturaDe(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Até
            </label>
            <input
              type="date"
              value={dtAberturaAte}
              onChange={(e) => setDtAberturaAte(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4" /> Data de SLA / Venc.
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              De
            </label>
            <input
              type="date"
              value={dtVencimentoDe}
              onChange={(e) => setDtVencimentoDe(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Até
            </label>
            <input
              type="date"
              value={dtVencimentoAte}
              onChange={(e) => setDtVencimentoAte(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4" /> Data de Fechamento
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              De
            </label>
            <input
              type="date"
              value={dtFechamentoDe}
              onChange={(e) => setDtFechamentoDe(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1">
              Até
            </label>
            <input
              type="date"
              value={dtFechamentoAte}
              onChange={(e) => setDtFechamentoAte(e.target.value)}
              className="w-full px-2 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-neutral-200 flex flex-col gap-2 bg-white">
        <button
          onClick={handleApply}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-white font-bold rounded-md transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          Aplicar Filtros
        </button>

        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-neutral-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-neutral-600 font-semibold rounded-md transition-colors"
        >
          <FilterX className="w-4 h-4" />
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
