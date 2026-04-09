"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Search,
  Shield,
  User,
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  Power,
  Edit,
  X,
} from "lucide-react";
import { atualizarUsuario, adicionarUsuario } from "@/app/actions/usuarios"; // Importando a sua action
import Swal from "sweetalert2";

/* Tipagens */
type Departamento = { id: number; nome: string };
type Usuario = {
  id: number;
  nome: string;
  login: string;
  perfil: string;
  ativo: boolean;
  departamentos: Departamento[];
};

interface UsuariosClientProps {
  usuarios: Usuario[];
  departamentosPermitidos: Departamento[];
  isGlobalAdmin: boolean;
  loggedUserId: number;
}

const ITEMS_PER_PAGE = 15;

const PERFIL_BADGE: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  ADMIN: {
    label: "Administrador Global",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: ShieldAlert,
  },
  ADMIN_DEPTO: {
    label: "Gestor de Depto",
    color: "bg-brand-yellow/20 text-brand-navy border-brand-yellow/40",
    icon: Shield,
  },
  TECNICO: {
    label: "Técnico (Atendimento)",
    color: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
    icon: User,
  },
  USUARIO: {
    label: "Usuário Padrão",
    color: "bg-neutral-100 text-neutral-600 border-neutral-200",
    icon: User,
  },
};

export default function UsuariosClient({
  usuarios,
  departamentosPermitidos,
  isGlobalAdmin,
  loggedUserId,
}: UsuariosClientProps) {
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados para as ações
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // ── FILTROS E PAGINAÇÃO ──
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((user) => {
      const matchBusca =
        user.nome.toLowerCase().includes(busca.toLowerCase()) ||
        user.login.toLowerCase().includes(busca.toLowerCase());

      const matchPerfil =
        filtroPerfil === "TODOS" || user.perfil === filtroPerfil;

      const matchStatus =
        filtroStatus === "TODOS"
          ? true
          : filtroStatus === "ATIVOS"
            ? user.ativo === true
            : filtroStatus === "INATIVOS"
              ? user.ativo === false
              : true;

      return matchBusca && matchPerfil && matchStatus;
    });
  }, [usuarios, busca, filtroPerfil, filtroStatus]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE),
  );
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaAtual - 1) * ITEMS_PER_PAGE,
    paginaAtual * ITEMS_PER_PAGE,
  );

  React.useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtroPerfil, filtroStatus]);

  // ── AÇÕES DE BANCO DE DADOS ──

  // Função do botão Power (Ativar/Desativar rápido)
  const handleToggleStatus = (user: Usuario) => {
    if (
      !confirm(
        `Deseja realmente ${user.ativo ? "desativar" : "ativar"} o acesso de ${user.nome}?`,
      )
    )
      return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("usuarioId", String(user.id));
      formData.append("perfil", user.perfil); // Mantém o perfil atual
      formData.append("ativo", String(!user.ativo)); // Inverte o status
      // Remonta os departamentos que o usuário já tem para não perdê-los na action
      user.departamentos.forEach((d) =>
        formData.append("departamentos", String(d.id)),
      );

      try {
        await atualizarUsuario(formData);
      } catch (error: any) {
        Swal.fire({
          title: "Erro",
          text: error.message || "Erro ao alterar status do usuário.",
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

  // Função do Modal de Edição (Salvar)
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await atualizarUsuario(formData);
        setEditingUser(null); // Fecha o modal com sucesso
      } catch (error: any) {
        Swal.fire({
          title: "Erro",
          text: error.message || "Erro ao salvar usuário.",
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

  // Função do Modal de Criação (Salvar)
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await adicionarUsuario(formData);
        setIsCreatingUser(false); // Fecha o modal com sucesso
      } catch (error: any) {
        Swal.fire({
          title: "Erro",
          text: error.message || "Erro ao criar usuário.",
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
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── CABEÇALHO ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="text-neutral-500 mt-1">
            Controle de acessos, perfis e permissões do sistema.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingUser(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors shrink-0"
        >
          <User className="w-4 h-4" />
          Adicionar Usuário
        </button>
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome, login de rede ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none transition-colors"
          />
        </div>

        <select
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value)}
          className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none min-w-[160px]"
        >
          <option value="TODOS">Todos os Perfis</option>
          <option value="ADMIN">Administradores</option>
          <option value="ADMIN_DEPTO">Gestores de Depto</option>
          <option value="TECNICO">Técnicos</option>
          <option value="USUARIO">Usuários Padrão</option>
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none min-w-[140px]"
        >
          <option value="TODOS">Todos os Status</option>
          <option value="ATIVOS">Apenas Ativos</option>
          <option value="INATIVOS">Apenas Inativos</option>
        </select>
      </div>

      {/* ── TABELA DE USUÁRIOS ── */}
      <div className="overflow-x-auto border border-neutral-200 rounded-lg relative">
        {/* Loading overlay enquanto processa ações no servidor */}
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-neutral-100 border-b border-neutral-200">
            <tr>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Colaborador
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Login (AD)
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Nível de Acesso
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm">
                Departamentos
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm text-center">
                Status
              </th>
              <th className="py-3 px-4 font-bold text-neutral-900 text-sm text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {usuariosPaginados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-500">
                  Nenhum usuário encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((user) => {
                const BadgeInfo =
                  PERFIL_BADGE[user.perfil] || PERFIL_BADGE["USUARIO"];
                const Icon = BadgeInfo.icon;

                // Impede que um gestor de depto edite um Admin Global
                const canEdit = isGlobalAdmin || user.perfil !== "ADMIN";

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-50 transition-colors ${!user.ativo ? "opacity-60 bg-neutral-50/50" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-neutral-900 text-sm truncate">
                            {user.nome}
                          </span>
                          <span className="text-xs text-neutral-500 truncate">
                            {user.login + "@viarondon.com.br"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-neutral-600">
                      {user.login}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap ${BadgeInfo.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {BadgeInfo.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {user.departamentos.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {user.departamentos.map((d) => (
                            <span
                              key={d.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-200 bg-white text-[10px] text-neutral-600 truncate max-w-[120px]"
                              title={d.nome}
                            >
                              <Building2 className="w-3 h-3 text-neutral-400" />
                              <span className="truncate">{d.nome}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          —
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {user.ativo ? (
                        <span
                          className="inline-flex items-center justify-center text-brand-green"
                          title="Ativo"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center text-neutral-400"
                          title="Inativo"
                        >
                          <XCircle className="w-5 h-5" />
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          disabled={!canEdit}
                          className={`p-1.5 rounded-md transition-colors ${!canEdit ? "opacity-30 cursor-not-allowed" : "text-neutral-400 hover:text-brand-navy hover:bg-brand-navy/10"}`}
                          title="Editar Permissões"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === loggedUserId || !canEdit}
                          className={`p-1.5 rounded-md transition-colors ${user.id === loggedUserId || !canEdit ? "opacity-30 cursor-not-allowed text-neutral-400" : "text-neutral-400 hover:text-red-600 hover:bg-red-50"}`}
                          title={
                            user.id === loggedUserId
                              ? "Você não pode desativar a si mesmo"
                              : "Ativar/Desativar Acesso"
                          }
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINAÇÃO ── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 border-t border-neutral-200 pt-4">
          <span className="text-sm text-neutral-500">
            Mostrando{" "}
            <span className="font-bold text-neutral-900">
              {(paginaAtual - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            a{" "}
            <span className="font-bold text-neutral-900">
              {Math.min(paginaAtual * ITEMS_PER_PAGE, usuariosFiltrados.length)}
            </span>{" "}
            de{" "}
            <span className="font-bold text-neutral-900">
              {usuariosFiltrados.length}
            </span>{" "}
            usuários
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-md disabled:opacity-50 hover:bg-neutral-50 transition-colors text-neutral-700"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
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

      {/* ── MODAL DE EDIÇÃO ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Editar Permissões
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {editingUser.nome}
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              <input type="hidden" name="usuarioId" value={editingUser.id} />

              <div className="space-y-6">
                {/* Status Toggle */}
                <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-neutral-900">
                      Acesso ao Sistema
                    </p>
                    <p className="text-xs text-neutral-500">
                      Permitir que este usuário faça login
                    </p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="ativo"
                      value="true"
                      className="sr-only peer"
                      defaultChecked={editingUser.ativo}
                    />
                    <div className="w-11 h-6 bg-neutral-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                  </div>
                </label>

                {/* Perfil Select */}
                <div>
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Nível de Acesso (Perfil)
                  </label>
                  <select
                    name="perfil"
                    defaultValue={editingUser.perfil}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none"
                  >
                    {isGlobalAdmin && (
                      <option value="ADMIN">Administrador Global</option>
                    )}
                    <option value="ADMIN_DEPTO">Gestor de Departamento</option>
                    <option value="TECNICO">Técnico (Atendimento)</option>
                    <option value="USUARIO">Usuário Padrão</option>
                  </select>
                </div>

                {/* Departamentos */}
                <div>
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Departamentos Vinculados
                  </label>
                  <p className="text-xs text-neutral-500 mb-3">
                    Defina de quais setores este usuário faz parte ou atende.
                  </p>

                  <div className="max-h-48 overflow-y-auto custom-scrollbar border border-neutral-200 rounded-md p-2 bg-neutral-50 space-y-1">
                    {departamentosPermitidos.length === 0 ? (
                      <p className="text-xs text-neutral-400 p-2 italic">
                        Nenhum departamento disponível para você gerenciar.
                      </p>
                    ) : (
                      departamentosPermitidos.map((depto) => {
                        const isChecked = editingUser.departamentos.some(
                          (d) => d.id === depto.id,
                        );
                        return (
                          <label
                            key={depto.id}
                            className="flex items-center gap-3 p-2 hover:bg-neutral-200/50 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              name="departamentos"
                              value={depto.id}
                              defaultChecked={isChecked}
                              className="w-4 h-4 rounded border-neutral-300 accent-brand-navy"
                            />
                            <span className="text-sm font-medium text-neutral-700">
                              {depto.nome}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CRIAÇÃO ── */}
      {isCreatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Adicionar Novo Usuário
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Pré-cadastro para liberação de acesso e perfil
                </p>
              </div>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Login de Rede (AD)
                  </label>
                  <input
                    type="text"
                    name="login"
                    required
                    placeholder="Ex: nome.sobrenome"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none"
                  />
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Nome Completo / Amigável
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    placeholder="Ex: Bruno Lopes de Paiva"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Nível de Acesso (Perfil)
                  </label>
                  <select
                    name="perfil"
                    defaultValue="USUARIO"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none"
                  >
                    {isGlobalAdmin && (
                      <option value="ADMIN">Administrador Global</option>
                    )}
                    <option value="ADMIN_DEPTO">Gestor de Departamento</option>
                    <option value="TECNICO">Técnico (Atendimento)</option>
                    <option value="USUARIO">Usuário Padrão</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-sm text-neutral-900 mb-2">
                    Departamentos Vinculados
                  </label>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar border border-neutral-200 rounded-md p-2 bg-neutral-50 space-y-1">
                    {departamentosPermitidos.length === 0 ? (
                      <p className="text-xs text-neutral-400 p-2 italic">
                        Nenhum departamento disponível para gerenciar.
                      </p>
                    ) : (
                      departamentosPermitidos.map((depto) => (
                        <label
                          key={depto.id}
                          className="flex items-center gap-3 p-2 hover:bg-neutral-200/50 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            name="departamentos"
                            value={depto.id}
                            className="w-4 h-4 rounded border-neutral-300 accent-brand-navy"
                          />
                          <span className="text-sm font-medium text-neutral-700">
                            {depto.nome}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {isPending ? "Criando..." : "Cadastrar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
