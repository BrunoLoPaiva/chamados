"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  CalendarClock,
  Building2,
  MapPin,
  UserCog,
  Power,
} from "lucide-react";
import PreventivaSlidePanel from "./PreventivaSlidePanel";
import {
  createPreventivaAdmin,
  updatePreventivaAdmin,
} from "@/app/actions/admin";

export default function PreventivasClient({
  preventivas,
  departamentos,
  locais,
  tipos,
  usuarios,
}: any) {
  const [busca, setBusca] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePreventiva, setActivePreventiva] = useState<any>(null);

  const filtradas = preventivas.filter(
    (p: any) =>
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.local.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.tecnico.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Manutenções Preventivas
            </h1>
            <p className="text-neutral-500 mt-1">
              Gerencie a abertura automática de chamados recorrentes.
            </p>
          </div>
          <button
            onClick={() => {
              setActivePreventiva(null);
              setIsPanelOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Preventiva
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por título, local ou técnico..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Título / Rotina
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-32 text-center">
                Frequência
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-40">
                Próx. Execução
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Detalhes
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-28 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtradas.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-neutral-500 italic"
                >
                  Nenhuma preventiva encontrada.
                </td>
              </tr>
            ) : (
              filtradas.map((p: any) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    setActivePreventiva(p);
                    setIsPanelOpen(true);
                  }}
                  className={`cursor-pointer transition-colors group ${p.ativa ? "hover:bg-neutral-50" : "bg-neutral-50/50 opacity-75 hover:opacity-100"}`}
                >
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-neutral-900 group-hover:text-brand-navy transition-colors">
                      {p.titulo}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-bold text-neutral-600">
                      <CalendarClock className="w-3.5 h-3.5" />{" "}
                      {p.frequenciaDias} dias
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-mono text-neutral-700">
                      {new Date(p.proximaExecucao).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1 text-[11px] font-medium text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {p.local.nome}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />{" "}
                        {p.departamentoDestino.nome}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserCog className="w-3 h-3" /> {p.tecnico.nome}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {p.ativa ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                        <Power className="w-3 h-3" /> Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded-full border border-neutral-300">
                        <Power className="w-3 h-3" /> Inativa
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PreventivaSlidePanel
        isOpen={isPanelOpen}
        preventiva={activePreventiva}
        onClose={() => {
          setIsPanelOpen(false);
          setActivePreventiva(null);
        }}
        departamentos={departamentos}
        locais={locais}
        tipos={tipos}
        usuarios={usuarios}
        createAction={createPreventivaAdmin}
        updateAction={updatePreventivaAdmin}
      />
    </div>
  );
}
