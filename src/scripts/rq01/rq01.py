import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Configurar caminhos
BASE_DIR = Path(__file__).resolve().parents[3]
DATA_PATH = BASE_DIR / 'data' / 'repositorios_populares.csv'
OUTPUT_DIR = Path(__file__).resolve().parent

def main():
    # Carregar dados
    df = pd.read_csv(DATA_PATH)

    # Calcular idade em anos para facilitar visualização
    df['idade_anos'] = df['idade_dias'] / 365.25

    # Calcular estatísticas
    median_age = df['idade_anos'].median()
    mean_age = df['idade_anos'].mean()
    std_age = df['idade_anos'].std()

    # Salvar estatísticas
    with open(OUTPUT_DIR / 'resultado_rq01.md', 'w', encoding='utf-8') as f:
        f.write(f"# Resultado RQ01 - Idade dos repositórios\n\n")
        f.write(f"- **Mediana**: {median_age:.2f} anos\n")
        f.write(f"- **Média**: {mean_age:.2f} anos\n")
        f.write(f"- **Desvio padrão**: {std_age:.2f} anos\n\n")
        f.write("A partir da mediana, podemos concluir se os repositórios são em geral mais maduros/antigos ou não.\n")
        
    # Gerar gráfico (Boxplot)
    plt.figure(figsize=(10, 6))
    sns.boxplot(x=df['idade_anos'])
    plt.title('Distribuição da Idade dos Repositórios Populares')
    plt.xlabel('Idade (Anos)')
    plt.savefig(OUTPUT_DIR / 'boxplot_idade.png', bbox_inches='tight')
    plt.close()

    # Gerar Histograma
    plt.figure(figsize=(10, 6))
    sns.histplot(df['idade_anos'], bins=30, kde=True)
    plt.title('Histograma da Idade dos Repositórios Populares')
    plt.xlabel('Idade (Anos)')
    plt.ylabel('Frequência')
    plt.savefig(OUTPUT_DIR / 'histograma_idade.png', bbox_inches='tight')
    plt.close()

    print("Resultados da RQ01 gerados e salvos com sucesso.")

if __name__ == '__main__':
    main()
