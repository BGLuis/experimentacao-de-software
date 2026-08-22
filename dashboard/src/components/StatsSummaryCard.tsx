export interface StatsSummary {
  count: number;
  avgX: number;
  medianX: number;
  q1X: number;
  q3X: number;
  minX: number;
  maxX: number;
  avgY: number;
  medianY: number;
  q1Y: number;
  q3Y: number;
}

interface StatsSummaryCardProps {
  stats: StatsSummary;
  xTitle: string;
  yTitle: string;
  xUnit?: string;
  yUnit?: string;
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
}

export function StatsSummaryCard({
  stats,
  xTitle,
  yTitle,
  xUnit = '',
  yUnit = '',
  xFormatter = (v) => new Intl.NumberFormat('pt-BR').format(Math.round(v * 10) / 10),
  yFormatter = (v) => new Intl.NumberFormat('pt-BR').format(Math.round(v * 10) / 10)
}: StatsSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <span className="text-slate-500 font-medium block">Total Analisado (100%)</span>
        <span className="text-base font-bold text-slate-800">{stats.count.toLocaleString('pt-BR')} repos</span>
      </div>

      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <span className="text-slate-500 font-medium block">Mediana de {xTitle}</span>
        <span className="text-base font-bold text-blue-700">{xFormatter(stats.medianX)} {xUnit}</span>
        <span className="text-[10px] text-slate-400 block">Média: {xFormatter(stats.avgX)} {xUnit}</span>
      </div>

      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <span className="text-slate-500 font-medium block">Mediana de {yTitle}</span>
        <span className="text-base font-bold text-amber-600">{yFormatter(stats.medianY)} {yUnit}</span>
        <span className="text-[10px] text-slate-400 block">Média: {yFormatter(stats.avgY)} {yUnit}</span>
      </div>

      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
        <span className="text-slate-500 font-medium block">Intervalo Interquartil (Q1 - Q3)</span>
        <span className="text-xs font-semibold text-slate-700 block mt-0.5">
          {xTitle}: {xFormatter(stats.q1X)} - {xFormatter(stats.q3X)}
        </span>
        <span className="text-[10px] text-slate-400 block">
          {yTitle}: {yFormatter(stats.q1Y)} - {yFormatter(stats.q3Y)}
        </span>
      </div>
    </div>
  );
}
