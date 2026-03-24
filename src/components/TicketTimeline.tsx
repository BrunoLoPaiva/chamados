"use client";

import {
  PlusCircle,
  MessageSquare,
  CheckCircle2,
  CheckSquare,
  Bot,
} from "lucide-react";

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
      <div className="text-sm text-neutral-600 ">
        Chamado aberto por{" "}
        <span className="font-semibold text-neutral-900 ">
          {chamado.usuarioCriacao?.nome || "Sistema"}
        </span>
        .
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
        <div
          className={`text-sm p-4 rounded-lg border shadow-sm transition-colors ${isSystemMsg ? "bg-neutral-50 /50 border-neutral-200  text-neutral-600 " : "bg-white  text-neutral-800  border-brand-navy/20 "}`}
        >
          <div className="font-bold mb-1.5 text-xs flex items-center gap-1.5">
            {isSystemMsg ? (
              <span className="text-neutral-500 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> Log do Sistema
              </span>
            ) : (
              <span className="text-brand-navy  flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> {int.usuario?.nome}
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">{int.texto}</div>
        </div>
      ),
    });
  });

  // 3. Fechamento e Solução
  if (chamado.status === "FECHADO" && chamado.solucao) {
    events.push({
      id: "fechamento",
      type: "FECHAMENTO",
      date: chamado.dataAtendimento
        ? new Date(chamado.dataAtendimento)
        : new Date(),
      isSystem: true,
      content: (
        <div className="bg-brand-green/5  border border-brand-green/20  rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand-green font-bold text-sm mb-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> Chamado Resolvido
          </div>
          <div className="text-sm text-neutral-800  whitespace-pre-wrap mb-4 font-medium">
            {chamado.solucao}
          </div>

          {chamado.acoes.filter((a) => a.realizado).length > 0 && (
            <div className="pt-3 border-t border-brand-green/10 ">
              <span className="text-[10px] font-bold text-brand-green/70 uppercase tracking-wider mb-2 block">
                Checklist Executado
              </span>
              <ul className="grid gap-1.5">
                {chamado.acoes
                  .filter((a) => a.realizado)
                  .map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-2 text-xs text-neutral-700 "
                    >
                      <CheckSquare className="w-4 h-4 text-brand-green shrink-0" />
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
      <div className="absolute left-[23px] top-4 bottom-4 w-px bg-neutral-200 " />

      <div className="space-y-6">
        {events.map((ev, index) => {
          let Icon = PlusCircle;
          let iconColor = "text-neutral-400 bg-neutral-100 ring-white  ";

          if (ev.type === "MENSAGEM") {
            Icon = MessageSquare;
            iconColor = ev.isSystem
              ? "text-neutral-500 bg-neutral-200 ring-white  "
              : "text-white bg-brand-navy ring-white  shadow-sm";
          } else if (ev.type === "FECHAMENTO") {
            Icon = CheckCircle2;
            iconColor = "text-white bg-brand-green ring-white  shadow-sm";
          }

          return (
            <div key={ev.id} className="relative flex gap-4 pr-2">
              {/* Dot / Icon */}
              <div
                className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0 ring-4 mt-0.5 shadow-sm transition-colors ${iconColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-neutral-400">
                    {ev.date.toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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
