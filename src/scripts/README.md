# Integração da coleta — Sprint 1

O comando abaixo consulta o GitHub GraphQL e exporta as métricas das RQs 01 a 06 para 100 repositórios:

```powershell
py -m src.scripts.coletar --limit 100
```

Antes de executá-lo, defina `GITHUB_TOKEN` apenas na sua sessão do PowerShell. Não coloque o token em arquivos versionados.

As funções de RQ05 e RQ06 são usadas durante a normalização dos resultados. A RQ07 não consulta a API: sua função de agrupamento por linguagem está preparada para a Sprint 3 e reutiliza o CSV coletado.
