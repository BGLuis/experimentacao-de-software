"""Ponto de entrada da mineração de repositórios do Lab01."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from src.mineracao.client import GitHubGraphQLClient
from src.mineracao.transform import export_csv, export_json, normalize_repositories


def load_dotenv(path: Path) -> None:
    """Carrega GITHUB_TOKEN de um arquivo .env simples, sem dependências externas."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "GITHUB_TOKEN" and value.strip():
            os.environ.setdefault("GITHUB_TOKEN", value.strip().strip('"').strip("'"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Coleta repositórios populares via GitHub GraphQL.")
    parser.add_argument("--limit", type=int, default=100, help="Quantidade de repositórios (padrão: 100).")
    parser.add_argument("--output-dir", type=Path, default=Path("data"), help="Diretório de saída.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not 1 <= args.limit <= 100:
        print("Erro: nesta versão, --limit deve estar entre 1 e 100.", file=sys.stderr)
        return 2
    load_dotenv(Path(".env"))
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("Erro: defina GITHUB_TOKEN no ambiente ou no arquivo .env.", file=sys.stderr)
        return 2
    repositories = GitHubGraphQLClient(token).fetch_popular_repositories(first=args.limit)
    rows = normalize_repositories(repositories)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    export_csv(rows, args.output_dir / "repositorios.csv")
    export_json(rows, args.output_dir / "repositorios.json")
    print(f"Coleta concluída: {len(rows)} repositórios exportados em {args.output_dir}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
