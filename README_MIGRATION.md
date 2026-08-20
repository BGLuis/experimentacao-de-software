# Migração para DuckDB + Parquet

## O Problema
Com a expectativa de escalar o dataset de repositórios para 200k linhas, a técnica original (fazer o download e o parsing de um arquivo CSV de possivelmente 150MB usando `Papa.parse`) se tornaria inviável, travando a interface do usuário (main thread) do navegador e resultando em longos tempos de carregamento.

## A Solução
Para solucionar o problema e preparar o dashboard para receber os 200 mil repositórios, migramos a arquitetura para **Apache Parquet + DuckDB WASM**. Essa abordagem é a mais recomendada pelo relatório ("Best for analytics, sums, averages, and aggregations") para os casos em que fazemos contas e agregações usando React:

1. **Eficiência do formato**: Um arquivo CSV de 200k linhas pesaria em torno de 150MB, enquanto no formato Parquet (colunar e comprimido) esse mesmo dado é absurdamente menor (~15MB ou menos).
2. **DuckDB WASM**: Com o banco de dados rodando em WebAssembly no navegador do usuário, conseguimos executar um comando `SELECT * FROM read_parquet` que converte a leitura colunar do arquivo para o JS de maneira otimizada usando Apache Arrow. Sem nenhum gargalo de parsing em texto.

## O que foi alterado
- Criamos um script `convert.py` que lê o `data/repositorios_populares.csv` e converte para `data/repositorios_populares.parquet`.
- Instalamos o `@duckdb/duckdb-wasm` e `apache-arrow`.
- Atualizamos o `src/context/DataContext.tsx` para não utilizar mais o `Papa.parse` e passar a consumir o link raw do arquivo Parquet hospedado no seu GitHub, usando o DuckDB.

## Próximos Passos
1. Executei a conversão do CSV atual para Parquet localmente e modifiquei seu React, **mas o arquivo `repositorios_populares.parquet` não está no repositório remoto do GitHub**. Portanto, em produção, o link falhará até que você adicione o `.parquet` aos seus commits e dê `git push`.
2. Quando for atualizar os dados para os 200k repositórios, basta que seu bot/scrapper exporte os dados usando `.parquet` (ou usar o meu script `python3 convert.py` após exportar o csv). Depois basta enviar o parquet atualizado para o GitHub, o DuckDB já fará o resto!
