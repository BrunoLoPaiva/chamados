"use client";

import { PlusCircle, MessageSquare, CheckCircle2, CheckSquare, Bot } from "lucide-react";

type Interacao = {
  id: number;
  texto: string;
  data: Date | string;
  usuario?: { nome: string } | null;
};

type Acao = {
  id: number;
  realizado: boolean;
  acao: { descricao: string };
};

interface Props {
  chamado: {
    dataCriacao: Date | string;
    usuarioCriacao?: { nome: string } | null;
    interacoes: Interacao[];
    status: string;
    dataAtendimento?: Date | string | null;
    solucao?: string | null;
    acoes: Acao[];
  };
}

type TimelineEvent = {
  id: string;
  type: "CRIACAO" | "MENSAGEM" | "FECHAMENTO";
  date: Date;
  content: React.ReactNode;
  isSystem?: boolean;
};

export default function TicketTimeline({ chamado }: Props) {
  const events: TimelineEvent[] = [];

  // 1. Criação
  events.push({
    id: "criacao",
    type: "CRIACAO",
    date: new Date(chamado.dataCriacao),
    isSystem: true,
    content: (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Chamado aberto por <span className="font-semibold text-neutral-900 dark:text-neutral-100">{chamado.usuarioCriacao?.nome || "Sistema"}</span>.
      </div>
    ),
  });

  // 2. Interações (Mensagens / Notas)
  chamado.interacoes.forEach((int) => {
    // Vamos considerar que se não tem usuário, ou se é uma mensagem do sistema "Técnico X assumiu", é system message.
    // Como interacoes geralmente são comentários:
    const isSystemMsg = !int.usuario;
    events.push({
      id: `int-${int.id}`,
      type: "MENSAGEM",
      date: new Date(int.data),
      isSystem: isSystemMsg,
      content: (
        <div className={`text-sm p-4 rounded-md ${isSystemMsg ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300" : "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-800/50"}`}>
          <div className="font-semibold mb-1 text-xs opacity-70 flex items-center gap-1.5">
            {isSystemMsg ? <Bot className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            {int.usuario?.nome || "Sistema"}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">
            {int.texto}
          </div>
        </div>
      ),
    });
  });

  // 3. Fechamento e Solução
  if (chamado.status === "FECHADO" && chamado.solucao) {
    events.push({
      id: "fechamento",
      type: "FECHAMENTO",
      date: chamado.dataAtendimento ? new Date(chamado.dataAtendimento) : new Date(),
      isSystem: true,
      content: (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-md p-4">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm mb-2">
            <CheckCircle2 className="w-4 h-4" /> Chamado Resolvido
          </div>
          <div className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap mb-4">
            {chamado.solucao}
          </div>
          
          {chamado.acoes.filter(a => a.realizado).length > 0 && (
            <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50">
              <span className="text-xs font-bold text-emerald-800/70 dark:text-emerald-400/70 uppercase tracking-wider mb-2 block">Ações Executadas</span>
              <ul className="grid gap-1.5">
                {chamado.acoes.filter(a => a.realizado).map(a => (
                  <li key={a.id} className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {a.acao.descricao}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    });
  }

  // Sort by date ascending
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="relative pl-4 mt-8 mb-6">
      {/* Linha vertical */}
      <div className="absolute left-[23px] top-4 bottom-4 w-px bg-neutral-200 dark:bg-neutral-800" />

      <div className="space-y-6">
        {events.map((ev, index) => {
          let Icon = PlusCircle;
          let iconColor = "text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 ring-neutral-200 dark:ring-neutral-800";
          
          if (ev.type === "MENSAGEM") {
             Icon = MessageSquare;
             iconColor = ev.isSystem ? "text-neutral-500 bg-neutral-100 dark:bg-neutral-800 ring-transparent" : "text-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-blue-100 dark:ring-blue-900/50";
          } else if (ev.type === "FECHAMENTO") {
             Icon = CheckCircle2;
             iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-emerald-100 dark:ring-emerald-900/50";
          }

          return (
            <div key={ev.id} className="relative flex gap-4 pr-2">
              {/* Dot / Icon */}
              <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0 ring-4 mt-0.5 shadow-sm transition-colors ${iconColor}`}>
                   <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-neutral-400">
                    {ev.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                {ev.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
