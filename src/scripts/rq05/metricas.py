"""Funções da RQ05: linguagem primária e classificação de popularidade."""

from collections.abc import Collection
from typing import Any


def obter_linguagem_primaria(repository: dict[str, Any]) -> str | None:
    """Extrai o nome da linguagem ou None quando o GitHub não o informa."""
    language = repository.get("primaryLanguage")
    if not isinstance(language, dict):
        return None

    name = language.get("name")
    return name.strip() if isinstance(name, str) and name.strip() else None


def linguagem_eh_popular(linguagem: str | None, linguagens_populares: Collection[str]) -> bool | None:
    """Compara sem diferença de maiúsculas/minúsculas com a fonte escolhida pelo grupo."""
    if linguagem is None:
        return None
    return linguagem.casefold() in {item.strip().casefold() for item in linguagens_populares}
