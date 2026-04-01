"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MapPinHouse,
  MapPin,
  Plus,
  Clock,
  Building2,
} from "lucide-react";
import { createTipoChamado, updateTipoChamado } from "@/app/actions/admin";
import TipoSlidePanel from "./TipoSlidePanel";

interface TiposClientProps {
  tipos: any[];
  departamentosDisponiveis: any[];
  locaisRaiz: any[];
  locaisMap: Record<number, string>;
}

const ITEMS_PER_PAGE = 20;

export default function TiposClient({
  tipos,
  departamentosDisponiveis,
  locaisRaiz,
  locaisMap,
}: TiposClientProps) {
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("TODOS");
  const [filtroDepartamento, setFiltroDepartamento] = useState("TODOS");
  const [filtroLocal, setFiltroLocal] = useState("TODOS");
  const [filtroSubLocal, setFiltroSubLocal] = useState("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados do Modal
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTipo, setActiveTipo] = useState<any>(null);

  const subLocaisDisponiveis = useMemo(() => {
    if (filtroLocal === "TODOS") return [];
    return locaisRaiz.find((l) => String(l.id) === filtroLocal)?.children || [];
  }, [filtroLocal, locaisRaiz]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroLocal(e.target.value);
    setFiltroSubLocal("TODOS");
  };

  const tiposFiltrados = useMemo(() => {
    return tipos.filter((tipo) => {
      const matchBusca =
        tipo.nome.toLowerCase().includes(busca.toLowerCase()) ||
        tipo.deptoTipos.some((dt: any) =>
          dt.departamento.nome.toLowerCase().includes(busca.toLowerCase()),
        );
      const matchPrioridade =
        filtroPrioridade === "TODOS" || tipo.prioridade === filtroPrioridade;
      const matchDepartamento =
        filtroDepartamento === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) => String(dt.departamentoId) === filtroDepartamento,
        );
      const matchLocal =
        filtroLocal === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) => !dt.localId || String(dt.localId) === filtroLocal,
        );
      const matchSubLocal =
        filtroSubLocal === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) =>
            !dt.localId ||
            (String(dt.localId) === filtroLocal && !dt.subLocalId) ||
            String(dt.subLocalId) === filtroSubLocal,
        );
      return (
        matchBusca &&
        matchPrioridade &&
        matchDepartamento &&
        matchLocal &&
        matchSubLocal
      );
    });
  }, [
    tipos,
    busca,
    filtroPrioridade,
    filtroDepartamento,
    filtroLocal,
    filtroSubLocal,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(tiposFiltrados.length / ITEMS_PER_PAGE),
  );
  const tiposPaginados = tiposFiltrados.slice(
    (paginaAtual - 1) * ITEMS_PER_PAGE,
    paginaAtual * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    filtroPrioridade,
    filtroDepartamento,
    filtroLocal,
    filtroSubLocal,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* HEADER E FILTROS */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Catálogo de Serviços
            </h1>
            <p className="text-neutral-500 mt-1">
              Gerencie os tipos de chamados, prazos (SLA) e locais de atuação.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTipo(null);
              setIsPanelOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Serviço
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por problema ou serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-neutral-400 hidden lg:block" />
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm outline-none w-full lg:w-auto"
            >
              <option value="TODOS">Todas Prioridades</option>
              <option value="Alta">Prioridade Alta</option>
              <option value="Media">Prioridade Média</option>
              <option value="Baixa">Prioridade Baixa</option>
            </select>
            <MapPinHouse className="w-4 h-4 text-neutral-400 hidden xl:block" />
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm outline-none w-full lg:w-auto"
            >
              <option value="TODOS">Todos Departamentos</option>
              {departamentosDisponiveis.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-neutral-400 hidden xl:block" />
            <select
              value={filtroLocal}
              onChange={handleLocalChange}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm outline-none w-full lg:w-auto"
            >
              <option value="TODOS">Qualquer Localidade</option>
              {locaisRaiz.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
            <select
              value={filtroSubLocal}
              onChange={(e) => setFiltroSubLocal(e.target.value)}
              disabled={subLocaisDisponiveis.length === 0}
              className="px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm outline-none w-full lg:w-auto disabled:opacity-50"
            >
              <option value="TODOS">Sub-local</option>
              {subLocaisDisponiveis.map((sl: any) => (
                <option key={sl.id} value={sl.id}>
                  ↳ {sl.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE LISTAGEM */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-x-auto relative">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Serviço / Problema
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-32">
                Prioridade
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-28">
                SLA
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-64">
                Departamentos
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Locais de Atuação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tiposPaginados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-neutral-500 italic"
                >
                  Nenhum serviço encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              tiposPaginados.map((tipo) => (
                <tr
                  key={tipo.id}
                  onClick={() => {
                    setActiveTipo(tipo);
                    setIsPanelOpen(true);
                  }}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900 group-hover:text-brand-navy transition-colors">
                        {tipo.nome}
                      </span>
                      {tipo.acoes.length > 0 && (
                        <span className="text-[10px] text-neutral-400 font-medium mt-0.5">
                          {tipo.acoes.length} item(ns) no checklist
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${tipo.prioridade === "Alta" ? "bg-red-100 text-red-700" : tipo.prioridade === "Media" ? "bg-brand-yellow/20 text-brand-navy" : "bg-brand-green/10 text-brand-green"}`}
                    >
                      {tipo.prioridade}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-600">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />{" "}
                      {tipo.tempoSlaHoras}h
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(
                        new Set(
                          tipo.deptoTipos.map(
                            (dt: any) => dt.departamento.nome,
                          ),
                        ),
                      ).map((nome: any) => (
                        <span
                          key={nome}
                          className="inline-flex items-center gap-1 bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-neutral-600"
                        >
                          <Building2 className="w-3 h-3 text-neutral-400" />{" "}
                          {nome}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {tipo.deptoTipos.length === 0 ? (
                        <span className="text-xs text-neutral-400 italic">
                          —
                        </span>
                      ) : (
                        tipo.deptoTipos.map((dt: any) => (
                          <span
                            key={dt.id}
                            className="text-[10px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600 truncate max-w-[180px]"
                            title={
                              dt.localId
                                ? locaisMap[dt.localId]
                                : "Todas as localidades"
                            }
                          >
                            {dt.localId
                              ? locaisMap[dt.localId]
                              : "Geral (Todos)"}
                            {dt.subLocalId
                              ? ` → ${locaisMap[dt.subLocalId]}`
                              : ""}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAINEL SLIDE-OVER MODAL */}
      <TipoSlidePanel
        isOpen={isPanelOpen}
        tipo={activeTipo}
        onClose={() => {
          setIsPanelOpen(false);
          setActiveTipo(null);
        }}
        departamentos={departamentosDisponiveis}
        locais={locaisRaiz}
        createAction={createTipoChamado}
        updateAction={updateTipoChamado}
      />
    </div>
  );
}
