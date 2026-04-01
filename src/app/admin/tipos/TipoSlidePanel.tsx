"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Trash2,
  ListChecks,
  Building2,
} from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import { deleteTipoChamado } from "@/app/actions/admin";

export default function TipoSlidePanel({
  tipo,
  isOpen,
  onClose,
  departamentos,
  locais,
  createAction,
  updateAction,
}: any) {
  const [nome, setNome] = useState("");
  const [prioridade, setPrioridade] = useState("Media");
  const [tempoSlaHoras, setTempoSlaHoras] = useState(24);
  const [selectedDeptos, setSelectedDeptos] = useState<Set<number>>(new Set());
  const [selectedRoots, setSelectedRoots] = useState<Set<number>>(new Set());
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [expandedRoots, setExpandedRoots] = useState<Set<number>>(new Set());

  // Ações do Checklist
  const [acoes, setAcoes] = useState<any[]>([]);
  const [novaAcao, setNovaAcao] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      if (tipo) {
        setNome(tipo.nome);
        setPrioridade(tipo.prioridade);
        setTempoSlaHoras(tipo.tempoSlaHoras);
        setSelectedDeptos(
          new Set(tipo.deptoTipos.map((dt: any) => dt.departamentoId)),
        );

        const roots = new Set<number>();
        const subs = new Set<string>();
        tipo.deptoTipos.forEach((dt: any) => {
          if (dt.localId && !dt.subLocalId) roots.add(dt.localId);
          if (dt.localId && dt.subLocalId)
            subs.add(`${dt.localId}_${dt.subLocalId}`);
        });
        setSelectedRoots(roots);
        setSelectedSubs(subs);

        // Acoes ativas para edição
        setAcoes(
          tipo.acoes.filter((a: any) => a.ativo).map((a: any) => ({ ...a })),
        );
      } else {
        // Reset para criação
        setNome("");
        setPrioridade("Media");
        setTempoSlaHoras(24);
        setSelectedDeptos(new Set());
        setSelectedRoots(new Set());
        setSelectedSubs(new Set());
        setAcoes([]);
        setNovaAcao("");
      }
    }
  }, [isOpen, tipo]);

  const handleAddAcao = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (e) e.preventDefault();

    if (!novaAcao.trim()) return;
    setAcoes([
      ...acoes,
      { id: null, descricao: novaAcao.trim(), _deleted: false },
    ]);
    setNovaAcao("");
  };

  const handleRemoveAcao = (index: number) => {
    setAcoes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, _deleted: true } : a)),
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedDeptos.size === 0) {
      alert("Selecione pelo menos um departamento.");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("prioridade", prioridade);
    formData.append("tempoSlaHoras", String(tempoSlaHoras));
    formData.append("acoesJson", JSON.stringify(acoes));

    selectedDeptos.forEach((id) =>
      formData.append("departamentos", String(id)),
    );
    selectedRoots.forEach((id) => formData.append("locais", String(id)));
    selectedSubs.forEach((key) => formData.append("sublocais", key));

    if (tipo) formData.append("id", String(tipo.id));

    startTransition(async () => {
      try {
        if (tipo) await updateAction(formData);
        else await createAction(formData);
        onClose();
      } catch (e) {
        alert("Erro ao salvar o tipo de chamado.");
      }
    });
  };

  // Funções da Árvore de Locais (iguais ao código anterior otimizado)
  const isParentFullySelected = useCallback(
    (local: any) => {
      if (local.children.length === 0) return selectedRoots.has(local.id);
      return local.children.every((c: any) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
    },
    [selectedRoots, selectedSubs],
  );

  const isParentPartiallySelected = useCallback(
    (local: any) => {
      if (local.children.length === 0) return false;
      const someSelected = local.children.some((c: any) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
      const allSelected = local.children.every((c: any) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
      return someSelected && !allSelected;
    },
    [selectedSubs],
  );

  const handleParentChange = (local: any, checked: boolean) => {
    if (local.children.length === 0) {
      setSelectedRoots((prev) => {
        const next = new Set(prev);
        if (checked) next.add(local.id);
        else next.delete(local.id);
        return next;
      });
    } else {
      setSelectedSubs((prev) => {
        const next = new Set(prev);
        local.children.forEach((c: any) =>
          checked
            ? next.add(`${local.id}_${c.id}`)
            : next.delete(`${local.id}_${c.id}`),
        );
        return next;
      });
      if (checked) setExpandedRoots((prev) => new Set(prev).add(local.id));
    }
  };

  const handleChildChange = (local: any, child: any, checked: boolean) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      const key = `${local.id}_${child.id}`;
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleExpanded = (id: number) => {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  const acoesAtivas = acoes
    .map((a, idx) => ({ ...a, originalIndex: idx }))
    .filter((a) => !a._deleted);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl h-full bg-white border-l shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {tipo ? "Editar Tipo de Chamado" : "Novo Tipo de Chamado"}
            </h2>
            <p className="text-sm text-neutral-500">
              {tipo
                ? `ID: ${tipo.id} • ${tipo.nome}`
                : "Configuração de SLAs e Regras"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="tipo-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Bloco 1: Infos Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Nome do Problema / Serviço
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  type="text"
                  required
                  placeholder="Ex: Manutenção de Ar Condicionado"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  Prioridade Padrão
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Media">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase">
                  SLA (Horas)
                </label>
                <input
                  value={tempoSlaHoras}
                  onChange={(e) => setTempoSlaHoras(Number(e.target.value))}
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md focus:ring-2 focus:ring-brand-navy/20 outline-none"
                />
              </div>
            </div>

            {/* Bloco 2: Departamentos e Locais em 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
              {/* Deptos */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase mb-2">
                  <Building2 className="w-4 h-4" /> Quem atende?
                </label>
                <div className="max-h-60 overflow-y-auto custom-scrollbar border border-neutral-200 rounded-md p-2 bg-neutral-50 space-y-1">
                  {departamentos.map((d: any) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-neutral-200 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDeptos.has(d.id)}
                        onChange={(e) => {
                          const next = new Set(selectedDeptos);
                          e.target.checked ? next.add(d.id) : next.delete(d.id);
                          setSelectedDeptos(next);
                        }}
                        className="w-4 h-4 rounded border-neutral-300 accent-brand-navy"
                      />
                      <span className="text-sm font-medium text-neutral-700">
                        {d.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Locais */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase">
                    <MapPin className="w-4 h-4" /> Locais Permitidos
                  </label>
                  {selectedRoots.size + selectedSubs.size > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-navy/10 text-brand-navy rounded-full">
                      {selectedRoots.size + selectedSubs.size} ativo
                      {selectedRoots.size + selectedSubs.size > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar border border-neutral-200 rounded-md bg-neutral-50">
                  {locais.map((local: any) => {
                    const hasChildren = local.children.length > 0;
                    return (
                      <div
                        key={local.id}
                        className="border-b border-neutral-100 last:border-b-0 bg-white"
                      >
                        <div className="flex items-center gap-1 p-2 hover:bg-neutral-50 transition-colors">
                          <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-neutral-300 accent-brand-navy"
                              checked={isParentFullySelected(local)}
                              ref={(el) => {
                                if (el)
                                  el.indeterminate =
                                    isParentPartiallySelected(local);
                              }}
                              onChange={(e) =>
                                handleParentChange(local, e.target.checked)
                              }
                            />
                            <span className="text-sm font-bold text-neutral-800 truncate">
                              {local.nome}
                            </span>
                          </label>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(local.id)}
                              className="p-1 rounded hover:bg-neutral-200 text-neutral-500"
                            >
                              {expandedRoots.has(local.id) ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        {hasChildren && expandedRoots.has(local.id) && (
                          <div className="pl-8 pr-2 pb-2 pt-1 space-y-0.5 border-l-2 border-brand-navy/10 ml-3 bg-neutral-50/50">
                            {local.children.map((child: any) => (
                              <label
                                key={child.id}
                                className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-600"
                                  checked={selectedSubs.has(
                                    `${local.id}_${child.id}`,
                                  )}
                                  onChange={(e) =>
                                    handleChildChange(
                                      local,
                                      child,
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span className="text-xs text-neutral-600">
                                  {child.nome}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1 leading-tight text-center">
                  Vazio = Válido para todos os locais.
                </p>
              </div>
            </div>

            {/* Bloco 3: Checklists */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase">
                <ListChecks className="w-4 h-4" /> Checklist do Técnico (Ações
                Padrão)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaAcao}
                  onChange={(e) => setNovaAcao(e.target.value)}
                  onKeyDown={handleAddAcao}
                  placeholder="Ex: Verificar tensão da tomada..."
                  className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddAcao()}
                  className="px-3 bg-brand-navy text-white rounded-md hover:bg-brand-navy/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mt-3">
                {acoesAtivas.map((acao, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-md group"
                  >
                    <span className="text-sm text-neutral-700 flex items-center gap-2">
                      <div className="w-4 h-4 border border-neutral-300 rounded-sm" />
                      {acao.descricao}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAcao(acao.originalIndex)}
                      className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {acoesAtivas.length === 0 && (
                  <p className="text-xs text-neutral-400 italic">
                    Nenhum passo obrigatório configurado.
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between shrink-0">
          <div>
            {tipo && (
              <DeleteButton
                action={deleteTipoChamado}
                id={tipo.id}
                disabled={
                  tipo._count?.chamados > 0 || tipo._count?.preventivas > 0
                }
                title="Excluir Tipo"
                text={`Deseja excluir "${tipo.nome}" definitivamente?`}
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
              form="tipo-form"
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-md hover:bg-brand-navy/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
