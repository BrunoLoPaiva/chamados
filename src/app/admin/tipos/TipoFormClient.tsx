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
  createAction: (formData: FormData) => Promise<void>;
}

export default function TipoFormClient({ departamentos, locais, createAction }: Props) {
  const [localId, setLocalId] = useState("");
  const localSelecionado = locais.find(l => l.id === Number(localId));
  const subLocais = localSelecionado?.children || [];

  return (
    <form action={createAction} className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-md p-5 transition-colors space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nome */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Nome do Problema</label>
          <input
            type="text"
            name="nome"
            required
            placeholder="Ex: Impressora Offline"
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
          />
        </div>

        {/* Departamento */}
        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Departamento</label>
          <select
            name="departamentoId"
            required
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
          >
            <option value="">Destino...</option>
            {departamentos.map(d => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        {/* Urgência / SLA */}
        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Urgência / SLA</label>
          <div className="flex gap-2">
            <select name="prioridade" required className="w-1/2 px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors">
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
            </select>
            <input
              type="number"
              name="tempoSlaHoras"
              defaultValue={24}
              min={1}
              required
              className="w-1/2 px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              placeholder="Horas"
              title="SLA em horas"
            />
          </div>
        </div>
      </div>

      {/* Local / SubLocal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Local Específico <span className="text-neutral-400 normal-case font-normal">(opcional — deixe vazio para qualquer local)</span>
          </label>
          <select
            name="localId"
            value={localId}
            onChange={e => setLocalId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
          >
            <option value="">Qualquer local</option>
            {locais.map(l => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Sub-Local Específico <span className="text-neutral-400 normal-case font-normal">(opcional)</span>
          </label>
          <select
            name="subLocalId"
            disabled={subLocais.length === 0}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors disabled:opacity-50"
          >
            <option value="">Qualquer sub-local</option>
            {subLocais.map(sl => (
              <option key={sl.id} value={sl.id}>↳ {sl.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm"
        >
          Adicionar Tipo
        </button>
      </div>
    </form>
  );
}
