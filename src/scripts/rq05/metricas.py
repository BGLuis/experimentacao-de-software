"""Funções da RQ05: linguagem primária e classificação de popularidade."""

from typing import Any


def obter_linguagem_primaria(repository: dict[str, Any]) -> str | None:
    language = repository.get("primaryLanguage") or {}
    return language.get("name")


def linguagem_eh_popular(linguagem: str | None, linguagens_populares: set[str]) -> bool | None:
    """Retorna None para repositórios sem linguagem primária identificada."""
    if linguagem is None:
        return None
    return linguagem.casefold() in {item.casefold() for item in linguagens_populares}
