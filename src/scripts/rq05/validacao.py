"""Validação de consistência da RQ05 para a Sprint 02.

Analisa distribuição, valores ausentes e categorias raras da linguagem
principal nos repositórios já coletados.
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
ARQUIVO_PADRAO = BASE_DIR / "data" / "repositorios_populares.csv"

# Fonte: GitHub Octoverse 2025.
# URL: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
LINGUAGENS_OCTOVERSE = (
    "TypeScript", "Python", "JavaScript", "Java", "C#",
    "PHP", "Shell", "C++", "HCL", "Go",
)
LINGUAGENS_OCTOVERSE_NORMALIZADAS = {
    linguagem.casefold() for linguagem in LINGUAGENS_OCTOVERSE
}


def argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida distribuição, ausentes e categorias raras da RQ05."
    )
    parser.add_argument("--arquivo", type=Path, default=ARQUIVO_PADRAO)
    parser.add_argument(
        "--quantidade", type=int,
        help="Quantidade inicial de registros a analisar; sem a opção, pergunta no início.",
    )
    parser.add_argument(
        "--saida", type=Path,
        help="CSV opcional para exportar a distribuição por linguagem.",
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


def linguagem_primaria(linha: dict[str, str]) -> str | None:
    linguagens = (linha.get("linguagens") or linha.get("linguagem_primaria") or "").strip()
    return linguagens.split(",", 1)[0].strip() or None


def carregar(arquivo: Path) -> list[dict[str, str]]:
    if not arquivo.exists():
        raise FileNotFoundError(f"Base não encontrada: {arquivo}")
    with arquivo.open(encoding="utf-8", newline="") as entrada:
        linhas = list(csv.DictReader(entrada))
    if not linhas:
        raise ValueError("A base CSV está vazia.")
    if "repositorio" not in linhas[0] or not ({"linguagens", "linguagem_primaria"} & linhas[0].keys()):
        raise ValueError("O CSV não contém as colunas necessárias para a RQ05.")
    return linhas


def exportar_distribuicao(
    saida: Path,
    contagem: Counter[str],
    total: int,
    ausentes: int,
) -> None:
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", encoding="utf-8", newline="") as arquivo:
        campos = ["posicao", "linguagem", "repositorios", "percentual", "octoverse_2025", "classificacao"]
        escritor = csv.DictWriter(arquivo, fieldnames=campos)
        escritor.writeheader()
        for posicao, (linguagem, quantidade) in enumerate(contagem.most_common(), start=1):
            escritor.writerow({
                "posicao": posicao,
                "linguagem": linguagem,
                "repositorios": quantidade,
                "percentual": round(quantidade / total, 4),
                "octoverse_2025": linguagem.casefold() in LINGUAGENS_OCTOVERSE_NORMALIZADAS,
                "classificacao": "categoria rara" if quantidade == 1 else "",
            })
        if ausentes:
            escritor.writerow({
                "posicao": "",
                "linguagem": "Não identificada",
                "repositorios": ausentes,
                "percentual": round(ausentes / total, 4),
                "octoverse_2025": "",
                "classificacao": "valor ausente",
            })


def main() -> None:
    args = argumentos()
    linhas = carregar(args.arquivo)
    quantidade = selecionar_quantidade(args.quantidade, len(linhas))
    amostra = linhas[:quantidade]

    linguagens = [linguagem_primaria(linha) for linha in amostra]
    identificadas = [linguagem for linguagem in linguagens if linguagem]
    contagem = Counter(identificadas)
    ausentes = quantidade - len(identificadas)
    no_octoverse = sum(
        linguagem.casefold() in LINGUAGENS_OCTOVERSE_NORMALIZADAS
        for linguagem in identificadas
    )
    raras = [(linguagem, total) for linguagem, total in contagem.items() if total == 1]

    print(f"\nRQ05 - Validação de consistência ({quantidade} repositórios)")
    print(f"Linguagem identificada: {len(identificadas)} ({len(identificadas) / quantidade:.2%})")
    print(f"Valores ausentes: {ausentes} ({ausentes / quantidade:.2%})")
    print(f"No Octoverse 2025: {no_octoverse} ({no_octoverse / quantidade:.2%} do total)")
    if identificadas:
        print(f"No Octoverse entre identificadas: {no_octoverse / len(identificadas):.2%}")
    print(f"Categorias distintas: {len(contagem)}")
    print(f"Categorias raras (1 ocorrência): {len(raras)}")

    print("\nDistribuição por linguagem")
    for posicao, (linguagem, total) in enumerate(contagem.most_common(), start=1):
        octoverse = "sim" if linguagem.casefold() in LINGUAGENS_OCTOVERSE_NORMALIZADAS else "não"
        rara = " | rara" if total == 1 else ""
        print(f"{posicao:>2}. {linguagem:<22} {total:>4} ({total / quantidade:>6.2%}) | Octoverse: {octoverse}{rara}")

    print("\nHipótese informal")
    print(
        "A maioria dos repositórios populares utiliza uma linguagem presente "
        "entre as dez linguagens mais populares do GitHub Octoverse 2025."
    )

    if args.saida:
        exportar_distribuicao(args.saida, contagem, quantidade, ausentes)
        print(f"\nDistribuição exportada para: {args.saida}")


if __name__ == "__main__":
    main()
