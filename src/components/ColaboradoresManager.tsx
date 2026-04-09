// src/components/ColaboradoresManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Users, Plus, Check, X } from "lucide-react";
import { adicionarColaborador } from "@/app/actions/tickets";
import Swal from "sweetalert2";

interface UsuarioList {
  id: number;
  nome: string;
}

interface ColaboradoresManagerProps {
  chamadoCodigo: string;
  tecnicoPrincipalId: number | null;
  colaboradores: UsuarioList[];
  todosUsuarios: UsuarioList[];
  podeAdicionar: boolean; // Se o usuário logado tem permissão para adicionar
}

export default function ColaboradoresManager({
  chamadoCodigo,
  tecnicoPrincipalId,
  colaboradores,
  todosUsuarios,
  podeAdicionar,
}: ColaboradoresManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filtra a lista de usuários para não mostrar quem já é colaborador ou o técnico principal
  const availableUsers = todosUsuarios.filter(
    (u) =>
      u.id !== tecnicoPrincipalId && !colaboradores.some((c) => c.id === u.id),
  );

  const handleAdd = () => {
    if (!selectedUserId) return;
    startTransition(async () => {
      try {
        await adicionarColaborador(chamadoCodigo, Number(selectedUserId));
        setIsAdding(false);
        setSelectedUserId("");
      } catch (error) {
        Swal.fire({
          title: "Erro",
          text: "Erro ao adicionar colaborador. Tente novamente.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Ok",
          customClass: {
            popup: "rounded-xl shadow-2xl border border-neutral-100",
            title: "text-xl font-bold text-neutral-900",
            htmlContainer: "text-sm text-neutral-600",
          },
        });
      }
    });
  };

  return (
    <div className="flex flex-col py-3 gap-2 border-t border-neutral-100 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-neutral-500 font-medium">
          Colaboradores
        </span>
      </div>

      {/* Lista de colaboradores atuais */}
      <div className="flex flex-wrap gap-1 mt-1">
        {colaboradores && colaboradores.length > 0 ? (
          colaboradores.map((colab) => (
            <span
              key={colab.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded border border-neutral-200 text-[11px] font-semibold text-neutral-700"
            >
              <Users className="w-3 h-3 text-neutral-400" />
              {colab.nome}
            </span>
          ))
        ) : (
          <span className="text-xs text-neutral-400 italic">Nenhum</span>
        )}
      </div>

      {/* UI de Adição de Colaborador */}
      {podeAdicionar && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-[11px] text-brand-navy font-bold hover:underline w-fit mt-1 transition-all"
        >
          <Plus className="w-3 h-3" /> Adicionar Técnico
        </button>
      )}

      {isAdding && (
        <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={isPending}
            className="flex-1 text-xs px-2 py-1.5 bg-white border border-neutral-300 rounded shadow-sm outline-none focus:border-brand-navy disabled:opacity-50"
          >
            <option value="">Selecionar técnico...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            disabled={isPending || !selectedUserId}
            title="Confirmar"
            className="p-1.5 bg-brand-navy text-white rounded hover:bg-brand-navy/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={() => {
              setIsAdding(false);
              setSelectedUserId("");
            }}
            disabled={isPending}
            title="Cancelar"
            className="p-1.5 bg-white border border-neutral-200 text-neutral-500 rounded hover:bg-neutral-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
