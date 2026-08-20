export interface RepoData {
  repositorio: string;
  url: string;
  estrelas: number;
  forks: number;
  linguagens: string;
  issues_fechadas: number;
  issues_total: number;
  razao_issues_fechadas: number;
  pull_requests_abertas: number;
  pull_requests_aceitas: number;
  releases: number;
  idade_dias: number;
  atualizado_em: string;
  dias_desde_atualizacao: number;
  total_commits: number;
  
  // Novos campos adicionados para filtros e análises bônus
  criado_em: string;
  possui_wiki: boolean;
  tamanho_kb: number;
  esta_arquivado: boolean;
  recebe_doacoes: boolean;
  possui_issues: boolean;
  licenca: string;
  tags: string;
  issues_abertas: number;
  e_fork: boolean;
  descricao: string;
}
