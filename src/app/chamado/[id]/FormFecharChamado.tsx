/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { fecharChamado } from "@/app/actions/tickets";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FormFecharChamado({ chamado }: { chamado: any }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await fecharChamado(formData);
    } catch (_) {
      toast.error("Erro ao fechar o chamado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inner input typing
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        return;
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        const textarea = document.querySelector(
          'textarea[name="solucao"]',
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="mt-8 bg-neutral-50 /50 p-6 md:p-8 rounded-lg border border-neutral-200  transition-colors">
      <h3 className="text-xl font-bold text-neutral-900  mb-6 flex items-center gap-2 transition-colors">
        <CheckCircle2 className="w-6 h-6 text-brand-green" />
        Concluir Atendimento
      </h3>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="codigo" value={chamado.codigo} />

        {chamado.acoes && chamado.acoes.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-neutral-900  mb-3 transition-colors">
              Checklist de Ações (Marque o que foi feito)
            </label>
            <div className="space-y-3 bg-white  p-4 rounded-md border border-neutral-200  transition-colors">
              {chamado.acoes.map((ca: any) => (
                <label
                  key={ca.id}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    name={`acao_${ca.id}`}
                    className="mt-0.5 w-5 h-5 text-brand-green border-neutral-300 rounded focus:ring-brand-green focus:ring-2 cursor-pointer transition-colors"
                  />
                  <span className="text-sm font-medium text-neutral-700  group-hover:text-neutral-900  transition-colors">
                    {ca.acao.descricao}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-neutral-900  mb-2 transition-colors">
            Resumo da Solução
          </label>
          <textarea
            name="solucao"
            required
            rows={4}
            className="block w-full px-4 py-3 border border-neutral-300  rounded-md shadow-sm focus:ring-2 focus:ring-brand-green/20 outline-none   bg-white transition-colors"
            placeholder="Descreva o que foi realizado para solucionar o problema..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900  mb-2 transition-colors">
            Anexar Evidência (Opcional)
          </label>
          <input
            name="anexo"
            type="file"
            className="block w-full text-sm text-neutral-500  file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 border border-neutral-300  rounded-md p-2 bg-white  transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-neutral-200  flex justify-end transition-colors">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-green text-white rounded-md hover:bg-brand-green/90 font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all w-full md:w-auto min-w-[180px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finalizando...
              </>
            ) : (
              "Fechar Chamado"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
