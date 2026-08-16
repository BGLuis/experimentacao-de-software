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
> **[Responsável: Luis]**
> **Hipótese Informal:**
> **Métrica:**
> **Validação e Conclusão:**

### RQ02: Contribuição Externa (Pull Requests)
> **[Responsável: Luis]**
> **Hipótese Informal:**
> **Métrica:**
> **Validação e Conclusão:**

### RQ03: Frequência de Releases
> **[Responsável: Isabella]**
> **Hipótese Informal:** Repositórios populares tendem a lançar releases com regularidade, mas alguns podem não usar a ferramenta de releases do GitHub, como listas de curadoria e tutoriais.
> **Métrica:** Número total de releases lançadas por cada repositório.
> **Validação e Conclusão:** Na amostra de 12.231 repositórios, a mediana de releases é de 11, suportando a hipótese de regularidade. No entanto, aproximadamente 34% da amostra (4.181 repositórios) não lançou nenhuma release (0 releases), confirmando a hipótese de que há um grande volume de projetos, como guias e bibliografias, que não utilizam o versionamento tradicional de artefatos no GitHub.

### RQ04: Frequência de Atualizações (Push)
> **[Responsável: Isabella]**
> **Hipótese Informal:** Repositórios populares tendem a ser atualizados muito recentemente, pois projetos altamente ativos atraem e mantêm sua base de usuários.
> **Métrica:** Tempo decorrido (em dias) desde a última atualização de código (utilizei o `pushedAt` para ficar amais específico).
> **Validação e Conclusão:** Os resultados apoiam fortemente a hipótese. Cerca de 20% da amostra (2.413 repositórios) tiveram alterações de código nas últimas 24 horas. A mediana é de apenas 50 dias sem push, demonstrando alta frequência de manutenção. No entanto, foram detectados outliers significativos indicando abandono (o maior caso estando há 5.356 dias, quase 15 anos, sem atualizações).

### RQ05: Linguagens Populares
> **[Responsável: Leandro]**
> **Hipótese Informal:**
> **Métrica:**
> **Validação e Conclusão:**

### RQ06: Manutenção Ativa (Issues Fechadas)
> **[Responsável: Leandro]**
> **Hipótese Informal:**
> **Métrica:**
> **Validação e Conclusão:**

### RQ07: Correlação Linguagem vs Atividade
> **[Responsável: Leandro]**
> **Hipótese Informal:**
> **Métrica:**
> **Validação e Conclusão:**

---

## 4. Considerações Finais

