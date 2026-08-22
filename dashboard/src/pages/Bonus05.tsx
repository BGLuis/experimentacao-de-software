import { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { getColorForLanguage } from '../utils/colors';
import { Spinner } from '../components/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Bonus05() {
  const { runQuery, buildWhereClause, loading: contextLoading, downloadProgress } = useData();
  const [loading, setLoading] = useState(true);
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartResult, setChartResult] = useState<{
    chartData: any[];
    languages: string[];
  }>({ chartData: [], languages: [] });

  useEffect(() => {
    let active = true;
    if (contextLoading) return;

    async function loadYearLangs() {
      setLoading(true);
      try {
        const where = buildWhereClause();
        const sql = `
          SELECT 
            substring(criado_em, 1, 4) as year,
            trim(string_split(coalesce(linguagens, 'Desconhecida'), ',')[1]) as lang,
            count(*) as count
          FROM repos
          ${where ? `${where} AND ` : 'WHERE '} criado_em IS NOT NULL AND substring(criado_em, 1, 4) != ''
          GROUP BY year, lang
          ORDER BY year ASC, count DESC
        `;
        const rows = await runQuery<{ year: string; lang: string; count: number }>(sql);

        const grouped: Record<string, Record<string, number>> = {};
        const langTotals: Record<string, number> = {};
        const langsSet = new Set<string>();

        rows.forEach(r => {
          const y = r.year;
          const l = r.lang || 'Desconhecida';
          const cnt = Number(r.count || 0);

          if (!grouped[y]) grouped[y] = {};
          grouped[y][l] = (grouped[y][l] || 0) + cnt;
          langTotals[l] = (langTotals[l] || 0) + cnt;
          langsSet.add(l);
        });

        const sortedLangs = Array.from(langsSet).sort((a, b) => (langTotals[b] || 0) - (langTotals[a] || 0));
        const topLangs = sortedLangs.slice(0, 20);

        const yearsList = Object.keys(grouped).sort();
        const chartData = yearsList.map(year => {
          const row: Record<string, any> = { year };
          let outros = 0;
          Object.keys(grouped[year]).forEach(l => {
            if (topLangs.includes(l)) {
              row[l] = grouped[year][l];
            } else {
              outros += grouped[year][l];
            }
          });
          if (outros > 0) {
            row['Outros'] = outros;
          }
          return row;
        });

        const finalLangs = [...topLangs];
        if (sortedLangs.length > 20) {
          finalLangs.push('Outros');
        }

        if (active) {
          setChartResult({ chartData, languages: finalLangs });
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em Bonus05:", err);
        if (active) setLoading(false);
      }
    }

    loadYearLangs();

    return () => { active = false; };
  }, [contextLoading, buildWhereClause, runQuery]);

  useEffect(() => {
    if (!contextLoading && !loading) {
      const timer = setTimeout(() => setIsChartReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsChartReady(false);
    }
  }, [contextLoading, loading]);

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner 
          message={downloadProgress.message || "Processando dados..."} 
          progress={downloadProgress.percentage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 05</h2>
        <p className="text-gray-600 text-sm md:text-base">Distribuição de Repositórios por Ano e Linguagem</p>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Criação por Ano</h3>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[70vh] min-h-[500px] min-w-[700px] w-full">
            {!isChartReady ? (
              <Spinner message="Desenhando gráfico..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartResult.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: 'Quantidade de Repositórios', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ bottom: 0 }} />
                  {chartResult.languages.map((lang) => (
                    <Bar 
                      key={lang} 
                      dataKey={lang} 
                      stackId="a" 
                      fill={lang === 'Outros' ? '#cbd5e1' : getColorForLanguage(lang)} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

