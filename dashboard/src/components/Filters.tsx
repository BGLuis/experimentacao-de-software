import { useMemo, useState, useRef, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Filter, X, ChevronDown, Search } from 'lucide-react';

function MultiSelectDropdown({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-56 bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors flex justify-between items-center"
      >
        <span className="truncate">
          {selected.length === 0 ? 'Todas as Linguagens' : `${selected.length} selecionadas`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            <label className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Todas as Linguagens</span>
            </label>
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-slate-400 text-center">Nenhuma encontrada</div>
            ) : (
              filteredOptions.map(opt => (
                <label key={opt} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleOption(opt)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                  <span className="text-sm text-slate-600 truncate">{opt}</span>
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
  const { metadata, filters, setFilters } = useData();
  const availableLanguages = useMemo(() => metadata?.languages || [], [metadata]);
  const availableYears = useMemo(() => metadata?.years || [], [metadata]);
  const hasActiveFilters = (filters.languages && filters.languages.length > 0) || filters.yearStart || filters.yearEnd || filters.repoType !== 'all';

  if (!metadata && availableLanguages.length === 0) return null;

  return (
    <div className="bg-white p-5 md:p-6 mb-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Filter size={20} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg">Filtros de Análise</h3>
        
        {hasActiveFilters && (
          <button
            onClick={() => setFilters({ languages: [], yearStart: '', yearEnd: '', repoType: 'all' })}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <X size={16} />
            <span className="hidden sm:inline">Limpar filtros</span>
          </button>
        )}
      </div>
      
      <div className="flex flex-col xl:flex-row gap-5 xl:items-end">
        {/* Languages */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Linguagens Primárias</label>
          <MultiSelectDropdown options={availableLanguages} selected={filters.languages || []} onChange={(langs) => setFilters({ ...filters, languages: langs })} />
        </div>

        {/* Year Range */}
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Período de Criação</label>
          <div className="flex items-center gap-3">
            <select value={filters.yearStart || ''} onChange={(e) => setFilters({ ...filters, yearStart: e.target.value })} className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer">
              <option value="">Qualquer (Início)</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <span className="text-slate-300 font-medium">→</span>
            <select value={filters.yearEnd || ''} onChange={(e) => setFilters({ ...filters, yearEnd: e.target.value })} className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer">
              <option value="">Qualquer (Fim)</option>
              {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        {/* Type */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">Tipo de Projeto</label>
          <div className="relative">
            <select value={filters.repoType || 'all'} onChange={(e) => setFilters({ ...filters, repoType: e.target.value as any })} className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer">
              <option value="all">Todos os Repositórios</option>
              <option value="code_only">Projetos de Software (Código)</option>
              <option value="docs_only">Listas, Livros & Guias</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
