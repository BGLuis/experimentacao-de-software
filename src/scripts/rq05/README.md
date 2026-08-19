**RQ 05.** Sistemas populares são escritos nas linguagens mais populares?
Métrica: linguagem primária de cada repositório
*(defina e referencie explicitamente a fonte usada para "linguagens mais populares" — ex.: TIOBE Index, GitHut ou o Octoverse do GitHub — mantendo a mesma referência ao longo de todo o laboratório)*

## Hipótese informal - Sprint 02

A maioria dos repositórios populares utiliza uma linguagem presente entre as dez linguagens mais populares do GitHub Octoverse 2025.

Fonte mantida no laboratório: [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/).

## Validação dos dados

O script `validacao.py` verifica:

- distribuição da linguagem principal;
- quantidade e percentual de linguagens ausentes;
- proporção de repositórios em linguagens do Octoverse;
- categorias raras, definidas como linguagens com apenas uma ocorrência.

Execução sobre toda a base:

```powershell
py src/scripts/rq05/validacao.py
```

Após a coleta dos 1.000 repositórios, exporte a distribuição com:

```powershell
py src/scripts/rq05/validacao.py --arquivo data/repositorios_populares_1000.csv --quantidade 1000 --saida data/analises/rq05_distribuicao.csv
```
