"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  X,
  Plus,
  Clock,
  ListChecks,
  Tags,
  Filter,
  MapPinHouse,
} from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import {
  deleteTipoChamado,
  createAcaoParaTipo,
  deleteAcao,
  createTipoChamado,
} from "@/app/actions/admin";
import TipoFormClient from "./TipoFormClient";

interface TiposClientProps {
  tipos: any[];
  departamentosDisponiveis: any[];
  locaisRaiz: any[];
  locaisMap: Record<number, string>;
}

const ITEMS_PER_PAGE = 12;

export default function TiposClient({
  tipos,
  departamentosDisponiveis,
  locaisRaiz,
  locaisMap,
}: TiposClientProps) {
  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("TODOS");
  const [filtroDepartamento, setFiltroDepartamento] = useState("TODOS");

  // Novos filtros de Localização
  const [filtroLocal, setFiltroLocal] = useState("TODOS");
  const [filtroSubLocal, setFiltroSubLocal] = useState("TODOS");

  const [paginaAtual, setPaginaAtual] = useState(1);

  // Obtém os sub-locais dinamicamente baseados no Local selecionado no filtro
  const subLocaisDisponiveis = useMemo(() => {
    if (filtroLocal === "TODOS") return [];
    const localSelecionado = locaisRaiz.find(
      (l) => String(l.id) === filtroLocal,
    );
    return localSelecionado?.children || [];
  }, [filtroLocal, locaisRaiz]);

  // Quando trocar de Local pai, reseta o Sub-local
  const handleLocalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroLocal(e.target.value);
    setFiltroSubLocal("TODOS");
  };

  // ── LÓGICA DE FILTROS ──
  const tiposFiltrados = useMemo(() => {
    return tipos.filter((tipo) => {
      // 1. Filtro de Texto
      const matchBusca =
        tipo.nome.toLowerCase().includes(busca.toLowerCase()) ||
        tipo.deptoTipos.some((dt: any) =>
          dt.departamento.nome.toLowerCase().includes(busca.toLowerCase()),
        );

      // 2. Filtro de Prioridade
      const matchPrioridade =
        filtroPrioridade === "TODOS" || tipo.prioridade === filtroPrioridade;

      // 3. Filtro de Departamento
      const matchDepartamento =
        filtroDepartamento === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) => String(dt.departamentoId) === filtroDepartamento,
        );

      // 4. Filtro de Local
      // Se um tipo não tem local definido (!dt.localId), ele vale para TODOS os locais. Logo, deve aparecer na busca.
      const matchLocal =
        filtroLocal === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) => !dt.localId || String(dt.localId) === filtroLocal,
        );

      // 5. Filtro de Sub-Local
      // Se o tipo vale para o Local todo (!dt.subLocalId), ele deve aparecer quando buscamos um sub-local específico.
      const matchSubLocal =
        filtroSubLocal === "TODOS" ||
        tipo.deptoTipos.some(
          (dt: any) =>
            !dt.localId || // Vale para tudo
            (String(dt.localId) === filtroLocal && !dt.subLocalId) || // Vale para o local inteiro
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

  // ── LÓGICA DE PAGINAÇÃO ──
  const totalPaginas = Math.max(
    1,
    Math.ceil(tiposFiltrados.length / ITEMS_PER_PAGE),
  );
  const tiposPaginados = tiposFiltrados.slice(
    (paginaAtual - 1) * ITEMS_PER_PAGE,
    paginaAtual * ITEMS_PER_PAGE,
  );

  // Reseta para a página 1 sempre que um filtro for alterado
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── HEADER E FORMULÁRIO ── */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Tipos de Chamado e SLAs
            </h1>
            <p className="text-neutral-500 mt-1">
              Catálogo de serviços, prazos de resolução e checklists técnicos.
            </p>
          </div>
          <div className="flex gap-4 shrink-0 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="text-center px-4 border-r border-neutral-200">
              <p className="text-2xl font-black text-brand-navy">
                {tipos.length}
              </p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Tipos Ativos
              </p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-black text-brand-navy">
                {tipos.reduce((acc, t) => acc + t.acoes.length, 0)}
              </p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Passos de Checklist
              </p>
            </div>
          </div>
        </div>

        <TipoFormClient
          departamentos={departamentosDisponiveis.map((d) => ({
            id: d.id,
            nome: d.nome,
          }))}
          locais={locaisRaiz.map((l) => ({
            id: l.id,
            nome: l.nome,
            children:
              l.children?.map((c: any) => ({ id: c.id, nome: c.nome })) || [],
          }))}
          createAction={createTipoChamado}
        />
      </div>

      {/* ── BARRA DE FILTROS AVANÇADOS ── */}
      <div className="flex flex-col gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        {/* Linha 1: Busca e Filtros Principais */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por problema..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Linha 2: Filtros de Localização */}

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400 hidden lg:block" />
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none w-full lg:w-auto transition-colors"
          >
            <option value="TODOS">Todas Prioridades</option>
            <option value="Alta">Prioridade Alta</option>
            <option value="Media">Prioridade Média</option>
            <option value="Baixa">Prioridade Baixa</option>
          </select>

          <MapPinHouse className="w-4 h-4 text-neutral-400 hidden lg:block" />
          <select
            value={filtroDepartamento}
            onChange={(e) => setFiltroDepartamento(e.target.value)}
            className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none w-full lg:w-auto transition-colors"
          >
            <option value="TODOS">Todos Departamentos</option>
            {departamentosDisponiveis.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>

          <MapPin className="w-4 h-4 text-neutral-400 hidden sm:block" />
          <select
            value={filtroLocal}
            onChange={handleLocalChange}
            className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none w-full sm:w-auto transition-colors"
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
            className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none w-full sm:w-auto transition-colors disabled:opacity-50 disabled:bg-neutral-100"
          >
            <option value="TODOS">Qualquer Sub-local</option>
            {subLocaisDisponiveis.map((sl: any) => (
              <option key={sl.id} value={sl.id}>
                ↳ {sl.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── GRID DE TIPOS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tiposPaginados.map((tipo) => {
          return (
            <div
              key={tipo.id}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col transition-all hover:shadow-md h-[450px]"
            >
              {/* Header do Card */}
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 rounded-t-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3
                    className="text-base font-bold text-neutral-900 leading-tight pr-2 line-clamp-2"
                    title={tipo.nome}
                  >
                    {tipo.nome}
                  </h3>
                  <div className="shrink-0 -mt-1 -mr-1">
                    <DeleteButton
                      action={deleteTipoChamado}
                      id={tipo.id}
                      disabled={
                        tipo._count.chamados > 0 || tipo._count.preventivas > 0
                      }
                      title="Excluir Tipo"
                      text={`Deseja excluir "${tipo.nome}"?`}
                    />
                  </div>
                </div>

                {/* Badges: Prioridade e SLA */}
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  <span
                    className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] tracking-wider ${
                      tipo.prioridade === "Alta"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : tipo.prioridade === "Media"
                          ? "bg-brand-yellow/20 text-brand-navy border border-brand-yellow/40"
                          : "bg-brand-green/10 text-brand-green border border-brand-green/20"
                    }`}
                  >
                    {tipo.prioridade}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 font-bold text-[10px] tracking-wider">
                    <Clock className="w-3 h-3" />
                    SLA: {tipo.tempoSlaHoras}h
                  </span>
                </div>

                {/* Departamento(s) Alvo */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                  {tipo.deptoTipos.map((dt: any) => (
                    <div
                      key={dt.id}
                      className="bg-white border border-neutral-200 rounded p-2 shadow-sm"
                    >
                      <p
                        className="text-[11px] text-neutral-700 font-medium truncate"
                        title={dt.departamento.nome}
                      >
                        {dt.departamento.nome}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-brand-navy/70">
                        {dt.localId ? (
                          <>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {locaisMap[dt.localId]}
                              {dt.subLocalId &&
                                ` → ${locaisMap[dt.subLocalId]}`}
                            </span>
                          </>
                        ) : (
                          <span className="italic text-neutral-400">
                            Qualquer localidade
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist / Ações (Com scroll) */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="px-5 pt-4 pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-neutral-400" />
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Checklist do Técnico
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {tipo.acoes.map((acao: any) => (
                    <div
                      key={acao.id}
                      className="flex justify-between items-start text-sm bg-neutral-50 border border-neutral-100 p-2 rounded-md group hover:border-brand-navy/30 transition-colors"
                    >
                      <span className="text-neutral-700 text-xs pr-2 leading-snug">
                        {acao.descricao}
                      </span>
                      <form
                        action={deleteAcao}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <input type="hidden" name="id" value={acao.id} />
                        <button
                          type="submit"
                          className="text-neutral-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Remover Ação"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  ))}
                  {tipo.acoes.length === 0 && (
                    <p className="text-xs text-neutral-400 italic text-center py-4">
                      Nenhuma ação cadastrada.
                    </p>
                  )}
                </div>
              </div>

              {/* Form de Nova Ação */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 rounded-b-lg">
                <form action={createAcaoParaTipo} className="flex gap-2">
                  <input type="hidden" name="tipoId" value={tipo.id} />
                  <input
                    type="text"
                    name="descricao"
                    required
                    placeholder="Adicionar passo..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-white border border-neutral-300 hover:bg-brand-navy hover:text-white hover:border-brand-navy text-neutral-600 text-sm font-medium rounded-md transition-all shrink-0"
                    title="Adicionar ação"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── EMPTY STATE ── */}
      {tiposFiltrados.length === 0 && (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <Tags className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="font-bold text-neutral-600 text-lg">
            Nenhum tipo de chamado encontrado.
          </p>
          {(busca ||
            filtroPrioridade !== "TODOS" ||
            filtroDepartamento !== "TODOS" ||
            filtroLocal !== "TODOS") && (
            <p className="text-sm text-neutral-500 mt-1">
              Revise os filtros aplicados acima.
            </p>
          )}
        </div>
      )}

      {/* ── CONTROLES DE PAGINAÇÃO ── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
          <span className="text-sm text-neutral-500">
            Mostrando{" "}
            <span className="font-bold text-neutral-900">
              {(paginaAtual - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            a{" "}
            <span className="font-bold text-neutral-900">
              {Math.min(paginaAtual * ITEMS_PER_PAGE, tiposFiltrados.length)}
            </span>{" "}
            de{" "}
            <span className="font-bold text-neutral-900">
              {tiposFiltrados.length}
            </span>{" "}
            tipos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-md disabled:opacity-50 hover:bg-neutral-50 transition-colors text-neutral-700"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1 hidden sm:flex">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setPaginaAtual(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${paginaAtual === page ? "bg-brand-navy text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() =>
                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-md disabled:opacity-50 hover:bg-neutral-50 transition-colors text-neutral-700"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
