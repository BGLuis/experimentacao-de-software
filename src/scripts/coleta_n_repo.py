"""Coleta os N repositórios públicos mais estrelados do GitHub.

Defina N_REPOSITORIOS abaixo e execute:
    $env:GITHUB_TOKEN="seu_token"
    py src/scripts/coletar_repositorios_populares.py
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# Configuração da coleta: altere somente este valor quando necessário.
N_REPOSITORIOS = 100

API_URL = "https://api.github.com/graphql"
ARQUIVO_CSV = Path("data/repositorios_populares.csv")
ARQUIVO_ENV = Path(__file__).resolve().parents[2] / ".env"

QUERY = """
query RepositoriosPopulares($first: Int!, $after: String) {
  search(
    query: "stars:>0 sort:stars-desc"
    type: REPOSITORY
    first: $first
    after: $after
  ) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on Repository {
        nameWithOwner
        url
        stargazerCount
      }
    }
  }
}
"""


def consultar_github(token: str, quantidade: int, cursor: str | None) -> dict:
    """Faz uma requisição GraphQL ao GitHub."""
    body = json.dumps({
        "query": QUERY,
        "variables": {"first": quantidade, "after": cursor},
    }).encode("utf-8")
    request = Request(
        API_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "lab01-experimentacao-software",
        },
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.load(response)
    except HTTPError as error:
        raise RuntimeError(f"GitHub respondeu HTTP {error.code}.") from error
    except URLError as error:
        raise RuntimeError("Não foi possível conectar à API do GitHub.") from error

    if result.get("errors"):
        messages = "; ".join(error["message"] for error in result["errors"])
        raise RuntimeError(f"Erro GraphQL: {messages}")
    return result["data"]["search"]


def coletar_repositorios(token: str, limite: int) -> list[dict]:
    """Coleta até 1.000 repositórios em ordem decrescente de estrelas."""
    if not 1 <= limite <= 1000:
        raise ValueError("N_REPOSITORIOS deve estar entre 1 e 1000.")

    repositorios: list[dict] = []
    cursor = None
    while len(repositorios) < limite:
        lote = min(100, limite - len(repositorios))
        resultado = consultar_github(token, lote, cursor)
        repositorios.extend(node for node in resultado["nodes"] if node)

        page_info = resultado["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        cursor = page_info["endCursor"]
    return repositorios


def salvar_csv(repositorios: list[dict]) -> None:
    """Salva somente os campos necessários para identificar e ordenar os repositórios."""
    ARQUIVO_CSV.parent.mkdir(parents=True, exist_ok=True)
    with ARQUIVO_CSV.open("w", encoding="utf-8", newline="") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=["repositorio", "url", "estrelas"])
        writer.writeheader()
        for repositorio in repositorios:
            writer.writerow({
                "repositorio": repositorio["nameWithOwner"],
                "url": repositorio["url"],
                "estrelas": repositorio["stargazerCount"],
            })


def carregar_env() -> None:
    """Carrega GITHUB_TOKEN do .env da raiz, sem bibliotecas externas."""
    if not ARQUIVO_ENV.exists():
        return

    for linha in ARQUIVO_ENV.read_text(encoding="utf-8").splitlines():
        chave, separador, valor = linha.partition("=")
        if chave.strip() == "GITHUB_TOKEN" and separador and valor.strip():
            os.environ.setdefault("GITHUB_TOKEN", valor.strip().strip('"').strip("'"))
            return


def main() -> None:
    carregar_env()
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("Defina a variável de ambiente GITHUB_TOKEN antes de executar.")

    repositorios = coletar_repositorios(token, N_REPOSITORIOS)
    salvar_csv(repositorios)
    print(f"{len(repositorios)} repositórios salvos em {ARQUIVO_CSV}.")


if __name__ == "__main__":
    main()
