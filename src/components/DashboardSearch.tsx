"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function DashboardSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamQ = searchParams?.get("q") || "";

  // Controla o valor digitado no input
  const [query, setQuery] = useState(searchParamQ);

  // Guarda o último valor da URL que vimos para saber quando ela muda externamente
  const [lastQueryParam, setLastQueryParam] = useState(searchParamQ);

  // Sincroniza o estado caso a URL mude externamente (ex: ao clicar em "Limpar Filtros")
  // Esta é a forma nativa recomendada pelo React em vez de usar useEffect
  if (searchParamQ !== lastQueryParam) {
    setQuery(searchParamQ);
    setLastQueryParam(searchParamQ);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    params.set("p", "1");
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full md:w-64">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-neutral-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar código ou título..."
        className="w-full pl-9 pr-3 py-2.5 md:py-2 bg-white border border-neutral-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-navy/20 transition-all shadow-sm"
      />
    </form>
  );
}
