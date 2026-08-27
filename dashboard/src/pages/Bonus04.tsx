import { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus04() {
  const { runQuery, buildWhereClause, loading: contextLoading, isDbReady, downloadProgress, datasetMode } = useData();
  const [loading, setLoading] = useState(true);
  const [tagStats, setTagStats] = useState({
    topAvg: [] as any[],
    topTotal: [] as any[],
    topCombos: [] as any[]
  });

  useEffect(() => {
    let active = true;
    if (contextLoading || !isDbReady) return;

    async function loadTagStats() {
      setLoading(true);
      try {
        const where = buildWhereClause();

        // 1. Tag aggregations (Avg and Total Stars)
        const tagsSql = `
          SELECT 
            trim(t) as tag,
            count(*) as count,
            sum(estrelas) as totalStars,
            round(avg(estrelas)) as avgStars
          FROM (
            SELECT estrelas, unnest(string_split(coalesce(tags, ''), ',')) as t 
            FROM repos 
            ${where}
          )
          WHERE trim(t) != ''
          GROUP BY tag
          HAVING count >= 20
        `;
        const tagsRes = await runQuery<{
          tag: string;
          count: number;
          totalStars: number;
          avgStars: number;
        }>(tagsSql);

        // 2. Language + Tag Combos
        const combosSql = `
          SELECT 
            concat(coalesce(nullif(trim(string_split(coalesce(linguagens, ''), ',')[1]), ''), 'Nenhuma'), ' + ', trim(t)) as combo,
            count(*) as count,
            round(avg(estrelas)) as avgStars
          FROM (
            SELECT linguagens, estrelas, unnest(string_split(coalesce(tags, ''), ',')) as t 
            FROM repos 
            ${where}
          )
          WHERE trim(t) != ''
          GROUP BY combo
          HAVING count >= 15
          ORDER BY avgStars DESC
          LIMIT 10
        `;
        const combosRes = await runQuery<{ combo: string; count: number; avgStars: number }>(combosSql);

        if (active) {
          setTagStats({
            topAvg: [...tagsRes].sort((a, b) => b.avgStars - a.avgStars).slice(0, 10),
            topTotal: [...tagsRes].sort((a, b) => b.totalStars - a.totalStars).slice(0, 10),
            topCombos: combosRes
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em Bonus04:", err);
        if (active) setLoading(false);
      }
    }

    loadTagStats();

    return () => { active = false; };
  }, [contextLoading, isDbReady, buildWhereClause, runQuery, datasetMode]);

  if (contextLoading || !isDbReady || loading) {
    return (
      <Spinner 
        message={downloadProgress.message || "Processando tags e correlações..."} 
        progress={downloadProgress.percentage}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 04: Tendências de Tags e Engajamento</h2>
        <p className="text-gray-600">O que torna um repositório mais popular?</p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
        <h3 className="font-bold text-yellow-800">1. Correlações e Mitos Desmascarados</h3>
        <p className="text-sm text-yellow-900 mt-2">
          Análises quantitativas no dataset demonstram que <strong>quantidade de commits</strong> não garante estrelas. As maiores correlações de popularidade (estrelas) estão atreladas a <strong>Forks (0.61)</strong> e <strong>Observadores (0.64)</strong>, e de forma secundária a issues abertas. Tamanho de código não tem correlação significativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-pink-800">2. Tags Que Mais Geram Engajamento (Média ⭐/repo)</h3>
          <ul className="space-y-2">
            {tagStats.topAvg.map((t, idx) => (
              <li key={idx} className="flex justify-between items-center border-b pb-1">
                <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">{t.tag}</span>
                <div className="text-right">
                  <span className="text-pink-700 font-bold block">{new Intl.NumberFormat('pt-BR').format(t.avgStars)} ⭐</span>
                  <span className="text-xs text-gray-400">em {t.count.toLocaleString()} repos</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-cyan-800">3. Tags Mais Frequentes (Soma Total de ⭐)</h3>
          <ul className="space-y-2">
            {tagStats.topTotal.map((t, idx) => (
              <li key={idx} className="flex justify-between items-center border-b pb-1">
                <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">{t.tag}</span>
                <span className="text-cyan-700 font-bold">{new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(t.totalStars)} ⭐ totais</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-slate-800">4. Combinações Matadoras (Linguagem Principal + Tag)</h3>
          <p className="text-xs text-gray-500 mb-3">Top combinações de linguagem com tag pela <strong>Média de Estrelas</strong>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {tagStats.topCombos.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                <span className="text-sm font-medium text-slate-700">{c.combo}</span>
                <span className="text-slate-800 font-bold bg-white px-2 py-1 rounded shadow-sm text-xs">
                  ~{new Intl.NumberFormat('pt-BR').format(c.avgStars)} ⭐
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

