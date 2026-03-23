"use client";

import { FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";

interface ChamadoExport {
  codigo: string;
  status: string;
  dataCriacao: Date;
  usuarioCriacao: string;
  tecnico: string;
  departamento: string;
  tipo: string;
  prioridade: string;
  dataAtendimento: Date | null;
  dataVencimento: Date | null;
}

export default function ExportCSVButton({ data, mes }: { data: ChamadoExport[], mes: string }) {
  const downloadCSV = () => {
    // Cabeçalho CSV
    const headers = [
      "Codigo", "Status", "Data_Criacao", "Solicitante", "Tecnico", 
      "Departamento", "Tipo", "Prioridade", "Data_Solucao", "Prazo_SLA", "TMA_Horas", "Violou_SLA"
    ];

    const rows = data.map(c => {
      const isResolvido = !!c.dataAtendimento;
      const tma = isResolvido ? ((c.dataAtendimento!.getTime() - c.dataCriacao.getTime()) / (1000 * 60 * 60)).toFixed(2) : "";
      const violouSla = c.dataVencimento && c.dataAtendimento ? c.dataAtendimento > c.dataVencimento : false;

      return [
        c.codigo,
        c.status,
        format(c.dataCriacao, "dd/MM/yyyy HH:mm"),
        `"${c.usuarioCriacao}"`,
        `"${c.tecnico}"`,
        `"${c.departamento}"`,
        `"${c.tipo}"`,
        c.prioridade,
        isResolvido ? format(c.dataAtendimento!, "dd/MM/yyyy HH:mm") : "",
        c.dataVencimento ? format(c.dataVencimento, "dd/MM/yyyy HH:mm") : "",
        tma.replace(".", ","),
        isResolvido ? (violouSla ? "SIM" : "NAO") : ""
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n"); // uFEFF is for UTF-8 BOM (Excel compat)
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Relatorio_Chamados_${mes.replace(" ", "_").toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={downloadCSV}
      disabled={data.length === 0}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FileSpreadsheet className="w-4 h-4" />
      Exportar CSV
    </button>
  );
}
