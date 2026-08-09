"""Normalização e exportação dos resultados da mineração."""

from __future__ import annotations

import csv
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

FIELDS = ["nome", "repositorio", "url", "estrelas", "criado_em", "idade_dias", "atualizado_em", "dias_desde_atualizacao", "linguagem_primaria", "pull_requests_aceitas", "releases", "issues_abertas", "issues_fechadas", "issues_total", "razao_issues_fechadas"]


def _parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize_repositories(repositories: list[dict[str, Any]]) -> list[dict[str, Any]]:
    now = datetime.now(UTC)
    rows: list[dict[str, Any]] = []
    for repository in repositories:
        created_at, updated_at = _parse_datetime(repository["createdAt"]), _parse_datetime(repository["updatedAt"])
        open_issues, closed_issues = repository["openIssues"]["totalCount"], repository["closedIssues"]["totalCount"]
        total_issues = open_issues + closed_issues
        language = repository.get("primaryLanguage") or {}
        rows.append({"nome": repository["name"], "repositorio": repository["nameWithOwner"], "url": repository["url"], "estrelas": repository["stargazerCount"], "criado_em": repository["createdAt"], "idade_dias": (now - created_at).days, "atualizado_em": repository["updatedAt"], "dias_desde_atualizacao": (now - updated_at).days, "linguagem_primaria": language.get("name"), "pull_requests_aceitas": repository["pullRequests"]["totalCount"], "releases": repository["releases"]["totalCount"], "issues_abertas": open_issues, "issues_fechadas": closed_issues, "issues_total": total_issues, "razao_issues_fechadas": round(closed_issues / total_issues, 4) if total_issues else None})
    return rows


def export_csv(rows: list[dict[str, Any]], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def export_json(rows: list[dict[str, Any]], path: Path) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
