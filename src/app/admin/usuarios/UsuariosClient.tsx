"use client";

import { useState } from "react";
import { atualizarUsuario } from "@/app/actions/usuarios";
import {
  Search,
  Edit2,
  Shield,
  ShieldAlert,
  User,
  Check,
  AlertCircle,
  X,
  GraduationCap,
} from "lucide-react";

type Departamento = {
  id: number;
  nome: string;
};

type UsuarioType = {
  id: number;
  nome: string;
  login: string;
  perfil: string;
  ativo: boolean;
  departamentos: Departamento[];
};

export default function UsuariosClient({
  usuarios,
  departamentosPermitidos,
  isGlobalAdmin,
  loggedUserId,
}: {
  usuarios: UsuarioType[];
  departamentosPermitidos: Departamento[];
  isGlobalAdmin: boolean;
  loggedUserId: number;
}) {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UsuarioType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredUsers = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.login.toLowerCase().includes(search.toLowerCase()),
  );

  const getRoleIcon = (perfil: string) => {
    switch (perfil) {
      case "ADMIN":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "ADMIN_DEPTO":
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case "TECNICO":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-neutral-500" />;
    }
  };

  const handleEdit = (user: UsuarioType) => {
    setEditingUser(user);
    setErrorMsg("");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      await atualizarUsuario(formData);
      setEditingUser(null);
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle default checks
  const isUserInDept = (userId: number, deptoId: number) => {
    if (!editingUser) return false;
    return editingUser.departamentos.some((d) => d.id === deptoId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white  rounded-lg shadow-sm border border-neutral-200  p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 0 tracking-tight">
              Usuários
            </h1>
            <p className="text-neutral-500  mt-1">
              Gerencie os acessos, perfis e departamentos dos usuários da
              plataforma.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou login..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50  border border-neutral-300  rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm">
                  Nome
                </th>
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm">
                  Login (AD)
                </th>
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm">
                  Perfil
                </th>
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm">
                  Status
                </th>
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm">
                  Departamentos
                </th>
                <th className="py-4 px-4 font-semibold text-neutral-500  text-sm text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100  hover:bg-neutral-50  transition-colors"
                >
                  <td className="py-4 px-4 font-medium text-neutral-900 ">
                    {user.nome}
                  </td>
                  <td className="py-4 px-4 text-neutral-600  text-sm">
                    {user.login}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {getRoleIcon(user.perfil)}
                      <span
                        className={
                          user.perfil === "ADMIN"
                            ? "text-red-600"
                            : user.perfil === "ADMIN_DEPTO"
                              ? "text-purple-600"
                              : user.perfil === "TECNICO"
                                ? "text-blue-600"
                                : "text-neutral-600 "
                        }
                      >
                        {user.perfil === "ADMIN_DEPTO"
                          ? "ADMIN. DEPTO."
                          : user.perfil}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {user.ativo ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50  text-emerald-700  text-xs font-semibold">
                        <Check className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50  text-red-700  text-xs font-semibold">
                        <X className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.departamentos.length > 0 ? (
                        user.departamentos.map((d) => (
                          <span
                            key={d.id}
                            className="px-2 py-1 text-xs rounded-md bg-neutral-100  text-neutral-600 "
                          >
                            {d.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          Nenhum
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="inline-flex items-center justify-center p-2 text-neutral-400 hover:text-brand-navy hover:bg-brand-navy/10  rounded-lg transition-colors"
                      title="Editar Usuário"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white  w-full max-w-lg rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100  flex justify-between items-center bg-neutral-50/50 /50">
              <h2 className="text-xl font-bold text-neutral-900 ">
                Editar Usuário
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                type="button"
                className="text-neutral-400 hover:text-neutral-600  p-1 rounded-lg hover:bg-neutral-200  transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <input type="hidden" name="usuarioId" value={editingUser.id} />

              {errorMsg && (
                <div className="mb-6 p-3 bg-red-50  border border-red-200  text-red-600  text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700  mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={editingUser.nome}
                    disabled
                    className="w-full px-4 py-2 bg-neutral-100  border border-neutral-200  rounded-md text-neutral-500 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700  mb-1">
                      Perfil
                    </label>
                    <select
                      name="perfil"
                      defaultValue={editingUser.perfil}
                      disabled={
                        editingUser.id === loggedUserId && isGlobalAdmin
                      }
                      className="w-full px-3 py-2 bg-neutral-50  border border-neutral-300  rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                    >
                      <option value="USUARIO">Usuário Comum</option>
                      <option value="TECNICO">Técnico/Analista</option>
                      {(isGlobalAdmin || editingUser.id !== loggedUserId) && (
                        <option value="ADMIN_DEPTO">
                          Administrador de Departamento
                        </option>
                      )}
                      {isGlobalAdmin && (
                        <option value="ADMIN">Administrador Global</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700  mb-1">
                      Status
                    </label>
                    <select
                      name="ativo"
                      defaultValue={editingUser.ativo ? "true" : "false"}
                      disabled={
                        editingUser.id === loggedUserId && isGlobalAdmin
                      }
                      className="w-full px-3 py-2 bg-neutral-50  border border-neutral-300  rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700  mb-2">
                    Departamentos (Acesso de Gestão/Técnico)
                  </label>
                  <p className="text-xs text-neutral-500 mb-3">
                    Marque os departamentos aos quais este usuário terá acesso
                    direto.{" "}
                    {!isGlobalAdmin &&
                      "Você só pode ver os departamentos que gerencia."}
                  </p>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2 border border-neutral-200  rounded-md p-3 bg-neutral-50 /50">
                    {departamentosPermitidos.map((depto) => (
                      <label
                        key={depto.id}
                        className="flex items-center gap-3 p-2 hover:bg-white  rounded-lg cursor-pointer transition-colors border border-transparent hover:border-neutral-200"
                      >
                        <input
                          type="checkbox"
                          name="departamentos"
                          value={depto.id}
                          defaultChecked={isUserInDept(
                            editingUser.id,
                            depto.id,
                          )}
                          className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500  "
                        />
                        <span className="text-sm font-medium text-neutral-800 ">
                          {depto.nome}
                        </span>
                      </label>
                    ))}
                    {departamentosPermitidos.length === 0 && (
                      <p className="text-sm text-neutral-500 italic p-2">
                        Nenhum departamento disponível para associar.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-100   rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold bg-brand-navy hover:bg-brand-navy/90 text-white rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
