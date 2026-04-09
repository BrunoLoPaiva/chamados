// src/app/admin/feriados/FeriadosClient.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCcw } from "lucide-react";
import {
  getFeriados,
  toggleFeriado,
  recalcularSLAsGlobais,
} from "@/app/actions/feriados";
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
  const [isRecalculando, setIsRecalculando] = useState(false);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

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

  const mesAnterior = () => setDataAtual(new Date(ano, mes - 1, 1));
  const proximoMes = () => setDataAtual(new Date(ano, mes + 1, 1));
  const hoje = () => setDataAtual(new Date());

  const handleToggleFeriado = (dataString: string, isFimDeSemana: boolean) => {
    if (isFimDeSemana) {
      toast.info("Finais de semana já são desconsiderados automaticamente.");
      return;
    }

    const novoSet = new Set(feriados);
    const estavaMarcado = novoSet.has(dataString);
    if (estavaMarcado) novoSet.delete(dataString);
    else novoSet.add(dataString);
    setFeriados(novoSet);

    startTransition(async () => {
      try {
        await toggleFeriado(dataString);
        toast.success(
          estavaMarcado ? "Feriado removido!" : "Feriado adicionado!",
        );
      } catch (error) {
        toast.error("Erro ao salvar alteração.");
        setFeriados(new Set(feriados)); // reverte
      }
    });
  };

  const handleRecalcularSLAs = async () => {
    if (
      !confirm(
        "Isso irá recalcular o vencimento de TODOS os chamados abertos atualmente usando a regra de feriados e fins de semana. Deseja continuar?",
      )
    )
      return;

    setIsRecalculando(true);
    try {
      const res = await recalcularSLAsGlobais();
      toast.success(`Pronto! ${res.count} chamados tiveram o SLA recalculado.`);
    } catch (error) {
      toast.error("Erro ao recalcular os SLAs.");
    } finally {
      setIsRecalculando(false);
    }
  };

  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = Array(primeiroDiaDoMes)
    .fill(null)
    .concat(Array.from({ length: diasNoMes }, (_, i) => i + 1));

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header do Calendário */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50/50 gap-4">
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={handleRecalcularSLAs}
            disabled={isRecalculando || isPending}
            className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
            title="Recalcular prazos de chamados abertos"
          >
            {isRecalculando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            Recalcular SLAs
          </button>

          <div className="flex items-center gap-1 border-l border-neutral-200 pl-3">
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
              className={`text-center text-xs font-bold uppercase tracking-wider py-2 ${index === 0 || index === 6 ? "text-neutral-400" : "text-neutral-600"}`}
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dias.map((dia, index) => {
            if (dia === null)
              return (
                <div
                  key={`empty-${index}`}
                  className="h-14 sm:h-20 rounded-lg bg-neutral-50/50 border border-neutral-100/50"
                />
              );

            const dataString = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const diaSemana = new Date(ano, mes, dia).getDay();
            const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
            const isFeriado = feriados.has(dataString);
            const isHoje =
              new Date().toISOString().split("T")[0] === dataString;

            return (
              <button
                key={dia}
                onClick={() => handleToggleFeriado(dataString, isFimDeSemana)}
                disabled={(isPending && !isFimDeSemana) || isRecalculando}
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

      <div className="bg-neutral-50 border-t border-neutral-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-neutral-500 gap-2">
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
        <span>As alterações salvam ao clicar.</span>
      </div>
    </div>
  );
}
