/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Plus, FileText, Filter as FilterIcon, X } from "lucide-react";
import DashboardFilters from "@/components/DashboardFilters";
import TicketsTable from "@/components/TicketsTable";
import TicketDetailsPanel from "@/components/TicketDetailsPanel";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = Number((session.user as any).id);

  // Next.js 15: searchParams must be awaited
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || "";
  const statusFilter = resolvedParams?.status || "";

  const localId = resolvedParams?.localId || "";
  const criadorId = resolvedParams?.criadorId || "";
  const tecnicoId = resolvedParams?.tecnicoId || "";
  const dtAberturaDe = resolvedParams?.dtAberturaDe || "";
  const dtAberturaAte = resolvedParams?.dtAberturaAte || "";
  const dtVencimentoDe = resolvedParams?.dtVencimentoDe || "";
  const dtVencimentoAte = resolvedParams?.dtVencimentoAte || "";
  const dtFechamentoDe = resolvedParams?.dtFechamentoDe || "";
  const dtFechamentoAte = resolvedParams?.dtFechamentoAte || "";

  // Alterado: Padrão agora é dataVencimento
  const sort =
    (resolvedParams?.sort as
      | "codigo"
      | "titulo"
      | "prioridade"
      | "local"
      | "solicitante"
      | "status"
      | "dataCriacao"
      | "dataVencimento") || "dataVencimento"; 
      
  // Alterado: Direção padrão agora é asc (do mais próximo/atrasado para o mais distante)
  const dir = (resolvedParams?.dir as "asc" | "desc") || "asc"; 
  const activeTicket = resolvedParams?.activeTicket || null;
  const isFilterOpen = resolvedParams?.filters === "open";

  // Busca do combo list data limitando colunas para não pesar
  const [locaisList, usuariosList] = await Promise.all([
    prisma.local.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, parentId: true },
      orderBy: { nome: "asc" },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Busca o utilizador logado para descobrir os seus departamentos e nível de acesso
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isAdmin = usuarioLogado?.perfil === "ADMIN";
  const isTecnico = usuarioLogado?.perfil === "TECNICO";
  const isDeptoAdmin = (session.user as any).isDeptoAdmin;
  const meusDeptosIds =
    usuarioLogado?.departamentos.map((d: any) => d.id) || [];

  const hasAdvancedFilterActive = !!(
    localId ||
    criadorId ||
    tecnicoId ||
    dtAberturaDe ||
    dtAberturaAte ||
    dtVencimentoDe ||
    dtVencimentoAte ||
    dtFechamentoDe ||
    dtFechamentoAte
  );

  // 1. QUERY BASE UNIFICADA
  const chamadosWhere: any = { AND: [] };

  // Status default (se não houver filtro de status ou busca avançada)
  if (statusFilter === "ALL") {
    // Não aplica nenhuma restrição de status, traz a base toda
  } else if (statusFilter) {
    // Filtro específico (FECHADO, SOLICITADO, etc)
    chamadosWhere.status = statusFilter;
  } else if (!hasAdvancedFilterActive && !q) {
    // Comportamento padrão: apenas chamados em aberto
    chamadosWhere.status = {
      in: ["SOLICITADO", "EM_ATENDIMENTO", "PENDENTE"],
    };
  }

  // 2. MATRIZ DE VISIBILIDADE POR PERFIL
  if (isAdmin) {
    // Admin vê absolutamente tudo (não adiciona restrições)
  } else if (isTecnico) {
    // Técnico vê APENAS o que foi atribuído a ele, onde ele colabora, ou os que ele mesmo abriu
    chamadosWhere.AND.push({
      OR: [
        { tecnicoId: userId },
        { usuarioCriacaoId: userId },
        { colaboradores: { some: { id: userId } } },
      ],
    });
  } else if (isDeptoAdmin) {
    // Coordenador vê tudo o que cai nos seus departamentos OU o que é dele
    chamadosWhere.AND.push({
      OR: [
        { departamentoDestinoId: { in: meusDeptosIds } },
        { tecnicoId: userId },
        { usuarioCriacaoId: userId },
      ],
    });
  } else {
    // Utilizador Comum vê apenas o que ele próprio criou
    chamadosWhere.AND.push({
      usuarioCriacaoId: userId,
    });
  }

  // 3. FILTROS DE BUSCA (Texto)
  if (q) {
    chamadosWhere.AND.push({
      OR: [
        { titulo: { contains: q } },
        { codigo: { contains: q.replace("#", "") } },
      ],
    });
  }

  // 4. FILTROS AVANÇADOS
  if (localId) chamadosWhere.localId = Number(localId);
  if (criadorId) chamadosWhere.usuarioCriacaoId = Number(criadorId);

  // Filtro de Técnico
  if (tecnicoId === "me") {
    chamadosWhere.tecnicoId = userId;
  } else if (tecnicoId === "unassigned") {
    chamadosWhere.tecnicoId = null;
  } else if (tecnicoId) {
    chamadosWhere.tecnicoId = Number(tecnicoId);
  }

  // Filtros de Data
  if (dtAberturaDe || dtAberturaAte) {
    const dataCriacao: any = {};
    if (dtAberturaDe)
      dataCriacao.gte = new Date(`${dtAberturaDe}T00:00:00.000Z`);
    if (dtAberturaAte)
      dataCriacao.lte = new Date(`${dtAberturaAte}T23:59:59.999Z`);
    chamadosWhere.dataCriacao = dataCriacao;
  }

  if (dtVencimentoDe || dtVencimentoAte) {
    const dataVencimento: any = {};
    if (dtVencimentoDe)
      dataVencimento.gte = new Date(`${dtVencimentoDe}T00:00:00.000Z`);
    if (dtVencimentoAte)
      dataVencimento.lte = new Date(`${dtVencimentoAte}T23:59:59.999Z`);
    chamadosWhere.dataVencimento = dataVencimento;
  }

  if (dtFechamentoDe || dtFechamentoAte) {
    const dataAtendimento: any = {};
    if (dtFechamentoDe)
      dataAtendimento.gte = new Date(`${dtFechamentoDe}T00:00:00.000Z`);
    if (dtFechamentoAte)
      dataAtendimento.lte = new Date(`${dtFechamentoAte}T23:59:59.999Z`);
    chamadosWhere.dataAtendimento = dataAtendimento;
  }

  // Limpeza final para o Prisma não reclamar de array vazio
  if (chamadosWhere.AND.length === 0) delete chamadosWhere.AND;

  const page = Math.max(1, Number(resolvedParams?.p || 1));
  const take = 25; // Mantido em 25 por página
  const skip = (page - 1) * take;

  // Mapeamento de ordenação para Prisma
  let orderByClause: any = {};
  if (sort === "codigo") orderByClause = { codigo: dir };
  else if (sort === "titulo") orderByClause = { titulo: dir };
  else if (sort === "status") orderByClause = { status: dir };
  else if (sort === "dataCriacao") orderByClause = { dataCriacao: dir };
  else if (sort === "dataVencimento") orderByClause = { dataVencimento: dir };
  else if (sort === "prioridade")
    orderByClause = { tipo: { prioridade: dir } }; // Isso às vezes falha ou é alfabético, não é perfeito mas resolve o essencial (Alta/Baixa/Media)
  else if (sort === "local") orderByClause = { local: { nome: dir } };
  else if (sort === "solicitante")
    orderByClause = { usuarioCriacao: { nome: dir } };

  // 5. EXECUÇÃO DA QUERY UNIFICADA
  const [chamadosListagem, totalListagem] = await Promise.all([
    prisma.chamado.findMany({
      where: chamadosWhere,
      include: {
        usuarioCriacao: true,
        tipo: true,
        local: true,
        departamentoDestino: true,
        colaboradores: true,
      },
      orderBy:
        Object.keys(orderByClause).length > 0
          ? orderByClause
          : { dataVencimento: "asc" }, // Alterado o fallback direto no Prisma
      take,
      skip,
    }),
    prisma.chamado.count({ where: chamadosWhere }),
  ]);

  // 6. BUSCA DO CHAMADO ATIVO SE HOUVER
  let chamadoAtivoCompleto: any = null;
  if (activeTicket) {
    chamadoAtivoCompleto = await prisma.chamado.findUnique({
      where: { codigo: activeTicket },
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
  }

  const totalPages = Math.max(1, Math.ceil(totalListagem / take));

  const buildUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (statusFilter) sp.set("status", statusFilter);
    // Alterado para refletir os novos defaults
    if (sort !== "dataVencimento") sp.set("sort", sort);
    if (dir !== "asc") sp.set("dir", dir);
    sp.set("p", String(p));
    return `/dashboard?${sp.toString()}`;
  };

  return (
    <div
      className={`min-h-screen bg-neutral-50 p-4 md:p-6 lg:p-6 transition-colors ${
        isFilterOpen ? "overflow-hidden" : ""
      }`}
    >
      <div
        className={
          activeTicket ? "mx-auto w-full max-w-[1600px]" : "max-w-6xl mx-auto"
        }
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              Painel de Chamados
            </h1>
            <p className="text-sm md:text-base text-neutral-500 mt-1">
              Caixa de entrada operacional
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href={
                buildUrl(page) +
                (buildUrl(page).includes("?") ? "&" : "?") +
                (isFilterOpen ? "filters=closed" : "filters=open")
              }
              scroll={false}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all border ${
                hasAdvancedFilterActive
                  ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <FilterIcon className="w-4 h-4" />
              Filtros
              {hasAdvancedFilterActive && (
                <span className="flex w-2 h-2 rounded-full bg-brand-navy absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>
              )}
            </Link>

            <Link
              href="/chamado/novo"
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-brand-navy text-white rounded-md hover:bg-brand-navy/90 focus:ring-4 focus:ring-brand-navy/20 transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              Novo Chamado
            </Link>
          </div>
        </header>

        {/* ── BARRA DE CONTEXTO DE FILTROS ATIVOS (CHIPS) ── */}
        {(hasAdvancedFilterActive || statusFilter) && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-2">
              Filtros Ativos:
            </span>

            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-brand-navy/10 text-brand-navy border border-brand-navy/20">
                Status: {statusFilter}
              </span>
            )}

            {localId && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                Localização Filtrada
              </span>
            )}

            {(dtAberturaDe || dtAberturaAte) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                Data de Abertura
              </span>
            )}

            <Link
              href="/dashboard"
              scroll={false}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline ml-auto flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpar Todos
            </Link>
          </div>
        )}

        {/* COMPONENT DE FILTROS (OFFCANVAS) */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <Link
              href={
                buildUrl(page) +
                (buildUrl(page).includes("?") ? "&" : "?") +
                "filters=closed"
              }
              scroll={false}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
            />
            <div className="relative w-full max-w-sm h-full bg-white border-l border-neutral-200 shadow-2xl flex flex-col pt-6 origin-right animate-in slide-in-from-right-full duration-300">
              <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100">
                <h2 className="text-lg font-bold">Filtros Avançados</h2>
                <Link
                  href={
                    buildUrl(page) +
                    (buildUrl(page).includes("?") ? "&" : "?") +
                    "filters=closed"
                  }
                  scroll={false}
                  className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Link>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <Suspense
                  fallback={
                    <div className="h-32 bg-neutral-100 animate-pulse rounded-lg"></div>
                  }
                >
                  <DashboardFilters
                    locais={locaisList}
                    usuarios={usuariosList}
                    isAdmin={isAdmin}
                    isDeptoAdmin={isDeptoAdmin}
                    currentUserId={userId}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {q || hasAdvancedFilterActive || statusFilter
                ? "Resultados da Busca"
                : "Fila de Chamados"}
            </h2>
            {totalListagem > 0 && (
              <span className="text-xs md:text-sm text-neutral-500">
                Total: {totalListagem} chamados
              </span>
            )}
          </div>

          <div
            className={`grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 ${
              activeTicket ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
            }`}
          >
            {/* Esquerda: A tabela (ou tela cheia) */}
            <div
              className={`min-w-0 flex flex-col ${
                activeTicket
                  ? "hidden lg:block lg:col-span-4 xl:col-span-3"
                  : ""
              }`}
            >
              <TicketsTable
                chamados={chamadosListagem}
                sort={sort}
                dir={dir}
                isSplitView={!!activeTicket}
                activeTicketCodigo={activeTicket}
                usuarios={usuariosList}
              />

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between md:justify-center items-center gap-2 md:gap-4 mt-8 bg-white p-2 rounded-md border border-neutral-200">
                  {page > 1 ? (
                    <Link
                      href={buildUrl(page - 1)}
                      className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors text-neutral-700"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <div className="px-3 md:px-4 py-2 border border-transparent text-sm opacity-50">
                      Anterior
                    </div>
                  )}

                  <span className="text-xs md:text-sm font-medium text-neutral-500 whitespace-nowrap px-2">
                    Pág {page} de {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={buildUrl(page + 1)}
                      className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors text-neutral-700"
                    >
                      Próxima
                    </Link>
                  ) : (
                    <div className="px-3 md:px-4 py-2 border border-transparent text-sm opacity-50">
                      Próxima
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direita: O ticket ativo (Master-Detail) */}
            {activeTicket && chamadoAtivoCompleto && (
              <div className="lg:col-span-8 xl:col-span-9 animate-in slide-in-from-right-8 duration-500">
                <TicketDetailsPanel
                  chamado={chamadoAtivoCompleto}
                  currentUserId={userId}
                  isAdmin={isAdmin}
                  meusDeptosIds={meusDeptosIds}
                  usuarios={usuariosList}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}