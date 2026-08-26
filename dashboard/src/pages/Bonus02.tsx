import { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus02() {
  const { runQuery, buildWhereClause, loading: contextLoading, downloadProgress, datasetMode } = useData();
  const [loading, setLoading] = useState(true);
  const [aiStats, setAiStats] = useState({
    totalAi: 0,
    yearChart: [] as { year: string; count: number }[],
    aiMarkdownRecent: [] as any[],
    topLangs: [] as { lang: string; stars: number }[]
  });

  useEffect(() => {
    let active = true;
    if (contextLoading) return;

    async function loadAiStats() {
      setLoading(true);
      try {
        const where = buildWhereClause();
        const aiCondition = "regexp_matches(lower(coalesce(tags,'')), '(\\b|^)(ai|ml|llm|gpt|machine learning|artificial intelligence)(\\b|$)')";

        // 1. By Year & Total
        const yearSql = `
          SELECT 
            substring(CAST(criado_em AS VARCHAR), 1, 4) as year,
            count(*) as count
          FROM repos
          ${where ? `${where} AND ${aiCondition}` : `WHERE ${aiCondition}`}
            AND substring(CAST(criado_em AS VARCHAR), 1, 4) != ''
          GROUP BY year
          ORDER BY year ASC
        `;
        const yearRes = await runQuery<{ year: string; count: number }>(yearSql);
        const totalAi = yearRes.reduce((acc, curr) => acc + (curr.count || 0), 0);

        // 2. Top AI Languages since 2024
        const topLangsSql = `
          SELECT 
            coalesce(nullif(trim(string_split(coalesce(linguagens, ''), ',')[1]), ''), 'Nenhuma') as lang,
            sum(estrelas) as stars
          FROM repos
          ${where ? `${where} AND ${aiCondition}` : `WHERE ${aiCondition}`}
            AND substring(CAST(criado_em AS VARCHAR), 1, 4) >= '2024'
          GROUP BY lang
          ORDER BY stars DESC
          LIMIT 5
        `;
        const topLangsRes = await runQuery<{ lang: string; stars: number }>(topLangsSql);

        // 3. Recent AI Markdown repos
        const markdownSql = `
          SELECT repositorio, descricao, estrelas, linguagens
          FROM repos
          ${where ? `${where} AND ${aiCondition}` : `WHERE ${aiCondition}`}
            AND substring(CAST(criado_em AS VARCHAR), 1, 4) >= '2023'
            AND lower(coalesce(linguagens, '')) LIKE '%markdown%'
          ORDER BY estrelas DESC
          LIMIT 5
        `;
        const markdownRes = await runQuery(markdownSql);

        if (active) {
          setAiStats({
            totalAi,
            yearChart: yearRes.slice(-6),
            topLangs: topLangsRes,
            aiMarkdownRecent: markdownRes
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em Bonus02:", err);
        if (active) setLoading(false);
      }
    }

    loadAiStats();

    return () => { active = false; };
  }, [contextLoading, buildWhereClause, runQuery, datasetMode]);

  if (contextLoading || loading) {
    return (
      <Spinner 
        message={downloadProgress.message || "Processando dados de Inteligência Artificial..."} 
        progress={downloadProgress.percentage}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 02: O Fenômeno IA</h2>
        <p className="text-gray-600">A explosão de repositórios de Inteligência Artificial desde 2022</p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-blue-800 font-medium">Total de Repositórios Focados em IA identificados: {aiStats.totalAi.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-indigo-800">1. Crescimento (Últimos Anos)</h3>
          <ul className="space-y-2">
            {aiStats.yearChart.map(y => (
              <li key={y.year} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span className="font-medium text-gray-700">{y.year}</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-bold">{y.count.toLocaleString()} repos</span>
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

