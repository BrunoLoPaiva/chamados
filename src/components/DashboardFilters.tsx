"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

type Option = { id: number; nome: string };

export default function DashboardFilters({ 
  locais, 
  usuarios 
}: { 
  locais: Option[]; 
  usuarios: Option[]; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário já estiver num input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        router.push("/chamado/novo");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // States
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [localId, setLocalId] = useState(searchParams.get("localId") || "");
  const [criadorId, setCriadorId] = useState(searchParams.get("criadorId") || "");
  const [tecnicoId, setTecnicoId] = useState(searchParams.get("tecnicoId") || "");
  
  const [dtAberturaDe, setDtAberturaDe] = useState(searchParams.get("dtAberturaDe") || "");
  const [dtAberturaAte, setDtAberturaAte] = useState(searchParams.get("dtAberturaAte") || "");
  const [dtVencimentoDe, setDtVencimentoDe] = useState(searchParams.get("dtVencimentoDe") || "");
  const [dtVencimentoAte, setDtVencimentoAte] = useState(searchParams.get("dtVencimentoAte") || "");
  const [dtFechamentoDe, setDtFechamentoDe] = useState(searchParams.get("dtFechamentoDe") || "");
  const [dtFechamentoAte, setDtFechamentoAte] = useState(searchParams.get("dtFechamentoAte") || "");

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    // Always reset to page 1 when filtering
    params.set("p", "1");

    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (localId) params.set("localId", localId);
    if (criadorId) params.set("criadorId", criadorId);
    if (tecnicoId) params.set("tecnicoId", tecnicoId);
    
    if (dtAberturaDe) params.set("dtAberturaDe", dtAberturaDe);
    if (dtAberturaAte) params.set("dtAberturaAte", dtAberturaAte);
    if (dtVencimentoDe) params.set("dtVencimentoDe", dtVencimentoDe);
    if (dtVencimentoAte) params.set("dtVencimentoAte", dtVencimentoAte);
    if (dtFechamentoDe) params.set("dtFechamentoDe", dtFechamentoDe);
    if (dtFechamentoAte) params.set("dtFechamentoAte", dtFechamentoAte);

    router.push(`/dashboard?${params.toString()}`);
  }, [
    q, status, localId, criadorId, tecnicoId, 
    dtAberturaDe, dtAberturaAte, dtVencimentoDe, dtVencimentoAte, dtFechamentoDe, dtFechamentoAte, 
    router
  ]);

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setLocalId("");
    setCriadorId("");
    setTecnicoId("");
    setDtAberturaDe("");
    setDtAberturaAte("");
    setDtVencimentoDe("");
    setDtVencimentoAte("");
    setDtFechamentoDe("");
    setDtFechamentoAte("");
    router.push("/dashboard");
  };

  const hasAdvancedFilters = localId || criadorId || tecnicoId || dtAberturaDe || dtAberturaAte || dtVencimentoDe || dtVencimentoAte || dtFechamentoDe || dtFechamentoAte;
  const hasAnyFilter = q || status || hasAdvancedFilters;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 md:p-6 mb-8 shadow-sm transition-all duration-300">
      {/* Top Bar - Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4 relative">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters()}
            placeholder="Buscar chamado por #hash ou título..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm appearance-none md:min-w-[180px] transition-colors"
          >
            <option value="">Status (Todos)</option>
            <option value="SOLICITADO">Solicitado</option>
            <option value="EM_ATENDIMENTO">Em Atendimento</option>
            <option value="PENDENTE">Pendente / Aguardando</option>
            <option value="FECHADO">Fechado</option>
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-md font-medium text-sm transition-colors ${
              hasAdvancedFilters 
                ? "border-blue-500 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10"
                : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            Avançado
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={updateFilters}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>

          {hasAnyFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center w-[46px] h-[46px] bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-md transition-colors shrink-0"
              title="Limpar todos os filtros"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Area */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/60 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Relational Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Atribuição</h3>
              
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Local / Unidade</label>
                <select value={localId} onChange={e => setLocalId(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">Qualquer local</option>
                  {/* Categorias Raiz sem sub-locais, ou pais com filhos */}
                  {locais.filter(l => !(l as any).parentId).map(cat => {
                    const filhos = locais.filter(l => (l as any).parentId === cat.id);
                    if (filhos.length > 0) {
                      return (
                        <optgroup key={cat.id} label={cat.nome}>
                          {filhos.map(sub => (
                             <option key={sub.id} value={sub.id}>{sub.nome}</option>
                          ))}
                        </optgroup>
                      );
                    }
                    
                    // Sem filhos, rederinga como option normal
                    return <option key={cat.id} value={cat.id}>{cat.nome}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Criado por</label>
                <select value={criadorId} onChange={e => setCriadorId(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">Qualquer usuário</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Técnico Atribuído</label>
                <select value={tecnicoId} onChange={e => setTecnicoId(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option value="">Qualquer técnico</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Date Filters 1 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Abertura e Vencimento</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Abertura (De)</label>
                  <input type="date" value={dtAberturaDe} onChange={e => setDtAberturaDe(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Abertura (Até)</label>
                  <input type="date" value={dtAberturaAte} onChange={e => setDtAberturaAte(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Vencimento (De)</label>
                  <input type="date" value={dtVencimentoDe} onChange={e => setDtVencimentoDe(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Vencimento (Até)</label>
                  <input type="date" value={dtVencimentoAte} onChange={e => setDtVencimentoAte(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
            </div>

            {/* Date Filters 2 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Conclusão</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Fechamento (De)</label>
                  <input type="date" value={dtFechamentoDe} onChange={e => setDtFechamentoDe(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Fechamento (Até)</label>
                  <input type="date" value={dtFechamentoAte} onChange={e => setDtFechamentoAte(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                </div>
              </div>
              
              {/* Espaço vazio para manter o layout se necessário */}
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50 flex justify-end">
                <button
                  onClick={updateFilters}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Aplicar Filtros Avançados
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
