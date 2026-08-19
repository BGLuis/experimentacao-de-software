**RQ 06.** Sistemas populares possuem um alto percentual de issues fechadas?
Métrica: razão entre issues fechadas e total de issues

## Hipótese informal - Sprint 02

A maioria dos repositórios populares com issues possui pelo menos 75% das issues fechadas, indicando manutenção ativa.

O limiar de 75% é um critério operacional definido pelo grupo para interpretar "alto percentual". Repositórios sem issues são contabilizados separadamente e não entram no cálculo da razão.

## Validação dos dados

O script `validacao.py` verifica:

- valores ausentes, inválidos e repositórios sem issues;
- distribuição da razão em quatro faixas;
- média, mediana, quartis, mínimo e máximo;
- outliers pela regra de 1,5 vezes o intervalo interquartil (IQR).

Execução sobre toda a base:

```powershell
py src/scripts/rq06/validacao.py
```

Após a coleta dos 1.000 repositórios, exporte distribuição e outliers com:

```powershell
py src/scripts/rq06/validacao.py --arquivo data/repositorios_populares_1000.csv --quantidade 1000 --saida-distribuicao data/analises/rq06_distribuicao.csv --saida-outliers data/analises/rq06_outliers.csv
```
