import { Metadata } from "next";
import FeriadosClient from "./FeriadosClient";

export const metadata: Metadata = {
  title: "Gerenciar Feriados | Admin",
};

export default function FeriadosPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Calendário de Feriados
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Clique nos dias para marcar ou desmarcar feriados. Estes dias serão
          ignorados no cálculo de SLA dos chamados.
        </p>
      </div>

      <FeriadosClient />
    </div>
  );
}
