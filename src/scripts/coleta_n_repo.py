"""Coleta os N repositórios mais estrelados e métricas das RQs 01 a 06."""

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

# Configuração: o primeiro valor é o total; o segundo é o lote de descoberta.
N_REPOSITORIOS = 100
TAMANHO_LOTE = 40

API_URL = "https://api.github.com/graphql"
ARQUIVO_CSV = Path("data/repositorios_populares.csv")
ARQUIVO_ENV = Path(__file__).resolve().parents[2] / ".env"

# Consulta leve: encontra os repositórios em ordem de estrelas.
QUERY_REPOSITORIOS = """
query RepositoriosPopulares($first: Int!, $after: String) {
  search(query: "stars:>0 sort:stars-desc", type: REPOSITORY, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on Repository { nameWithOwner } }
  }
}
"""

# Consulta pequena: busca todas as métricas de somente um repositório por vez.
QUERY_METRICAS = """
query MetricasRepositorio($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    url
    stargazerCount
    createdAt
    updatedAt
    primaryLanguage { name }
    pullRequests(first: 1, states: MERGED) { totalCount }
    releases(first: 1) { totalCount }
    openIssues: issues(first: 1, states: OPEN) { totalCount }
    closedIssues: issues(first: 1, states: CLOSED) { totalCount }
  }
}
"""


def carregar_env() -> None:
    """Carrega GITHUB_TOKEN do .env da raiz, sem biblioteca externa."""
    if not ARQUIVO_ENV.exists():
        return
    for linha in ARQUIVO_ENV.read_text(encoding="utf-8").splitlines():
        chave, separador, valor = linha.partition("=")
        if separador and chave.strip() == "GITHUB_TOKEN" and valor.strip():
            os.environ.setdefault("GITHUB_TOKEN", valor.strip().strip('"').strip("'"))
            return


def consultar_github(token: str, query: str, variaveis: dict) -> dict:
    """Executa uma query e repete falhas temporárias de rede/gateway."""
    body = json.dumps({"query": query, "variables": variaveis}).encode("utf-8")
    request = Request(API_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "lab01-experimentacao-software",
    })
    for tentativa in range(5):
        try:
            with urlopen(request, timeout=30) as response:
                result = json.load(response)
            break
        except HTTPError as error:
            if error.code not in {502, 503, 504} or tentativa == 4:
                raise RuntimeError(f"GitHub respondeu HTTP {error.code}.") from error
        except (URLError, IncompleteRead, TimeoutError) as error:
            if tentativa == 4:
                raise RuntimeError("Falha de conexão após 5 tentativas.") from error
        espera = 2 ** tentativa
        print(f"Falha temporária; nova tentativa em {espera}s...")
        sleep(espera)

    if result.get("errors"):
        mensagens = "; ".join(error["message"] for error in result["errors"])
        raise RuntimeError(f"Erro GraphQL: {mensagens}")
    return result["data"]


def coletar_repositorios(token: str, limite: int) -> list[dict]:
    """Descobre em lotes e coleta métricas individuais, evitando query pesada."""
    if not 1 <= limite <= 1000:
        raise ValueError("N_REPOSITORIOS deve estar entre 1 e 1000.")
    if TAMANHO_LOTE < 1:
        raise ValueError("TAMANHO_LOTE deve ser maior que zero.")

    repositorios: list[dict] = []
    cursor = None
    while len(repositorios) < limite:
        tamanho_atual = min(TAMANHO_LOTE, limite - len(repositorios))
        pagina = consultar_github(token, QUERY_REPOSITORIOS, {
            "first": tamanho_atual, "after": cursor,
        })["search"]

        for item in pagina["nodes"]:
            if not item:
                continue
            owner, nome = item["nameWithOwner"].split("/", maxsplit=1)
            metricas = consultar_github(token, QUERY_METRICAS, {"owner": owner, "name": nome})
            repositorios.append(metricas["repository"])
            print(f"Coletados {len(repositorios)} de {limite} repositórios.")

        if not pagina["pageInfo"]["hasNextPage"]:
            break
        cursor = pagina["pageInfo"]["endCursor"]
    return repositorios


def salvar_csv(repositorios: list[dict]) -> None:
    campos = [
        "repositorio", "url", "estrelas", "criado_em", "idade_dias",
        "atualizado_em", "dias_desde_atualizacao", "linguagem_primaria",
        "pull_requests_aceitas", "releases", "issues_abertas", "issues_fechadas",
        "issues_total", "razao_issues_fechadas",
    ]
    ARQUIVO_CSV.parent.mkdir(parents=True, exist_ok=True)
    with ARQUIVO_CSV.open("w", encoding="utf-8", newline="") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=campos)
        writer.writeheader()
        for repositorio in repositorios:
            agora = datetime.now(UTC)
            criado = datetime.fromisoformat(repositorio["createdAt"].replace("Z", "+00:00"))
            atualizado = datetime.fromisoformat(repositorio["updatedAt"].replace("Z", "+00:00"))
            abertas = repositorio["openIssues"]["totalCount"]
            fechadas = repositorio["closedIssues"]["totalCount"]
            total_issues = abertas + fechadas
            linguagem = repositorio.get("primaryLanguage") or {}
            writer.writerow({
                "repositorio": repositorio["nameWithOwner"],
                "url": repositorio["url"],
                "estrelas": repositorio["stargazerCount"],
                "criado_em": repositorio["createdAt"],
                "idade_dias": (agora - criado).days,
                "atualizado_em": repositorio["updatedAt"],
                "dias_desde_atualizacao": (agora - atualizado).days,
                "linguagem_primaria": linguagem.get("name"),
                "pull_requests_aceitas": repositorio["pullRequests"]["totalCount"],
                "releases": repositorio["releases"]["totalCount"],
                "issues_abertas": abertas,
                "issues_fechadas": fechadas,
                "issues_total": total_issues,
                "razao_issues_fechadas": fechadas / total_issues if total_issues else None,
            })


def main() -> None:
    carregar_env()
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("Defina GITHUB_TOKEN no .env ou no ambiente.")
    repositorios = coletar_repositorios(token, N_REPOSITORIOS)
    salvar_csv(repositorios)
    print(f"{len(repositorios)} repositórios salvos em {ARQUIVO_CSV}.")


if __name__ == "__main__":
    main()
