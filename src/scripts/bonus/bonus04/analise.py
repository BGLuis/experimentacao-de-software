import pandas as pd
import numpy as np
from collections import Counter
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"

def run_trends_and_correlations():
    df = pd.read_csv(DATA_FILE)
    df['linguagens'] = df['linguagens'].fillna('')
    df['tags'] = df['tags'].fillna('')
    df['licenca'] = df['licenca'].fillna('Sem Licença')
    
    print("=== 1. CORRELAÇÕES GERAIS DE POPULARIDADE ===")
    # Correlação entre métricas numéricas
    cols_correlacao = ['estrelas', 'forks', 'observadores', 'tamanho_kb', 'issues_abertas', 'pull_requests_abertas', 'total_commits']
    corr_matrix = df[cols_correlacao].corr()
    print("Correlação com Estrelas:")
    print(corr_matrix['estrelas'].sort_values(ascending=False)[1:]) # exclui a própria estrela
    
    print("\n=== 2. TENDÊNCIAS DE TAGS VS POPULARIDADE ===")
    # Para analisar tags, precisamos separar as listas separadas por vírgula
    tags_list = df['tags'].apply(lambda x: [tag.strip() for tag in x.split(',') if tag.strip()])
    
    # Criar um dicionário para acumular estrelas e contagem por tag
    tag_stats = {}
    for idx, tags in tags_list.items():
        stars = df.at[idx, 'estrelas']
        for tag in tags:
            if tag not in tag_stats:
                tag_stats[tag] = {'count': 0, 'stars': 0}
            tag_stats[tag]['count'] += 1
            tag_stats[tag]['stars'] += stars
            
    # Converter para dataframe para facilitar o sort
    tags_df = pd.DataFrame.from_dict(tag_stats, orient='index')
    tags_df['avg_stars'] = tags_df['stars'] / tags_df['count']
    
    # Filtrar tags que aparecem em pelo menos 20 repositórios para evitar anomalias (1 repo gigante distorcendo)
    tags_populares = tags_df[tags_df['count'] >= 20].copy()
    
    print("\nTop 10 Tags que mais geram engajamento (Média de Estrelas por Repo):")
    print(tags_populares.sort_values('avg_stars', ascending=False)[['count', 'avg_stars']].head(10).astype({'avg_stars': 'int'}))
    
    print("\nTop 10 Tags mais frequentes no ecosistema (Soma Total de Estrelas):")
    print(tags_populares.sort_values('stars', ascending=False)[['count', 'stars']].head(10))

    print("\n=== 3. TENDÊNCIAS DE COMBINAÇÃO (LINGUAGEM + TAG) ===")
    df['linguagem_primaria'] = df['linguagens'].apply(lambda x: x.split(',')[0].strip() if x else 'Nenhuma')
    
    # Vamos pegar repositorios populares e ver as combinações
    combo_df = df.explode('tags')
    # O explode requer que a coluna tags seja lista
    df['lista_tags'] = df['tags'].apply(lambda x: [tag.strip() for tag in x.split(',') if tag.strip()][:3]) # pega top 3 tags para n explodir mt
    combo_df = df.explode('lista_tags')
    combo_df = combo_df[combo_df['lista_tags'].notna()]
    
    combo_grouped = combo_df.groupby(['linguagem_primaria', 'lista_tags']).agg(
        qtd=('repositorio', 'count'),
        media_estrelas=('estrelas', 'mean')
    ).reset_index()
    
    combo_filtrado = combo_grouped[combo_grouped['qtd'] >= 15]
    print("\nTop 10 Combinações de (Linguagem + Tag) com MAIOR Média de Estrelas:")
    print(combo_filtrado.sort_values('media_estrelas', ascending=False).head(10).to_string(index=False))

    print("\n=== 4. TENDÊNCIAS DE LICENCIAMENTO ===")
    # Agrupar por licença
    lic_df = df.groupby('licenca').agg(
        qtd=('repositorio', 'count'),
        media_estrelas=('estrelas', 'mean')
    ).reset_index()
    lic_filtrado = lic_df[lic_df['qtd'] >= 50].sort_values('media_estrelas', ascending=False)
    print("\nTop 5 Licenças que concentram os repositórios mais populares (Média de Estrelas):")
    for _, row in lic_filtrado.head(5).iterrows():
        lic_name = row['licenca'][:40]
        print(f"- {lic_name}: {int(row['media_estrelas'])} estrelas (em {row['qtd']} projetos)")

if __name__ == '__main__':
    run_trends_and_correlations()
