import { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';
import { CanvasScatterChart, type CanvasScatterPoint } from '../components/CanvasScatterChart';
import { StatsSummaryCard, type StatsSummary } from '../components/StatsSummaryCard';

export default function RQ06() {
  const { runQuery, buildWhereClause, loading: contextLoading, downloadProgress, filters, datasetMode } = useData();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<CanvasScatterPoint[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    count: 0,
    avgX: 0,
    medianX: 0,
    q1X: 0,
    q3X: 0,
    minX: 0,
    maxX: 0,
    avgY: 0,
    medianY: 0,
    q1Y: 0,
    q3Y: 0
  });

  useEffect(() => {
    let active = true;
    if (contextLoading) return;

    async function loadData() {
      setLoading(true);
      try {
        const where = buildWhereClause(["estrelas IS NOT NULL"]);

        // 1. Fetch 100% of all points for Canvas rendering
        const pointsSql = `
          SELECT 
            round(case when (coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0)) > 0 
                       then (coalesce(pull_requests_aceitas, 0)::DOUBLE / (coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0))) * 100 
                       else 0 end, 2) as x,
            estrelas as y,
            linguagens
          FROM repos
          ${where}
        LIMIT 10000`;
        const points = await runQuery<{ x: number; y: number; linguagens: string }>(pointsSql);

        // 2. Fetch Exact Descriptive Statistics on 100% of the dataset
        const statsSql = `
          WITH calc AS (
            SELECT 
              case when (coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0)) > 0 
                   then (coalesce(pull_requests_aceitas, 0)::DOUBLE / (coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0))) * 100 
                   else 0 end as ratio,
              estrelas
            FROM repos
            ${where}
          )
          SELECT 
            count(*) as count,
            coalesce(avg(ratio), 0) as avgX,
            coalesce(median(ratio), 0) as medianX,
            coalesce(quantile_cont(ratio, 0.25), 0) as q1X,
            coalesce(quantile_cont(ratio, 0.75), 0) as q3X,
            coalesce(min(ratio), 0) as minX,
            coalesce(max(ratio), 0) as maxX,
            coalesce(avg(estrelas), 0) as avgY,
            coalesce(median(estrelas), 0) as medianY,
            coalesce(quantile_cont(estrelas, 0.25), 0) as q1Y,
            coalesce(quantile_cont(estrelas, 0.75), 0) as q3Y
          FROM calc
        `;
        const statsRes = await runQuery<StatsSummary>(statsSql);

        if (active) {
          setRawData(points.map(p => {
            const langs = p.linguagens ? p.linguagens.split(',').map((l: string) => l.trim()) : [];
            let lang = langs[0] || 'Desconhecida';
            if (filters.languages && filters.languages.length > 0) {
              const match = langs.find((l: string) => filters.languages.includes(l));
              if (match) lang = match;
            }
            return { x: p.x, y: p.y, language: lang };
          }));

          if (statsRes[0]) {
            setStats(statsRes[0]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em RQ06:", err);
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => { active = false; };
  }, [contextLoading, buildWhereClause, runQuery, filters, datasetMode]);

  const chartData = useMemo(() => rawData, [rawData]);

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner 
          message={downloadProgress.message || "Consultando 100% dos repositórios..."} 
          progress={downloadProgress.percentage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">RQ 06</h2>
        <p className="text-gray-600 text-sm md:text-base">Sistemas populares têm um alto índice de Pull Requests fechados/aceitos?</p>
      </div>

      <StatsSummaryCard 
        stats={stats}
        xTitle="Taxa de PRs"
        yTitle="Estrelas"
        xUnit="%"
        yUnit="⭐"
        xFormatter={(v) => `${v.toFixed(1)}%`}
        yFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)}
      />
      
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800">% de PRs Aceitos x Estrelas</h3>
        <CanvasScatterChart
          data={chartData}
          xLabel="Taxa de Aceitação de PRs"
          yLabel="Número de Estrelas"
          xUnit="%"
          yUnit="estrelas"
          xFormatter={(v) => `${v.toFixed(1)}%`}
          yFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)}
          height={500}
        />
      </div>
    </div>
  );
}


