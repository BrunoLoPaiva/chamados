/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  atribuirChamado,
  pausarChamado,
  retomarChamado,
} from "@/app/actions/tickets"; // Add novas Actions
import FormFecharChamado from "./FormFecharChamado";
import { ArrowLeft, User, Building2, UserCog, Paperclip } from "lucide-react";
import TicketTimeline from "@/components/TicketTimeline";
import ColaboradoresManager from "@/components/ColaboradoresManager";

export default async function ChamadoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ... MANTER INÍCIO DO CÓDIGO ...
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = Number((session.user as any).id);

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });
  const isAdmin = usuarioLogado?.perfil === "ADMIN";
  const meusDeptosIds =
    usuarioLogado?.departamentos.map((d: any) => d.id) || [];

  const usuariosList = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  const chamado = await prisma.chamado.findUnique({
    where: { codigo: resolvedParams.id },
    include: {
      usuarioCriacao: true,
      tecnico: true,
      departamentoDestino: { include: { usuarios: true } },
      local: true,
      tipo: true,
      anexos: true,
      colaboradores: true,
      acoes: { include: { acao: true } },
      interacoes: { include: { usuario: true }, orderBy: { data: "asc" } },
    },
  });
  if (!chamado) return notFound();

  const isMembroDepto = meusDeptosIds.includes(chamado.departamentoDestinoId);
  const podeAtribuir = isAdmin || isMembroDepto;
  const isTecnicoPrincipal = chamado.tecnicoId === userId;
  const isColaborador = chamado.colaboradores?.some(
    (c: any) => c.id === userId,
  );
  const podeFechar =
    chamado.status === "EM_ATENDIMENTO" &&
    (isTecnicoPrincipal || isColaborador || isAdmin);

  return (
    <div className="min-h-screen bg-neutral-50 50 p-4 md:p-6 lg:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ... MANTÉM NAVEGAÇÃO E HEADER ... */}
        <div className="mb-2 animate-in fade-in slide-in-from-left-4 duration-300">
          <Link
            href="/dashboard"
            className="text-sm text-brand-navy hover:text-brand-navy/90 font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Painel
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-75 transition-colors">
          <div className="flex flex-col lg:flex-row min-h-full">
            <div className="flex-1 p-6 md:p-10 lg:border-r border-neutral-100 ">
              {/* ... MANTÉM DADOS BÁSICOS ... */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                <span className="text-sm font-mono tabular-nums text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md tracking-wider">
                  #{chamado.codigo}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border transition-colors ${chamado.tipo.prioridade === "Alta" ? "bg-red-600 text-white border-red-700 shadow-sm" : chamado.tipo.prioridade === "Media" ? "bg-brand-yellow text-white border-brand-yellow shadow-sm" : "bg-neutral-100 text-neutral-700 border-neutral-200"}`}
                >
                  {chamado.tipo.prioridade}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase transition-colors border ${chamado.status === "SOLICITADO" ? "bg-amber-100 text-amber-700 border-amber-200/50" : chamado.status === "FECHADO" ? "bg-neutral-100 text-neutral-600 border-neutral-200/50" : chamado.status === "EM_ATENDIMENTO" ? "bg-brand-navy text-white border-brand-navy shadow-sm" : "bg-purple-100 text-purple-700 border-purple-200/50"}`}
                >
                  {chamado.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 0 mb-3 leading-tight">
                {chamado.titulo}
              </h1>
              <p className="text-neutral-500 font-medium mb-8">
                {chamado.tipo.nome} • {chamado.local.nome}
              </p>
              <h3 className="text-xs font-bold text-neutral-900 mb-3 uppercase tracking-wider">
                Descrição do Problema
              </h3>
              <div className="text-base text-neutral-700 bg-neutral-50 /30 p-5 rounded-md border border-neutral-100 leading-relaxed mb-8">
                {chamado.descricao
                  .split("\n")
                  .map((linha: string, i: number) => (
                    <p key={i} className="mb-2 last:mb-0 min-h-[1.5rem]">
                      {linha}
                    </p>
                  ))}
              </div>

              {/* CORREÇÃO DO LINK DE ANEXOS AQUI TAMBÉM */}
              {chamado.anexos.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xs font-bold text-neutral-900 mb-3 uppercase tracking-wider">
                    Arquivos Anexados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {chamado.anexos.map((anexo: any) => (
                      <a
                        key={anexo.id}
                        href={
                          anexo.base64?.startsWith("/uploads/")
                            ? anexo.base64
                            : `data:${anexo.tipo};base64,${anexo.base64}`
                        }
                        download={anexo.nomeArquivo}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-md shadow-sm hover:border-brand-navy hover:text-brand-navy transition-colors text-sm font-semibold"
                      >
                        <Paperclip className="w-4 h-4 text-neutral-400" />
                        {anexo.nomeArquivo}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-xs font-bold text-neutral-900 mb-4 uppercase tracking-wider">
                Histórico da Solicitação
              </h3>
              <TicketTimeline chamado={chamado} />

              {podeFechar && (
                <div className="mt-10 border-t border-neutral-100 pt-8">
                  <FormFecharChamado chamado={chamado} />
                </div>
              )}
            </div>

            <div className="w-full lg:w-[320px] xl:w-[360px] p-6 md:p-8 bg-neutral-50/50 /20 flex flex-col gap-8">
              {chamado.status !== "FECHADO" && (
                <div className="flex flex-col gap-2 p-5 bg-brand-navy/5 border border-brand-navy/10 rounded-lg">
                  <span className="text-[10px] font-bold text-brand-navy uppercase tracking-wider mb-2">
                    Ações Rápidas
                  </span>

                  {/* ... MANTÉM OS FORMS ORIGINAIS DE ATRIBUIR E TRANSFERIR ... */}
                  {!chamado.tecnicoId && podeAtribuir && (
                    <form action={atribuirChamado}>
                      <input
                        type="hidden"
                        name="codigo"
                        value={chamado.codigo}
                      />
                      <input
                        type="hidden"
                        name="tecnicoId"
                        value={String(userId)}
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand-navy hover:bg-brand-navy/90 text-white text-sm font-bold rounded-md shadow-sm transition-colors"
                      >
                        Atribuir Chamado
                      </button>
                    </form>
                  )}

                  {chamado.tecnicoId && podeAtribuir && (
                    <form action={atribuirChamado}>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-neutral-500 font-medium">
                          Reatribuir ticket:
                        </span>
                        <input
                          type="hidden"
                          name="codigo"
                          value={chamado.codigo}
                        />
                        <select
                          name="tecnicoId"
                          required
                          defaultValue={chamado.tecnicoId.toString()}
                          className="text-sm px-3 py-2 border border-neutral-300 rounded-lg shadow-sm outline-none bg-white transition-colors w-full"
                        >
                          <option value="">Selecione...</option>
                          {chamado.departamentoDestino?.usuarios.map(
                            (u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.nome}
                              </option>
                            ),
                          )}
                        </select>
                        <button
                          type="submit"
                          className="w-full py-2 bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          Transferir
                        </button>
                      </div>
                    </form>
                  )}

                  {/* NOVOS FORMS DE PAUSA E RETOMADA PARA PÁGINA CHEIA */}
                  {chamado.tecnicoId &&
                    podeAtribuir &&
                    chamado.status === "EM_ATENDIMENTO" && (
                      <div className="mt-4 pt-4 border-t border-brand-navy/10">
                        <span className="text-xs font-bold text-brand-yellow uppercase tracking-wider mb-2 block">
                          Pausar Chamado
                        </span>
                        <form
                          action={pausarChamado}
                          className="flex flex-col gap-2"
                        >
                          <input
                            type="hidden"
                            name="codigo"
                            value={chamado.codigo}
                          />
                          <textarea
                            name="justificativa"
                            required
                            placeholder="Justificativa (obrigatória)..."
                            className="w-full text-sm p-2 rounded border border-brand-yellow/30 outline-none"
                            rows={2}
                          ></textarea>
                          <input
                            type="date"
                            name="dataLimite"
                            required
                            className="w-full text-sm p-2 rounded border border-brand-yellow/30 outline-none"
                            title="Nova Data Limite SLA"
                          />
                          <button
                            type="submit"
                            className="w-full py-2 bg-brand-yellow hover:bg-brand-yellow/90 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                          >
                            Confirmar Pausa
                          </button>
                        </form>
                      </div>
                    )}

                  {chamado.tecnicoId &&
                    podeAtribuir &&
                    chamado.status === "PENDENTE" && (
                      <div className="mt-4 pt-4 border-t border-brand-navy/10">
                        <form
                          action={async () => {
                            "use server";
                            await retomarChamado(chamado.codigo);
                          }}
                        >
                          <button
                            type="submit"
                            className="w-full py-2 bg-brand-navy hover:bg-brand-navy/90 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                          >
                            Retomar Atendimento
                          </button>
                        </form>
                      </div>
                    )}
                </div>
              )}

              {/* ... [MANTÉM O RESTANTE DOS DADOS INTACTO] ... */}
              <div>
                <h3 className="text-xs font-bold text-neutral-900 mb-4 uppercase tracking-wider">
                  Detalhes do Ticket
                </h3>
                <div className="flex flex-col divide-y divide-neutral-200 border-y border-neutral-200 ">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 font-medium">
                      Solicitante
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                      <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">
                        {chamado.usuarioCriacao?.nome || "Sistema"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 font-medium">
                      Departamento
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                      <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">
                        {chamado.departamentoDestino?.nome || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 font-medium">
                      Técnico Atual
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 text-right">
                      <UserCog className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px] xl:max-w-[160px]">
                        {chamado.tecnico?.nome || (
                          <span className="text-amber-500 font-normal italic">
                            Aguardando...
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-neutral-200">
                    <ColaboradoresManager
                      chamadoCodigo={chamado.codigo}
                      tecnicoPrincipalId={chamado.tecnicoId}
                      colaboradores={chamado.colaboradores || []}
                      todosUsuarios={usuariosList}
                      podeAdicionar={
                        isTecnicoPrincipal && chamado.status !== "FECHADO"
                      }
                    />
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 font-medium">
                      Abertura
                    </span>
                    <span className="text-sm font-medium text-neutral-700 tabular-nums">
                      {new Date(chamado.dataCriacao).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs text-neutral-500 font-medium">
                      SLA / Vencimento
                    </span>
                    <span className="text-sm font-medium text-neutral-700 pr-1 tabular-nums">
                      {chamado.dataVencimento
                        ? new Date(chamado.dataVencimento).toLocaleString(
                            "pt-BR",
                            { dateStyle: "short", timeStyle: "short" },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
