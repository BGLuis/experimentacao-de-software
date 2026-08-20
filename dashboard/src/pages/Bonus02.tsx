import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus02() {
  const { data, loading } = useData();

  const aiStats = useMemo(() => {
    let totalAi = 0;
    const aiByYear: Record<string, number> = {};
    const aiMarkdownRecent: any[] = [];
    const aiLangs: Record<string, number> = {};

    data.forEach(d => {
      const isAi = d.tags && String(d.tags).toLowerCase().match(/\b(ai|ml|llm|gpt|machine learning|artificial intelligence)\b/);
      
      if (isAi) {
        totalAi++;
        
        // By year
        if (d.criado_em) {
          const year = String(d.criado_em).substring(0, 4);
          if (year && !isNaN(Number(year))) {
            aiByYear[year] = (aiByYear[year] || 0) + 1;
            
            // Markdown recent (>= 2023)
            if (Number(year) >= 2023 && d.linguagens && d.linguagens.toLowerCase().includes('markdown')) {
              aiMarkdownRecent.push(d);
            }

            // Top Langs recent (>= 2024)
            if (Number(year) >= 2024) {
               const primaryLang = d.linguagens ? d.linguagens.split(',')[0].trim() : 'Nenhuma';
               aiLangs[primaryLang] = (aiLangs[primaryLang] || 0) + (d.estrelas || 0);
            }
          }
        }
      }
    });

    const yearsSorted = Object.keys(aiByYear).sort();
    const yearChart = yearsSorted.slice(-6).map(y => ({ year: y, count: aiByYear[y] }));

    aiMarkdownRecent.sort((a, b) => (b.estrelas || 0) - (a.estrelas || 0));

    const topLangs = Object.entries(aiLangs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, stars]) => ({ lang, stars }));

    return { totalAi, yearChart, aiMarkdownRecent: aiMarkdownRecent.slice(0, 5), topLangs };
  }, [data]);

  if (loading) return <Spinner message="Processando dados de Inteligência Artificial..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 02: O Fenômeno IA</h2>
        <p className="text-gray-600">A explosão de repositórios de Inteligência Artificial desde 2022</p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-blue-800 font-medium">Total de Repositórios Focados em IA identificados: {aiStats.totalAi}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-indigo-800">1. Crescimento (Últimos Anos)</h3>
          <ul className="space-y-2">
            {aiStats.yearChart.map(y => (
              <li key={y.year} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="font-medium text-gray-700">{y.year}</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-bold">{y.count} repos</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-emerald-800">2. Top 5 Linguagens IA (Desde 2024)</h3>
          <p className="text-xs text-gray-500 mb-3">Soma de estrelas de repos criados em 2024 ou depois.</p>
          <ul className="space-y-2">
            {aiStats.topLangs.map((l, idx) => (
              <li key={idx} className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-800">{l.lang}</span>
                <span className="text-gray-600">{new Intl.NumberFormat('pt-BR').format(l.stars)} ⭐ totais</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-rose-800">3. A Hipótese do Markdown</h3>
          <p className="text-sm text-gray-600 mb-4">
            Repositórios recentes de IA que usam primariamente <strong>Markdown</strong>. Muitos são listas "Awesome" curadas ou "Agent Skills" para guiar LLMs.
          </p>
          <div className="space-y-3">
            {aiStats.aiMarkdownRecent.map((repo: any, idx: number) => (
              <div key={idx} className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-rose-900">{repo.repositorio}</span>
                  <span className="text-sm bg-white px-2 py-0.5 rounded shadow-sm font-medium">{new Intl.NumberFormat('pt-BR').format(repo.estrelas)} ⭐</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{repo.descricao || "Sem descrição"}</p>
                <div className="text-xs text-rose-700 mt-2 font-medium">Linguagens: {repo.linguagens}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
