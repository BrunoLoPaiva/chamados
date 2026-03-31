"use client";

import { useState, useCallback } from "react";
import { MapPin, ChevronDown, ChevronRight } from "lucide-react";

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

/**
 * Modelo de seleção de locais:
 * - "sublocais" é o campo enviado ao servidor com value="${localPaiId}_${filhoId}"
 * - Se um local-pai não tem filhos, enviamos via "locais" com value="${localPaiId}"
 * - Se um local-pai TEM filhos, ao selecioná-lo, selecionamos todos os filhos automaticamente.
 *   Desmarcando o pai, desmarcamos todos os filhos.
 *   O usuário pode desmarcar filhos individualmente depois.
 * - Se TODOS os filhos de um pai forem desmarcados individualmente, o pai fica desmarcado também.
 */
export default function TipoFormClient({
  departamentos,
  locais,
  createAction,
}: Props) {
  // Conjunto de IDs de locais-pai sem filhos que estão marcados
  const [selectedRoots, setSelectedRoots] = useState<Set<number>>(new Set());

  // Conjunto de strings "paiId_filhoId" para sub-locais selecionados
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());

  // Quais pais estão com o accordion aberto (se tiver filhos)
  const [expandedRoots, setExpandedRoots] = useState<Set<number>>(new Set());

  // Verifica se um pai (com filhos) está "totalmente" selecionado
  const isParentFullySelected = useCallback(
    (local: LocalItem) => {
      if (local.children.length === 0) return selectedRoots.has(local.id);
      return local.children.every((c) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
    },
    [selectedRoots, selectedSubs],
  );

  // Verifica se um pai (com filhos) está "parcialmente" selecionado (indeterminate)
  const isParentPartiallySelected = useCallback(
    (local: LocalItem) => {
      if (local.children.length === 0) return false;
      const someSelected = local.children.some((c) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
      const allSelected = local.children.every((c) =>
        selectedSubs.has(`${local.id}_${c.id}`),
      );
      return someSelected && !allSelected;
    },
    [selectedSubs],
  );

  const handleParentChange = useCallback(
    (local: LocalItem, checked: boolean) => {
      if (local.children.length === 0) {
        // Sem filhos: toggle simples
        setSelectedRoots((prev) => {
          const next = new Set(prev);
          if (checked) next.add(local.id);
          else next.delete(local.id);
          return next;
        });
      } else {
        // Com filhos: seleciona/deseleciona todos os filhos
        setSelectedSubs((prev) => {
          const next = new Set(prev);
          for (const c of local.children) {
            const key = `${local.id}_${c.id}`;
            if (checked) next.add(key);
            else next.delete(key);
          }
          return next;
        });
        // Abre o accordion para mostrar os filhos
        if (checked) {
          setExpandedRoots((prev) => {
            const next = new Set(prev);
            next.add(local.id);
            return next;
          });
        }
      }
    },
    [],
  );

  const handleChildChange = useCallback(
    (
      local: LocalItem,
      child: { id: number; nome: string },
      checked: boolean,
    ) => {
      const key = `${local.id}_${child.id}`;
      setSelectedSubs((prev) => {
        const next = new Set(prev);
        if (checked) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [],
  );

  const toggleExpanded = useCallback((id: number) => {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Conta quantos locais/sublocais estão selecionados para o label de resumo
  const totalSelecionados = selectedRoots.size + selectedSubs.size;

  return (
    <form
      action={createAction}
      className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 transition-colors space-y-6"
    >
      {/* Campos ocultos para os valores selecionados */}
      {Array.from(selectedRoots).map((id) => (
        <input key={`r_${id}`} type="hidden" name="locais" value={id} />
      ))}
      {Array.from(selectedSubs).map((key) => (
        <input key={`s_${key}`} type="hidden" name="sublocais" value={key} />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
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
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Prioridade &amp; SLA
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

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Departamentos Responsáveis
            </label>
            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-neutral-300 rounded-md p-2 bg-white space-y-1">
              {departamentos.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    name="departamentos"
                    value={d.id}
                    className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    {d.nome}
                  </span>
                </label>
              ))}
              {departamentos.length === 0 && (
                <p className="text-xs text-neutral-400 italic p-1">
                  Nenhum departamento cadastrado
                </p>
              )}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Selecione 1 ou mais departamentos que receberão os chamados deste
              tipo.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Locais e Sub-Locais{" "}
              <span className="text-neutral-400 normal-case font-normal">
                (Opcional)
              </span>
            </label>
            {totalSelecionados > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-navy/10 text-brand-navy rounded-full">
                {totalSelecionados} selecionado
                {totalSelecionados !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto custom-scrollbar border border-neutral-300 rounded-md bg-white shadow-inner">
            {locais.map((local) => {
              const hasChildren = local.children.length > 0;
              const isExpanded = expandedRoots.has(local.id);
              const fullyChecked = isParentFullySelected(local);
              const partiallyChecked = isParentPartiallySelected(local);

              return (
                <div
                  key={local.id}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  {/* Linha do Local Pai */}
                  <div className="flex items-center gap-1 p-2 bg-neutral-50 hover:bg-neutral-100 transition-colors">
                    {/* Checkbox do pai */}
                    <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer"
                        checked={fullyChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = partiallyChecked;
                        }}
                        onChange={(e) =>
                          handleParentChange(local, e.target.checked)
                        }
                      />
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="text-sm font-bold text-neutral-800 truncate">
                        {local.nome}
                      </span>
                      {hasChildren && (
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          ({local.children.length} sub-locais)
                        </span>
                      )}
                    </label>

                    {/* Botão de expandir/colapsar (só se tem filhos) */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(local.id)}
                        className="p-1 rounded hover:bg-neutral-200 transition-colors shrink-0 text-neutral-500"
                        title={
                          isExpanded
                            ? "Recolher sub-locais"
                            : "Expandir sub-locais"
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Sub-locais (filhos) — exibidos somente se expandido */}
                  {hasChildren && isExpanded && (
                    <div className="pl-8 pr-2 pb-2 pt-1 space-y-0.5 bg-white border-l-2 border-brand-navy/10 ml-3">
                      {local.children.map((child) => {
                        const key = `${local.id}_${child.id}`;
                        const isChecked = selectedSubs.has(key);
                        return (
                          <label
                            key={child.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-600 cursor-pointer"
                              checked={isChecked}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {locais.length === 0 && (
              <p className="text-xs text-neutral-400 italic p-3">
                Nenhum local cadastrado
              </p>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
            Selecionar um local pai marca todos os seus sub-locais
            automaticamente. Você pode desmarcar sub-locais individualmente
            depois. Se nada for selecionado, o tipo valerá para qualquer
            localidade.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 mt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors text-sm"
        >
          Adicionar Novo Tipo
        </button>
      </div>
    </form>
  );
}
