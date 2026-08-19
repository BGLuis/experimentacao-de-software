# Lab01S02 - Validação das RQs 05 e 06

Responsável: Leandro Alencar Pereira Clemente  
Snapshot analisado: `data/repositorios_populares_1000.csv`  
Data da coleta: 16/08/2026

## Consistência geral da base

A paginação coletou os 1.000 repositórios públicos mais estrelados retornados pela busca do GitHub. O snapshot possui 1.000 linhas, 1.000 nomes únicos, nenhuma duplicata, 33 colunas e nenhuma quebra na ordenação decrescente por estrelas. A amostra vai de 540.257 a 32.906 estrelas.

## RQ05 - Linguagens populares

**Pergunta:** sistemas populares são escritos nas linguagens mais populares?

**Hipótese informal:** a maioria dos repositórios populares utiliza uma linguagem presente entre as dez linguagens mais populares do GitHub Octoverse 2025.

**Métrica:** linguagem principal operacional de cada repositório. Como a consulta retorna as linguagens em ordem decrescente de tamanho do código, foi utilizada a primeira linguagem da lista.

**Fonte de referência:** [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/): TypeScript, Python, JavaScript, Java, C#, PHP, Shell, C++, HCL e Go.

### Resultados

| Indicador | Resultado |
|---|---:|
| Repositórios analisados | 1.000 |
| Linguagem identificada | 913 (91,30%) |
| Linguagem ausente | 87 (8,70%) |
| Em linguagens do Octoverse | 702 (70,20% do total) |
| Em linguagens do Octoverse entre identificados | 76,89% |
| Linguagens distintas identificadas | 43 |
| Categorias raras, com uma ocorrência | 11 |

As linguagens mais frequentes foram Python, com 229 repositórios; TypeScript, com 174; JavaScript, com 110; Go, com 76; e Rust, com 57. Rust não faz parte da lista adotada do Octoverse.

**Conclusão inicial:** os resultados apoiam a hipótese informal, pois 70,20% de toda a amostra e 76,89% dos casos com linguagem identificada pertencem à lista do Octoverse. Os 87 valores ausentes devem permanecer explícitos no relatório, sem serem classificados como linguagem não popular.

## RQ06 - Percentual de issues fechadas

**Pergunta:** sistemas populares possuem um alto percentual de issues fechadas?

**Hipótese informal:** a maioria dos repositórios populares com issues possui pelo menos 75% das issues fechadas, indicando manutenção ativa.

**Métrica:** `issues fechadas / (issues abertas + issues fechadas)`. O grupo definiu 75% como critério operacional de “alto percentual”. Repositórios sem issues são contabilizados separadamente e não entram no cálculo da razão.

### Resultados

| Indicador | Resultado |
|---|---:|
| Repositórios analisados | 1.000 |
| Razões válidas | 957 (95,70%) |
| Repositórios sem issues | 43 (4,30%) |
| Valores ausentes ou inválidos | 0 |
| Média da razão | 80,24% |
| Mediana da razão | 87,62% |
| Primeiro quartil | 70,49% |
| Terceiro quartil | 96,78% |
| Com pelo menos 75% fechadas | 678 (70,85% dos válidos) |
| Outliers pela regra de 1,5 x IQR | 40 |

Distribuição dos 957 casos válidos:

| Faixa de fechamento | Repositórios | Percentual |
|---|---:|---:|
| 0% a menos de 25% | 22 | 2,30% |
| 25% a menos de 50% | 86 | 8,99% |
| 50% a menos de 75% | 171 | 17,87% |
| 75% a 100% | 678 | 70,85% |

**Conclusão inicial:** os resultados apoiam a hipótese informal. Entre os repositórios em que a razão pode ser calculada, 70,85% atingem o critério de pelo menos 75% de issues fechadas. Os 40 outliers estão na cauda inferior da distribuição e devem ser examinados como projetos com comportamento diferente, não removidos automaticamente.

## Evidências reproduzíveis

- `data/repositorios_populares_1000.csv`: snapshot bruto dos 1.000 repositórios;
- `data/analises/rq05_distribuicao.csv`: distribuição da RQ05;
- `data/analises/rq06_distribuicao.csv`: distribuição por faixas da RQ06;
- `data/analises/rq06_outliers.csv`: outliers identificados na RQ06;
- `src/scripts/rq05/validacao.py` e `src/scripts/rq06/validacao.py`: scripts usados na validação.

## Textos para as Issues

### Issue - RQ05

**Título:** `[Lab01S02] Validar consistência dos dados da RQ05 e registrar hipótese informal`

**Descrição:**

> Hipótese informal: a maioria dos repositórios populares utiliza uma linguagem presente entre as dez linguagens mais populares do GitHub Octoverse 2025.
>
> Validar nos 1.000 repositórios a distribuição da linguagem principal, os valores ausentes, a proporção de linguagens pertencentes ao Octoverse e as categorias raras. A validação encontrou 87 valores ausentes, 43 linguagens identificadas e 702 repositórios em linguagens do Octoverse, equivalentes a 70,20% da amostra. A hipótese foi apoiada pelos resultados.
>
> Evidências: `data/analises/rq05_distribuicao.csv` e `src/scripts/rq05/validacao.py`.

### Issue - RQ06

**Título:** `[Lab01S02] Validar consistência dos dados da RQ06 e registrar hipótese informal`

**Descrição:**

> Hipótese informal: a maioria dos repositórios populares com issues possui pelo menos 75% das issues fechadas, indicando manutenção ativa.
>
> Validar nos 1.000 repositórios os valores ausentes, repositórios sem issues, a distribuição da razão e os outliers pela regra de 1,5 x IQR. Foram obtidas 957 razões válidas, 43 repositórios sem issues, nenhum valor inválido e 678 casos com pelo menos 75% de fechamento, equivalentes a 70,85% dos válidos. A hipótese foi apoiada pelos resultados.
>
> Evidências: `data/analises/rq06_distribuicao.csv`, `data/analises/rq06_outliers.csv` e `src/scripts/rq06/validacao.py`.
