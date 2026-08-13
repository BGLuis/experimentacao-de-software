"""RQ03: total de releases."""

from typing import Any


def obter_total_releases(repository: dict[str, Any]) -> int | None:
    """Extrai o total de releases do repositório."""
    releases = repository.get("releases")
    if not isinstance(releases, dict):
        return None

    total = releases.get("totalCount")
    return total if isinstance(total, int) else None
