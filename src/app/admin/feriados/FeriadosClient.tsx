"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { getFeriados, toggleFeriado } from "@/app/actions/feriados";
import { toast } from "sonner";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function FeriadosClient() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [feriados, setFeriados] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  // Carrega os feriados sempre que o mês ou ano muda
  useEffect(() => {
    const fetchFeriados = async () => {
      setIsLoading(true);
      try {
        const datas = await getFeriados(ano, mes);
        setFeriados(new Set(datas));
      } catch (error) {
        toast.error("Erro ao carregar feriados.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeriados();
  }, [ano, mes]);

  const mesAnterior = () => {
    setDataAtual(new Date(ano, mes - 1, 1));
  };

  const proximoMes = () => {
    setDataAtual(new Date(ano, mes + 1, 1));
  };

  const hoje = () => {
    setDataAtual(new Date());
  };

  const handleToggleFeriado = (dataString: string, isFimDeSemana: boolean) => {
    if (isFimDeSemana) {
      toast.info("Finais de semana já são desconsiderados automaticamente.");
      return;
    }

    // Atualização otimista na tela
    const novoSet = new Set(feriados);
    const estavaMarcado = novoSet.has(dataString);

    if (estavaMarcado) {
      novoSet.delete(dataString);
    } else {
      novoSet.add(dataString);
    }
    setFeriados(novoSet);

    startTransition(async () => {
      try {
        await toggleFeriado(dataString);
        toast.success(
          estavaMarcado ? "Feriado removido!" : "Feriado adicionado!",
        );
      } catch (error) {
        toast.error("Erro ao salvar alteração.");
        // Reverte em caso de erro
        const revertSet = new Set(feriados);
        setFeriados(revertSet);
      }
    });
  };

  // Lógica de construção do calendário
  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = [];

  // Preenche os dias em branco do começo do mês
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    dias.push(null);
  }

  // Preenche os dias reais
  for (let i = 1; i <= diasNoMes; i++) {
    dias.push(i);
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-neutral-800 w-40">
            {MESES[mes]} {ano}
          </h2>
          <button
            onClick={hoje}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Hoje
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={mesAnterior}
            className="p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={proximoMes}
            className="p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="p-4 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
          </div>
        )}

        <div className="grid grid-cols-7 gap-2 mb-2">
          {DIAS_SEMANA.map((dia, index) => (
            <div
              key={dia}
              className={`text-center text-xs font-bold uppercase tracking-wider py-2 ${
                index === 0 || index === 6
                  ? "text-neutral-400"
                  : "text-neutral-600"
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dias.map((dia, index) => {
            if (dia === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-14 sm:h-20 rounded-lg bg-neutral-50/50 border border-neutral-100/50"
                />
              );
            }

            // Formata a data para a string YYYY-MM-DD (Garante 2 dígitos para mês e dia)
            const dataString = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

            // Verifica se é final de semana (0 = Domingo, 6 = Sábado)
            const diaSemana = new Date(ano, mes, dia).getDay();
            const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
            const isFeriado = feriados.has(dataString);

            // Verifica se é o dia de hoje real
            const isHoje =
              new Date().toISOString().split("T")[0] === dataString;

            return (
              <button
                key={dia}
                onClick={() => handleToggleFeriado(dataString, isFimDeSemana)}
                disabled={isPending && !isFimDeSemana}
                className={`
                  relative flex flex-col items-center justify-center h-14 sm:h-20 rounded-lg border transition-all
                  ${isFimDeSemana ? "bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-navy/40 hover:shadow-sm"}
                  ${isFeriado ? "bg-red-50 border-red-200 text-red-700 shadow-inner ring-1 ring-red-200" : !isFimDeSemana ? "bg-white border-neutral-200 text-neutral-700" : ""}
                  ${isHoje && !isFeriado ? "ring-2 ring-brand-navy border-brand-navy font-bold text-brand-navy bg-brand-navy/5" : ""}
                `}
              >
                <span
                  className={`text-lg sm:text-xl font-medium ${isFeriado ? "font-bold" : ""}`}
                >
                  {dia}
                </span>

                {isFeriado && (
                  <span className="absolute bottom-1.5 sm:bottom-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded text-red-600">
                    Feriado
                  </span>
                )}

                {isFimDeSemana && !isFeriado && (
                  <span className="absolute bottom-1.5 sm:bottom-2 text-[9px] sm:text-[10px] uppercase font-semibold text-neutral-400">
                    Fim de Sem.
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-neutral-50 border-t border-neutral-100 p-4 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
            <span>Feriado Marcado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neutral-100 border border-neutral-200"></div>
            <span>Fim de Semana (Padrão)</span>
          </div>
        </div>
        <span>As alterações são salvas automaticamente ao clicar.</span>
      </div>
    </div>
  );
}
