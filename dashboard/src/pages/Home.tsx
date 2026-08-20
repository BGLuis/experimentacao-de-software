import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Database, Star, GitMerge, AlertCircle } from 'lucide-react';

export default function Home() {
  const { data, loading } = useData();

  if (loading) return <div>Carregando dados (12k repositórios)...</div>;

  const { totalRepos, avgStars, avgPRs, avgIssues } = useMemo(() => {
    const validData = data.filter(d => d.repositorio);
    const totalRepos = validData.length;
    const avgStars = validData.reduce((acc, curr) => acc + (curr.estrelas || 0), 0) / (totalRepos || 1);
    const avgPRs = validData.reduce((acc, curr) => acc + (curr.pull_requests_abertas || 0) + (curr.pull_requests_aceitas || 0), 0) / (totalRepos || 1);
    const avgIssues = validData.reduce((acc, curr) => acc + (curr.issues_total || 0), 0) / (totalRepos || 1);
    return { totalRepos, avgStars, avgPRs, avgIssues };
  }, [data]);

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
            <p className="text-xl md:text-2xl font-bold text-gray-900">{totalRepos.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
            <Star size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de Estrelas</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(avgStars).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg shrink-0">
            <GitMerge size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de PRs</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(avgPRs).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">Média de Issues</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{Math.round(avgIssues).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
