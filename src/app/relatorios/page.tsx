import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suspense } from "react";
import RelatoriosFilters from "@/components/RelatoriosFilters";
import RelatoriosClientView from "./RelatoriosClientView"; // <-- IMPORT CORRETO DA VERSÃO COM ABAS

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

  if (!isAdmin && !isDeptoAdmin) redirect("/dashboard");

  // Listas auxiliares para os filtros
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

  const chamados = await prisma.chamado.findMany({
    where: filterWhere as any,
    include: {
      tipo: true,
      tecnico: true,
      usuarioCriacao: true,
      departamentoDestino: true,
      local: true,
    },
    orderBy: { dataCriacao: "desc" },
  });

  // --- LÓGICA DE BI ---
  const countTecnicos: Record<string, number> = {};
  const countLocais: Record<string, number> = {};
  const countSolicitantes: Record<string, number> = {};
  const countTipos: Record<string, number> = {};

  chamados.forEach((c) => {
    const tecnico = c.tecnico?.nome || "Aguardando Atribuição";
    countTecnicos[tecnico] = (countTecnicos[tecnico] || 0) + 1;

    const local = c.local?.nome || "Desconhecido";
    countLocais[local] = (countLocais[local] || 0) + 1;

    const solicitante = c.usuarioCriacao?.nome || "Sistema";
    countSolicitantes[solicitante] = (countSolicitantes[solicitante] || 0) + 1;

    const tipo = c.tipo?.nome || "Não classificado";
    countTipos[tipo] = (countTipos[tipo] || 0) + 1;
  });

  const formatChartData = (record: Record<string, number>, limit: number = 5) =>
    Object.entries(record)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

  const chartData = {
    tecnicos: formatChartData(countTecnicos, 5),
    locais: formatChartData(countLocais, 5),
    solicitantes: formatChartData(countSolicitantes, 5),
    tipos: formatChartData(countTipos, 8),
  };

  // --- CÁLCULOS DE KPIS ---
  const total = chamados.length;
  const fechados = chamados.filter((c: any) => c.status === "FECHADO");
  const abertos = total - fechados.length;
  const fechadosComData = fechados.filter((c: any) => c.dataAtendimento);

  const somaTMA = fechadosComData.reduce(
    (acc: number, c: any) =>
      acc + (c.dataAtendimento.getTime() - c.dataCriacao.getTime()),
    0,
  );
  const tmaMs = fechadosComData.length ? somaTMA / fechadosComData.length : 0;
  const tmaHoras = (tmaMs / (1000 * 60 * 60)).toFixed(1);

  const slaNoPrazo = fechadosComData.filter(
    (c: any) => !c.dataVencimento || c.dataAtendimento <= c.dataVencimento,
  ).length;
  const slaPorcentagem = fechadosComData.length
    ? Math.round((slaNoPrazo / fechadosComData.length) * 100)
    : 100;
  const resolvidosPerc =
    total > 0 ? Math.round((fechados.length / total) * 100) : 0;

  const kpis = {
    total,
    resolvidosPerc,
    abertos,
    fechados: fechados.length,
    tmaHoras,
    slaPerc: slaPorcentagem,
  };

  // --- EXPORT DATA ---
  const exportData = chamados.map((c: any) => ({
    codigo: c.codigo,
    status: c.status,
    dataCriacao: c.dataCriacao,
    usuarioCriacao: c.usuarioCriacao?.nome || "Sistema",
    tecnico: c.tecnico?.nome || "Não atribuído",
    departamento: c.departamentoDestino?.nome || "Desconhecido",
    local: c.local?.nome || "Desconhecido",
    tipo: c.tipo?.nome || "Outros",
    prioridade: c.tipo?.prioridade || "Média",
    dataAtendimento: c.dataAtendimento,
    dataVencimento: c.dataVencimento,
  }));

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
              Relatórios e Métricas
            </h1>
            <p className="text-neutral-500 mt-1 capitalize">
              Visão consolidada: {mesAtualNome}
            </p>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="h-16 bg-neutral-100 animate-pulse rounded-lg mb-6"></div>
          }
        >
          <RelatoriosFilters
            departamentos={departamentosAtivos.map((d) => ({
              id: d.id,
              nome: d.nome,
            }))}
            tecnicos={tecnicosAtivos.map((t) => ({ id: t.id, nome: t.nome }))}
          />
        </Suspense>

        {/* --- INJETANDO O CLIENT VIEW COM ABAS --- */}
        <RelatoriosClientView
          kpis={kpis}
          charts={chartData}
          chamados={chamados}
          exportData={exportData}
          mesAtualNome={mesAtualNome}
        />
      </div>
    </div>
  );
}
