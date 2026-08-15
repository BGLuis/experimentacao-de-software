"""Imprime a linguagem primária de cada repositório do CSV para a RQ05."""

import csv
from pathlib import Path

# Fonte: GitHub Octoverse 2025.
# URL: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
LINGUAGENS_ESCOLHIDAS = {
    "TypeScript", "Python", "JavaScript", "Java", "C#", "PHP", "Shell", "C++", "HCL", "Go",
}

ARQUIVO_CSV = Path("data/repositorios_populares.csv")


class medicao:
    """Representa a linguagem primária de um repositório."""

    def __init__(self, linguagem_primaria: str | None) -> None:
        self.linguagem_primaria = linguagem_primaria or "Não identificada"
        self.eh_linguagem_escolhida = (
            linguagem_primaria.casefold() in {item.casefold() for item in LINGUAGENS_ESCOLHIDAS}
            if linguagem_primaria else None
        )

    def imprimir(self, repositorio: str) -> None:
        escolhida = (
            "sim" if self.eh_linguagem_escolhida is True
            else "não" if self.eh_linguagem_escolhida is False
            else "não identificada"
        )
        print(
            f"{repositorio}: linguagem primária = {self.linguagem_primaria} "
            f"| escolhida no Octoverse 2025 = {escolhida}"
        )


def main() -> None:
    with ARQUIVO_CSV.open(encoding="utf-8", newline="") as arquivo:
        for row in csv.DictReader(arquivo):
            medicao(row["linguagem_primaria"]).imprimir(row["repositorio"])


if __name__ == "__main__":
    main()
