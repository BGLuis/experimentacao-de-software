import { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus01() {
  const { runQuery, buildWhereClause, loading: contextLoading, downloadProgress, datasetMode } = useData();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    wiki: {
      hasWiki: { count: 0, avgStars: 0 },
      noWiki: { count: 0, avgStars: 0 },
    },
    size: [] as { label: string; count: number; archivedRate: string }[],
    noIssues: 0,
    forks: { count: 0, top: [] as any[] }
  });

  useEffect(() => {
    let active = true;
    if (contextLoading) return;

    async function loadStats() {
      setLoading(true);
      try {
        const where = buildWhereClause();

        // 1. Wiki stats
        const wikiRes = await runQuery<{ has_wiki: boolean; cnt: number; avg_stars: number }>(`
          SELECT 
            possui_wiki as has_wiki,
            count(*) as cnt,
            round(coalesce(avg(estrelas), 0)) as avg_stars
          FROM repos
          ${where}
          GROUP BY possui_wiki
        `);

        let hasWiki = { count: 0, avgStars: 0 };
        let noWiki = { count: 0, avgStars: 0 };
        wikiRes.forEach(r => {
          if (r.has_wiki) {
            hasWiki = { count: r.cnt, avgStars: r.avg_stars };
          } else {
            noWiki = { count: r.cnt, avgStars: r.avg_stars };
          }
        });

        // 2. Size stats
        const sizeRes = await runQuery<{ label: string; count: number; archivedRate: number }>(`
          SELECT 
            case 
              when tamanho_kb < 1000 then 'Pequeno (<1MB)'
              when tamanho_kb < 10000 then 'Médio (1-10MB)'
              when tamanho_kb < 100000 then 'Grande (10-100MB)'
              else 'Gigante (>100MB)'
            end as label,
            count(*) as count,
            round(100.0 * sum(case when esta_arquivado then 1 else 0 end) / nullif(count(*), 0), 1) as archivedRate
          FROM repos
          ${where}
          GROUP BY 1
          ORDER BY 
            case 
              when label = 'Pequeno (<1MB)' then 1
              when label = 'Médio (1-10MB)' then 2
              when label = 'Grande (10-100MB)' then 3
              else 4
            end
        `);

        // 3. No issues
        const noIssuesRes = await runQuery<{ cnt: number }>(`
          SELECT count(*) as cnt
          FROM repos
          ${where ? `${where} AND possui_issues = false` : 'WHERE possui_issues = false'}
        `);

        // 4. Forks
        const forksCountRes = await runQuery<{ cnt: number }>(`
          SELECT count(*) as cnt
          FROM repos
          ${where ? `${where} AND e_fork = true` : 'WHERE e_fork = true'}
        `);

        const topForksRes = await runQuery<{ repositorio: string; estrelas: number }>(`
          SELECT repositorio, estrelas
          FROM repos
          ${where ? `${where} AND e_fork = true` : 'WHERE e_fork = true'}
          ORDER BY estrelas DESC
          LIMIT 5
        `);

        if (active) {
          setStats({
            wiki: { hasWiki, noWiki },
            size: sizeRes.map(s => ({ ...s, archivedRate: String(s.archivedRate || 0) })),
            noIssues: noIssuesRes[0]?.cnt || 0,
            forks: {
              count: forksCountRes[0]?.cnt || 0,
              top: topForksRes
            }
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro em Bonus01:", err);
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => { active = false; };
  }, [contextLoading, buildWhereClause, runQuery, datasetMode]);

  if (contextLoading || loading) {
    return (
      <Spinner 
        message={downloadProgress.message || "Analisando dados bônus estruturais..."} 
        progress={downloadProgress.percentage}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bônus 01: Análise Estrutural</h2>
        <p className="text-gray-600">O Paradoxo da Wiki e o Tamanho do Código</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-blue-800">1. O Impacto da Wiki</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border-b pb-2">
              <span>Projetos <strong>Com</strong> Wiki:</span>
              <span>{stats.wiki.hasWiki.count.toLocaleString()} repos ({stats.wiki.hasWiki.avgStars.toLocaleString()} ⭐ médias)</span>
            </li>
            <li className="flex justify-between pt-2">
              <span>Projetos <strong>Sem</strong> Wiki:</span>
              <span>{stats.wiki.noWiki.count.toLocaleString()} repos ({stats.wiki.noWiki.avgStars.toLocaleString()} ⭐ médias)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-purple-800">2. Repositórios que Desativam Issues</h3>
          <p className="text-4xl font-bold text-gray-800 my-2">{stats.noIssues.toLocaleString()}</p>
          <p className="text-sm text-gray-600">projetos preferem não lidar com issues (ou usam plataformas externas de rastreamento).</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-green-800">3. Tamanho e Taxa de Arquivamento (Abandono)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-2 rounded-tl-lg">Categoria</th>
                  <th className="p-2">Qtd. Projetos</th>
                  <th className="p-2 rounded-tr-lg">Taxa de Arquivamento (%)</th>
                </tr>
              </thead>
              <tbody>
                {stats.size.map((s, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-medium">{s.label}</td>
                    <td className="p-2">{s.count.toLocaleString()}</td>
                    <td className="p-2">{s.archivedRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-orange-800">4. Top Forks que Ficaram Famosos</h3>
          <p className="text-sm text-gray-600 mb-3">Total de forks ultra populares: {stats.forks.count.toLocaleString()}</p>
          {stats.forks.top.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum fork encontrado com os filtros atuais.</p>
          ) : (
            <ul className="space-y-2">
              {stats.forks.top.map((f: any, idx: number) => (
                <li key={idx} className="bg-gray-50 p-2 rounded-lg flex justify-between">
                  <span className="font-medium text-gray-800">{f.repositorio}</span>
                  <span className="text-yellow-600 font-bold">{new Intl.NumberFormat('pt-BR').format(f.estrelas)} ⭐</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

