import { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus03() {
  const { runQuery, buildWhereClause, loading: contextLoading, downloadProgress } = useData();
  const [loading, setLoading] = useState(true);
  const [licStats, setLicStats] = useState({
    donations: [] as any[],
    prs: [] as any[],
    archived: [] as any[],
    ai: [] as any[]
  });

  useEffect(() => {
    let active = true;
    if (contextLoading) return;

    async function loadLicStats() {
      setLoading(true);
      try {
        const where = buildWhereClause();

        // 1. General License stats
        const licSql = `
          SELECT 
            coalesce(nullif(licenca, ''), 'Nenhuma/Não Informada') as raw_lic,
            count(*) as count,
            round(100.0 * sum(case when recebe_doacoes then 1 else 0 end) / nullif(count(*), 0), 1) as donationRate,
            round(100.0 * sum(coalesce(pull_requests_aceitas, 0)) / nullif(sum(coalesce(pull_requests_abertas, 0) + coalesce(pull_requests_aceitas, 0)), 0), 1) as prAcceptance,
            round(100.0 * sum(case when esta_arquivado then 1 else 0 end) / nullif(count(*), 0), 1) as archivedRate
          FROM repos
          ${where}
          GROUP BY raw_lic
          HAVING count >= 20
        `;
        const licRes = await runQuery<{
          raw_lic: string;
          count: number;
          donationRate: number;
          prAcceptance: number;
          archivedRate: number;
        }>(licSql);

        const formattedLics = licRes.map(item => {
          let lic = item.raw_lic;
          if (lic.length > 30) lic = lic.substring(0, 30) + '...';
          return {
            lic,
            count: item.count,
            donationRate: String(item.donationRate ?? 0),
            prAcceptance: String(item.prAcceptance ?? 0),
            archivedRate: String(item.archivedRate ?? 0)
          };
        });

        // 2. AI Licenses
        const aiLicSql = `
          SELECT 
            coalesce(nullif(licenca, ''), 'Nenhuma/Não Informada') as raw_lic,
            count(*) as count
          FROM repos
          ${where ? `${where} AND ` : 'WHERE '} regexp_matches(lower(coalesce(tags,'')), '(\\\\b|^)(ai|ml|llm|gpt|machine learning)(\\\\b|$)')
          GROUP BY raw_lic
          ORDER BY count DESC
          LIMIT 5
        `;
        const aiLicRes = await runQuery<{ raw_lic: string; count: number }>(aiLicSql);
        const topAiLics = aiLicRes.map(item => ({
          lic: item.raw_lic.length > 30 ? item.raw_lic.substring(0, 30) + '...' : item.raw_lic,
          count: item.count
        }));

        if (active) {
          setLicStats({
            donations: [...formattedLics].sort((a, b) => Number(b.donationRate) - Number(a.donationRate)).slice(0, 8),
            prs: [...formattedLics].sort((a, b) => Number(b.prAcceptance) - Number(a.prAcceptance)).slice(0, 8),
            archived: [...formattedLics].sort((a, b) => Number(b.archivedRate) - Number(a.archivedRate)).slice(0, 8),
            ai: topAiLics
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em Bonus03:", err);
        if (active) setLoading(false);
      }
    }

    loadLicStats();

    return () => { active = false; };
  }, [contextLoading, buildWhereClause, runQuery]);

  if (contextLoading || loading) {
    return (
      <Spinner 
        message={downloadProgress.message || "Analisando aspectos legais e licenciamento..."} 
        progress={downloadProgress.percentage}
      />
    );
  }

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

