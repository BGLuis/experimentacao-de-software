from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from http.client import IncompleteRead
from pathlib import Path
from time import sleep
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# --- Configurações ---
API_URL = "https://api.github.com/graphql"
ARQUIVO_ENV = Path(__file__).resolve().parents[2] / ".env"
MAX_CONCORRENCIA_POR_TOKEN = 3

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'

# --- Queries GraphQL ---
QUERY_BUSCAR_NOMES = """
query BuscarNomes($queryStr: String!, $first: Int!, $after: String) {
  search(query: $queryStr, type: REPOSITORY, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on Repository { nameWithOwner stargazerCount } }
  }
}
"""

QUERY_METRICAS = """
query MetricasRepo($owner: String!, $name: String!) {
  rateLimit { remaining resetAt cost }
  repository(owner: $owner, name: $name) {
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
"""

CAMPOS_CSV = [
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


# --- Classes de Gerenciamento de Tokens ---
class TokenInfo:
    def __init__(self, token: str):
        self.token = token
        self.remaining = 5000  # Valor otimista
        self.reset_at = time.time()
        self.concorrencia_atual = 0

class GerenciadorTokens:
    def __init__(self, tokens: list[str]):
        if not tokens:
            raise RuntimeError(f"{Colors.RED}Nenhum token fornecido.{Colors.RESET}")
        self.tokens_info = [TokenInfo(t) for t in tokens]
        self.lock = threading.Lock()

    def obter_token_seguro(self) -> TokenInfo:
        while True:
            with self.lock:
                agora = time.time()
                # Libera saldo para tokens que já passaram da janela de reset
                for ti in self.tokens_info:
                    if agora >= ti.reset_at and ti.remaining < 50:
                        ti.remaining = 5000

                # Busca tokens viáveis
                disponiveis = [ti for ti in self.tokens_info 
                               if ti.remaining > 50 and ti.concorrencia_atual < MAX_CONCORRENCIA_POR_TOKEN]
                
                if disponiveis:
                    # Pega o que está mais livre no momento para distribuir carga
                    escolhido = min(disponiveis, key=lambda t: t.concorrencia_atual)
                    escolhido.concorrencia_atual += 1
                    return escolhido
                
                # Se não tem disponíveis, entender o motivo
                tem_saldo = any(ti.remaining > 50 for ti in self.tokens_info)
                if tem_saldo:
                    # Apenas aguardar liberar a thread de algum token
                    pass 
                else:
                    # Burnout! Aguardar até o reset_at mais próximo
                    proximo_reset = min(ti.reset_at for ti in self.tokens_info)
                    espera = max(1.0, proximo_reset - agora + 2)  # +2s de margem
                    print(f"\n{Colors.YELLOW}Todos tokens esgotados! Aguardando {espera:.0f}s até reset da API...{Colors.RESET}")
                    sleep(espera)
                    continue

            # Breve pausa (fora do lock) para aguardar threads terminarem
            sleep(0.2)

    def liberar_token(self, token_info: TokenInfo, remaining: int = None, reset_at_str: str = None):
        with self.lock:
            token_info.concorrencia_atual = max(0, token_info.concorrencia_atual - 1)
            if remaining is not None:
                token_info.remaining = remaining
            if reset_at_str is not None:
                try:
                    dt = datetime.fromisoformat(reset_at_str.replace("Z", "+00:00"))
                    token_info.reset_at = dt.timestamp()
                except Exception:
                    pass


# --- Funções Auxiliares ---
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

def ler_repositorios_processados(caminho_csv: Path) -> set[str]:
    processados = set()
    if caminho_csv.exists():
        with caminho_csv.open("r", encoding="utf-8") as arquivo:
            try:
                reader = csv.DictReader(arquivo)
                for row in reader:
                    if row.get("repositorio"):
                        processados.add(row["repositorio"])
            except Exception:
                pass
    return processados

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


# --- Fase 1: Descoberta ---
def consultar_graphql_simples(token: str, query: str, variaveis: dict) -> dict:
    body = json.dumps({"query": query, "variables": variaveis}).encode("utf-8")
    for tentativa in range(5):
        request = Request(API_URL, data=body, method="POST", headers={
            "Authorization": f"Bearer {token}", "Content-Type": "application/json",
            "User-Agent": "lab01-experimentacao-software",
        })
        try:
            with urlopen(request, timeout=30) as response:
                result = json.load(response)
            if result.get("errors"):
                # Falhas na query GraphQL
                print(f"\nErro GraphQL na busca: {result['errors']}")
                sleep(2 ** tentativa)
                continue
            return result.get("data") or {}
        except HTTPError as e:
            if e.code in {403, 429}:
                sleep(2 ** tentativa)
            else:
                sleep(2 ** tentativa)
        except Exception:
            sleep(2 ** tentativa)
            
    raise RuntimeError("Falha ao consultar API na descoberta após 5 tentativas.")

def fase1_descobrir_repositorios(tokens: list[str], limite: int) -> list[tuple[str, str]]:
    print(f"{Colors.GREEN}Fase 1: Descobrindo até {limite} repositórios...{Colors.RESET}")
    token = tokens[0]  # Usa o primeiro token para a busca leve
    repositorios_descobertos = []
    
    ultimo_stars = None
    cursor = None
    
    while len(repositorios_descobertos) < limite:
        if ultimo_stars is None:
            query_str = "stars:>0 sort:stars-desc"
        else:
            query_str = f"stars:<={ultimo_stars} sort:stars-desc"
            
        try:
            dados = consultar_graphql_simples(token, QUERY_BUSCAR_NOMES, {
                "queryStr": query_str,
                "first": min(100, limite - len(repositorios_descobertos)),
                "after": cursor
            })
        except Exception as e:
            print(f"\n{Colors.RED}Falha na busca de nomes: {e}{Colors.RESET}")
            break
        
        search_data = dados.get("search", {})
        nodes = search_data.get("nodes", [])
        
        for node in nodes:
            if not node or not node.get("nameWithOwner"):
                continue
            owner, name = node["nameWithOwner"].split("/", 1)
            repo_id = f"{owner}/{name}"
            # Evitar duplicatas exatas devido ao operador <=
            if not any(r[0] == owner and r[1] == name for r in repositorios_descobertos):
                repositorios_descobertos.append((owner, name, node.get("stargazerCount")))
                
        sys.stdout.write(f"\r{Colors.GREEN}Descobertos: {len(repositorios_descobertos)} / {limite}{Colors.RESET}")
        sys.stdout.flush()
        
        page_info = search_data.get("pageInfo", {})
        if page_info.get("hasNextPage"):
            cursor = page_info["endCursor"]
        else:
            # Pular barreira dos 1000 da pesquisa atual
            if repositorios_descobertos:
                novo_ultimo_stars = repositorios_descobertos[-1][2]
                if novo_ultimo_stars == ultimo_stars:
                    ultimo_stars -= 1  # Força desempate se muitos repos tiverem o mesmo nr de estrelas
                else:
                    ultimo_stars = novo_ultimo_stars
            else:
                break
            cursor = None
            
    print(f"\n{Colors.GREEN}Fase 1 concluída!{Colors.RESET}\n")
    return [(r[0], r[1]) for r in repositorios_descobertos[:limite]]


# --- Fase 2: Coleta Pesada ---
csv_lock = threading.Lock()
contagem_sucesso = 0
contagem_falha = 0

def processar_repositorio(owner: str, name: str, gerenciador: GerenciadorTokens, caminho_saida: Path):
    global contagem_sucesso, contagem_falha
    
    token_info = gerenciador.obter_token_seguro()
    rate_limit = None
    
    try:
        body = json.dumps({"query": QUERY_METRICAS, "variables": {"owner": owner, "name": name}}).encode("utf-8")
        request = Request(API_URL, data=body, method="POST", headers={
            "Authorization": f"Bearer {token_info.token}", "Content-Type": "application/json",
            "User-Agent": "lab01-experimentacao-software",
        })
        
        sucesso = False
        repo_data = None
        
        for tentativa in range(6):
            try:
                with urlopen(request, timeout=30) as response:
                    result = json.load(response)
                
                rate_limit = result.get("data", {}).get("rateLimit")
                
                if result.get("errors"):
                    mensagens = "; ".join(error.get("message", "") for error in result["errors"])
                    if "rate limit" in mensagens.lower():
                        sleep(5)
                        continue
                    # Erro grave interno do repo, pular
                    break
                    
                repo_data = result.get("data", {}).get("repository")
                if repo_data:
                    sucesso = True
                break
            except HTTPError as e:
                # 502/504 são muito comuns em queries pesadas no GH, tentar backoff
                sleep((2 ** tentativa) + 1)
            except (URLError, IncompleteRead, TimeoutError):
                sleep((2 ** tentativa) + 1)
                
        if not sucesso or not repo_data:
            with csv_lock:
                contagem_falha += 1
            return False
            
        # Parse dados e salva no CSV
        agora = datetime.now(UTC)
        criado_em = datetime.fromisoformat(repo_data["createdAt"].replace("Z", "+00:00")) if repo_data.get("createdAt") else agora
        atualizado_em = datetime.fromisoformat(repo_data["updatedAt"].replace("Z", "+00:00")) if repo_data.get("updatedAt") else agora
        pushed_em = datetime.fromisoformat(repo_data["pushedAt"].replace("Z", "+00:00")) if repo_data.get("pushedAt") else agora
        
        idade_dias = (agora - criado_em).days
        total_commits, media_historica, maior_gap, media_recente = analisar_commits(idade_dias, repo_data.get("defaultBranchRef"))
        
        abertas = repo_data.get("openIssues", {}).get("totalCount", 0)
        fechadas = repo_data.get("closedIssues", {}).get("totalCount", 0)
        total_issues = abertas + fechadas
        
        descricao = repo_data.get("description") or ""
        descricao = " ".join(descricao.split())
        
        langs = [node["name"] for node in repo_data.get("languages", {}).get("nodes", [])]
        tags = [node["topic"]["name"] for node in repo_data.get("repositoryTopics", {}).get("nodes", [])]
        
        linha = {
            "repositorio": repo_data.get("nameWithOwner"),
            "url": repo_data.get("url"),
            "descricao": descricao,
            "estrelas": repo_data.get("stargazerCount"),
            "forks": repo_data.get("forkCount"),
            "observadores": repo_data.get("watchers", {}).get("totalCount"),
            "usuarios_mencionaveis": repo_data.get("mentionableUsers", {}).get("totalCount"),
            "tamanho_kb": repo_data.get("diskUsage"),
            "e_fork": repo_data.get("isFork"),
            "esta_arquivado": repo_data.get("isArchived"),
            "recebe_doacoes": repo_data.get("hasSponsorshipsEnabled"),
            "possui_wiki": repo_data.get("hasWikiEnabled"),
            "possui_issues": repo_data.get("hasIssuesEnabled"),
            "licenca": repo_data.get("licenseInfo", {}).get("name") if repo_data.get("licenseInfo") else None,
            "linguagens": ", ".join(langs),
            "tags": ", ".join(tags),
            "issues_abertas": abertas,
            "issues_fechadas": fechadas,
            "issues_total": total_issues,
            "razao_issues_fechadas": round(fechadas / total_issues, 4) if total_issues else None,
            "pull_requests_abertas": repo_data.get("openPRs", {}).get("totalCount"),
            "pull_requests_aceitas": repo_data.get("mergedPRs", {}).get("totalCount"),
            "releases": repo_data.get("releases", {}).get("totalCount"),
            "criado_em": repo_data.get("createdAt"),
            "idade_dias": idade_dias,
            "atualizado_em": repo_data.get("updatedAt"),
            "dias_desde_atualizacao": max(0, (agora - atualizado_em).days),
            "ultimo_push_em": repo_data.get("pushedAt"),
            "dias_desde_ultimo_push": max(0, (agora - pushed_em).days),
            "total_commits": total_commits,
            "media_dias_entre_commits_historico": round(media_historica, 4) if media_historica is not None else None,
            "maior_gap_recente_sem_codigo": maior_gap,
            "media_dias_commits_recentes": round(media_recente, 4) if media_recente is not None else None
        }
        
        with csv_lock:
            with caminho_saida.open("a", encoding="utf-8", newline="") as arquivo:
                writer = csv.DictWriter(arquivo, fieldnames=CAMPOS_CSV)
                writer.writerow(linha)
            contagem_sucesso += 1
            
        return True
            
    finally:
        remaining = rate_limit.get("remaining") if rate_limit else None
        reset_at = rate_limit.get("resetAt") if rate_limit else None
        gerenciador.liberar_token(token_info, remaining, reset_at)

def atualizar_barra_fase2(total: int):
    global contagem_sucesso, contagem_falha
    while True:
        with csv_lock:
            sucesso = contagem_sucesso
            falha = contagem_falha
            
        processados = sucesso + falha
        sys.stdout.write(f"\r{Colors.GREEN}Coletando métricas: {sucesso} OK | {falha} Erros | Total: {processados}/{total}{Colors.RESET}")
        sys.stdout.flush()
        
        if processados >= total:
            break
        sleep(0.5)


# --- Principal ---
def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta os repositórios mais estrelados em paralelo e extrai métricas.")
    parser.add_argument("-l", "--limit", type=int, default=10000, help="Quantidade de repositórios a buscar (padrão: 10000).")
    parser.add_argument("-o", "--output", type=str, default="data/repositorios_populares.csv", help="Caminho do CSV de saída.")
    parser.add_argument("-w", "--workers", type=int, default=None, help="Num. de workers (padrão: 3 por token disponível).")
    args = parser.parse_args()

    tokens = carregar_tokens()
    if not tokens:
        raise RuntimeError(f"{Colors.RED}Defina GITHUB_TOKEN no .env ou no ambiente.{Colors.RESET}")
        
    gerenciador = GerenciadorTokens(tokens)
    caminho_saida = Path(args.output)
    
    inicio = time.time()
    
    # Prepara CSV e avalia Resume (Skip)
    caminho_saida.parent.mkdir(parents=True, exist_ok=True)
    processados = ler_repositorios_processados(caminho_saida)
    if not caminho_saida.exists() or not processados:
        with caminho_saida.open("w", encoding="utf-8", newline="") as arquivo:
            writer = csv.DictWriter(arquivo, fieldnames=CAMPOS_CSV)
            writer.writeheader()
    
    if processados:
        print(f"{Colors.YELLOW}Recuperação ativa: {len(processados)} repositórios já presentes no arquivo serão pulados.{Colors.RESET}")
    
    # Fase 1: Descobrir nomes
    lista_descoberta = fase1_descobrir_repositorios(tokens, args.limit)
    
    # Filtrar já processados
    lista_pendente = [(o, n) for o, n in lista_descoberta if f"{o}/{n}" not in processados]
    
    if not lista_pendente:
        print(f"\n{Colors.GREEN}Todos os {len(lista_descoberta)} repositórios já foram processados!{Colors.RESET}")
        return
        
    # Calcular workers
    workers = args.workers if args.workers else len(tokens) * MAX_CONCORRENCIA_POR_TOKEN
    print(f"{Colors.GREEN}Fase 2: Iniciando coleta pesada de {len(lista_pendente)} repositórios usando {workers} workers...{Colors.RESET}")
    
    # Thread para barra de progresso visual
    barra_thread = threading.Thread(target=atualizar_barra_fase2, args=(len(lista_pendente),), daemon=True)
    barra_thread.start()
    
    # Executar Threads
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futuros = {executor.submit(processar_repositorio, owner, name, gerenciador, caminho_saida): (owner, name) 
                   for owner, name in lista_pendente}
        
        for _ in as_completed(futuros):
            pass  # Barra de progresso cuida da exibição
            
    barra_thread.join()
            
    tempo_total = time.time() - inicio
    print(f"\n\n{Colors.GREEN}Coleta concluída com sucesso em {tempo_total:.2f} segundos!{Colors.RESET}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Execução interrompida pelo usuário.{Colors.RESET}")
        sys.exit(0)
