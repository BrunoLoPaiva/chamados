"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/actions/tickets";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Building2,
  Tag,
  Info,
  Paperclip,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

export default function NovoChamadoForm({
  departamentos,
  locais,
  usuarioLogado,
}: any) {
  const router = useRouter();
  const [localId, setLocalId] = useState("");
  const [subLocalId, setSubLocalId] = useState("");
  const [deptoId, setDeptoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPreventiva, setIsPreventiva] = useState(false);
  const [tipoId, setTipoId] = useState("");

  // ── LÓGICA DE LOCALIZAÇÃO ──
  const localSelecionado = locais.find((l: any) => l.id === Number(localId));
  const subLocais = localSelecionado?.children || [];
  const finalLocalValue = subLocais.length > 0 ? subLocalId : localId;

  // ── LÓGICA DE TIPOS (FILTRO DINÂMICO) ──
  const deptoSelecionado = departamentos.find(
    (d: any) => d.id === Number(deptoId),
  );

  const tiposDisponiveis = useMemo(() => {
    if (!deptoSelecionado) return [];

    const selectedLocalId = Number(localId) || null; // O Pai
    const selectedSubLocalId = Number(subLocalId) || null; // O Filho (se houver)

    return deptoSelecionado.deptoTipos
      .filter((dt: any) => {
        if (!dt.tipo.ativo) return false;

        // 1. O tipo foi cadastrado para QUALQUER local?
        if (!dt.localId) return true;

        // 2. O tipo foi cadastrado EXATAMENTE para este sub-local?
        if (dt.subLocalId && selectedSubLocalId) {
          return dt.subLocalId === selectedSubLocalId;
        }

        // 3. O tipo foi cadastrado para a Unidade inteira?
        // (Se sim, ele vale para o pai e para qualquer filho)
        if (dt.localId === selectedLocalId && !dt.subLocalId) {
          return true;
        }

        // Caso contrário, não exibe
        return false;
      })
      .map((dt: any) => dt.tipo);
  }, [deptoSelecionado, localId, subLocalId]);

  useEffect(() => {
    if (tipoId && !tiposDisponiveis.some((t: any) => String(t.id) === tipoId)) {
      setTipoId("");
    }
  }, [tiposDisponiveis, tipoId]);

  const pertenceAoDepto = usuarioLogado?.departamentos?.some(
    (d: any) => d.id === Number(deptoId),
  );

  async function handleSubmit(formData: FormData) {
    if (!finalLocalValue) {
      toast.error("Por favor, selecione a unidade ou o sub-local final.");
      return;
    }

    const anexoFile = formData.get("anexo") as File | null;
    if (anexoFile && anexoFile.size > 5 * 1024 * 1024) {
      toast.error("O arquivo anexado ultrapassa o limite de 5MB.");
      return;
    }

    setLoading(true);
    formData.append("isPreventiva", isPreventiva.toString());
    formData.set("localId", finalLocalValue);

    try {
      await createTicket(formData);
      toast.success(
        isPreventiva ? "Preventiva configurada!" : "Chamado aberto!",
      );
      router.push("/dashboard");
    } catch (_) {
      toast.error("Erro ao registrar chamado. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-10">
      {/* SEÇÃO 1: ONDE ESTÁ O PROBLEMA */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <MapPin className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Localização
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">
              Unidade Principal
            </label>
            <select
              value={localId}
              onChange={(e) => {
                setLocalId(e.target.value);
                setSubLocalId("");
              }}
              required
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
            >
              <option value="">Selecione...</option>
              {locais.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          {subLocais.length > 0 && (
            <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
              <label className="text-sm font-bold text-brand-navy flex items-center gap-1">
                <ChevronRight className="w-4 h-4" /> Sub-Local Específico
              </label>
              <select
                value={subLocalId}
                onChange={(e) => setSubLocalId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-brand-navy/30 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 outline-none transition-all"
              >
                <option value="">Onde exatamente?</option>
                {subLocais.map((sl: any) => (
                  <option key={sl.id} value={sl.id}>
                    ↳ {sl.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO 2: QUAL O PROBLEMA */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Building2 className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Classificação
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">
              Departamento Responsável
            </label>
            <select
              name="departamentoDestinoId"
              required
              value={deptoId}
              onChange={(e) => {
                setDeptoId(e.target.value);
                setIsPreventiva(false);
              }}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
            >
              <option value="">Para quem é esta demanda?</option>
              {departamentos.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">
              Tipo de Solicitação
            </label>
            <select
              name="tipoId"
              required
              disabled={!deptoId}
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all disabled:opacity-50"
            >
              <option value="">
                {deptoId
                  ? "Selecione o problema..."
                  : "Aguardando departamento..."}
              </option>
              {tiposDisponiveis.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.nome} (SLA: {t.tempoSlaHoras}h)
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: DETALHES */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Tag className="w-4 h-4 text-brand-navy" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Descrição
          </h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700">
              Título Resumido
            </label>
            <input
              name="titulo"
              type="text"
              required
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
              placeholder="Ex: Ar condicionado vazando água"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 font-sans">
              Relato Detalhado
            </label>
            <textarea
              name="descricao"
              rows={4}
              required
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all resize-none"
              placeholder="Descreva o que está acontecendo, se houve queda de energia ou outros detalhes..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Anexar Evidência (Foto/PDF)
            </label>
            <input
              name="anexo"
              type="file"
              accept="image/*,application/pdf"
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-navy file:text-white hover:file:bg-brand-navy/90 border-2 border-dashed border-neutral-300 rounded-xl p-6 bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors text-center"
            />
          </div>
        </div>
      </section>

      {/* ÁREA DE PREVENTIVAS (DINÂMICA) */}
      {pertenceAoDepto && (
        <section className="animate-in zoom-in-95 duration-300">
          <div
            className={`p-6 border rounded-xl transition-all ${isPreventiva ? "border-brand-green bg-brand-green/5 ring-4 ring-brand-green/5" : "border-neutral-200 bg-neutral-50"}`}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPreventiva}
                onChange={(e) => setIsPreventiva(e.target.checked)}
                className="w-6 h-6 text-brand-green border-neutral-300 rounded-md focus:ring-brand-green focus:ring-offset-0 transition-all cursor-pointer"
              />
              <div>
                <span
                  className={`text-sm font-black uppercase tracking-tight ${isPreventiva ? "text-brand-green" : "text-neutral-500"}`}
                >
                  Gerar como Manutenção Preventiva
                </span>
                <p className="text-xs text-neutral-400">
                  Esta tarefa será repetida automaticamente conforme a
                  frequência.
                </p>
              </div>
            </label>

            {isPreventiva && (
              <div className="mt-6 pt-6 border-t border-brand-green/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-green flex items-center gap-1">
                    <CalendarClock className="w-4 h-4" /> Intervalo (Dias)
                  </label>
                  <input
                    name="frequenciaDias"
                    type="number"
                    min="1"
                    required={isPreventiva}
                    className="w-full px-4 py-3 border-2 border-brand-green/30 rounded-lg text-sm outline-none focus:border-brand-green bg-white transition-all"
                    placeholder="Ex: 30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-green flex items-center gap-1">
                    <Info className="w-4 h-4" /> Técnico Responsável
                  </label>
                  <select
                    name="tecnicoId"
                    required={isPreventiva}
                    className="w-full px-4 py-3 border-2 border-brand-green/30 rounded-lg text-sm outline-none focus:border-brand-green bg-white appearance-none transition-all"
                  >
                    <option value="">Selecione o responsável...</option>
                    {deptoSelecionado?.usuarios.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* AÇÕES FINAIS */}
      <div className="pt-8 border-t border-neutral-200 flex flex-col-reverse sm:flex-row justify-end gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all text-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-10 py-3 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 font-black shadow-lg shadow-brand-navy/20 flex items-center justify-center gap-2 disabled:opacity-70 transition-all min-w-[160px]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Registrar Chamado"
          )}
        </button>
      </div>
    </form>
  );
}
