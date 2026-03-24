/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import {
  createDepartamento,
  deleteDepartamento,
  addUsuarioDepartamento,
  removeUsuarioDepartamento,
} from "@/app/actions/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import {
  X,
  Plus,
  Users,
  Ticket,
  ShieldCheck,
  Wrench,
  User,
} from "lucide-react";

function PerfilBadge({ perfil }: { perfil: string }) {
  const map: Record<
    string,
    { label: string; class: string; icon: React.ReactNode }
  > = {
    ADMIN: {
      label: "Admin Global",
      class: "bg-purple-50 text-purple-700 border-purple-200   ",
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    ADMIN_DEPTO: {
      label: "Admin Depto",
      class: "bg-blue-50   text-blue-700   border-blue-200         ",
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    TECNICO: {
      label: "Técnico",
      class: "bg-emerald-50 text-emerald-700 border-emerald-200   ",
      icon: <Wrench className="w-3 h-3" />,
    },
    USUARIO: {
      label: "Usuário",
      class: "bg-neutral-100 text-neutral-600 border-neutral-200   ",
      icon: <User className="w-3 h-3" />,
    },
  };
  const { label, class: cls, icon } = map[perfil] || map["USUARIO"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default async function DepartamentosPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session?.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
  });
  if (usuarioLogado?.perfil !== "ADMIN") redirect("/admin");

  const departamentos = await prisma.departamento.findMany({
    where: { ativo: true },
    include: {
      usuarios: { where: { ativo: true }, orderBy: { nome: "asc" } },
      _count: { select: { chamadosDestino: true, deptoTipos: true } },
    },
    orderBy: { nome: "asc" },
  });

  const todosUsuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header + formulário de criação */}
      <div className="bg-white  rounded-lg shadow-sm border border-neutral-200  p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 0 tracking-tight">
              Departamentos
            </h1>
            <p className="text-neutral-500  mt-1">
              Gerencie as áreas de atendimento, seus membros e os tipos de
              chamado associados.
            </p>
          </div>

          {/* Estatísticas rápidas */}
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 0">
                {departamentos.length}
              </p>
              <p className="text-xs text-neutral-500  mt-0.5">Departamentos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 0">
                {departamentos.reduce((acc, d) => acc + d.usuarios.length, 0)}
              </p>
              <p className="text-xs text-neutral-500  mt-0.5">Membros</p>
            </div>
          </div>
        </div>

        {/* Formulário inline de criação */}
        <form
          action={createDepartamento}
          className="flex gap-3 mt-6 pt-6 border-t border-neutral-100 "
        >
          <input
            type="text"
            name="nome"
            required
            placeholder="Nome do novo departamento..."
            className="flex-1 px-4 py-2.5 bg-neutral-50  border border-neutral-300  rounded-md text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white font-semibold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Criar Departamento
          </button>
        </form>
      </div>

      {/* Grid de Departamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departamentos.map((depto) => {
          const usuariosDisponiveis = todosUsuarios.filter(
            (tu) => !depto.usuarios.some((du) => du.id === tu.id),
          );

          return (
            <div
              key={depto.id}
              className="bg-white  rounded-lg shadow-sm border border-neutral-200  overflow-hidden flex flex-col transition-all hover:shadow-md"
            >
              {/* Cabeçalho do card */}
              <div className="p-5 flex items-start justify-between gap-3 border-b border-neutral-100 ">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-blue-50  flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-600 " />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 0 truncate">
                      {depto.nome}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 ">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {depto.usuarios.length}{" "}
                        {depto.usuarios.length === 1 ? "membro" : "membros"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        {depto._count.chamadosDestino} chamados
                      </span>
                      <span className="flex items-center gap-1">
                        {depto._count.deptoTipos} tipos
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
                  title="Excluir Departamento"
                  text={`Tem certeza que deseja remover o departamento "${depto.nome}"? Ele não pode ter chamados ou membros ativos.`}
                />
              </div>

              {/* Membros */}
              <div className="p-5 flex-1">
                <h4 className="text-xs font-bold text-neutral-500  uppercase tracking-wider mb-3">
                  Equipe do Departamento
                </h4>

                <div className="space-y-2 mb-4 min-h-[52px]">
                  {depto.usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-50 /60 border border-neutral-200  rounded-md group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-neutral-200  flex items-center justify-center text-xs font-bold text-neutral-600  shrink-0">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-neutral-800  truncate">
                          {u.nome}
                        </span>
                        <PerfilBadge perfil={u.perfil} />
                      </div>
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
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all rounded-lg p-1 hover:bg-red-50 "
                          title="Remover membro"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  ))}

                  {depto.usuarios.length === 0 && (
                    <p className="text-sm text-neutral-400 00 italic px-1">
                      Nenhum membro vinculado.
                    </p>
                  )}
                </div>

                {/* Adicionar membro */}
                {usuariosDisponiveis.length > 0 && (
                  <form
                    action={addUsuarioDepartamento}
                    className="flex gap-2 pt-3 border-t border-neutral-100 "
                  >
                    <input
                      type="hidden"
                      name="departamentoId"
                      value={depto.id}
                    />
                    <select
                      name="usuarioId"
                      required
                      className="flex-1 px-3 py-2 bg-neutral-50  border border-neutral-300  rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors appearance-none"
                    >
                      <option value="">Adicionar membro...</option>
                      {usuariosDisponiveis.map((tu) => (
                        <option key={tu.id} value={tu.id}>
                          {tu.nome} · {tu.perfil}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3.5 py-2 bg-neutral-100  hover:bg-blue-50  border border-neutral-200  hover:border-blue-200  text-neutral-700  hover:text-blue-700  font-semibold rounded-md text-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Vincular
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {departamentos.length === 0 && (
        <div className="text-center py-16 text-neutral-400 00">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Nenhum departamento cadastrado.</p>
          <p className="text-sm mt-1">
            Use o formulário acima para criar o primeiro.
          </p>
        </div>
      )}
    </div>
  );
}
