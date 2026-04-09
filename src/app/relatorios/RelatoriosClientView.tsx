"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3, Clock, CheckCircle2, AlertTriangle,
  LayoutDashboard, Users, TableProperties
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import ExportCSVButton from "@/components/ExportCSVButton";

const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

interface RelatoriosViewProps {
  kpis: { total: number; resolvidosPerc: number; abertos: number; fechados: number; tmaHoras: string; slaPerc: number; };
  charts: { tecnicos: any[]; locais: any[]; solicitantes: any[]; tipos: any[]; };
  chamados: any[];
  exportData: any[];
  mesAtualNome: string;
}

export default function RelatoriosClientView({ kpis, charts, chamados, exportData, mesAtualNome }: RelatoriosViewProps) {
  const [activeTab, setActiveTab] = useState<"geral" | "equipe" | "dados">("geral");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 p-3 rounded-lg shadow-xl shadow-black/5">
          <p className="text-sm font-bold text-neutral-800 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].fill }} />
            <p className="text-sm text-neutral-600 font-medium">Chamados: <span className="font-bold text-neutral-900">{payload[0].value}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      
      {/* --- NAVEGAÇÃO POR ABAS (TABS) --- */}
      <div className="flex overflow-x-auto border-b border-neutral-200 mb-6 custom-scrollbar">
        <button
          onClick={() => setActiveTab("geral")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "geral" ? "border-brand-navy text-brand-navy" : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Visão Geral
        </button>
        <button
          onClick={() => setActiveTab("equipe")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "equipe" ? "border-brand-navy text-brand-navy" : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
          }`}
        >
          <Users className="w-4 h-4" /> Equipe & Solicitantes
        </button>
        <button
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === "dados" ? "border-brand-navy text-brand-navy" : "border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300"
          }`}
        >
          <TableProperties className="w-4 h-4" /> Base de Dados
        </button>
      </div>

      {/* --- ABA 1: VISÃO GERAL --- */}
      {activeTab === "geral" && (
        <div className="animate-in fade-in duration-300">
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-5 md:p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-brand-navy/10 text-brand-navy rounded-md"><BarChart3 className="w-5 h-5 md:w-6 md:h-6" /></div>
              </div>
              <div>
                <h3 className="text-neutral-500 text-xs md:text-sm font-medium">Total de Chamados</h3>
                <p className="text-2xl md:text-3xl font-bold text-neutral-900 mt-1">{kpis.total}</p>
                <p className="text-[10px] md:text-xs text-neutral-400 mt-1">{kpis.abertos} pendentes / {kpis.fechados} concluídos</p>
              </div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-brand-green/10 text-brand-green rounded-md"><CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /></div>
              </div>
              <div>
                <h3 className="text-neutral-500 text-xs md:text-sm font-medium">Resolvidos</h3>
                <p className="text-2xl md:text-3xl font-bold text-neutral-900 mt-1">{kpis.resolvidosPerc}%</p>
                <p className="text-[10px] md:text-xs text-neutral-400 mt-1">Taxa de resolução no período</p>
              </div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-brand-yellow/10 text-brand-yellow rounded-md"><Clock className="w-5 h-5 md:w-6 md:h-6" /></div>
              </div>
              <div>
                <h3 className="text-neutral-500 text-xs md:text-sm font-medium">Tempo Médio (TMA)</h3>
                <p className="text-2xl md:text-3xl font-bold text-neutral-900 mt-1">{kpis.tmaHoras}h</p>
                <p className="text-[10px] md:text-xs text-neutral-400 mt-1">Abertura até a solução</p>
              </div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-md ${kpis.slaPerc >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-neutral-500 text-xs md:text-sm font-medium">SLA no Prazo</h3>
                <p className="text-2xl md:text-3xl font-bold text-neutral-900 mt-1">{kpis.slaPerc}%</p>
                <p className="text-[10px] md:text-xs text-neutral-400 mt-1">Atendimentos dentro do prazo</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm lg:col-span-1 flex flex-col">
              <div className="mb-2">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Por Categoria</h3>
              </div>
              <div className="h-56 w-full flex items-center justify-center">
                {charts.tipos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={charts.tipos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                        {charts.tipos.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (<div className="text-sm text-neutral-400 border-2 border-dashed border-neutral-100 rounded-lg w-full h-full flex items-center justify-center">Sem dados</div>)}
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-auto pt-4 border-t border-neutral-100">
                {charts.tipos.map((tipo, i) => (
                  <div key={tipo.name} className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="truncate max-w-[110px]">{tipo.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm lg:col-span-2 flex flex-col">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Top Locais e Sub-locais</h3>
              </div>
              <div className="h-64 w-full mt-auto">
                {charts.locais.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.locais} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#404040', fontWeight: 500 }} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={48}>
                        {charts.locais.map((e, i) => <Cell key={`cell-${i}`} fill={i === 0 ? "#1e293b" : "#3b82f6"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="text-sm text-neutral-400 border-2 border-dashed border-neutral-100 rounded-lg w-full h-full flex items-center justify-center">Sem dados</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ABA 2: EQUIPE & SOLICITANTES --- */}
      {activeTab === "equipe" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Top Técnicos (Soluções)</h3>
            </div>
            <div className="h-[350px] w-full mt-auto">
              {charts.tecnicos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.tecnicos} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12, fill: '#404040', fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (<div className="text-sm text-neutral-400 border-2 border-dashed border-neutral-100 rounded-lg w-full h-full flex items-center justify-center">Sem dados</div>)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Top Solicitantes (Aberturas)</h3>
            </div>
            <div className="h-[350px] w-full mt-auto">
              {charts.solicitantes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.solicitantes} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12, fill: '#404040', fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (<div className="text-sm text-neutral-400 border-2 border-dashed border-neutral-100 rounded-lg w-full h-full flex items-center justify-center">Sem dados</div>)}
            </div>
          </div>
        </div>
      )}

      {/* --- ABA 3: BASE DE DADOS --- */}
      {activeTab === "dados" && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Listagem de Registos</h2>
              <p className="text-xs text-neutral-500 mt-1">Dados brutos do período selecionado</p>
            </div>
            <ExportCSVButton data={exportData} mes={mesAtualNome} />
          </div>

          <div className="overflow-x-auto border rounded-lg border-neutral-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Abertura</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Técnico</th>
                  <th className="px-4 py-3 font-semibold">TMA</th>
                  <th className="px-4 py-3 font-semibold">Prioridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {chamados.slice(0, 50).map((c) => {
                  const resolucao = c.dataAtendimento ? (new Date(c.dataAtendimento).getTime() - new Date(c.dataCriacao).getTime()) / (1000 * 60 * 60) : null;
                  const violouSla = c.dataVencimento && c.dataAtendimento ? new Date(c.dataAtendimento) > new Date(c.dataVencimento) : false;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 font-mono text-brand-navy font-bold group-hover:underline">#{c.codigo}</Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === "FECHADO" ? "bg-neutral-100 text-neutral-600" : "bg-blue-50 text-blue-600"}`}>
                            {c.status.replace("_", " ")}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0 text-neutral-700">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 whitespace-nowrap">
                          {format(new Date(c.dataCriacao), "dd MMM, HH:mm", { locale: ptBR })}
                        </Link>
                      </td>
                      <td className="p-0 text-neutral-700 max-w-[150px]" title={c.usuarioCriacao?.nome}>
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 truncate">{c.usuarioCriacao?.nome || "Sistema"}</Link>
                      </td>
                      <td className="p-0 text-neutral-700 max-w-[150px]">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 truncate">{c.tecnico?.nome || "-"}</Link>
                      </td>
                      <td className="p-0 text-neutral-700">
                        <Link href={`/chamado/${c.codigo}`} className="block px-4 py-3 font-mono">
                          {resolucao !== null ? `${resolucao.toFixed(1)}h` : <span className="text-neutral-400">-</span>}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/chamado/${c.codigo}`} className="flex items-center gap-2 px-4 py-3">
                          <span className="text-xs uppercase font-bold text-neutral-600">{c.tipo?.prioridade || "Média"}</span>
                          {c.status === "FECHADO" && c.dataVencimento && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${violouSla ? "bg-red-500" : "bg-emerald-500"}`} title={violouSla ? "Violou SLA" : "No Prazo"}></span>
                          )}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {chamados.length === 0 && <div className="text-center py-12 text-neutral-500">Nenhum chamado no período.</div>}
            {chamados.length > 50 && <div className="text-center py-4 bg-neutral-50 text-xs text-neutral-500">Exibindo os últimos 50 registros. Exporte para CSV para ver todos.</div>}
          </div>
        </div>
      )}
    </div>
  );
}