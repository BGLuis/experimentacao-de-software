import { useMemo, useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Spinner } from '../components/Spinner';

export default function Bonus01() {
  const { data, loading } = useData();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const stats = useMemo(() => {
    let wikiCount = 0;
    let wikiStars = 0;
    let noWikiCount = 0;
    let noWikiStars = 0;

    let small = 0, medium = 0, large = 0, giant = 0;
    let smallArchived = 0, mediumArchived = 0, largeArchived = 0, giantArchived = 0;

    let noIssuesCount = 0;
    let forksCount = 0;
    let forksData: any[] = [];

    data.forEach(d => {
      // Wiki
      if (d.possui_wiki) {
        wikiCount++;
        wikiStars += (d.estrelas || 0);
      } else {
        noWikiCount++;
        noWikiStars += (d.estrelas || 0);
      }

      // Size
      const kb = d.tamanho_kb || 0;
      if (kb < 1000) { small++; if (d.esta_arquivado) smallArchived++; }
      else if (kb < 10000) { medium++; if (d.esta_arquivado) mediumArchived++; }
      else if (kb < 100000) { large++; if (d.esta_arquivado) largeArchived++; }
      else { giant++; if (d.esta_arquivado) giantArchived++; }

      // Issues
      if (d.possui_issues === false) {
        noIssuesCount++;
      }

      // Forks
      if (d.e_fork) {
        forksCount++;
        forksData.push(d);
      }
    });

    forksData.sort((a, b) => (b.estrelas || 0) - (a.estrelas || 0));

    return {
      wiki: {
        hasWiki: { count: wikiCount, avgStars: wikiCount ? Math.round(wikiStars / wikiCount) : 0 },
        noWiki: { count: noWikiCount, avgStars: noWikiCount ? Math.round(noWikiStars / noWikiCount) : 0 },
      },
      size: [
        { label: 'Pequeno (<1MB)', count: small, archivedRate: small ? (smallArchived / small * 100).toFixed(1) : '0' },
        { label: 'Médio (1-10MB)', count: medium, archivedRate: medium ? (mediumArchived / medium * 100).toFixed(1) : '0' },
        { label: 'Grande (10-100MB)', count: large, archivedRate: large ? (largeArchived / large * 100).toFixed(1) : '0' },
        { label: 'Gigante (>100MB)', count: giant, archivedRate: giant ? (giantArchived / giant * 100).toFixed(1) : '0' },
      ],
      noIssues: noIssuesCount,
      forks: { count: forksCount, top: forksData.slice(0, 5) }
    };
  }, [data]);

  if (loading || !isReady) {
    return <Spinner message="Analisando dados bônus estruturais..." />;
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
              <span>{stats.wiki.hasWiki.count} repos ({stats.wiki.hasWiki.avgStars} ⭐ médias)</span>
            </li>
            <li className="flex justify-between pt-2">
              <span>Projetos <strong>Sem</strong> Wiki:</span>
              <span>{stats.wiki.noWiki.count} repos ({stats.wiki.noWiki.avgStars} ⭐ médias)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-purple-800">2. Repositórios que Desativam Issues</h3>
          <p className="text-4xl font-bold text-gray-800 my-2">{stats.noIssues}</p>
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
                    <td className="p-2">{s.count}</td>
                    <td className="p-2">{s.archivedRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-orange-800">4. Top Forks que Ficaram Famosos</h3>
          <p className="text-sm text-gray-600 mb-3">Total de forks ultra populares: {stats.forks.count}</p>
          <ul className="space-y-2">
            {stats.forks.top.map((f: any, idx: number) => (
              <li key={idx} className="bg-gray-50 p-2 rounded-lg flex justify-between">
                <span className="font-medium text-gray-800">{f.repositorio}</span>
                <span className="text-yellow-600 font-bold">{new Intl.NumberFormat('pt-BR').format(f.estrelas)} ⭐</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
