"""Cliente GraphQL próprio para a API pública do GitHub."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_URL = "https://api.github.com/graphql"

POPULAR_REPOSITORIES_QUERY = """
query PopularRepositories($first: Int!) {
  search(query: "stars:>0 sort:stars-desc", type: REPOSITORY, first: $first) {
    nodes {
      ... on Repository {
        nameWithOwner
        url
        stargazerCount
        createdAt
        updatedAt
        primaryLanguage { name }
        pullRequests(states: MERGED) { totalCount }
        releases { totalCount }
        openIssues: issues(states: OPEN) { totalCount }
        closedIssues: issues(states: CLOSED) { totalCount }
      }
    }
  }
}
"""


class GitHubGraphQLClient:
    """Executa consultas GraphQL sem SDKs ou bibliotecas de terceiros."""

    def __init__(self, token: str) -> None:
        self.token = token

    def fetch_popular_repositories(self, limit: int) -> list[dict[str, Any]]:
        payload = json.dumps({
            "query": POPULAR_REPOSITORIES_QUERY,
            "variables": {"first": limit},
        }).encode("utf-8")
        request = Request(
            API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "User-Agent": "lab01-experimentacao-software",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                result = json.load(response)
        except HTTPError as error:
            raise RuntimeError(f"GitHub respondeu HTTP {error.code}.") from error
        except URLError as error:
            raise RuntimeError("Não foi possível conectar à API do GitHub.") from error

        if errors := result.get("errors"):
            details = "; ".join(error["message"] for error in errors)
            raise RuntimeError(f"Erro na consulta GraphQL: {details}")

        return [node for node in result["data"]["search"]["nodes"] if node]
