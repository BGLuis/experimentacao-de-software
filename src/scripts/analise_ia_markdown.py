import pandas as pd
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"

def analyze_ai_markdown():
    df = pd.read_csv(DATA_FILE)
    df['linguagens'] = df['linguagens'].fillna('')
    df['descricao'] = df['descricao'].fillna('')
    df['tags'] = df['tags'].fillna('')
    df['criado_em'] = pd.to_datetime(df['criado_em'])
    df['ano_criacao'] = df['criado_em'].dt.year
    
    # Identify AI related repos
    ai_keywords = ['ai', 'llm', 'gpt', 'chatgpt', 'agent', 'machine learning', 'deep learning']
    
    def is_ai(row):
        text = str(row['descricao']).lower() + " " + str(row['tags']).lower()
        for kw in ai_keywords:
            if kw in text:
                return True
        return False
        
    df['is_ai'] = df.apply(is_ai, axis=1)
    
    # 1. Total AI Repos by Year
    ai_by_year = df[df['is_ai']].groupby('ano_criacao')['repositorio'].count()
    print("Repositórios sobre IA/LLMs por Ano de Criação:")
    print(ai_by_year.tail(6))
    
    # 2. Top AI Repos in Markdown created recently
    recent_md_ai = df[(df['is_ai']) & (df['linguagens'].str.contains('Markdown', case=False, na=False)) & (df['ano_criacao'] >= 2023)]
    
    print("\nRepositórios de IA focados em Markdown (Criados desde 2023):")
    for _, row in recent_md_ai.sort_values(by='estrelas', ascending=False).head(10).iterrows():
        print(f"- {row['repositorio']} ({row['ano_criacao']}) | {row['estrelas']} estrelas | {row['linguagens']}")
        print(f"  Desc: {row['descricao'][:100]}")
        
    # Top 5 overall languages for AI repos in 2024-2026
    recent_ai = df[(df['is_ai']) & (df['ano_criacao'] >= 2024)]
    recent_ai['linguagem_primaria'] = recent_ai['linguagens'].apply(lambda x: x.split(',')[0].strip() if x else 'Nenhuma')
    top_ai_langs = recent_ai.groupby('linguagem_primaria')['estrelas'].sum().sort_values(ascending=False).head(5)
    print("\nTop 5 Linguagens para Projetos de IA (Criação >= 2024, por estrelas acumuladas):")
    print(top_ai_langs)

if __name__ == '__main__':
    analyze_ai_markdown()
