/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/actions/tickets";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

  // Mapeia o Local selecionado para extrair a lista de filhas (children) caso existam
  const localSelecionado = locais.find((l: any) => l.id === Number(localId));
  const subLocais = localSelecionado?.children || [];

  // Se não tem subLocais, o valor final pro banco é o localId principal.
  // Se tem subLocais, o valor final só é válido se a pessoa escolher o subLocal.
  const finalLocalValue = subLocais.length > 0 ? subLocalId : localId;

  // Mapeia o departamento selecionado
  const deptoSelecionado = departamentos.find(
    (d: any) => d.id === Number(deptoId),
  );

  // Como usamos a tabela intermediária DeptoTipo, mapeamos os tipos disponíveis
  // filtrando por local/sublocal selecionado:
  //   - dt.localId null = aparece em qualquer local
  //   - dt.localId preenchido = só aparece quando o local pai bate
  //   - dt.subLocalId preenchido = só aparece quando o sublocal exato está selecionado
  const effectiveLocalId = Number(subLocalId || localId) || null;
  const parentLocalId = Number(localId) || null;

  const tiposDisponiveis = deptoSelecionado
    ? deptoSelecionado.deptoTipos
        .filter((dt: any) => {
          if (!dt.tipo.ativo) return false;
          if (!dt.localId) return true; // sem restrição de local
          if (dt.subLocalId) {
            // Só aparece se o sublocal exato está selecionado
            return dt.subLocalId === effectiveLocalId;
          }
          // Aparece se o local pai bate (independente de sublocal estar ou não selecionado)
          return dt.localId === parentLocalId || dt.localId === effectiveLocalId;
        })
        .map((dt: any) => dt.tipo)
    : [];

  // Regra de Negócio: O usuário logado pertence a este departamento?
  const pertenceAoDepto = usuarioLogado?.departamentos?.some(
    (d: any) => d.id === Number(deptoId),
  );

  async function handleSubmit(formData: FormData) {
    if (!finalLocalValue) {
      toast.error("Por favor, selecione a unidade ou o sub-local final.");
      return;
    }

    setLoading(true);
    formData.append("isPreventiva", isPreventiva.toString());
    // Injetamos o local exato selecionado sobrepondo nomes normais do form
    formData.set("localId", finalLocalValue);

    try {
      await createTicket(formData);
      toast.success(isPreventiva ? "Preventiva criada com sucesso!" : "Chamado criado com sucesso!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar chamado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Filtrando para mostrar na primeira combobox APENAS Locais PAI/Roots (que não recebem sub-localização como seu superior)
  const locaisRoots = locais.filter((l: any) => !l.parentId);

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Local / Categoria
          </label>
          <select
            value={localId}
            onChange={(e) => {
              setLocalId(e.target.value);
              setSubLocalId(""); // reseta o filho se trocar o pai
            }}
            required
            className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-50 appearance-none transition-colors"
          >
            <option value="">Selecione a unidade principal...</option>
            {locaisRoots.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>

          {/* Segunda combobox caso o local pai exija sub-locais ex: (Praça pedágio -> P1) */}
          {subLocais.length > 0 && (
            <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
               <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                 Sub-Local Especifico <span className="text-red-500">*</span>
               </label>
               <select
                 value={subLocalId}
                 onChange={(e) => setSubLocalId(e.target.value)}
                 required
                 className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-white appearance-none transition-colors ring-1 ring-blue-500/50"
               >
                 <option value="">Selecione a parte interior/unidade...</option>
                 {subLocais.map((sl: any) => (
                   <option key={sl.id} value={sl.id}>
                     ↳ {sl.nome}
                   </option>
                 ))}
               </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Departamento de Destino
          </label>
          <select
            name="departamentoDestinoId"
            required
            value={deptoId}
            onChange={(e) => {
              setDeptoId(e.target.value);
              setIsPreventiva(false); // Reseta a preventiva se mudar de departamento
            }}
            className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-50 appearance-none transition-colors"
          >
            <option value="">Selecione a área...</option>
            {departamentos.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Tipo de Solicitação
        </label>
        <select
          name="tipoId"
          required
          disabled={!deptoId}
          className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-50 appearance-none disabled:opacity-50 transition-colors"
        >
          <option value="">
            {deptoId
              ? "Selecione o problema..."
              : "Escolha um departamento primeiro"}
          </option>
          {tiposDisponiveis.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.nome} (SLA: {t.tempoSlaHoras}h)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Título do Problema
        </label>
        <input
          name="titulo"
          type="text"
          required
          className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-50 transition-colors"
          placeholder="Ex: Impressora sem conexão na recepção"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Descrição Detalhada
        </label>
        <textarea
          name="descricao"
          rows={4}
          required
          className="block w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:text-neutral-100 bg-neutral-50 transition-colors"
          placeholder="Descreva os detalhes e contexto..."
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Anexar Arquivo (Opcional)
        </label>
        <input
          name="anexo"
          type="file"
          className="block w-full text-sm text-neutral-500 dark:text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 border border-neutral-300 dark:border-neutral-700 rounded-md p-2 bg-neutral-50 dark:bg-neutral-900 transition-colors file:transition-colors"
        />
      </div>

      {/* ÁREA EXCLUSIVA DE PREVENTIVAS */}
      {pertenceAoDepto && (
        <div className="p-5 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg transition-colors">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isPreventiva}
              onChange={(e) => setIsPreventiva(e.target.checked)}
              className="w-5 h-5 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-neutral-900 focus:ring-2 dark:bg-neutral-800 dark:border-neutral-600 transition-colors"
            />
            <span className="font-bold text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              Transformar em Preventiva (Gerar recorrentemente)
            </span>
          </label>

          {isPreventiva && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
                  Frequência (Em dias)
                </label>
                <input
                  name="frequenciaDias"
                  type="number"
                  min="1"
                  required={isPreventiva}
                  className="block w-full px-4 py-3 border border-emerald-200 dark:border-emerald-800/50 rounded-md shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-neutral-900 dark:text-neutral-100 bg-white transition-colors"
                  placeholder="Ex: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-2">
                  Técnico Padrão Responsável
                </label>
                <select
                  name="tecnicoId"
                  required={isPreventiva}
                  className="block w-full px-4 py-3 border border-emerald-200 dark:border-emerald-800/50 rounded-md shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:bg-neutral-900 dark:text-neutral-100 bg-white appearance-none transition-colors"
                >
                  <option value="">Atribuir para...</option>
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
      )}

      <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 rounded-md font-semibold transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold shadow-sm flex items-center gap-2 disabled:opacity-70 transition-all font-sans"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Processando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
