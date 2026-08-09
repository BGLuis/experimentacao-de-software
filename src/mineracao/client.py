"""Cliente mínimo para a API GraphQL do GitHub."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .query import POPULAR_REPOSITORIES_QUERY

GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"


class GitHubGraphQLClient:
    def __init__(self, token: str) -> None:
        self.token = token

    def fetch_popular_repositories(self, first: int) -> list[dict[str, Any]]:
        payload = json.dumps({"query": POPULAR_REPOSITORIES_QUERY, "variables": {"first": first}}).encode()
        request = Request(GITHUB_GRAPHQL_URL, data=payload, headers={
            "Authorization": f"Bearer {self.token}", "Content-Type": "application/json",
            "User-Agent": "lab-experimentacao-software",
        }, method="POST")
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
        return [node for node in result["data"]["search"]["nodes"] if node]
