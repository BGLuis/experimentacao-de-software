

from __future__ import annotations

import csv
import json
import os
from datetime import UTC, datetime
from http.client import IncompleteRead
from pathlib import Path
from time import sleep
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

N_REPOSITORIOS = 1000
TAMANHO_LOTE = 100
API_URL = "https://api.github.com/graphql"
ARQUIVO_CSV = Path("data/repositorios_populares.csv")
ARQUIVO_ENV = Path(__file__).resolve().parents[2] / ".env"

QUERY_REPOSITORIOS = """
query RepositoriosPopulares($first: Int!, $after: String) {
  rateLimit { remaining resetAt cost }
  search(query: "stars:>0 sort:stars-desc", type: REPOSITORY, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on Repository {
        nameWithOwner url stargazerCount createdAt updatedAt pushedAt
        description forkCount diskUsage isArchived hasSponsorshipsEnabled
        hasWikiEnabled hasIssuesEnabled isFork
        licenseInfo { name }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { nodes { name } }
        repositoryTopics(first: 10) { nodes { topic { name } } }
        mergedPRs: pullRequests(first: 1, states: MERGED) { totalCount }
        openPRs: pullRequests(first: 1, states: OPEN) { totalCount }
        releases(first: 1) { totalCount }
        openIssues: issues(first: 1, states: OPEN) { totalCount }
        closedIssues: issues(first: 1, states: CLOSED) { totalCount }
        watchers(first: 1) { totalCount }
        mentionableUsers(first: 1) { totalCount }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 50) {
                totalCount
                nodes { committedDate }
              }
            }
          }
        }
      }
    }
  }
}
"""

class GerenciadorTokens:
    def __init__(self, tokens: list[str]):
        if not tokens:
            raise RuntimeError("Nenhum token fornecido.")
        self.tokens = tokens
        self.atual = 0

    def obter_token(self) -> str:
        return self.tokens[self.atual]

    def proximo_token(self) -> None:
        if len(self.tokens) > 1:
            self.atual = (self.atual + 1) % len(self.tokens)
            print(f"Alternando para o token {self.atual + 1} de {len(self.tokens)}...")
        else:
            print("Aviso: Apenas um token disponível. Pausando por 60 segundos para evitar bloqueio...")
            sleep(60)

def carregar_tokens() -> list[str]:
    tokens = []
    
    if "GITHUB_TOKEN" in os.environ:
        tokens.extend(t.strip() for t in os.environ["GITHUB_TOKEN"].split(",") if t.strip())
        
    if not ARQUIVO_ENV.exists():
        return list(dict.fromkeys(tokens))
        
    for linha in ARQUIVO_ENV.read_text(encoding="utf-8").splitlines():
        chave, separador, valor = linha.partition("=")
        if separador:
            chave = chave.strip()
            valor = valor.strip().strip('"').strip("'")
            if chave == "GITHUB_TOKEN" and valor:
                tokens.extend(t.strip() for t in valor.split(",") if t.strip())
                
    return list(dict.fromkeys(tokens))


def consultar_github(gerenciador_tokens: GerenciadorTokens, query: str, variaveis: dict) -> dict:
    body = json.dumps({"query": query, "variables": variaveis}).encode("utf-8")
    for tentativa in range(10):
        token = gerenciador_tokens.obter_token()
        request = Request(API_URL, data=body, method="POST", headers={
            "Authorization": f"Bearer {token}", "Content-Type": "application/json",
            "User-Agent": "lab01-experimentacao-software",
        })
        try:
            with urlopen(request, timeout=45) as response:
                result = json.load(response)
                
            if result.get("errors"):
                mensagens = "; ".join(error.get("message", "") for error in result["errors"])
                if "rate limit" in mensagens.lower():
                    print("Rate limit atingido pelo GraphQL.")
                    gerenciador_tokens.proximo_token()
                    continue
                print(f"Aviso GraphQL: {mensagens}")
                
            rate_limit = result.get("data", {}).get("rateLimit")
            if rate_limit and rate_limit.get("remaining", 100) < 10:
                print(f"Rate limit próximo do fim (Restante: {rate_limit['remaining']}).")
                gerenciador_tokens.proximo_token()
                
            return result.get("data") or {}
            
        except HTTPError as error:
            if error.code in {403, 429}:
                print(f"GitHub respondeu HTTP {error.code}. Rate limit atingido.")
                gerenciador_tokens.proximo_token()
                continue
            if error.code not in {502, 503, 504} or tentativa >= 8:
                raise RuntimeError(f"GitHub respondeu HTTP {error.code}.") from error
        except (URLError, IncompleteRead, TimeoutError) as error:
            if tentativa >= 8:
                raise RuntimeError("Falha de conexão após várias tentativas.") from error
        
        espera = 2 ** min(tentativa, 6)
        print(f"Falha temporária; nova tentativa em {espera}s...")
        sleep(espera)


def analisar_commits(idade_dias: int, default_branch_ref: dict | None) -> tuple[int, float | None, int | None, float | None]:
    if not default_branch_ref or not default_branch_ref.get("target"):
        return 0, None, None, None
        
    history = default_branch_ref["target"].get("history", {})
    total_commits = history.get("totalCount", 0)
    
    media_historica = (idade_dias / total_commits) if total_commits > 0 else None
    
    nodes = history.get("nodes", [])
    if len(nodes) < 2:
        return total_commits, media_historica, None, None
        
    gaps = []
    for i in range(len(nodes) - 1):
        data_atual = datetime.fromisoformat(nodes[i]["committedDate"].replace("Z", "+00:00"))
        data_anterior = datetime.fromisoformat(nodes[i+1]["committedDate"].replace("Z", "+00:00"))
        gap = (data_atual - data_anterior).days
        gaps.append(max(0, gap))
        
    maior_gap = max(gaps) if gaps else None
    media_recente = (sum(gaps) / len(gaps)) if gaps else None
    
    return total_commits, media_historica, maior_gap, media_recente


def coletar_repositorios(gerenciador_tokens: GerenciadorTokens, limite: int) -> list[dict]:
    repositorios: list[dict] = []
    cursor = None
    while len(repositorios) < limite:
        tamanho_atual = min(TAMANHO_LOTE, limite - len(repositorios))
        dados = consultar_github(gerenciador_tokens, QUERY_REPOSITORIOS, {
            "first": tamanho_atual, "after": cursor,
        })
        
        if "search" not in dados:
            print("Erro ou limite alcançado ao buscar repositórios.")
            break
            
        pagina = dados["search"]
        for item in pagina.get("nodes", []):
            if item and item.get("nameWithOwner"):
                repositorios.append(item)
                
        print(f"Coletados {len(repositorios)} de {limite} repositórios.")
        
        if not pagina.get("pageInfo", {}).get("hasNextPage"):
            break
        cursor = pagina["pageInfo"]["endCursor"]
        
    return repositorios[:limite]


def salvar_csv(repositorios: list[dict]) -> None:
    campos = [
        "repositorio", "url", "descricao", "estrelas", "forks", "observadores", "usuarios_mencionaveis",
        "tamanho_kb", "e_fork", "esta_arquivado", "recebe_doacoes", "possui_wiki", "possui_issues",
        "licenca", "linguagens", "tags",
        "issues_abertas", "issues_fechadas", "issues_total", "razao_issues_fechadas",
        "pull_requests_abertas", "pull_requests_aceitas", "releases",
        "criado_em", "idade_dias", 
        "atualizado_em", "dias_desde_atualizacao", 
        "ultimo_push_em", "dias_desde_ultimo_push",
        "total_commits", "media_dias_entre_commits_historico",
        "maior_gap_recente_sem_codigo", "media_dias_commits_recentes"
    ]
    
    ARQUIVO_CSV.parent.mkdir(parents=True, exist_ok=True)
    with ARQUIVO_CSV.open("w", encoding="utf-8", newline="") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=campos)
        writer.writeheader()
        
        for rep in repositorios:
            agora = datetime.now(UTC)
            
            criado_em = datetime.fromisoformat(rep["createdAt"].replace("Z", "+00:00")) if rep.get("createdAt") else agora
            atualizado_em = datetime.fromisoformat(rep["updatedAt"].replace("Z", "+00:00")) if rep.get("updatedAt") else agora
            pushed_em = datetime.fromisoformat(rep["pushedAt"].replace("Z", "+00:00")) if rep.get("pushedAt") else agora
            
            idade_dias = (agora - criado_em).days
            
            total_commits, media_historica, maior_gap, media_recente = analisar_commits(idade_dias, rep.get("defaultBranchRef"))
            
            abertas = rep.get("openIssues", {}).get("totalCount", 0)
            fechadas = rep.get("closedIssues", {}).get("totalCount", 0)
            total_issues = abertas + fechadas
            
            descricao = rep.get("description") or ""
            descricao = " ".join(descricao.split())
            
            langs = [node["name"] for node in rep.get("languages", {}).get("nodes", [])]
            tags = [node["topic"]["name"] for node in rep.get("repositoryTopics", {}).get("nodes", [])]
            
            writer.writerow({
                "repositorio": rep.get("nameWithOwner"),
                "url": rep.get("url"),
                "descricao": descricao,
                "estrelas": rep.get("stargazerCount"),
                "forks": rep.get("forkCount"),
                "observadores": rep.get("watchers", {}).get("totalCount"),
                "usuarios_mencionaveis": rep.get("mentionableUsers", {}).get("totalCount"),
                "tamanho_kb": rep.get("diskUsage"),
                "e_fork": rep.get("isFork"),
                "esta_arquivado": rep.get("isArchived"),
                "recebe_doacoes": rep.get("hasSponsorshipsEnabled"),
                "possui_wiki": rep.get("hasWikiEnabled"),
                "possui_issues": rep.get("hasIssuesEnabled"),
                "licenca": rep.get("licenseInfo", {}).get("name") if rep.get("licenseInfo") else None,
                "linguagens": ", ".join(langs),
                "tags": ", ".join(tags),
                "issues_abertas": abertas,
                "issues_fechadas": fechadas,
                "issues_total": total_issues,
                "razao_issues_fechadas": round(fechadas / total_issues, 4) if total_issues else None,
                "pull_requests_abertas": rep.get("openPRs", {}).get("totalCount"),
                "pull_requests_aceitas": rep.get("mergedPRs", {}).get("totalCount"),
                "releases": rep.get("releases", {}).get("totalCount"),
                "criado_em": rep.get("createdAt"),
                "idade_dias": idade_dias,
                "atualizado_em": rep.get("updatedAt"),
                "dias_desde_atualizacao": max(0, (agora - atualizado_em).days),
                "ultimo_push_em": rep.get("pushedAt"),
                "dias_desde_ultimo_push": max(0, (agora - pushed_em).days),
                "total_commits": total_commits,
                "media_dias_entre_commits_historico": round(media_historica, 4) if media_historica is not None else None,
                "maior_gap_recente_sem_codigo": maior_gap,
                "media_dias_commits_recentes": round(media_recente, 4) if media_recente is not None else None
            })

def main() -> None:
    tokens = carregar_tokens()
    if not tokens:
        raise RuntimeError("Defina GITHUB_TOKEN no .env ou no ambiente.")
    
    print(f"Iniciando coleta com {len(tokens)} token(s) carregado(s).")
    gerenciador = GerenciadorTokens(tokens)
    
    repositorios = coletar_repositorios(gerenciador, N_REPOSITORIOS)
    salvar_csv(repositorios)
    print(f"{len(repositorios)} repositórios salvos em {ARQUIVO_CSV}.")

if __name__ == "__main__":
    main()
