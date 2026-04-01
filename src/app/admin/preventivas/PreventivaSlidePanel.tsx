"use client";

import { useState, useEffect, useTransition } from "react";
import { X } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import { deletePreventivaAdmin } from "@/app/actions/admin";

export default function PreventivaSlidePanel({
  preventiva,
  isOpen,
  onClose,
  departamentos,
  locais,
  tipos,
  usuarios,
  createAction,
  updateAction,
}: any) {
  const [isPending, startTransition] = useTransition();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [frequenciaDias, setFrequenciaDias] = useState(30);
  const [proximaExecucao, setProximaExecucao] = useState("");
  const [departamentoDestinoId, setDepartamentoDestinoId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [localId, setLocalId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [ativa, setAtiva] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (preventiva) {
        setTitulo(preventiva.titulo);
        setDescricao(preventiva.descricao);
        setFrequenciaDias(preventiva.frequenciaDias);
        // Formata data para YYYY-MM-DD pro input type date
        setProximaExecucao(
          new Date(preventiva.proximaExecucao).toISOString().split("T")[0],
        );
        setDepartamentoDestinoId(String(preventiva.departamentoDestinoId));
        setTipoId(String(preventiva.tipoId));
        setLocalId(String(preventiva.localId));
        setTecnicoId(String(preventiva.tecnicoId));
        setAtiva(preventiva.ativa);
      } else {
        setTitulo("");
        setDescricao("");
        setFrequenciaDias(30);
        setProximaExecucao(new Date().toISOString().split("T")[0]);
        setDepartamentoDestinoId("");
        setTipoId("");
        setLocalId("");
        setTecnicoId("");
        setAtiva(true);
      }
    }
  }, [isOpen, preventiva]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("frequenciaDias", String(frequenciaDias));
    formData.append("proximaExecucao", proximaExecucao);
    formData.append("departamentoDestinoId", departamentoDestinoId);
    formData.append("tipoId", tipoId);
    formData.append("localId", localId);
    formData.append("tecnicoId", tecnicoId);
    formData.append("ativa", ativa ? "true" : "false");

    if (preventiva) formData.append("id", String(preventiva.id));

    startTransition(async () => {
      try {
        if (preventiva) await updateAction(formData);
        else await createAction(formData);
        onClose();
      } catch (error) {
        alert("Erro ao salvar a preventiva.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl h-full bg-white border-l shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {preventiva ? "Editar Preventiva" : "Nova Preventiva"}
            </h2>
            <p className="text-sm text-neutral-500">
              {preventiva
                ? `ID: ${preventiva.id}`
                : "Agendamento de Manutenção"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form
            id="preventiva-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="flex items-center justify-between p-4 border border-brand-green/20 bg-brand-green/5 rounded-lg">
              <div>
                <span className="block text-sm font-bold text-brand-green">
                  Status da Rotina
                </span>
                <span className="text-xs text-neutral-500">
                  Se desativada, não gerará mais chamados automáticos.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={ativa}
                  onChange={(e) => setAtiva(e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">
                Título da Manutenção
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                type="text"
                required
                placeholder="Ex: Limpeza Filtros Ar Condicionado"
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">
                Descrição (Tarefas a realizar)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Frequência (Dias)
                </label>
                <input
                  value={frequenciaDias}
                  onChange={(e) => setFrequenciaDias(Number(e.target.value))}
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Próxima Execução
                </label>
                <input
                  value={proximaExecucao}
                  onChange={(e) => setProximaExecucao(e.target.value)}
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Departamento Responsável
                </label>
                <select
                  value={departamentoDestinoId}
                  onChange={(e) => setDepartamentoDestinoId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                >
                  <option value="">Selecione...</option>
                  {departamentos.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Tipo de Serviço / Checklist
                </label>
                <select
                  value={tipoId}
                  onChange={(e) => setTipoId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                >
                  <option value="">Selecione...</option>
                  {tipos.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Localização
                </label>
                <select
                  value={localId}
                  onChange={(e) => setLocalId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                >
                  <option value="">Selecione...</option>
                  {locais.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Técnico Predefinido
                </label>
                <select
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                >
                  <option value="">Selecione...</option>
                  {usuarios.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between shrink-0">
          <div>
            {preventiva && (
              <DeleteButton
                action={deletePreventivaAdmin}
                id={preventiva.id}
                title="Excluir Preventiva"
                text={`Deseja cancelar e excluir a rotina "${preventiva.titulo}"?`}
              />
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              form="preventiva-form"
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-md hover:bg-brand-navy/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Salvar Preventiva"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
