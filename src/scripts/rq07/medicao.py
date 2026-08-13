"""Agrupa RQ02, RQ03 e RQ04 por linguagem para responder à RQ07.

O CSV atual exporta uma lista de linguagens. Para esta medição, a primeira
linguagem da lista é usada como linguagem principal operacional.
"""

import csv
from collections import defaultdict
from datetime import UTC, datetime
from enum import Enum
from pathlib import Path

ARQUIVO_CSV = Path("data/repositorios_populares.csv")

# Fonte: GitHub Octoverse 2025.
# URL: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
LINGUAGENS_ESCOLHIDAS = {
    "TypeScript", "Python", "JavaScript", "Java", "C#", "PHP", "Shell", "C++", "HCL", "Go",
}


class Ordenacao(Enum):
    """Opções disponíveis para ordenar a tabela da RQ07."""

    TOTAL_PRS = "total_prs"
    TOTAL_RELEASES = "total_releases"
    ATUALIZACAO_MAIS_RECENTE = "atualizacao_mais_recente"
    MOD = "mod"
    QUANTIDADE_REPOSITORIOS = "quantidade_repositorios"
    LINGUAGEM = "linguagem"


# Altere esta constante para mudar a ordem de impressão.
ORDENAR_POR = Ordenacao.MOD


def formatar_duracao(segundos: float) -> str:
    """Escolhe a maior unidade inteira útil para exibir o tempo decorrido."""
    if segundos >= 86_400:
        return f"{segundos / 86_400:.1f} dias"
    if segundos >= 3_600:
        return f"{segundos / 3_600:.1f} horas"
    if segundos >= 60:
        return f"{segundos / 60:.1f} minutos"
    return f"{segundos:.0f} segundos"


class medicao:
    """Calcula totais de contribuição e releases por linguagem."""

    def __init__(self, linguagem: str, repositorios: list[dict[str, str]]) -> None:
        self.linguagem = linguagem
        self.quantidade_repositorios = len(repositorios)
        self.total_prs_aceitas = sum(
            int(repositorio["pull_requests_aceitas"]) for repositorio in repositorios
        )
        self.total_releases = sum(
            int(repositorio["releases"]) for repositorio in repositorios
        )
        agora = datetime.now(UTC)
        self.menor_tempo_desde_atualizacao = min(
            max(
                0,
                (agora - datetime.fromisoformat(repositorio["atualizado_em"].replace("Z", "+00:00"))).total_seconds(),
            )
            for repositorio in repositorios
        )
        horas_desde_atualizacao = self.menor_tempo_desde_atualizacao / 3_600
        self.mod = (
            (self.total_prs_aceitas / self.quantidade_repositorios)
            / self.total_releases
            / horas_desde_atualizacao
            if self.total_releases > 0 and horas_desde_atualizacao > 0
            else None
        )
        self.linguagem_escolhida = linguagem.casefold() in {
            item.casefold() for item in LINGUAGENS_ESCOLHIDAS
        }

    def linha(self, posicao: int) -> list[str]:
        return [
            str(posicao),
            self.linguagem,
            "sim" if self.linguagem_escolhida else "não",
            str(self.quantidade_repositorios),
            str(self.total_prs_aceitas),
            str(self.total_releases),
            formatar_duracao(self.menor_tempo_desde_atualizacao),
            f"{self.mod:.2f}" if self.mod is not None else "N/A",
        ]


def linguagem_principal(row: dict[str, str]) -> str:
    linguagens = row["linguagens"].split(",")
    return linguagens[0].strip() if row["linguagens"].strip() else "Não identificada"


def chave_ordenacao(item: medicao) -> tuple:
    """Retorna a chave de ordenação conforme a opção configurada."""
    if ORDENAR_POR is Ordenacao.TOTAL_PRS:
        return (-item.total_prs_aceitas, -item.total_releases, item.linguagem.casefold())
    if ORDENAR_POR is Ordenacao.TOTAL_RELEASES:
        return (-item.total_releases, -item.total_prs_aceitas, item.linguagem.casefold())
    if ORDENAR_POR is Ordenacao.ATUALIZACAO_MAIS_RECENTE:
        return (item.menor_tempo_desde_atualizacao, item.linguagem.casefold())
    if ORDENAR_POR is Ordenacao.MOD:
        return (-(item.mod if item.mod is not None else -1), item.linguagem.casefold())
    if ORDENAR_POR is Ordenacao.QUANTIDADE_REPOSITORIOS:
        return (-item.quantidade_repositorios, item.linguagem.casefold())
    return (item.linguagem.casefold(),)


def main() -> None:
    with ARQUIVO_CSV.open(encoding="utf-8", newline="") as arquivo:
        grupos: dict[str, list[dict[str, str]]] = defaultdict(list)
        for row in csv.DictReader(arquivo):
            grupos[linguagem_principal(row)].append(row)

    medicoes = [medicao(linguagem, repositorios) for linguagem, repositorios in grupos.items()]
    medicoes.sort(key=chave_ordenacao)

    print("RQ07 — Totais por linguagem principal")
    print(f"Ordenação: {ORDENAR_POR.value}.\n")
    cabecalho = ["#", "Linguagem", "Octoverse", "Repos", "Total PRs", "Total releases", "Atualização mais recente", "MOD"]
    linhas = [item.linha(posicao) for posicao, item in enumerate(medicoes, start=1)]
    larguras = [max(len(celula) for celula in coluna) for coluna in zip(cabecalho, *linhas)]

    def imprimir_linha(linha: list[str]) -> None:
        print(" | ".join(celula.ljust(largura) for celula, largura in zip(linha, larguras)))

    imprimir_linha(cabecalho)
    print("-+-".join("-" * largura for largura in larguras))
    for linha in linhas:
        imprimir_linha(linha)


if __name__ == "__main__":
    main()
