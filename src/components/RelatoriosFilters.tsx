"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";

export default function RelatoriosFilters({
  departamentos,
  tecnicos
}: {
  departamentos: { id: number; nome: string }[];
  tecnicos: { id: number; nome: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dataInicio, setDataInicio] = useState(searchParams?.get("inicio") || "");
  const [dataFim, setDataFim] = useState(searchParams?.get("fim") || "");
  const [deptoId, setDeptoId] = useState(searchParams?.get("depto") || "");
  const [tecnicoId, setTecnicoId] = useState(searchParams?.get("tecnico") || "");

  const handleApply = useCallback(() => {
    const params = new URLSearchParams();
    if (dataInicio) params.set("inicio", dataInicio);
    if (dataFim) params.set("fim", dataFim);
    if (deptoId) params.set("depto", deptoId);
    if (tecnicoId) params.set("tecnico", tecnicoId);
    
    router.push(`/relatorios?${params.toString()}`);
  }, [dataInicio, dataFim, deptoId, tecnicoId, router]);

  const handleClear = () => {
    setDataInicio("");
    setDataFim("");
    setDeptoId("");
    setTecnicoId("");
    router.push("/relatorios");
  };

  const isFiltered = dataInicio || dataFim || deptoId || tecnicoId;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 transition-colors">
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Data Inicio */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Data Inicial
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-neutral-700 dark:text-neutral-300"
            />
          </div>
        </div>

        {/* Data Final */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Data Final
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-neutral-700 dark:text-neutral-300"
            />
          </div>
        </div>

        {/* Departamento */}
        <div className="flex-[1.5]">
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Departamento
          </label>
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={deptoId}
              onChange={(e) => setDeptoId(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-neutral-700 dark:text-neutral-300 appearance-none"
            >
              <option value="">Todos os Departamentos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Técnico */}
        <div className="flex-[1.5]">
          <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
            Técnico Analista
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-neutral-700 dark:text-neutral-300 appearance-none"
            >
              <option value="">Todos os Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2 shrink-0">
          <button
            onClick={handleApply}
            className="px-4 py-2 md:h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm shadow-sm transition-colors"
          >
            Filtrar
          </button>
          
          {isFiltered && (
            <button
              onClick={handleClear}
              className="p-2 md:h-9 md:w-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-md transition-colors"
              title="Limpar Filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
