import { useData } from '../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RQ05() {
  const { data, loading } = useData();

  if (loading) return <div>Carregando dados...</div>;

  const langMap = new Map<string, number>();
  
  data.forEach(d => {
    if (d.linguagens) {
      langMap.set(d.linguagens, (langMap.get(d.linguagens) || 0) + 1);
    }
  });

  const chartData = Array.from(langMap.entries())
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 languages

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">RQ 05</h2>
        <p className="text-gray-600 text-sm md:text-base">Sistemas populares são escritos nas linguagens mais populares?</p>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Top 15 Linguagens nos Repositórios Populares</h3>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="h-[70vh] min-h-[400px] min-w-[700px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 65, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lang" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 'auto']} allowDataOverflow={true} tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)} label={{ value: 'Qtd. Repositórios', angle: -90, position: 'insideLeft', offset: -20, style: { textAnchor: 'middle' }, fill: '#64748b' }} />
                <Tooltip formatter={(value: any) => [new Intl.NumberFormat('pt-BR').format(Number(value) || 0), 'Repositórios']} />
                <Bar dataKey="count" fill="#0ea5e9" name="Nº de Repositórios" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
