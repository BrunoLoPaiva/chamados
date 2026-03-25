"use client";


interface LocalItem {
  id: number;
  nome: string;
  children: { id: number; nome: string }[];
}

interface Props {
  departamentos: { id: number; nome: string }[];
  locais: LocalItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAction: any;
}

export default function TipoFormClient({
  departamentos,
  locais,
  createAction,
}: Props) {
  // Utiliza lists independentes nas checkboxes, não dependendo mais de estado local.

  return (
    <form
      action={createAction}
      className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 transition-colors space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Nome do Problema/Tipo
            </label>
            <input
              type="text"
              name="nome"
              required
              placeholder="Ex: Impressora Offline"
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Prioridade & SLA
            </label>
            <div className="flex gap-2">
              <select
                name="prioridade"
                required
                className="w-1/2 px-2 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
              >
                <option value="Baixa">Baixa</option>
                <option value="Media">Média</option>
                <option value="Alta">Alta</option>
              </select>
              <div className="relative w-1/2">
                <input
                  type="number"
                  name="tempoSlaHoras"
                  defaultValue={24}
                  min={1}
                  required
                  className="w-full pl-2 pr-8 py-2 bg-white border border-neutral-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-colors"
                  title="SLA em horas"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                  h
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Departamentos Responsáveis
            </label>
            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-neutral-300 rounded-md p-2 bg-white space-y-1">
              {departamentos.map((d) => (
                <label key={d.id} className="flex items-center gap-2 p-1.5 hover:bg-neutral-50 rounded cursor-pointer transition-colors">
                  <input type="checkbox" name="departamentos" value={d.id} className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer" />
                  <span className="text-sm font-medium text-neutral-700">{d.nome}</span>
                </label>
              ))}
              {departamentos.length === 0 && (
                <p className="text-xs text-neutral-400 italic p-1">Nenhum departamento cadastrado</p>
              )}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Selecione 1 ou mais departamentos que receberão os chamados deste tipo.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Locais e Sub-Locais <span className="text-neutral-400 normal-case font-normal">(Opcional)</span>
          </label>
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar border border-neutral-300 rounded-md p-3 bg-white shadow-inner">
            {locais.map((l) => (
              <div key={l.id} className="mb-3 last:mb-0">
                <label className="flex items-center gap-2 p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded cursor-pointer border border-neutral-200 mb-1 transition-colors">
                  <input type="checkbox" name="locais" value={l.id} className="w-4 h-4 rounded border-neutral-300 accent-brand-navy cursor-pointer" />
                  <span className="text-sm font-bold text-neutral-800">{l.nome}</span>
                </label>
                {l.children && l.children.length > 0 && (
                  <div className="pl-6 space-y-1 mt-1 border-l-2 border-neutral-100 ml-2">
                    {l.children.map((sl) => (
                      <label key={sl.id} className="flex items-center gap-2 p-1 hover:bg-neutral-50 rounded cursor-pointer transition-colors">
                        <input type="checkbox" name="sublocais" value={`${l.id}_${sl.id}`} className="w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-500 cursor-pointer" />
                        <span className="text-sm text-neutral-600 truncate">{sl.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {locais.length === 0 && (
              <p className="text-xs text-neutral-400 italic p-1">Nenhum local cadastrado</p>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 leading-tight">Marque locais específicos onde este problema pode ocorrer. Se deixar tudo em branco, valerá para qualquer localidade.</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 mt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-brand-navy text-white font-bold rounded-md hover:bg-brand-navy/90 shadow-sm transition-colors text-sm"
        >
          Adicionar Novo Tipo
        </button>
      </div>
    </form>
  );
}
