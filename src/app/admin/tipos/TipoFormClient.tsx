"use client";

import { useState } from "react";

interface LocalItem {
  id: number;
  nome: string;
  children: { id: number; nome: string }[];
}

interface Props {
  departamentos: { id: number; nome: string }[];
  locais: LocalItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAction: any;
}

export default function TipoFormClient({
  departamentos,
  locais,
  createAction,
}: Props) {
  const [localId, setLocalId] = useState("");
  const localSelecionado = locais.find((l) => l.id === Number(localId));
  const subLocais = localSelecionado?.children || [];

  return (
    <form
      action={createAction}
      className="bg-neutral-50/50 border border-neutral-200 rounded-lg p-5 transition-colors space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Nome do Problema/Tipo
          </label>
          <input
            type="text"
            name="nome"
            required
            placeholder="Ex: Impressora Offline"
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Departamento Destino
          </label>
          <select
            name="departamentoId"
            required
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          >
            <option value="">Selecione...</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Prioridade & SLA
          </label>
          <div className="flex gap-2">
            <select
              name="prioridade"
              required
              className="w-1/2 px-2 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
            >
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
            </select>
            <div className="relative w-1/2">
              <input
                type="number"
                name="tempoSlaHoras"
                defaultValue={24}
                min={1}
                required
                className="w-full pl-2 pr-8 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
                title="SLA em horas"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                h
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-neutral-200">
        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Local Específico{" "}
            <span className="text-neutral-400 normal-case font-normal">
              (Opcional)
            </span>
          </label>
          <select
            name="localId"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          >
            <option value="">Válido em qualquer local</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Sub-Local{" "}
            <span className="text-neutral-400 normal-case font-normal">
              (Opcional)
            </span>
          </label>
          <select
            name="subLocalId"
            disabled={subLocais.length === 0}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors disabled:opacity-50 disabled:bg-neutral-100"
          >
            <option value="">Qualquer sub-local</option>
            {subLocais.map((sl) => (
              <option key={sl.id} value={sl.id}>
                ↳ {sl.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors text-sm"
        >
          Adicionar Tipo de Chamado
        </button>
      </div>
    </form>
  );
}
