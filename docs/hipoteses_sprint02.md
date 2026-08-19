### RQ05: Linguagens Populares

> **Responsável: Leandro**
>
> **Hipótese Informal:** Repositórios populares tendem a ser escritos em linguagens também populares na comunidade GitHub, conforme a lista de linguagens mais utilizadas do GitHub Octoverse 2025.
>
> **Métrica:** Linguagem principal de cada repositório. Como a coleta retorna as linguagens ordenadas por tamanho de código, foi considerada como linguagem principal a primeira linguagem listada.
>
> **Validação e Conclusão:** Na amostra de 1.000 repositórios, 913 (91,30%) possuem uma linguagem identificada e 87 (8,70%) não possuem linguagem informada. Foram encontrados 702 repositórios (70,20% da amostra; 76,89% entre os identificados) em linguagens presentes no GitHub Octoverse 2025, apoiando a hipótese informal. Python (229), TypeScript (174) e JavaScript (110) foram as linguagens mais frequentes. A distribuição apresentou 43 linguagens distintas e 11 categorias raras, com apenas uma ocorrência; esses casos foram mantidos na análise, pois representam diversidade de linguagens e não dados inválidos.

### RQ06: Percentual de Issues Fechadas

> **Responsável: Leandro**
>
> **Hipótese Informal:** Repositórios populares tendem a possuir uma alta proporção de issues fechadas, pois projetos consolidados geralmente possuem manutenção mais ativa.
>
> **Métrica:** Razão entre issues fechadas e o total de issues: `issues fechadas / (issues abertas + issues fechadas)`. Para tornar “alto percentual” mensurável, foi adotado o critério operacional de pelo menos 75% de issues fechadas.
>
> **Validação e Conclusão:** Na amostra de 1.000 repositórios, 957 possuíam issues suficientes para calcular a razão; 43 não possuíam issues e foram excluídos apenas desse cálculo. Não foram encontrados valores ausentes ou inválidos. A mediana da razão de fechamento foi 87,62% e 678 repositórios (70,85% dos casos válidos) alcançaram pelo menos 75% de issues fechadas, apoiando a hipótese informal. Foram identificados 40 outliers pela regra de 1,5 vezes o intervalo interquartil, todos na cauda inferior da distribuição; eles foram preservados para representar projetos com padrão de tratamento de issues diferente.

Fonte de linguagens populares: [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).
