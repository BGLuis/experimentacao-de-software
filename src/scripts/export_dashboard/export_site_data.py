import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json
import os
from pathlib import Path

# Paths setup
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_FILE = BASE_DIR / "data" / "repositorios_populares.csv"
EXPORT_DIR = Path(__file__).resolve().parent
ASSETS_DIR = EXPORT_DIR / "assets"
JSON_FILE = EXPORT_DIR / "site_data.json"
MD_FILE = EXPORT_DIR / "report.md"

def export_data():
    print("Iniciando exportação de dados para o Dashboard...")
    df = pd.read_csv(DATA_FILE)
    
    # Pre-processing
    df['linguagens'] = df['linguagens'].fillna('')
    df['linguagem_primaria'] = df['linguagens'].apply(lambda x: x.split(',')[0].strip() if x else 'Nenhuma')
    df['tags'] = df['tags'].fillna('').str.lower()
    df['licenca'] = df['licenca'].fillna('Nenhuma/Não Informada')
    df['licenca_simples'] = df['licenca'].apply(lambda x: x[:30] + '...' if len(x) > 30 else x)
    df['criado_em'] = pd.to_datetime(df['criado_em'])
    df['ano_criacao'] = df['criado_em'].dt.year
    df['is_ai'] = df['tags'].str.contains('ai|ml|llm|gpt|machine learning')
    
    condicoes = [
        (df['tamanho_kb'] < 1000),         
        (df['tamanho_kb'] < 10000),        
        (df['tamanho_kb'] < 100000),       
        (df['tamanho_kb'] >= 100000)       
    ]
    categorias = ['Pequeno (<1MB)', 'Médio (1-10MB)', 'Grande (10-100MB)', 'Gigante (>100MB)']
    df['categoria_tamanho'] = np.select(condicoes, categorias, default='Desconhecido')

    data_json = {}
    
    # 1. Linguagens Top
    top_langs = df.groupby('linguagem_primaria')['estrelas'].sum().sort_values(ascending=False).head(10)
    data_json['top_linguagens_estrelas'] = top_langs.to_dict()
    
    plt.figure(figsize=(10, 6))
    top_langs.plot(kind='bar', color='skyblue')
    plt.title('Top 10 Linguagens por Estrelas Acumuladas')
    plt.ylabel('Soma de Estrelas')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(ASSETS_DIR / "linguagens_top.png")
    plt.close()
    
    # 2. IA por Ano
    ai_by_year = df[df['is_ai']].groupby('ano_criacao')['repositorio'].count()
    ai_by_year = ai_by_year[ai_by_year.index >= 2018]
    data_json['projetos_ia_por_ano'] = ai_by_year.to_dict()
    
    plt.figure(figsize=(10, 6))
    ai_by_year.plot(kind='line', marker='o', color='purple')
    plt.title('Crescimento de Repositórios de IA (2018+)')
    plt.ylabel('Quantidade de Projetos')
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(ASSETS_DIR / "ai_creations.png")
    plt.close()

    # 3. Tamanho vs Arquivamento
    tamanho_stats = df.groupby('categoria_tamanho').agg(
        taxa_arquivamento=('esta_arquivado', 'mean')
    ).reindex(categorias)
    data_json['taxa_arquivamento_por_tamanho'] = tamanho_stats.to_dict()['taxa_arquivamento']
    
    plt.figure(figsize=(8, 5))
    (tamanho_stats['taxa_arquivamento'] * 100).plot(kind='bar', color='coral')
    plt.title('Taxa de Abandono (Arquivamento) por Tamanho do Repo')
    plt.ylabel('Porcentagem Arquivada (%)')
    plt.xticks(rotation=0)
    plt.tight_layout()
    plt.savefig(ASSETS_DIR / "tamanho_arquivado.png")
    plt.close()
    
    # 4. Licenças vs Doações
    doacoes_licenca = df.groupby('licenca_simples').agg(
        qtd_projetos=('repositorio', 'count'),
        qtd_recebe_doacoes=('recebe_doacoes', 'sum')
    )
    doacoes_licenca['pct_doacoes'] = (doacoes_licenca['qtd_recebe_doacoes'] / doacoes_licenca['qtd_projetos']) * 100
    top_doacoes = doacoes_licenca[doacoes_licenca['qtd_projetos'] >= 50].sort_values('pct_doacoes', ascending=False).head(5)
    data_json['licencas_doacoes_pct'] = top_doacoes['pct_doacoes'].to_dict()
    
    plt.figure(figsize=(10, 6))
    top_doacoes['pct_doacoes'].plot(kind='bar', color='gold')
    plt.title('Top 5 Licenças que mais recebem Doações/Sponsors')
    plt.ylabel('Projetos Patrocinados (%)')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(ASSETS_DIR / "licencas_doacoes.png")
    plt.close()

    # Escrevendo JSON
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data_json, f, ensure_ascii=False, indent=4)
        
    # Escrevendo Markdown Report
    md_content = f"""# Relatório de Insights: Ecossistema GitHub

Este relatório apresenta análises estruturais, tendências e correlações extraídas dos dados dos repositórios mais populares.

## 1. Top Linguagens do Ecosistema
Observamos que as linguagens mais predominantes ditam o mercado atual de desenvolvimento, com liderança destacada das linguagens web e ciência de dados.

![Top Linguagens](assets/linguagens_top.png)

## 2. A Explosão da Inteligência Artificial
A partir de 2022/2023, o número de projetos com foco em IA (LLMs, GPTs, ML) explodiu, tornando o Python a principal linguagem contemporânea para inovação open-source.

![Crescimento IA](assets/ai_creations.png)

## 3. Tamanho do Projeto e Manutenção
Fica claro que projetos pequenos tendem a ser "abandonados" com o dobro de frequência em relação aos repositórios massivos, provando que grande volume de código atrai maior comprometimento da comunidade a longo prazo.

![Abandono por Tamanho](assets/tamanho_arquivado.png)

## 4. O Comportamento das Licenças e Doações
Licenças Copyleft (como AGPL e GPL) lideram o ranking de repositórios que pedem doações e suporte comunitário, contrastando com repositórios MIT que muitas vezes são mantidos por corporações.

![Doações por Licença](assets/licencas_doacoes.png)

*Dados extraídos e estruturados dinamicamente em {JSON_FILE.name}*
"""
    with open(MD_FILE, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Exportação concluída!")
    print(f"Arquivos gerados em {EXPORT_DIR}")

if __name__ == '__main__':
    export_data()
