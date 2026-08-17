import pandas as pd
import matplotlib.pyplot as plt
import os
from pathlib import Path

# Configura o caminho absoluto
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"

def run_analysis():
    print("--- INICIANDO ANÁLISE ---")
    df = pd.read_csv(DATA_FILE)
    
    # Preencher linguagens vazias e converter data
    df['linguagens'] = df['linguagens'].fillna('')
    df['criado_em'] = pd.to_datetime(df['criado_em'])
    df['ano_criacao'] = df['criado_em'].dt.year
    
    # 1. Identificar linguagens primárias (a primeira da lista)
    df['linguagem_primaria'] = df['linguagens'].apply(lambda x: x.split(',')[0].strip() if x else 'Nenhuma')
    
    # 2. Criar grade das linguagens mais populares por ano (baseado na soma de estrelas ou contagem de repos)
    # Pegando as top 5 linguagens com mais estrelas acumuladas em todo dataset
    top_langs = df.groupby('linguagem_primaria')['estrelas'].sum().sort_values(ascending=False).head(10).index.tolist()
    
    # Pivot table (grade) das top linguagens por ano de criação (soma de estrelas)
    df_top = df[df['linguagem_primaria'].isin(top_langs)]
    grade_ano = pd.crosstab(df_top['ano_criacao'], df_top['linguagem_primaria'], values=df_top['estrelas'], aggfunc='sum').fillna(0)
    
    print("\n[Grade: Top Linguagens por Ano de Criação (Soma de Estrelas)]")
    print(grade_ano.tail(6)) # Mostra os ultimos 6 anos
    
    # 3. Análise específica: Repositórios apenas de Markdown (ou cujo primário é Markdown)
    df['eh_markdown_only'] = df['linguagens'].apply(lambda x: x.strip().lower() == 'markdown')
    df['tem_markdown'] = df['linguagens'].apply(lambda x: 'markdown' in x.lower())
    
    # Repositórios cujo primário é Markdown (Lists, curadorias, tutorias) por ano
    df_md = df[df['linguagem_primaria'] == 'Markdown']
    md_por_ano = df_md.groupby('ano_criacao').agg(
        qtd_repos=('repositorio', 'count'),
        total_estrelas=('estrelas', 'sum')
    )
    
    print("\n[Crescimento de Repositórios 'Markdown' por Ano de Criação]")
    print(md_por_ano.tail(6))
    
    # Vamos ver os repositórios mais estrelados de Markdown criados desde 2022
    recent_md = df_md[df_md['ano_criacao'] >= 2022].sort_values(by='estrelas', ascending=False).head(5)
    print("\n[Top 5 Repositórios de Markdown criados de 2022 em diante]")
    for _, row in recent_md.iterrows():
        print(f"- {row['repositorio']} ({row['ano_criacao']}): {row['estrelas']} estrelas -> {row['descricao'][:60]}...")

if __name__ == '__main__':
    run_analysis()
