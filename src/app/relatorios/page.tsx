import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suspense } from "react";
import { BarChart3, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import ExportCSVButton from "@/components/ExportCSVButton";
import RelatoriosFilters from "@/components/RelatoriosFilters";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = Number((session.user as any).id);

  // Autenticação e Nível de Acesso
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isAdmin = usuarioLogado?.perfil === "ADMIN";
  const isDeptoAdmin = (session.user as any).isDeptoAdmin;
  const meusDeptosIds =
    usuarioLogado?.departamentos.map((d: any) => d.id) || [];

  if (!isAdmin && !isDeptoAdmin) {
    redirect("/dashboard");
  }

  // Listas auxiliares para os filtros (Somente ativos para o form)
  const [departamentosAtivos, tecnicosAtivos] = await Promise.all([
    prisma.departamento.findMany({ orderBy: { nome: "asc" } }),
    prisma.usuario.findMany({
      where: { perfil: { in: ["ADMIN", "TECNICO"] } },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Construção do Filtro
  const pInicio = resolvedParams?.inicio;
  const pFim = resolvedParams?.fim;
  const pDepto = resolvedParams?.depto ? Number(resolvedParams?.depto) : null;
  const pTecnico = resolvedParams?.tecnico
    ? Number(resolvedParams?.tecnico)
    : null;

  const inicioMes = pInicio ? parseISO(pInicio) : startOfMonth(new Date());
  const fimMes = pFim ? parseISO(pFim) : endOfMonth(new Date());

  // Ajuste do final do dia para contemplar o dia útil passado na UI
  fimMes.setHours(23, 59, 59, 999);

  const filterWhere: Record<string, unknown> = {
    dataCriacao: { gte: inicioMes, lte: fimMes },
  };

  if (!isAdmin && meusDeptosIds.length > 0) {
    filterWhere.departamentoDestinoId = { in: meusDeptosIds };
  } else if (pDepto) {
    filterWhere.departamentoDestinoId = pDepto;
  }
  if (pTecnico) filterWhere.tecnicoId = pTecnico;

  const mesAtualNome =
    format(inicioMes, "MMMM 'de' yyyy", { locale: ptBR }) +
    (pFim ? ` até ${format(fimMes, "dd/MM/yyyy")}` : "");

  type ChamadoComplete = {
    id: number;
    codigo: string;
    status: string;
    dataCriacao: Date;
    dataAtendimento: Date | null;
    dataVencimento: Date | null;
    usuarioCriacao: { nome: string } | null;
    tecnico: { nome: string } | null;
    departamentoDestino: { nome: string } | null;
    tipo: { nome: string; prioridade: string } | null;
  };

  const chamadosResult = await prisma.chamado.findMany({
    where: filterWhere as any, // Prisma typed where query workaround for dynamic keys
    include: {
      tipo: true,
      tecnico: true,
      usuarioCriacao: true,
      departamentoDestino: true,
    },
    orderBy: { dataCriacao: "desc" },
  });

  const chamados = chamadosResult as unknown as ChamadoComplete[];

  // Cálculos de KPIs
  const total = chamados.length;
  const fechados = chamados.filter(
    (c: ChamadoComplete) => c.status === "FECHADO",
  );
  const abertos = total - fechados.length;

  const fechadosComData = fechados.filter(
    (c: ChamadoComplete) => c.dataAtendimento,
  );

  // TMA (Tempo Médio de Atendimento) em Horas
  const somaTMA = fechadosComData.reduce(
    (acc: number, c: ChamadoComplete) =>
      acc + (c.dataAtendimento!.getTime() - c.dataCriacao.getTime()),
    0,
  );
  const tmaMs = fechadosComData.length ? somaTMA / fechadosComData.length : 0;
  const tmaHoras = (tmaMs / (1000 * 60 * 60)).toFixed(1);

  // SLA Violado
  const slaNoPrazo = fechadosComData.filter(
    (c: ChamadoComplete) =>
      !c.dataVencimento || c.dataAtendimento! <= c.dataVencimento,
  ).length;
  const slaPorcentagem = fechadosComData.length
    ? Math.round((slaNoPrazo / fechadosComData.length) * 100)
    : 100;

  // Preparando dados para Exportação
  const exportData = chamados.map((c: ChamadoComplete) => ({
    codigo: c.codigo,
    status: c.status,
    dataCriacao: c.dataCriacao,
    usuarioCriacao: c.usuarioCriacao?.nome || "Sistema",
    tecnico: c.tecnico?.nome || "Não atribuído",
    departamento: c.departamentoDestino?.nome || "Desconhecido",
    tipo: c.tipo?.nome || "Outros",
    prioridade: c.tipo?.prioridade || "Média",
    dataAtendimento: c.dataAtendimento,
    dataVencimento: c.dataVencimento,
  }));

  return (
    <div className="min-h-screen bg-neutral-50 50 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 0 tracking-tight">
              Relatórios e Métricas
            </h1>
            <p className="text-neutral-500  mt-1 capitalize">
              Visão consolidada: {mesAtualNome}
            </p>
          </div>
        </header>

        <Suspense fallback={<div className="h-16 bg-neutral-100 animate-pulse rounded-lg mb-6"></div>}>
          <RelatoriosFilters
            departamentos={departamentosAtivos.map((d) => ({
              id: d.id,
              nome: d.nome,
            }))}
            tecnicos={tecnicosAtivos.map((t) => ({ id: t.id, nome: t.nome }))}
          />
        </Suspense>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="bg-white  p-6 rounded-lg border border-neutral-200  shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-navy/10  text-brand-navy  rounded-md">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-neutral-500  text-sm font-medium">
              Total de Chamados
            </h3>
            <p className="text-3xl font-bold text-neutral-900 0 mt-1">
              {total}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              {abertos} pendentes / {fechados.length} concluídos
            </p>
          </div>

          <div className="bg-white  p-6 rounded-lg border border-neutral-200  shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-green/10  text-brand-green  rounded-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-neutral-500  text-sm font-medium">
              Resolvidos
            </h3>
            <p className="text-3xl font-bold text-neutral-900 0 mt-1">
              {total > 0 ? Math.round((fechados.length / total) * 100) : 0}%
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Taxa de resolução no mês
            </p>
          </div>

          <div className="bg-white  p-6 rounded-lg border border-neutral-200  shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-yellow/10  text-brand-yellow  rounded-md">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-neutral-500  text-sm font-medium">
              Tempo Médio de Atendimento
            </h3>
            <p className="text-3xl font-bold text-neutral-900 0 mt-1">
              {tmaHoras}h
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Tempo da abertura até a solução
            </p>
          </div>

          <div className="bg-white  p-6 rounded-lg border border-neutral-200  shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-md ${slaPorcentagem >= 80 ? "bg-emerald-50 text-emerald-600  " : "bg-red-50 text-red-600  "}`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-neutral-500  text-sm font-medium">
              SLA no Prazo
            </h3>
            <p className="text-3xl font-bold text-neutral-900 0 mt-1">
              {slaPorcentagem}%
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Atendimentos dentro do prazo
            </p>
          </div>
        </div>

        {/* Detalhamento e Listagem */}
        <div className="bg-white  rounded-lg border border-neutral-200  p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-neutral-900 0">
              Volume do Mês Atual
            </h2>
            <ExportCSVButton data={exportData} mes={mesAtualNome} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500  uppercase bg-neutral-50 /50">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">ID</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Abertura</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Técnico</th>
                  <th className="px-4 py-3 font-semibold">TMA (Horas)</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg">
                    Prioridade / SLA
                  </th>
                </tr>
              </thead>
              <tbody>
                {chamados.slice(0, 50).map((c) => {
                  const resolucao = c.dataAtendimento
                    ? (c.dataAtendimento.getTime() - c.dataCriacao.getTime()) /
                      (1000 * 60 * 60)
                    : null;
                  const violouSla =
                    c.dataVencimento && c.dataAtendimento
                      ? c.dataAtendimento > c.dataVencimento
                      : false;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 font-mono text-brand-navy font-bold group-hover:underline">
                          #{c.codigo}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${c.status === "FECHADO" ? "bg-neutral-100 text-neutral-600" : "bg-blue-50 text-blue-600"}`}
                          >
                            {c.status.replace("_", " ")}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0 text-neutral-700">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3">
                          {format(c.dataCriacao, "dd 'de' MMM, HH:mm", {
                            locale: ptBR,
                          })}
                        </Link>
                      </td>
                      <td
                        className="p-0 text-neutral-700 max-w-[150px]"
                        title={c.usuarioCriacao?.nome}
                      >
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 truncate">
                          {c.usuarioCriacao?.nome || "Sistema"}
                        </Link>
                      </td>
                      <td className="p-0 text-neutral-700 max-w-[150px]">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 truncate">
                          {c.tecnico?.nome || "-"}
                        </Link>
                      </td>
                      <td className="p-0 text-neutral-700">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3">
                          {resolucao !== null ? (
                            <span className="font-mono">
                              {resolucao.toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="flex items-center gap-2 px-4 py-3">
                          <span className="text-xs uppercase font-bold text-neutral-600">
                            {c.tipo?.prioridade || "Média"}
                          </span>
                          {c.status === "FECHADO" &&
                            c.dataVencimento &&
                            (violouSla ? (
                              <span
                                className="w-2 h-2 rounded-full bg-red-500 shrink-0"
                                title="Violou SLA"
                              ></span>
                            ) : (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                title="No Prazo"
                              ></span>
                            ))}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {chamados.length === 0 && (
              <div className="text-center py-12 text-neutral-500 ">
                Nenhum chamado registrado neste período.
              </div>
            )}

            {chamados.length > 50 && (
              <div className="text-center py-4 border-t border-neutral-100  text-xs text-neutral-500">
                Exibindo os últimos 50 registros do mês. Exporte para CSV para
                ver todos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
