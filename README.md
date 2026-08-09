# Laboratório de Experimentação de Software

Mineração de repositórios populares do GitHub para a disciplina de Laboratório de Experimentação de Software.

## Sprint 1 — Lab01S01

O objetivo é coletar, por GraphQL, os 100 repositórios públicos mais estrelados. O mesmo coletor será ampliado para 1.000 na Sprint 2.

| RQ | Métrica |
| --- | --- |
| RQ01 | Data de criação e idade |
| RQ02 | Pull requests aceitas |
| RQ03 | Releases |
| RQ04 | Última atualização |
| RQ05 | Linguagem primária |
| RQ06 | Issues abertas, fechadas e razão de fechamento |

RQ07 será analisada na Sprint 3 a partir de RQ02, RQ03 e RQ04 agrupadas por linguagem.

## Estrutura

```text
minerar.py                 # comando único de coleta
src/mineracao/client.py    # comunicação com GitHub GraphQL
src/mineracao/query.py     # consulta GraphQL
src/mineracao/transform.py # normalização e exportação
data/                      # resultados locais (ignorados pelo Git)
docs/                      # planejamento e documentação
```

## Preparação

1. Instale Python 3.10 ou superior.
2. Gere um [Personal Access Token](https://github.com/settings/tokens) do GitHub com acesso de leitura a repositórios públicos.
3. Copie `.env.example` para `.env` e informe o token:

```powershell
Copy-Item .env.example .env
```

```text
GITHUB_TOKEN=seu_token_aqui
```

O token não é enviado ao GitHub: `.env` está no `.gitignore`.

## Execução

```powershell
python minerar.py --limit 100
```

O resultado é salvo em `data/repositorios.csv` e `data/repositorios.json`.

## Processo do grupo

O GitHub Projects deve usar `Backlog → To Do → Doing → Review → Done`, com WIP máximo de **3** em Doing (uma tarefa principal por integrante). Cada tarefa precisa ser uma Issue com responsável; todo commit deve mencionar sua Issue, por exemplo: `#12 implementa consulta GraphQL`.

## Fonte para RQ05

A equipe definirá e documentará uma única fonte para "linguagens mais populares" antes da análise, mantendo-a durante todo o laboratório.

Repositório do grupo: https://github.com/BGLuis/experimentacao-de-software
