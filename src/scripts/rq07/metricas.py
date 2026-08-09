"""Funções preparadas para a análise da RQ07 na Sprint 3."""

from __future__ import annotations

from collections import defaultdict
from statistics import median
from typing import Any


def calcular_mediana_por_linguagem(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Agrupa RQ02, RQ03 e RQ04 por linguagem; não executa nova consulta."""
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        linguagem = row.get("linguagem_primaria")
        if linguagem:
            groups[linguagem].append(row)

    result = []
    for linguagem, group in sorted(groups.items()):
        result.append({
            "linguagem_primaria": linguagem,
            "quantidade_repositorios": len(group),
            "mediana_pull_requests_aceitas": median(item["pull_requests_aceitas"] for item in group),
            "mediana_releases": median(item["releases"] for item in group),
            "mediana_dias_desde_atualizacao": median(item["dias_desde_atualizacao"] for item in group),
        })
    return result
