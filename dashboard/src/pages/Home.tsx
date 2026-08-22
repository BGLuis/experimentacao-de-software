import { useData } from '../hooks/useData';
import { useDuckDbQuery } from '../hooks/useDuckDbQuery';
import { Spinner } from '../components/Spinner';
import { Database, Star, GitMerge, AlertCircle } from 'lucide-react';

interface HomeMetrics {
  total_repos: number;
  avg_stars: number;
  avg_prs: number;
  avg_issues: number;
}

export default function Home() {
  const { loading: contextLoading, downloadProgress } = useData();

  const { data, loading: queryLoading } = useDuckDbQuery<HomeMetrics>((where) => `
    SELECT 
      count(*) as total_repos,
      coalesce(avg(estrelas), 0) as avg_stars,
      coalesce(avg(coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0)), 0) as avg_prs,
      coalesce(avg(coalesce(issues_total, 0)), 0) as avg_issues
    FROM repos
    ${where}
  `);

  if (contextLoading || queryLoading) {
    const loadedMb = (downloadProgress.loadedBytes / (1024 * 1024)).toFixed(1);
    const totalMb = (downloadProgress.totalBytes / (1024 * 1024)).toFixed(1);
    const details = downloadProgress.totalBytes > 0 ? `${loadedMb} MB / ${totalMb} MB` : undefined;

    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Spinner 
          message={downloadProgress.message || "Carregando dados dos repositórios..."} 
          progress={downloadProgress.percentage}
          details={details}
        />
      </div>
    );
  }

  const metrics = data[0] || {
    total_repos: 0,
    avg_stars: 0,
    avg_prs: 0,
    avg_issues: 0
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Visão Geral dos Dados</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Database size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Total de Repositórios</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{metrics.total_repos.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
            <Star size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de Estrelas</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(metrics.avg_stars).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg shrink-0">
            <GitMerge size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de PRs</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(metrics.avg_prs).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de Issues</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(metrics.avg_issues).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

