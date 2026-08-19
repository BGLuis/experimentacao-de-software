# Relatório de Pesquisa: Análise de Repositórios Populares no GitHub

**Disciplina:** Laboratório de Experimentação de Software  
**Equipe:** Isabella Dias, Luis Henrique, Leandro Alencar  
**Data:** 06 de Agosto de 2026  

---

## 1. Introdução com Hipóteses Informais (RQs)

Este relatório apresenta os resultados preliminares da mineração e análise de dados dos repositórios mais populares do GitHub. O objetivo da pesquisa é investigar características fundamentais que tornam projetos de código aberto bem-sucedidos e ativos na comunidade, guiados por 6 Questões de Pesquisa (RQs). A amostra utilizada neste estudo contém os 1.000 repositórios mais populares coletados via GraphQL API.

## 2. Metodologia de Coleta

- **Coleta de Dados:** Os dados foram extraídos utilizando a API GraphQL do GitHub.
- **Amostra:** 1.000 repositórios ordenados por número de estrelas.
- **Validação:** A validação preliminar dos dados baseou-se na formulação de hipóteses informais e análise de distribuição, identificação de outliers e verificação de valores ausentes para cada RQ.

---

## 3. Hipóteses Informais e Resultados Preliminares

### RQ01: Idade dos Repositórios Populares
**Responsável: Luis**  
**Hipótese Informal:** Repositórios mais populares tendem a ser maduros e antigos, pois precisam de tempo para construir uma comunidade sólida e acumular milhares de estrelas.  
**Métrica:** Idade do repositório em anos (calculada a partir da data de criação até a data atual).  
**Validação e Conclusão:** A análise dos dados suporta a hipótese. A mediana de idade dos repositórios na amostra foi de 8,72 anos (com média de 8,33 anos e desvio padrão de 4,32 anos). Isso confirma que a grande maioria dos repositórios de sucesso global são projetos bastante estabelecidos e consolidados ao longo de quase uma década.

### RQ02: Contribuição Externa (Pull Requests)
**Responsável: Luis**  
**Hipótese Informal:** Repositórios populares recebem uma quantidade massiva de contribuições externas através de pull requests, refletindo um alto engajamento e descentralização do desenvolvimento.  
**Métrica:** Total de pull requests aceitas (status merged) por repositório.  
**Validação e Conclusão:** Os resultados confirmam fortemente a hipótese. A mediana de PRs aceitas foi de 134, indicando colaboração externa frequente na maioria absoluta dos projetos. A média foi de 1.273,64 com um desvio padrão muito alto (6.215,67), demonstrando a presença de repositórios gigantescos que concentram volumes extremos de contribuições externas da comunidade.  

### RQ03: Frequência de Releases
**Responsável: Isabella**  
**Hipótese Informal:** Repositórios populares tendem a lançar releases com regularidade, mas alguns podem não usar a ferramenta de releases do GitHub, como listas de curadoria e tutoriais.  
**Métrica:** Número total de releases lançadas por cada repositório.  
**Validação e Conclusão:** Na nova amostra dos Top 1.000 repositórios, a mediana de releases subiu consideravelmente para 39,5, indicando uma regularidade de versionamento muito alta entre a elite do GitHub. Contudo, 28% (280 repositórios) não lançaram nenhuma release (0 releases). Isso reafirma que uma porção enorme dos projetos mais hypados ainda foca em conteúdos passivos (guias, listas) ou não adota releases formais.

### RQ04: Frequência de Atualizações (Push)
**Responsável: Isabella**  
**Hipótese Informal:** Repositórios populares tendem a ser atualizados muito recentemente, pois projetos altamente ativos atraem e mantêm sua base de usuários.  
**Métrica:** Tempo decorrido (em dias) desde a última atualização de código (utilizando o `pushedAt`).  
**Validação e Conclusão:** Os dados dos 1.000 maiores repositórios comprovam uma atividade diária frenética: 40,5% deles receberam atualizações de código nas últimas 24 horas. A mediana global de inatividade é de apenas 3 dias (contra 50 dias da amostra geral antiga). O outlier mais extremo de abandono nesta elite está há 2.448 dias (cerca de 6,7 anos) sem um push sequer, mostrando que a fama pode persistir muito além da manutenção ativa.

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



---

## 4. Considerações Finais

