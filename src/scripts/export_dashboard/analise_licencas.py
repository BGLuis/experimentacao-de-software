import pandas as pd
import numpy as np
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"

def analyze_licenses():
    df = pd.read_csv(DATA_FILE)
    df['licenca'] = df['licenca'].fillna('Nenhuma/Não Informada')
    df['licenca_simples'] = df['licenca'].apply(lambda x: x[:30] + '...' if len(x) > 30 else x)
    
    print("=== 1. LICENÇAS VS FINANCIAMENTO (Doações) ===")
    doacoes_licenca = df.groupby('licenca_simples').agg(
        qtd_projetos=('repositorio', 'count'),
        qtd_recebe_doacoes=('recebe_doacoes', 'sum')
    )
    doacoes_licenca['pct_doacoes'] = (doacoes_licenca['qtd_recebe_doacoes'] / doacoes_licenca['qtd_projetos']) * 100
    doacoes_licenca = doacoes_licenca[doacoes_licenca['qtd_projetos'] >= 50]
    print(doacoes_licenca.sort_values('pct_doacoes', ascending=False).head(8))
    
    print("\n=== 2. LICENÇAS VS ACEITAÇÃO DE COMUNIDADE (Pull Requests) ===")
    df['total_prs'] = df['pull_requests_abertas'] + df['pull_requests_aceitas']
    df['taxa_aceitacao_pr'] = np.where(df['total_prs'] > 0, df['pull_requests_aceitas'] / df['total_prs'], 0)
    
    pr_licenca = df.groupby('licenca_simples').agg(
        qtd_projetos=('repositorio', 'count'),
        media_taxa_aceitacao=('taxa_aceitacao_pr', 'mean'),
        media_prs_aceitas=('pull_requests_aceitas', 'mean')
    )
    pr_licenca = pr_licenca[pr_licenca['qtd_projetos'] >= 50]
    print(pr_licenca.sort_values('media_taxa_aceitacao', ascending=False).head(8))
    
    print("\n=== 3. LICENÇAS POR DOMÍNIO (IA vs Educação) ===")
    df['tags'] = df['tags'].fillna('').str.lower()
    df['is_ai'] = df['tags'].str.contains('ai|ml|llm|gpt|machine learning')
    df['is_edu'] = df['tags'].str.contains('education|tutorial|course|learn')
    
    print("\nTop 5 Licenças em Projetos de Inteligência Artificial:")
    ai_lic = df[df['is_ai']]['licenca_simples'].value_counts().head(5)
    print(ai_lic)
    
    print("\nTop 5 Licenças em Projetos de Educação:")
    edu_lic = df[df['is_edu']]['licenca_simples'].value_counts().head(5)
    print(edu_lic)
    
    print("\n=== 4. LICENÇAS VS MANUTENÇÃO (Projetos Arquivados) ===")
    arq_licenca = df.groupby('licenca_simples').agg(
        qtd_projetos=('repositorio', 'count'),
        qtd_arquivados=('esta_arquivado', 'sum')
    )
    arq_licenca['pct_arquivados'] = (arq_licenca['qtd_arquivados'] / arq_licenca['qtd_projetos']) * 100
    arq_licenca = arq_licenca[arq_licenca['qtd_projetos'] >= 50]
    print(arq_licenca.sort_values('pct_arquivados', ascending=False).head(8))

if __name__ == '__main__':
    analyze_licenses()
