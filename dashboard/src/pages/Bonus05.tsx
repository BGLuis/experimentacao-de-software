import { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { getColorForLanguage } from '../utils/colors';
import { Spinner } from '../components/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Bonus05() {
  const { filteredData: data, loading } = useData();
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsChartReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsChartReady(false);
    }
  }, [loading]);

  const { chartData, languages } = useMemo(() => {
    // Group by year and language
    const grouped: Record<string, Record<string, number>> = {};
    const langs = new Set<string>();

    data.forEach(d => {
      if (d.criado_em) {
        const year = String(d.criado_em).substring(0, 4);
        if (year && !isNaN(Number(year))) {
          if (!grouped[year]) {
            grouped[year] = {};
          }
          const lang = d.linguagens ? d.linguagens.split(',')[0].trim() : 'Desconhecida';
          langs.add(lang);
          grouped[year][lang] = (grouped[year][lang] || 0) + 1;
        }
      }
    });

    const result = Object.keys(grouped).sort().map(year => {
      return {
        year,
        ...grouped[year]
      };
    });

    // Sort languages by total count descending to show most popular at the bottom of the stack
    const langCounts: Record<string, number> = {};
    data.forEach(d => {
      const lang = d.linguagens ? d.linguagens.split(',')[0].trim() : 'Desconhecida';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    });

    const sortedLangs = Array.from(langs).sort((a, b) => langCounts[b] - langCounts[a]);

    // Limit to top 20 languages to avoid huge DOM if no filters are applied
    const topLangs = sortedLangs.slice(0, 20);

    // Re-map to group "Outros"
    if (sortedLangs.length > 20) {
      result.forEach(r => {
        const row = r as Record<string, any>;
        let outros = 0;
        Object.keys(row).forEach(key => {
          if (key !== 'year' && !topLangs.includes(key)) {
            outros += row[key] as number;
            delete row[key];
          }
        });
        if (outros > 0) {
          row['Outros'] = outros;
        }
      });
      topLangs.push('Outros');
    }

    return { chartData: result, languages: topLangs };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner message="Processando dados..." />
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
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: 'Quantidade de Repositórios', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ bottom: 0 }} />
                  {languages.map((lang) => (
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
