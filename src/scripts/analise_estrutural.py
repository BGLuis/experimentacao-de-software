import pandas as pd
import numpy as np
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"

def analyze_structure():
    df = pd.read_csv(DATA_FILE)
    
    print("=== 1. O IMPACTO DA WIKI (possui_wiki) ===")
    wiki_stats = df.groupby('possui_wiki').agg(
        qtd_projetos=('repositorio', 'count'),
        media_estrelas=('estrelas', 'mean'),
        media_issues=('issues_abertas', 'mean'),
        media_prs=('pull_requests_abertas', 'mean')
    )
    print(wiki_stats)
    
    print("\n=== 2. TAMANHO DO REPOSITÓRIO (tamanho_kb) ===")
    # Categorizar os repositórios pelo tamanho
    condicoes = [
        (df['tamanho_kb'] < 1000),         # < 1 MB
        (df['tamanho_kb'] < 10000),        # 1 MB - 10 MB
        (df['tamanho_kb'] < 100000),       # 10 MB - 100 MB
        (df['tamanho_kb'] >= 100000)       # > 100 MB
    ]
    categorias = ['Pequeno (<1MB)', 'Médio (1-10MB)', 'Grande (10-100MB)', 'Gigante (>100MB)']
    df['categoria_tamanho'] = np.select(condicoes, categorias, default='Desconhecido')
    
    tamanho_stats = df.groupby('categoria_tamanho').agg(
        qtd_projetos=('repositorio', 'count'),
        media_estrelas=('estrelas', 'mean'),
        media_commits=('total_commits', 'mean'),
        taxa_arquivamento=('esta_arquivado', 'mean')
    )
    # Reordenar para exibir logicamente
    tamanho_stats = tamanho_stats.reindex(categorias)
    print(tamanho_stats)
    
    print("\n=== 3. REPOSITÓRIOS QUE DESATIVAM ISSUES (possui_issues = False) ===")
    no_issues = df[df['possui_issues'] == False]
    print(f"Total de projetos com issues desativadas: {len(no_issues)}")
    if len(no_issues) > 0:
        print("Linguagens mais comuns onde issues são desativadas:")
        print(no_issues['linguagens'].value_counts().head(3))
        
    print("\n=== 4. FORKS POPULARES (e_fork = True) ===")
    forks = df[df['e_fork'] == True]
    print(f"Total de forks que ficaram ultra populares (no dataset): {len(forks)}")
    if len(forks) > 0:
        print("Alguns forks famosos:")
        print(forks[['repositorio', 'estrelas']].sort_values('estrelas', ascending=False).head(3))

if __name__ == '__main__':
    analyze_structure()
