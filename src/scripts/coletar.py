"""Comando integrado da Sprint 1 para coletar as métricas das RQs 01 a 06."""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .github_graphql import GitHubGraphQLClient
from .rq05.metricas import obter_linguagem_primaria
from .rq06.metricas import calcular_razao_issues_fechadas

CSV_FIELDS = [
    "repositorio", "url", "estrelas", "criado_em", "idade_dias", "atualizado_em",
    "dias_desde_atualizacao", "linguagem_primaria", "pull_requests_aceitas", "releases",
    "issues_abertas", "issues_fechadas", "issues_total", "razao_issues_fechadas",
]


def parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalizar_repositorios(repositories: list[dict[str, Any]]) -> list[dict[str, Any]]:
    now = datetime.now(UTC)
    rows: list[dict[str, Any]] = []
    for repository in repositories:
        abertas = repository["openIssues"]["totalCount"]
        fechadas = repository["closedIssues"]["totalCount"]
        created_at = parse_datetime(repository["createdAt"])
        updated_at = parse_datetime(repository["updatedAt"])
        rows.append({
            "repositorio": repository["nameWithOwner"],
            "url": repository["url"],
            "estrelas": repository["stargazerCount"],
            "criado_em": repository["createdAt"],
            "idade_dias": (now - created_at).days,
            "atualizado_em": repository["updatedAt"],
            "dias_desde_atualizacao": (now - updated_at).days,
            "linguagem_primaria": obter_linguagem_primaria(repository),
            "pull_requests_aceitas": repository["pullRequests"]["totalCount"],
            "releases": repository["releases"]["totalCount"],
            "issues_abertas": abertas,
            "issues_fechadas": fechadas,
            "issues_total": abertas + fechadas,
            "razao_issues_fechadas": calcular_razao_issues_fechadas(abertas, fechadas),
        })
    return rows


def exportar(rows: list[dict[str, Any]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "repositorios.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    (output_dir / "repositorios.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta dados para as RQs 01 a 06 do Lab01.")
    parser.add_argument("--limit", type=int, default=100, help="Quantidade de repositórios (1 a 100).")
    parser.add_argument("--output-dir", type=Path, default=Path("data"))
    args = parser.parse_args()
    if not 1 <= args.limit <= 100:
        parser.error("na Sprint 1, --limit deve estar entre 1 e 100")
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("Defina GITHUB_TOKEN no ambiente antes de executar a coleta.", file=sys.stderr)
        return 2
    repositories = GitHubGraphQLClient(token).fetch_popular_repositories(args.limit)
    rows = normalizar_repositorios(repositories)
    exportar(rows, args.output_dir)
    print(f"Coleta concluída: {len(rows)} repositórios exportados em {args.output_dir}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
