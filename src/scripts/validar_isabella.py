"""Script de validação para as métricas RQ03 e RQ04."""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from rq03.metricas import obter_total_releases
from rq04.metricas import obter_dias_desde_atualizacao

API_URL = "https://api.github.com/graphql"
ARQUIVO_ENV = Path(__file__).resolve().parents[2] / ".env"

QUERY_VALIDACAO = """
query ValidaMetricasIsabella($first: Int!) {
  search(query: "stars:>0 sort:stars-desc", type: REPOSITORY, first: $first) {
    nodes {
      ... on Repository {
        nameWithOwner
        pushedAt
        releases(first: 1) { totalCount }
      }
    }
  }
}
"""


def carregar_env() -> None:
    """Carrega as variáveis de ambiente do arquivo .env"""
    if not ARQUIVO_ENV.exists():
        return
    for linha in ARQUIVO_ENV.read_text(encoding="utf-8").splitlines():
        chave, separador, valor = linha.partition("=")
        if separador and chave.strip() == "GITHUB_TOKEN" and valor.strip():
            os.environ.setdefault("GITHUB_TOKEN", valor.strip().strip('"').strip("'"))
            return


def consultar_github(token: str, quantidade: int) -> dict:
    """Faz a consulta das métricas para validação usando a API GraphQL."""
    body = json.dumps({
        "query": QUERY_VALIDACAO,
        "variables": {"first": quantidade},
    }).encode("utf-8")
    request = Request(
        API_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "lab01-isabella",
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
        mensagens = "; ".join(error["message"] for error in result["errors"])
        raise RuntimeError(f"Erro GraphQL: {mensagens}")
    return result["data"]["search"]


def main() -> None:
    print("Iniciando script de validação das RQs 03 e 04 (Amostra)...")
    carregar_env()
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("Erro: GITHUB_TOKEN não encontrado. Por favor, defina no arquivo .env.")
        return

    print("Consultando 10 repositórios...\n")
    resultado = consultar_github(token, 10)
    repositorios = [node for node in resultado["nodes"] if node]

    print("--- Resultados da Validação ---")
    for repo in repositorios:
        nome = repo.get("nameWithOwner")
        total_releases = obter_total_releases(repo)
        dias_atualizacao = obter_dias_desde_atualizacao(repo)
        data_bruta = repo.get("pushedAt")

        print(f"Repositório: {nome}")
        print(f"  - Data bruta da API (Push): {data_bruta}")
        print(f"  - RQ03 (Total de Releases): {total_releases}")
        print(f"  - RQ04 (Tempo desde o último Push): {dias_atualizacao}")
        print("-" * 35)

    print("Validação concluída com sucesso.")


if __name__ == "__main__":
    main()
