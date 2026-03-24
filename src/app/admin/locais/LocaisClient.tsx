"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { createLocal, deleteLocal } from "@/app/actions/admin";
import DeleteButton from "@/components/DeleteButton";
import {
  ChevronDown,
  ChevronRight,
  Search,
  FolderTree,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";

type Categoria = any;

interface LocaisClientProps {
  categorias: Categoria[];
  locaisPorCategoria: Record<number, Categoria[]>;
}

export default function LocaisClient({
  categorias,
  locaisPorCategoria,
}: LocaisClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  const { filteredCategorias, filteredLocais } = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredCategorias: categorias,
        filteredLocais: locaisPorCategoria,
      };
    }

    const lowerTerm = searchTerm.toLowerCase();
    const resultCats: Categoria[] = [];
    const resultLocais: Record<number, Categoria[]> = {};
    const autoExpanded = new Set<number>();

    categorias.forEach((cat) => {
      const matchCat = cat.nome.toLowerCase().includes(lowerTerm);
      const subLocais = locaisPorCategoria[cat.id] || [];
      const matchSubLocais = subLocais.filter((sub) =>
        sub.nome.toLowerCase().includes(lowerTerm),
      );

      if (matchCat || matchSubLocais.length > 0) {
        resultCats.push(cat);
        resultLocais[cat.id] =
          matchSubLocais.length > 0 ? matchSubLocais : subLocais;
        if (searchTerm.trim()) autoExpanded.add(cat.id);
      }
    });

    setExpandedCats((prev) => new Set([...prev, ...autoExpanded]));

    return { filteredCategorias: resultCats, filteredLocais: resultLocais };
  }, [categorias, locaisPorCategoria, searchTerm]);

  const toggleCategory = (id: number) => {
    setExpandedCats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const expandAll = () => setExpandedCats(new Set(categorias.map((c) => c.id)));
  const collapseAll = () => setExpandedCats(new Set());

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        <form
          action={createLocal}
          className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto"
        >
          <select
            name="parentId"
            className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none w-full sm:w-48 text-neutral-600 transition-colors"
          >
            <option value="">(Sem categoria pai)</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="nome"
            required
            placeholder="Nome (ex: Praças ou P1)..."
            className="flex-1 px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors shrink-0"
          >
            Adicionar Local
          </button>
        </form>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={expandAll}
          className="text-xs font-semibold text-neutral-500 hover:text-brand-navy flex items-center gap-1 transition-colors"
        >
          <ChevronsUpDown className="w-3 h-3" /> Expandir Tudo
        </button>
        <span className="text-neutral-300">|</span>
        <button
          onClick={collapseAll}
          className="text-xs font-semibold text-neutral-500 hover:text-brand-navy flex items-center gap-1 transition-colors"
        >
          <ChevronsDownUp className="w-3 h-3" /> Recolher Tudo
        </button>
      </div>

      <div className="overflow-x-auto border border-neutral-200 rounded-lg max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 bg-neutral-100 shadow-sm z-10">
            <tr>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Nome da Unidade
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-32 text-center">
                Chamados
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-32 text-center">
                Preventivas
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm w-24 text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategorias.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-12 text-center text-neutral-500 bg-white"
                >
                  Nenhum local encontrado para esta busca.
                </td>
              </tr>
            )}

            {filteredCategorias.map((categoria) => {
              const isExpanded = expandedCats.has(categoria.id);
              const subLocais = filteredLocais[categoria.id] || [];
              const hasChildren = subLocais.length > 0;

              return (
                <React.Fragment key={`cat-${categoria.id}`}>
                  <tr
                    onClick={() => hasChildren && toggleCategory(categoria.id)}
                    className={`border-b border-neutral-200 transition-colors ${hasChildren ? "cursor-pointer hover:bg-neutral-50" : "bg-white"} ${isExpanded ? "bg-neutral-50/80" : "bg-white"}`}
                  >
                    <td className="py-3 px-4 font-bold text-neutral-900 flex items-center gap-2 select-none">
                      {hasChildren ? (
                        <button className="text-neutral-400 hover:text-brand-navy transition-colors focus:outline-none">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}
                      <FolderTree className="w-4 h-4 text-brand-navy/60" />
                      {categoria.nome}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 text-center font-mono text-sm">
                      {categoria._count?.chamados || 0}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 text-center font-mono text-sm">
                      {categoria._count?.preventivas || 0}
                    </td>
                    <td
                      className="py-3 px-4 flex justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteButton
                        action={deleteLocal}
                        id={categoria.id}
                        disabled={
                          (categoria._count?.chamados || 0) > 0 ||
                          (categoria._count?.preventivas || 0) > 0 ||
                          subLocais.length > 0
                        }
                        title="Excluir Categoria"
                        text={`Tem certeza que deseja remover a categoria "${categoria.nome}"?`}
                      />
                    </td>
                  </tr>

                  {isExpanded &&
                    subLocais.map((sub: any) => (
                      <tr
                        key={`sub-${sub.id}`}
                        className="border-b border-neutral-100 bg-white hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-2.5 px-4 pl-14 font-medium text-neutral-700 relative text-sm">
                          <div className="absolute left-7 top-0 bottom-1/2 border-l-2 border-neutral-200"></div>
                          <div className="absolute left-7 top-1/2 w-4 border-t-2 border-neutral-200"></div>
                          <div className="absolute left-7 top-1/2 bottom-0 border-l-2 border-neutral-200"></div>
                          {sub.nome}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-500 text-center font-mono text-xs">
                          {sub._count?.chamados || 0}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-500 text-center font-mono text-xs">
                          {sub._count?.preventivas || 0}
                        </td>
                        <td className="py-2.5 px-4 flex justify-end">
                          <DeleteButton
                            action={deleteLocal}
                            id={sub.id}
                            disabled={
                              (sub._count?.chamados || 0) > 0 ||
                              (sub._count?.preventivas || 0) > 0
                            }
                            title="Excluir Sub-local"
                            text={`Tem certeza que deseja remover "${sub.nome}"?`}
                          />
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
