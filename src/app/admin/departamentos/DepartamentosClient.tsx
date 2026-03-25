"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  createDepartamento,
  deleteDepartamento,
  addUsuarioDepartamento,
  removeUsuarioDepartamento,
} from "@/app/actions/admin";
import DeleteButton from "@/components/DeleteButton";
import {
  X,
  Plus,
  Users,
  Ticket,
  ShieldCheck,
  Wrench,
  User,
  Search,
  Building2,
  ShieldAlert,
} from "lucide-react";

// Tipagens baseadas no retorno do Prisma
type Usuario = any;
type Departamento = any;

interface DepartamentosClientProps {
  departamentos: Departamento[];
  todosUsuarios: Usuario[];
}

// Badge de Perfil padronizado com a tela de Usuários
function PerfilBadge({ perfil }: { perfil: string }) {
  const map: Record<
    string,
    { label: string; class: string; icon: React.ReactNode }
  > = {
    ADMIN: {
      label: "Admin Global",
      class: "bg-red-100 text-red-700 border-red-200",
      icon: <ShieldAlert className="w-3 h-3" />,
    },
    ADMIN_DEPTO: {
      label: "Gestor",
      class: "bg-brand-yellow/20 text-brand-navy border-brand-yellow/40",
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    TECNICO: {
      label: "Técnico",
      class: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
      icon: <Wrench className="w-3 h-3" />,
    },
    USUARIO: {
      label: "Usuário",
      class: "bg-neutral-100 text-neutral-600 border-neutral-200",
      icon: <User className="w-3 h-3" />,
    },
  };
  const { label, class: cls, icon } = map[perfil] || map["USUARIO"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default function DepartamentosClient({
  departamentos,
  todosUsuarios,
}: DepartamentosClientProps) {
  const [busca, setBusca] = useState("");

  // Filtro em tempo real
  const departamentosFiltrados = departamentos.filter((d) =>
    d.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── HEADER & CRIAÇÃO ── */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Departamentos
            </h1>
            <p className="text-neutral-500 mt-1">
              Gerencie as áreas de atendimento, seus membros e vínculos.
            </p>
          </div>

          {/* Estatísticas rápidas */}
          <div className="flex gap-6 shrink-0 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="text-center px-4 border-r border-neutral-200">
              <p className="text-2xl font-black text-brand-navy">
                {departamentos.length}
              </p>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Departamentos
              </p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-black text-brand-navy">
                {departamentos.reduce((acc, d) => acc + d.usuarios.length, 0)}
              </p>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                Membros Totais
              </p>
            </div>
          </div>
        </div>

        {/* Formulário inline de criação */}
        <form
          action={createDepartamento}
          className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-neutral-100"
        >
          <input
            type="text"
            name="nome"
            required
            placeholder="Nome do novo departamento..."
            className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Criar Departamento
          </button>
        </form>
      </div>

      {/* ── BARRA DE BUSCA ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar departamento por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none transition-colors"
        />
      </div>

      {/* ── GRID DE DEPARTAMENTOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {departamentosFiltrados.map((depto) => {
          // Filtra quem ainda não está no departamento para aparecer no Select
          const usuariosDisponiveis = todosUsuarios.filter(
            (tu) => !depto.usuarios.some((du: any) => du.id === tu.id),
          );

          return (
            <div
              key={depto.id}
              className="bg-white rounded-lg shadow-sm border border-neutral-200 flex flex-col transition-all hover:shadow-md h-[450px]"
            >
              {/* Cabeçalho do Card */}
              <div className="p-5 flex items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50 rounded-t-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Building2 className="w-5 h-5 text-brand-navy" />
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-base font-bold text-neutral-900 truncate"
                      title={depto.nome}
                    >
                      {depto.nome}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {depto.usuarios.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        {depto._count.chamadosDestino}
                      </span>
                    </div>
                  </div>
                </div>

                <DeleteButton
                  action={deleteDepartamento}
                  id={depto.id}
                  disabled={
                    depto._count.chamadosDestino > 0 ||
                    depto.usuarios.length > 0
                  }
                  title="Excluir"
                  text={`Tem certeza que deseja remover o departamento "${depto.nome}"?`}
                />
              </div>

              {/* Lista de Membros (Com Scroll Interno) */}
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-white">
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                  Equipe do Departamento
                </h4>

                <div className="space-y-2">
                  {depto.usuarios.map((u: any) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-50 border border-neutral-100 rounded-md group hover:border-brand-navy/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-neutral-800 truncate leading-tight">
                            {u.nome}
                          </span>
                          <PerfilBadge perfil={u.perfil} />
                        </div>
                      </div>

                      {/* Form para remover o usuário */}
                      <form
                        action={removeUsuarioDepartamento}
                        className="shrink-0"
                      >
                        <input
                          type="hidden"
                          name="departamentoId"
                          value={depto.id}
                        />
                        <input type="hidden" name="usuarioId" value={u.id} />
                        <button
                          type="submit"
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-all rounded p-1.5 hover:bg-red-50"
                          title="Remover membro"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  ))}

                  {depto.usuarios.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-neutral-400 italic">
                        Nenhum membro vinculado.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Adicionar membro */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 rounded-b-lg">
                {usuariosDisponiveis.length > 0 ? (
                  <form action={addUsuarioDepartamento} className="flex gap-2">
                    <input
                      type="hidden"
                      name="departamentoId"
                      value={depto.id}
                    />
                    <select
                      name="usuarioId"
                      required
                      className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none transition-colors"
                    >
                      <option value="">Adicionar membro...</option>
                      {usuariosDisponiveis.map((tu) => (
                        <option key={tu.id} value={tu.id}>
                          {tu.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="flex items-center justify-center w-9 h-9 bg-white hover:bg-brand-navy border border-neutral-200 hover:border-brand-navy text-neutral-600 hover:text-white rounded-md transition-all shrink-0"
                      title="Vincular"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-center text-neutral-400 py-2">
                    Todos os usuários já estão neste departamento.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {departamentosFiltrados.length === 0 && (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="font-bold text-neutral-600 text-lg">
            Nenhum departamento encontrado.
          </p>
          {busca && (
            <p className="text-sm text-neutral-500 mt-1">
              Tente limpar sua busca.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
