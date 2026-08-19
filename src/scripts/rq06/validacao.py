"""Validação de consistência da RQ06 para a Sprint 02.

Analisa distribuição, valores ausentes e outliers da razão entre issues
fechadas e o total de issues nos repositórios já coletados.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from statistics import mean, median, quantiles

BASE_DIR = Path(__file__).resolve().parents[3]
ARQUIVO_PADRAO = BASE_DIR / "data" / "repositorios_populares.csv"
LIMIAR_ALTO_PERCENTUAL = 0.75


def argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida distribuição, ausentes e outliers da RQ06."
    )
    parser.add_argument("--arquivo", type=Path, default=ARQUIVO_PADRAO)
    parser.add_argument(
        "--quantidade", type=int,
        help="Quantidade inicial de registros a analisar; sem a opção, pergunta no início.",
    )
    parser.add_argument(
        "--saida-distribuicao", type=Path,
        help="CSV opcional para exportar a distribuição por faixa.",
    )
    parser.add_argument(
        "--saida-outliers", type=Path,
        help="CSV opcional para exportar os repositórios classificados como outliers.",
    )
    return parser.parse_args()


def selecionar_quantidade(valor: int | None, total: int) -> int:
    if valor is not None:
        if valor <= 0:
            raise ValueError("--quantidade deve ser maior que zero.")
        return min(valor, total)

    while True:
        entrada = input(f"Quantidade de repositórios para analisar [todos: {total}]: ").strip()
        if not entrada:
            return total
        if entrada.isdigit() and int(entrada) > 0:
            return min(int(entrada), total)
        print("Informe um número inteiro maior que zero.")


def carregar(arquivo: Path) -> list[dict[str, str]]:
    if not arquivo.exists():
        raise FileNotFoundError(f"Base não encontrada: {arquivo}")
    with arquivo.open(encoding="utf-8", newline="") as entrada:
        linhas = list(csv.DictReader(entrada))
    if not linhas:
        raise ValueError("A base CSV está vazia.")
    exigidas = {"repositorio", "issues_fechadas", "issues_total"}
    if not exigidas.issubset(linhas[0]):
        raise ValueError("O CSV não contém as colunas necessárias para a RQ06.")
    return linhas


def extrair_razoes(
    linhas: list[dict[str, str]],
) -> tuple[list[tuple[dict[str, str], float]], int, int]:
    validas: list[tuple[dict[str, str], float]] = []
    ausentes_ou_invalidas = 0
    sem_issues = 0

    for linha in linhas:
        try:
            fechadas = int(linha["issues_fechadas"])
            total = int(linha["issues_total"])
        except (TypeError, ValueError):
            ausentes_ou_invalidas += 1
            continue

        if fechadas < 0 or total < 0 or fechadas > total:
            ausentes_ou_invalidas += 1
        elif total == 0:
            sem_issues += 1
        else:
            validas.append((linha, fechadas / total))

    return validas, ausentes_ou_invalidas, sem_issues


def calcular_quartis(valores: list[float]) -> tuple[float, float]:
    if len(valores) < 2:
        return valores[0], valores[0]
    q1, _, q3 = quantiles(valores, n=4, method="inclusive")
    return q1, q3


def faixa(razao: float) -> str:
    if razao < 0.25:
        return "0% a <25%"
    if razao < 0.50:
        return "25% a <50%"
    if razao < 0.75:
        return "50% a <75%"
    return "75% a 100%"


def exportar_distribuicao(
    saida: Path,
    distribuicao: dict[str, int],
    total_validos: int,
    total_amostra: int,
    sem_issues: int,
    ausentes_ou_invalidas: int,
) -> None:
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", encoding="utf-8", newline="") as arquivo:
        campos = ["categoria", "repositorios", "percentual_amostra", "percentual_validos"]
        escritor = csv.DictWriter(arquivo, fieldnames=campos)
        escritor.writeheader()
        for nome, quantidade in distribuicao.items():
            escritor.writerow({
                "categoria": nome,
                "repositorios": quantidade,
                "percentual_amostra": round(quantidade / total_amostra, 4),
                "percentual_validos": round(quantidade / total_validos, 4),
            })
        escritor.writerow({
            "categoria": "Sem issues",
            "repositorios": sem_issues,
            "percentual_amostra": round(sem_issues / total_amostra, 4),
            "percentual_validos": "",
        })
        escritor.writerow({
            "categoria": "Ausente ou inválido",
            "repositorios": ausentes_ou_invalidas,
            "percentual_amostra": round(ausentes_ou_invalidas / total_amostra, 4),
            "percentual_validos": "",
        })


def exportar_outliers(
    saida: Path,
    outliers: list[tuple[dict[str, str], float]],
) -> None:
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", encoding="utf-8", newline="") as arquivo:
        campos = ["repositorio", "issues_fechadas", "issues_total", "razao_issues_fechadas"]
        escritor = csv.DictWriter(arquivo, fieldnames=campos)
        escritor.writeheader()
        for linha, razao in sorted(outliers, key=lambda item: item[1]):
            escritor.writerow({
                "repositorio": linha["repositorio"],
                "issues_fechadas": linha["issues_fechadas"],
                "issues_total": linha["issues_total"],
                "razao_issues_fechadas": round(razao, 4),
            })


def main() -> None:
    args = argumentos()
    linhas = carregar(args.arquivo)
    quantidade = selecionar_quantidade(args.quantidade, len(linhas))
    amostra = linhas[:quantidade]
    validas, ausentes_ou_invalidas, sem_issues = extrair_razoes(amostra)
    if not validas:
        raise ValueError("Nenhum repositório possui total de issues válido maior que zero.")

    valores = [razao for _, razao in validas]
    q1, q3 = calcular_quartis(valores)
    iqr = q3 - q1
    limite_inferior = q1 - 1.5 * iqr
    limite_superior = q3 + 1.5 * iqr
    outliers = [
        item for item in validas
        if item[1] < limite_inferior or item[1] > limite_superior
    ]
    ordem_faixas = ("0% a <25%", "25% a <50%", "50% a <75%", "75% a 100%")
    distribuicao = {nome: 0 for nome in ordem_faixas}
    for valor in valores:
        distribuicao[faixa(valor)] += 1
    alto_percentual = sum(valor >= LIMIAR_ALTO_PERCENTUAL for valor in valores)

    print(f"\nRQ06 - Validação de consistência ({quantidade} repositórios)")
    print(f"Razões válidas: {len(validas)} ({len(validas) / quantidade:.2%})")
    print(f"Sem issues: {sem_issues} ({sem_issues / quantidade:.2%})")
    print(f"Ausentes ou inválidos: {ausentes_ou_invalidas} ({ausentes_ou_invalidas / quantidade:.2%})")
    print(f"Média: {mean(valores):.2%}")
    print(f"Mediana: {median(valores):.2%}")
    print(f"Q1: {q1:.2%} | Q3: {q3:.2%} | IQR: {iqr:.4f}")
    print(f"Mínimo: {min(valores):.2%} | Máximo: {max(valores):.2%}")
    print(f"Com 75% ou mais de issues fechadas: {alto_percentual} ({alto_percentual / len(validas):.2%} dos válidos)")
    print(f"Outliers pela regra 1,5 x IQR: {len(outliers)}")

    print("\nDistribuição da razão")
    for nome, total in distribuicao.items():
        print(f"{nome:<13} {total:>4} ({total / len(validas):>6.2%})")

    if outliers:
        print("\nOutliers")
        for linha, razao in sorted(outliers, key=lambda item: item[1]):
            print(
                f"{linha['repositorio']}: {razao:.2%} "
                f"({linha['issues_fechadas']} / {linha['issues_total']})"
            )

    print("\nHipótese informal")
    print(
        "A maioria dos repositórios populares com issues possui pelo menos "
        "75% das issues fechadas, indicando manutenção ativa."
    )

    if args.saida_distribuicao:
        exportar_distribuicao(
            args.saida_distribuicao,
            distribuicao,
            len(validas),
            quantidade,
            sem_issues,
            ausentes_ou_invalidas,
        )
        print(f"\nDistribuição exportada para: {args.saida_distribuicao}")
    if args.saida_outliers:
        exportar_outliers(args.saida_outliers, outliers)
        print(f"Outliers exportados para: {args.saida_outliers}")


if __name__ == "__main__":
    main()
