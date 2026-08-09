"""RQ04: tempo até a última atualização."""

from datetime import UTC, datetime
from typing import Any


def obter_dias_desde_atualizacao(repository: dict[str, Any]) -> str | None:
    """Calcula a quantidade de dias desde a última atualização de código (pushedAt).
    Se for menor que 1 dia, retorna a quantidade de horas."""
    pushed_at_str = repository.get("pushedAt")
    if not isinstance(pushed_at_str, str):
        return None

    try:
        pushed_at = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
        agora = datetime.now(UTC)
        diferenca = agora - pushed_at
        
        if diferenca.days > 0:
            return f"{diferenca.days} dias"
        
        segundos_totais = int(diferenca.total_seconds())
        horas = segundos_totais // 3600
        minutos = (segundos_totais % 3600) // 60
        segundos = segundos_totais % 60
        
        if horas > 0:
            return f"{horas} horas"
        elif minutos > 0:
            return f"{minutos} minutos"
        else:
            return f"{segundos} segundos"
    except ValueError:
        return None
