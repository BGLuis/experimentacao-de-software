import { useCallback } from 'react';
import { useData } from '../hooks/useData';
import { useQuery } from '../hooks/useQuery';
import { Spinner } from '../components/Spinner';
import { Database, Star, GitMerge, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface HomeMetrics {
  total_repos: number;
  avg_stars: number;
  avg_prs: number;
  avg_issues: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-sm border border-slate-700">
        <p className="font-semibold mb-1">{payload[0].name || payload[0].payload.category}</p>
        <p className="text-slate-300">
          Total: <span className="text-white font-bold">{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const { loading: contextLoading, datasetMode, isDbReady } = useData();

  // Metrics query
  const buildMetricsQuery = useCallback((where: string) => `
    SELECT count(*) as total_repos, coalesce(avg(estrelas), 0) as avg_stars, coalesce(avg(coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0)), 0) as avg_prs, coalesce(avg(coalesce(issues_total, 0)), 0) as avg_issues FROM repos ${where}
  `, []);

  // RQ01: Age
  const buildAgeQuery = useCallback((where: string) => `
    SELECT CASE WHEN (CAST(coalesce(idade_dias, '0') AS FLOAT) / 365.25) <= 3 THEN 'Até 3 anos' WHEN (CAST(coalesce(idade_dias, '0') AS FLOAT) / 365.25) <= 7 THEN '4 a 7 anos' ELSE '+ de 7 anos' END as category, count(*) as count FROM repos ${where} GROUP BY category ORDER BY count DESC
  `, []);

  // RQ02: PRs
  const buildPrQuery = useCallback((where: string) => `
    SELECT CASE WHEN pull_requests_aceitas = 0 THEN '0 PRs' WHEN pull_requests_aceitas <= 50 THEN '1 a 50 PRs' WHEN pull_requests_aceitas <= 500 THEN '51 a 500 PRs' ELSE '+ de 500 PRs' END as category, count(*) as count FROM repos ${where} GROUP BY category
  `, []);

  // RQ03: Releases
  const buildReleaseQuery = useCallback((where: string) => `
    SELECT CASE WHEN coalesce(releases, 0) > 0 THEN 'Com Releases' ELSE 'Zero Releases' END as category, count(*) as count FROM repos ${where} GROUP BY category
  `, []);

  // RQ04: Pushes
  const buildPushQuery = useCallback((where: string) => `
    SELECT CASE WHEN coalesce(dias_desde_ultimo_push, 9999) <= 30 THEN 'Ativos (< 30 dias)' WHEN coalesce(dias_desde_ultimo_push, 9999) <= 365 THEN 'Lentos (Até 1 ano)' ELSE 'Abandonados (> 1 ano)' END as category, count(*) as count FROM repos ${where} GROUP BY category
  `, []);

  // RQ05: Languages
  const buildLangQuery = useCallback((where: string) => `
    SELECT trim(split_part(coalesce(linguagens, 'Desconhecida'), ',', 1)) as category, count(*) as count FROM repos ${where} GROUP BY category ORDER BY count DESC LIMIT 5
  `, []);

  // RQ06: Issues
  const buildIssuesQuery = useCallback((where: string) => `
    SELECT CASE WHEN issues_total = 0 THEN 'Sem Issues' WHEN (CAST(issues_fechadas AS FLOAT) / issues_total) >= 0.75 THEN 'Alta Resolução (>= 75%)' ELSE 'Baixa Resolução (< 75%)' END as category, count(*) as count FROM repos ${where} GROUP BY category
  `, []);

  const { data: metricsData, loading: q1 } = useQuery<HomeMetrics>(buildMetricsQuery);
  const { data: ageData, loading: q2 } = useQuery<any>(buildAgeQuery);
  const { data: prData, loading: q3 } = useQuery<any>(buildPrQuery);
  const { data: releaseData, loading: q4 } = useQuery<any>(buildReleaseQuery);
  const { data: pushData, loading: q5 } = useQuery<any>(buildPushQuery);
  const { data: langData, loading: q6 } = useQuery<any>(buildLangQuery);
  const { data: issuesData, loading: q7 } = useQuery<any>(buildIssuesQuery);

  const isLoading = contextLoading || !isDbReady || q1 || q2 || q3 || q4 || q5 || q6 || q7;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner message="Processando Dashboard..." />
      </div>
    );
  }

  const metrics = metricsData?.[0] || { total_repos: 0, avg_stars: 0, avg_prs: 0, avg_issues: 0 };

  if (metrics.total_repos === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Visão Geral do Ecossistema</h2>
          <p className="text-slate-500 mt-1">Análise consolidada</p>
        </div>
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum repositório encontrado</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Os filtros selecionados acima não retornaram nenhum registro. Tente selecionar outras linguagens, alterar o período de criação ou limpar os filtros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Visão Geral do Ecossistema</h2>
          <p className="text-slate-500 mt-1">
            Análise consolidada de {datasetMode === 'full' ? '202.017' : '1.000'} repositórios no GitHub
          </p>
        </div>
      </div>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Total de Repositórios", val: metrics.total_repos, icon: Database, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Média de Estrelas", val: Math.round(metrics.avg_stars), icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" },
          { title: "Média de PRs", val: Math.round(metrics.avg_prs), icon: GitMerge, color: "text-emerald-600", bg: "bg-emerald-100" },
          { title: "Média de Issues", val: Math.round(metrics.avg_issues), icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100" }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl shrink-0 ${card.bg} ${card.color}`}>
              <card.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{card.title}</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{card.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RQ01 - Idade */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Maturidade dos Projetos (RQ01)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ageData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="category">
                  {ageData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* RQ02 - PRs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Pull Requests (RQ02)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{fill: '#475569'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* RQ03 - Releases */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Adoção de Releases (RQ03)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={releaseData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="category">
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* RQ04 - Pushes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Frequência de Atualizações (RQ04)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pushData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="category">
                  {pushData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* RQ05 - Linguagens */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Top 5 Linguagens (RQ05)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={langData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis dataKey="category" type="category" width={80} tick={{fill: '#475569', fontWeight: 600}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

          {/* RQ06 - Issues */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Resolução de Issues (RQ06)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={issuesData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="category">
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
