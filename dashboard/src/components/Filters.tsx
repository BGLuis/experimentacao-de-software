import { useMemo } from 'react';
import { useData } from '../hooks/useData';

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

  return (
    <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center">
      <div className="font-semibold text-gray-700 mr-2">Filtros:</div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="lang-filter" className="text-sm text-gray-600">Linguagem:</label>
        <select
          id="lang-filter"
          value={filters.language}
          onChange={(e) => setFilters({ ...filters, language: e.target.value })}
          className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500 max-w-[200px]"
        >
          <option value="">Todas</option>
          {availableLanguages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="year-filter" className="text-sm text-gray-600">Ano Criação:</label>
        <select
          id="year-filter"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="border border-gray-300 rounded-md p-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todos</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {(filters.language || filters.year) && (
        <button
          onClick={() => setFilters({ language: '', year: '' })}
          className="text-sm text-blue-600 hover:text-blue-800 underline ml-auto"
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
