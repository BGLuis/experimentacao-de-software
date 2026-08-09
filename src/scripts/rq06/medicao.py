"""Imprime a razão de issues fechadas para cada repositório do CSV."""

import csv
from pathlib import Path

ARQUIVO_CSV = Path("data/repositorios_populares.csv")


class medicao:
    """Mede a razão: issues fechadas / total de issues."""

    def __init__(self, issues_fechadas: int, total_issues: int) -> None:
        if issues_fechadas < 0 or total_issues < 0:
            raise ValueError("As quantidades de issues não podem ser negativas.")
        if issues_fechadas > total_issues:
            raise ValueError("Issues fechadas não podem superar o total de issues.")
        self.issues_fechadas = issues_fechadas
        self.total_issues = total_issues
        self.razao = issues_fechadas / total_issues if total_issues else None

    def imprimir(self, repositorio: str) -> None:
        if self.razao is None:
            print(f"{repositorio}: sem issues para medir")
        else:
            print(
                f"{repositorio}: {self.razao:.2%} de issues fechadas "
                f"({self.issues_fechadas} / {self.total_issues})"
            )


def main() -> None:
    with ARQUIVO_CSV.open(encoding="utf-8", newline="") as arquivo:
        for row in csv.DictReader(arquivo):
            medicao(
                issues_fechadas=int(row["issues_fechadas"]),
                total_issues=int(row["issues_total"]),
            ).imprimir(row["repositorio"])


if __name__ == "__main__":
    main()
