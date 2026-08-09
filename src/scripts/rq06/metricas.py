"""Funções da RQ06: proporção de issues fechadas."""


def calcular_razao_issues_fechadas(issues_abertas: int, issues_fechadas: int) -> float | None:
    """Calcula fechadas / (abertas + fechadas), ou None se não houver issues."""
    if issues_abertas < 0 or issues_fechadas < 0:
        raise ValueError("As quantidades de issues não podem ser negativas.")

    total = issues_abertas + issues_fechadas
    if total == 0:
        return None
    return issues_fechadas / total
