import { useData } from '../hooks/useData';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RQ07() {
  const { data, loading } = useData();

  if (loading) return <div>Carregando dados...</div>;

  const chartData = data
    .filter(d => d.razao_issues_fechadas != null && d.estrelas != null)
    .map(d => ({
      ratio: Number((d.razao_issues_fechadas * 100).toFixed(2)),
      stars: d.estrelas
    }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">RQ 07</h2>
        <p className="text-gray-600 text-sm md:text-base">Sistemas populares têm um alto índice de Issues fechadas?</p>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">% de Issues Fechadas x Estrelas</h3>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[70vh] min-h-[400px] min-w-[700px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 25, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="ratio" name="% Issues Fechadas" unit="%" domain={[0, 100]} allowDataOverflow={true} tickFormatter={(v) => `${v}%`} label={{ value: 'Issues Fechadas (%)', position: 'insideBottom', offset: -15, fill: '#64748b' }} />
                <YAxis type="number" dataKey="stars" name="Estrelas" domain={['dataMin', 'auto']} allowDataOverflow={true} tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} label={{ value: 'Número de Estrelas', angle: -90, position: 'insideLeft', offset: -20, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name: any) => [name === 'Estrelas' ? new Intl.NumberFormat('pt-BR').format(Number(value) || 0) : `${value}%`, String(name)]} />
                <Scatter name="Repositórios" data={chartData} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
