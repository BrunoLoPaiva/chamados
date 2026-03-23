/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
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
  
  const sort = (resolvedParams?.sort as "codigo" | "titulo" | "prioridade" | "local" | "solicitante" | "status" | "dataCriacao" | "dataVencimento") || "dataCriacao";
  const dir = (resolvedParams?.dir as "asc" | "desc") || "desc";
  const activeTicket = resolvedParams?.activeTicket || null;
  const isFilterOpen = resolvedParams?.filters === "open";

  // Busca do combo list data limitando colunas para não pesar
  const [locaisList, usuariosList] = await Promise.all([
    prisma.local.findMany({ where: { ativo: true }, select: { id: true, nome: true, parentId: true }, orderBy: { nome: "asc" } }),
    prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
  ]);

  // Busca o usuário logado para descobrir seus departamentos e nível de acesso
  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { departamentos: true },
  });

  const isAdmin = usuarioLogado?.perfil === "ADMIN";
  const isDeptoAdmin = (session.user as any).isDeptoAdmin;
  const meusDeptosIds = usuarioLogado?.departamentos.map((d: any) => d.id) || [];

  const hasAdvancedFilterActive = !!(localId || criadorId || tecnicoId || dtAberturaDe || dtAberturaAte || dtVencimentoDe || dtVencimentoAte || dtFechamentoDe || dtFechamentoAte);

  const showTabs = !hasAdvancedFilterActive && !q && !statusFilter;
  
  const triagemWhere = {
    status: "SOLICITADO",
    tecnicoId: null,
    ...(isAdmin ? {} : { departamentoDestinoId: { in: meusDeptosIds } })
  };
  
  const countTriagem = showTabs ? await prisma.chamado.count({ where: triagemWhere }) : 0;
  const activeTab = resolvedParams?.tab || (countTriagem > 0 ? "triagem" : "atendimentos");

  // 2. QUERY BASE DE ATENDIMENTOS:
  let atendimentosWhere: any = {};
  
  if (statusFilter) {
    atendimentosWhere.status = statusFilter;
  } else if (showTabs) {
    atendimentosWhere.status = { in: ["SOLICITADO", "EM_ATENDIMENTO", "PENDENTE"] };
  }

  if (q || statusFilter || hasAdvancedFilterActive || isDeptoAdmin || isAdmin) {
     if (isAdmin) {
       // Admin vê tudo na busca
     } else if (isDeptoAdmin) {
       // Admin de depto vê tudo de seus deptos
       atendimentosWhere.departamentoDestinoId = { in: meusDeptosIds };
     } else {
       // Tecnico normal só vê o que é dele ou que ele mesmo criou
       atendimentosWhere.OR = [
         { tecnicoId: userId },
         { usuarioCriacaoId: userId }
       ];
     }
  } else {
    // Normal users ONLY see their created or assigned tickets on the "Atendimentos" default view
    atendimentosWhere.OR = [
      { tecnicoId: userId },
      { usuarioCriacaoId: userId }
    ];
  }

  if (q) {
    atendimentosWhere = {
      ...atendimentosWhere,
      OR: [
        ...(atendimentosWhere.OR || []),
        { titulo: { contains: q, } },
        { codigo: { contains: q.replace("#", "") } }
      ]
    }
  }

  // Rest of Advanced Filters
  if (localId) atendimentosWhere.localId = Number(localId);
  if (criadorId) atendimentosWhere.usuarioCriacaoId = Number(criadorId);
  if (tecnicoId) atendimentosWhere.tecnicoId = Number(tecnicoId);

  // Date Filters
  if (dtAberturaDe || dtAberturaAte) {
    atendimentosWhere.dataCriacao = {};
    if (dtAberturaDe) atendimentosWhere.dataCriacao.gte = new Date(`${dtAberturaDe}T00:00:00.000Z`);
    if (dtAberturaAte) atendimentosWhere.dataCriacao.lte = new Date(`${dtAberturaAte}T23:59:59.999Z`);
  }

  if (dtVencimentoDe || dtVencimentoAte) {
    atendimentosWhere.dataVencimento = {};
    if (dtVencimentoDe) atendimentosWhere.dataVencimento.gte = new Date(`${dtVencimentoDe}T00:00:00.000Z`);
    if (dtVencimentoAte) atendimentosWhere.dataVencimento.lte = new Date(`${dtVencimentoAte}T23:59:59.999Z`);
  }

  if (dtFechamentoDe || dtFechamentoAte) {
    atendimentosWhere.dataAtendimento = {};
    if (dtFechamentoDe) atendimentosWhere.dataAtendimento.gte = new Date(`${dtFechamentoDe}T00:00:00.000Z`);
    if (dtFechamentoAte) atendimentosWhere.dataAtendimento.lte = new Date(`${dtFechamentoAte}T23:59:59.999Z`);
  }

  const page = Math.max(1, Number(resolvedParams?.p || 1));
  const take = 25; // Aumentado para 25 por página
  const skip = (page - 1) * take;

  let chamadosListagem: any[] = [];
  let totalListagem = 0;

  // Mapeamento de ordenação para Prisma
  let orderByClause: any = {};
  if (sort === "codigo") orderByClause = { codigo: dir };
  else if (sort === "titulo") orderByClause = { titulo: dir };
  else if (sort === "status") orderByClause = { status: dir };
  else if (sort === "dataCriacao") orderByClause = { dataCriacao: dir };
  else if (sort === "dataVencimento") orderByClause = { dataVencimento: dir };
  else if (sort === "prioridade") orderByClause = { tipo: { prioridade: dir } }; // Isso as vezes falha ou é alfabético, não é perfeito mas quebra o galho (Alta/Baixa/Media)
  else if (sort === "local") orderByClause = { local: { nome: dir } };
  else if (sort === "solicitante") orderByClause = { usuarioCriacao: { nome: dir } };

  if (showTabs && activeTab === "triagem") {
      [chamadosListagem, totalListagem] = await Promise.all([
        prisma.chamado.findMany({
          where: triagemWhere,
          include: { usuarioCriacao: true, tipo: true, local: true, departamentoDestino: true },
          orderBy: Object.keys(orderByClause).length > 0 ? orderByClause : { dataCriacao: "asc" }, 
          take,
          skip
        }),
        prisma.chamado.count({ where: triagemWhere })
      ]);
  } else {
      [chamadosListagem, totalListagem] = await Promise.all([
        prisma.chamado.findMany({
          where: atendimentosWhere,
          include: { usuarioCriacao: true, tipo: true, local: true },
          orderBy: Object.keys(orderByClause).length > 0 ? orderByClause : { dataCriacao: "desc" }, 
          take,
          skip
        }),
        prisma.chamado.count({ where: atendimentosWhere })
      ]);
  }
  // 3. BUSCA DO CHAMADO ATIVO SE HOUVER
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
        acoes: { include: { acao: true } },
        interacoes: { include: { usuario: true }, orderBy: { data: "asc" } },
      },
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalListagem / take));

  const buildUrl = (p: number, overwriteTab?: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (statusFilter) sp.set("status", statusFilter);
    if (sort !== "dataCriacao") sp.set("sort", sort);
    if (dir !== "desc") sp.set("dir", dir);
    if (overwriteTab) {
       sp.set("tab", overwriteTab);
    } else if (activeTab === "triagem" && showTabs) {
       sp.set("tab", "triagem");
    }
    sp.set("p", String(p));
    return `/dashboard?${sp.toString()}`;
  };

  return (
    <div className={`min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-6 lg:p-8 transition-colors ${isFilterOpen ? "overflow-hidden" : ""}`}>
      <div className={activeTicket ? "mx-auto w-full max-w-[1600px]" : "max-w-6xl mx-auto"}>
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
              Painel de Chamados
            </h1>
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 mt-1">
              Caixa de entrada operacional
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href={buildUrl(page) + (buildUrl(page).includes('?') ? '&' : '?') + (isFilterOpen ? "filters=closed" : "filters=open")}
              scroll={false}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all border ${
                hasAdvancedFilterActive
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <FilterIcon className="w-4 h-4" />
              Filtros
              {hasAdvancedFilterActive && <span className="flex w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 md:relative md:top-0 md:right-0"></span>}
            </Link>

            <Link
              href="/chamado/novo"
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-600/20 transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              Novo Chamado
            </Link>
          </div>
        </header>

        {/* COMPONENT DE FILTROS AGORA É OFFCANVAS BASEADO NA URL */}
        {isFilterOpen && (
           <div className="fixed inset-0 z-50 flex justify-end">
              <Link href={buildUrl(page) + (buildUrl(page).includes('?') ? '&' : '?') + "filters=closed"} scroll={false} className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" />
              <div className="relative w-full max-w-sm h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col pt-6 origin-right animate-in slide-in-from-right-full duration-300">
                  <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/60">
                     <h2 className="text-lg font-bold">Filtros Avançados</h2>
                     <Link href={buildUrl(page) + (buildUrl(page).includes('?') ? '&' : '?') + "filters=closed"} scroll={false} className="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg">
                       <X className="w-5 h-5" />
                     </Link>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                     <DashboardFilters locais={locaisList} usuarios={usuariosList} />
                  </div>
              </div>
           </div>
        )}

        {showTabs && (
          <div className="flex space-x-2 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            <Link
              href={buildUrl(1, "triagem")}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                 activeTab === "triagem" 
                  ? "border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-500/5" 
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              Solicitações
              {countTriagem > 0 && (
                 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === "triagem" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                   {countTriagem}
                 </span>
              )}
            </Link>
            <Link
              href={buildUrl(1, "atendimentos")}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                 activeTab === "atendimentos" 
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5" 
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
              }`}
            >
              Atendimentos
            </Link>
          </div>
        )}

        <div>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {!showTabs ? `Resultados da Busca` : activeTab === "triagem" ? "Aguardando Atribuição" : "Seus Chamados"}
              </h2>
              {totalListagem > 0 && (
                 <span className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">Total: {totalListagem} chamados</span>
              )}
           </div>
          
          <div className={`grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 ${activeTicket ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
            
             {/* Esquerda: A tabela (ou tela cheia) */}
            <div className={`${activeTicket ? "hidden lg:block lg:col-span-5 xl:col-span-4" : ""}`}>
               <TicketsTable 
                 chamados={chamadosListagem} 
                 sort={sort} 
                 dir={dir} 
                 isSplitView={!!activeTicket}
                 activeTicketCodigo={activeTicket}
               />
               
               {/* Paginação */}
               {totalPages > 1 && (
                 <div className="flex justify-between md:justify-center items-center gap-2 md:gap-4 mt-8 bg-white dark:bg-neutral-900 p-2 rounded-md border border-neutral-200 dark:border-neutral-800">
                   {page > 1 ? (
                     <Link href={buildUrl(page - 1)} className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">
                       Anterior
                     </Link>
                   ) : (
                     <div className="px-3 md:px-4 py-2 border border-transparent text-sm opacity-50">Anterior</div>
                   )}
                   
                   <span className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap px-2">
                     Pág {page} de {totalPages}
                   </span>
                   
                   {page < totalPages ? (
                     <Link href={buildUrl(page + 1)} className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">
                       Próxima
                     </Link>
                   ) : (
                     <div className="px-3 md:px-4 py-2 border border-transparent text-sm opacity-50">Próxima</div>
                   )}
                 </div>
               )}
            </div>

            {/* Direita: O ticket ativo (Master-Detail) */}
            {activeTicket && chamadoAtivoCompleto && (
               <div className="lg:col-span-7 xl:col-span-8 animate-in slide-in-from-right-8 duration-500">
                  <TicketDetailsPanel 
                     chamado={chamadoAtivoCompleto} 
                     currentUserId={userId} 
                     isAdmin={isAdmin} 
                     meusDeptosIds={meusDeptosIds}
                  />
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
