"""Funções da RQ06: proporção de issues fechadas."""


def calcular_razao_issues_fechadas(issues_abertas: int, issues_fechadas: int) -> float | None:
    total = issues_abertas + issues_fechadas
    if total == 0:
        return None
    return issues_fechadas / total
