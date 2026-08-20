import { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { getColorForLanguage } from '../utils/colors';
import { Spinner } from '../components/Spinner';
import { sampleData } from '../utils/sampling';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer , Legend} from 'recharts';

export default function RQ04() {
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


  const chartData = useMemo(() => {
    const rawData = data
    .filter(d => d.dias_desde_atualizacao != null && d.estrelas != null)
    .map(d => ({ daysSinceUpdate: d.dias_desde_atualizacao, stars: d.estrelas, language: d.linguagens ? d.linguagens.split(',')[0].trim() : undefined }));
    return sampleData(rawData, 2000);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner message="Baixando e processando 12.000 repositórios (isso ocorre apenas 1x)..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">RQ 04</h2>
        <p className="text-gray-600 text-sm md:text-base">Sistemas populares são atualizados frequentemente?</p>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Dias desde a Última Atualização x Estrelas</h3>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[70vh] min-h-[400px] min-w-[700px] w-full">
            {!isChartReady ? (
            <Spinner message="Desenhando gráfico..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="daysSinceUpdate" name="Dias desde atualização" domain={[0, 'auto']} allowDataOverflow={true} tickFormatter={(v) => `${v} dias`} label={{ value: 'Dias desde a última atualização', position: 'insideBottom', offset: -15, fill: '#64748b' }} />
                <YAxis type="number" dataKey="stars" name="Estrelas" domain={['dataMin', 'auto']} allowDataOverflow={true} tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} label={{ value: 'Número de Estrelas', angle: -90, position: 'insideLeft', offset: -20, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                <Legend verticalAlign="top" height={36} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name: any) => [new Intl.NumberFormat('pt-BR').format(Number(value) || 0), String(name)]} />
                {Array.from(new Set(chartData.map((d: any) => d.language || 'Desconhecida'))).map(lang => (
                  <Scatter 
                    key={lang as string}
                    isAnimationActive={false} 
                    name={lang as string} 
                    data={chartData.filter((d: any) => (d.language || 'Desconhecida') === lang)} 
                    fill={getColorForLanguage(lang as string)} 
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
