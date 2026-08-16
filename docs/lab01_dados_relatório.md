# Relatório de Pesquisa: Análise de Repositórios Populares no GitHub

**Disciplina:** Laboratório de Experimentação de Software  
**Equipe:** Isabella Dias, Luis Henrique, Leandro Alencar  
**Data:** 06 de Agosto de 2026  

---

## 1. Introdução com Hipóteses Informais (RQs)

Este relatório apresenta os resultados preliminares da mineração e análise de dados dos repositórios mais populares do GitHub. O objetivo da pesquisa é investigar características fundamentais que tornam projetos de código aberto bem-sucedidos e ativos na comunidade, guiados por 7 Questões de Pesquisa (RQs). A amostra utilizada neste estudo contém mais de 12.000 repositórios coletados via GraphQL API.

## 2. Metodologia de Coleta

- **Coleta de Dados:** Os dados foram extraídos utilizando a API GraphQL do GitHub.
- **Amostra:** 12.231 repositórios ordenados por número de estrelas.
- **Validação:** A validação preliminar dos dados baseou-se na formulação de hipóteses informais e análise de distribuição, identificação de outliers e verificação de valores ausentes para cada RQ.

---

## 3. Hipóteses Informais e Resultados Preliminares

### RQ01: Idade dos Repositórios Populares
**Responsável: Luis**  
**Hipótese Informal:**  
**Métrica:**  
**Validação e Conclusão:**  

### RQ02: Contribuição Externa (Pull Requests)
**Responsável: Luis**  
**Hipótese Informal:**  
**Métrica:**  
**Validação e Conclusão:**  

### RQ03: Frequência de Releases
**Responsável: Isabella**  
**Hipótese Informal:** Repositórios populares tendem a lançar releases com regularidade, mas alguns podem não usar a ferramenta de releases do GitHub, como listas de curadoria e tutoriais.  
**Métrica:** Número total de releases lançadas por cada repositório.  
**Validação e Conclusão:** Na amostra de 12.231 repositórios, a mediana de releases é de 11, suportando a hipótese de regularidade. No entanto, aproximadamente 34% da amostra (4.181 repositórios) não lançou nenhuma release (0 releases), confirmando a hipótese de que há um grande volume de projetos, como guias e bibliografias, que não utilizam o versionamento tradicional de artefatos no GitHub.  

### RQ04: Frequência de Atualizações (Push)
**Responsável: Isabella**  
**Hipótese Informal:** Repositórios populares tendem a ser atualizados muito recentemente, pois projetos altamente ativos atraem e mantêm sua base de usuários.  
**Métrica:** Tempo decorrido (em dias) desde a última atualização de código (utilizei o `pushedAt` para ficar amais específico).  
**Validação e Conclusão:** Os resultados apoiam fortemente a hipótese. Cerca de 20% da amostra (2.413 repositórios) tiveram alterações de código nas últimas 24 horas. A mediana é de apenas 50 dias sem push, demonstrando alta frequência de manutenção. No entanto, foram detectados outliers significativos indicando abandono, o maior caso estando há 5.356 dias, quase 15 anos, sem atualizações.  

### RQ05: Linguagens Populares

**Responsável: Leandro**

**Hipótese Informal:** Repositórios populares tendem a ser escritos em linguagens também populares na comunidade GitHub, conforme a lista de linguagens mais utilizadas do GitHub Octoverse 2025.

**Métrica:** Linguagem principal de cada repositório. Como a coleta retorna as linguagens ordenadas por tamanho de código, foi considerada como linguagem principal a primeira linguagem listada.

**Validação e Conclusão:** Na amostra de 1.000 repositórios, 913 (91,30%) possuem uma linguagem identificada e 87 (8,70%) não possuem linguagem informada. Foram encontrados 702 repositórios (70,20% da amostra; 76,89% entre os identificados) em linguagens presentes no GitHub Octoverse 2025, apoiando a hipótese informal. Python (229), TypeScript (174) e JavaScript (110) foram as linguagens mais frequentes. A distribuição apresentou 43 linguagens distintas e 11 categorias raras, com apenas uma ocorrência; esses casos foram mantidos na análise, pois representam diversidade de linguagens e não dados inválidos.

### RQ06: Percentual de Issues Fechadas

**Responsável: Leandro**

**Hipótese Informal:** Repositórios populares tendem a possuir uma alta proporção de issues fechadas, pois projetos consolidados geralmente possuem manutenção mais ativa.

 **Métrica:** Razão entre issues fechadas e o total de issues: `issues fechadas / (issues abertas + issues fechadas)`. Para tornar “alto percentual” mensurável, foi adotado o critério operacional de pelo menos 75% de issues fechadas.

**Validação e Conclusão:** Na amostra de 1.000 repositórios, 957 possuíam issues suficientes para calcular a razão; 43 não possuíam issues e foram excluídos apenas desse cálculo. Não foram encontrados valores ausentes ou inválidos. A mediana da razão de fechamento foi 87,62% e 678 repositórios (70,85% dos casos válidos) alcançaram pelo menos 75% de issues fechadas, apoiando a hipótese informal. Foram identificados 40 outliers pela regra de 1,5 vezes o intervalo interquartil, todos na cauda inferior da distribuição; eles foram preservados para representar projetos com padrão de tratamento de issues diferente.

Fonte de linguagens populares: [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

### RQ07: Correlação Linguagem vs Atividade
**Responsável: Leandro**  
**Hipótese Informal:**  
**Métrica:**  
**Validação e Conclusão:**  

---

## 4. Considerações Finais
