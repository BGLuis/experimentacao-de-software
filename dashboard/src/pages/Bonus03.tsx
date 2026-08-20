import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus03() {
  const { data, loading } = useData();

  const licStats = useMemo(() => {
    const licenses: Record<string, any> = {};
    const aiLicenses: Record<string, number> = {};

    data.forEach(d => {
      let lic = d.licenca || 'Nenhuma/Não Informada';
      if (lic.length > 30) lic = lic.substring(0, 30) + '...';

      if (!licenses[lic]) {
        licenses[lic] = { count: 0, donations: 0, prTotal: 0, prAccepted: 0, archived: 0 };
      }
      
      licenses[lic].count++;
      if (d.recebe_doacoes) licenses[lic].donations++;
      if (d.esta_arquivado) licenses[lic].archived++;
      
      const totalPrs = (d.pull_requests_abertas || 0) + (d.pull_requests_aceitas || 0);
      licenses[lic].prTotal += totalPrs;
      licenses[lic].prAccepted += (d.pull_requests_aceitas || 0);

      // AI Licenses
      const isAi = d.tags && d.tags.toLowerCase().match(/ai|ml|llm|gpt|machine learning/);
      if (isAi) {
        aiLicenses[lic] = (aiLicenses[lic] || 0) + 1;
      }
    });

    const licArray = Object.entries(licenses)
      .filter(([_, stats]) => stats.count >= 20) // Filter to licenses with at least 20 repos for significance
      .map(([lic, stats]) => ({
        lic,
        count: stats.count,
        donationRate: (stats.donations / stats.count * 100).toFixed(1),
        prAcceptance: stats.prTotal > 0 ? (stats.prAccepted / stats.prTotal * 100).toFixed(1) : '0.0',
        archivedRate: (stats.archived / stats.count * 100).toFixed(1)
      }));

    const topAiLics = Object.entries(aiLicenses).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l, c]) => ({ lic: l, count: c }));

    return { 
      donations: [...licArray].sort((a, b) => Number(b.donationRate) - Number(a.donationRate)).slice(0, 8),
      prs: [...licArray].sort((a, b) => Number(b.prAcceptance) - Number(a.prAcceptance)).slice(0, 8),
      archived: [...licArray].sort((a, b) => Number(b.archivedRate) - Number(a.archivedRate)).slice(0, 8),
      ai: topAiLics
    };
  }, [data]);

  if (loading) return <Spinner message="Analisando aspectos legais e licenciamento..." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 03: Dinheiro, Ideologia e Licenças</h2>
        <p className="text-gray-600">O impacto da licença no engajamento e financiamento de projetos open source.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-green-800">1. Licenças vs Doações</h3>
          <p className="text-xs text-gray-500 mb-2">Porcentagem de projetos com a licença que recebem doações financeiras.</p>
          <ul className="space-y-2">
            {licStats.donations.map((l, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span className="text-sm font-medium">{l.lic}</span>
                <span className="text-green-700 font-bold">{l.donationRate}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-blue-800">2. Licenças vs Aceitação de PRs</h3>
          <p className="text-xs text-gray-500 mb-2">Taxa média de aceitação de Pull Requests da comunidade.</p>
          <ul className="space-y-2">
            {licStats.prs.map((l, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span className="text-sm font-medium">{l.lic}</span>
                <span className="text-blue-700 font-bold">{l.prAcceptance}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-purple-800">3. Licenças em Projetos de IA</h3>
          <p className="text-xs text-gray-500 mb-2">O domínio das licenças em IA corporativa e acadêmica.</p>
          <ul className="space-y-2">
            {licStats.ai.map((l, i) => (
              <li key={i} className="flex justify-between items-center bg-purple-50 p-2 rounded">
                <span className="text-sm font-medium text-purple-900">{l.lic}</span>
                <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded">{l.count} repos</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-orange-800">4. Licenças vs Abandono (Arquivados)</h3>
          <p className="text-xs text-gray-500 mb-2">Projetos arquivados por tipo de licença.</p>
          <ul className="space-y-2">
            {licStats.archived.map((l, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span className="text-sm font-medium">{l.lic}</span>
                <span className="text-orange-700 font-bold">{l.archivedRate}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
