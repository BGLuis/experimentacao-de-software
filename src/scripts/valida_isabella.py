"""Valida as métricas RQ03 e RQ04 usando a base CSV já coletada.

Uso:
    py src/scripts/valida_isabella.py
    py src/scripts/valida_isabella.py --quantidade 20
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPTS_DIR.parents[1]
CSV_PATH = BASE_DIR / "data" / "repositorios_populares.csv"
sys.path.insert(0, str(SCRIPTS_DIR))

from rq03.metricas import obter_total_releases
from rq04.metricas import obter_dias_desde_atualizacao


def argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida RQ03 e RQ04 a partir de repositorios_populares.csv."
    )
    parser.add_argument(
        "--quantidade", type=int,
        help="Quantidade de repositórios da base a exibir (dispensa a seleção inicial).",
    )
    return parser.parse_args()


def selecionar_quantidade(valor_informado: int | None) -> int:
    """Obtém a quantidade pela linha de comando ou por seleção no início."""
    if valor_informado is not None:
        if valor_informado <= 0:
            raise ValueError("--quantidade deve ser maior que zero.")
        return valor_informado

    while True:
        entrada = input("Quantidade de repositórios para validar [10]: ").strip()
        if not entrada:
            return 10
        if entrada.isdigit() and int(entrada) > 0:
            return int(entrada)
        print("Informe um número inteiro maior que zero.")


def carregar_repositorios() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Base não encontrada: {CSV_PATH}")

    with CSV_PATH.open(encoding="utf-8", newline="") as arquivo:
        return list(csv.DictReader(arquivo))


def main() -> None:
    args = argumentos()
    quantidade = selecionar_quantidade(args.quantidade)

    repositorios = carregar_repositorios()
    amostra = repositorios[:quantidade]
    print(f"Base: {CSV_PATH.name} ({len(repositorios)} repositórios)")
    print(f"Exibindo {len(amostra)} repositórios para validação das RQs 03 e 04.\n")

    for linha in amostra:
        # Adaptador: as funções originais recebem a estrutura retornada pela API,
        # enquanto o CSV armazena os mesmos valores em colunas planas.
        repositorio = {
            "releases": {"totalCount": int(linha["releases"])},
            "pushedAt": linha["ultimo_push_em"],
        }
        total_releases = obter_total_releases(repositorio)
        tempo_atualizacao = obter_dias_desde_atualizacao(repositorio)

        print(f"Repositório: {linha['repositorio']}")
        print(f"  - RQ03 (Total de releases): {total_releases}")
        print(f"  - RQ04 (Tempo desde o último push): {tempo_atualizacao}")
        print("-" * 35)

    print("Validação concluída usando exclusivamente a base já coletada.")


if __name__ == "__main__":
    main()
