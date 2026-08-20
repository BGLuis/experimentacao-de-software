import { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { getColorForLanguage } from '../utils/colors';
import { Spinner } from '../components/Spinner';
import { sampleData } from '../utils/sampling';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer , Cell} from 'recharts';


const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md z-50 relative">
        <p className="text-sm font-bold text-gray-800 mb-1">Linguagem: {data.language || 'Desconhecida'}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm text-gray-600">
            <span className="font-medium">{p.name}:</span> {new Intl.NumberFormat('pt-BR').format(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RQ06() {
  const { filteredData: data, loading, filters } = useData();
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
      .filter(d => d.pull_requests_abertas != null && d.pull_requests_aceitas != null && d.estrelas != null)
      .map(d => {
        const totalPrs = d.pull_requests_abertas + d.pull_requests_aceitas;
        const ratio = totalPrs > 0 ? (d.pull_requests_aceitas / totalPrs) * 100 : 0;
        
        const langs = d.linguagens ? d.linguagens.split(',').map((l: string) => l.trim()) : [];
        let lang = langs[0] || 'Desconhecida';
        if (filters.languages.length > 0) {
          const match = langs.find((l: string) => filters.languages.includes(l));
          if (match) lang = match;
        }
        return { ratio: Number(ratio.toFixed(2)), stars: d.estrelas, language: lang };

      });
    return sampleData(rawData, 2000);
  }, [data, filters]);

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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">RQ 06</h2>
        <p className="text-gray-600 text-sm md:text-base">Sistemas populares têm um alto índice de Pull Requests fechados/aceitos?</p>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">% de PRs Aceitos x Estrelas</h3>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[70vh] min-h-[400px] min-w-[700px] w-full">
            {!isChartReady ? (
            <Spinner message="Desenhando gráfico..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="ratio" name="% PRs Aceitos" unit="%" domain={[0, 100]} allowDataOverflow={true} tickFormatter={(v) => `${v}%`} label={{ value: 'Taxa de Aceitação (%)', position: 'insideBottom', offset: -15, fill: '#64748b' }} />
                <YAxis type="number" dataKey="stars" name="Estrelas" domain={['dataMin', 'auto']} allowDataOverflow={true} tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} label={{ value: 'Número de Estrelas', angle: -90, position: 'insideLeft', offset: -20, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter isAnimationActive={false} name="Repositórios" data={chartData}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getColorForLanguage(entry.language)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
