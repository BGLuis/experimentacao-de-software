"""Medição da RQ03: total de releases por repositório da base coletada.

Uso:
    py src/scripts/rq03/medicao.py
    py src/scripts/rq03/medicao.py --quantidade 20
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from statistics import mean, median

BASE_DIR = Path(__file__).resolve().parents[3]
CSV_PATH = BASE_DIR / "data" / "repositorios_populares.csv"


def argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mede o total de releases da RQ03.")
    parser.add_argument(
        "--quantidade",
        type=int,
        help="Quantidade de repositórios a analisar; pula a seleção interativa.",
    )
    return parser.parse_args()


def selecionar_quantidade(valor_informado: int | None, total_disponivel: int) -> int:
    """Permite escolher, no início, quantos repositórios da base serão usados."""
    if valor_informado is not None:
        if valor_informado <= 0:
            raise ValueError("--quantidade deve ser maior que zero.")
        return min(valor_informado, total_disponivel)

    while True:
        entrada = input(
            f"Quantidade de repositórios para analisar [todos: {total_disponivel}]: "
        ).strip()
        if not entrada:
            return total_disponivel
        if entrada.isdigit() and int(entrada) > 0:
            return min(int(entrada), total_disponivel)
        print("Informe um número inteiro maior que zero.")


def carregar_base() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Base não encontrada: {CSV_PATH}")
    with CSV_PATH.open(encoding="utf-8", newline="") as arquivo:
        return list(csv.DictReader(arquivo))


def main() -> None:
    args = argumentos()
    repositorios = carregar_base()
    quantidade = selecionar_quantidade(args.quantidade, len(repositorios))
    amostra = repositorios[:quantidade]
    releases = [int(repositorio["releases"]) for repositorio in amostra]

    print(f"\nRQ03 - Total de releases ({quantidade} repositórios)\n")
    for indice, (repositorio, total) in enumerate(zip(amostra, releases), start=1):
        print(f"{indice:>3}. {repositorio['repositorio']}: {total} releases")

    print("\nResumo")
    print(f"Total de releases: {sum(releases)}")
    print(f"Média: {mean(releases):.2f}")
    print(f"Mediana: {median(releases):.2f}")
    print(f"Sem releases: {sum(total == 0 for total in releases)}")


if __name__ == "__main__":
    main()
