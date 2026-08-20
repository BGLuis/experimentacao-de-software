import { useMemo, useState, useRef, useEffect } from 'react';
import { useData } from '../hooks/useData';

function MultiSelectDropdown({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500 bg-white min-w-[150px] text-left flex justify-between items-center"
      >
        <span className="truncate max-w-[120px] text-gray-700">
          {selected.length === 0 ? 'Todas' : `${selected.length} selecionadas`}
        </span>
        <span className="text-gray-400 text-xs ml-2">▼</span>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg flex flex-col">
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-md">
            <input
              type="text"
              placeholder="Buscar linguagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-auto custom-scrollbar">
            <label className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-b">
                <input 
                  type="checkbox" 
                  checked={selected.length === 0} 
                  onChange={() => onChange([])}
                  className="rounded border-gray-300"
                />
                Todas as Linguagens
            </label>
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">Nenhuma encontrada</div>
            ) : (
              filteredOptions.map(opt => (
                <label key={opt} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    checked={selected.includes(opt)} 
                    onChange={() => toggleOption(opt)}
                    className="rounded border-gray-300"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Filters() {
  const { data, filters, setFilters } = useData();

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    data.forEach(d => {
      if (d.linguagens) {
        d.linguagens.split(',').forEach(l => langs.add(l.trim()));
      }
    });
    return Array.from(langs).sort();
  }, [data]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(d => {
      if (d.criado_em) {
        const year = String(d.criado_em).substring(0, 4);
        if (year && !isNaN(Number(year))) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Descending
  }, [data]);

  if (data.length === 0) return null;

  const hasActiveFilters = filters.languages.length > 0 || filters.yearStart || filters.yearEnd || filters.repoType !== 'all';

  return (
    <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center flex-wrap">
      <div className="font-semibold text-gray-700 mr-2">Filtros:</div>
      
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Linguagens:</label>
        <MultiSelectDropdown 
          options={availableLanguages} 
          selected={filters.languages || []} 
          onChange={(langs) => setFilters({ ...filters, languages: langs })} 
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Ano de Criação:</label>
        <select
          value={filters.yearStart || ''}
          onChange={(e) => setFilters({ ...filters, yearStart: e.target.value })}
          className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Início</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span className="text-gray-400">até</span>
        <select
          value={filters.yearEnd || ''}
          onChange={(e) => setFilters({ ...filters, yearEnd: e.target.value })}
          className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Fim</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="repo-type" className="text-sm text-gray-600">Tipo:</label>
        <select
          id="repo-type"
          value={filters.repoType || 'all'}
          onChange={(e) => setFilters({ ...filters, repoType: e.target.value as any })}
          className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Repositórios</option>
          <option value="code_only">Apenas Código (Ocultar Docs/Listas)</option>
          <option value="docs_only">Apenas Documentação/Listas</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ languages: [], yearStart: '', yearEnd: '', repoType: 'all' })}
          className="text-sm text-blue-600 hover:text-blue-800 underline ml-auto mt-2 xl:mt-0"
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
