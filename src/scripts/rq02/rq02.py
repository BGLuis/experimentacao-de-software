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

    # Extrair métrica
    prs = df['pull_requests_aceitas']

    # Calcular estatísticas
    median_prs = prs.median()
    mean_prs = prs.mean()
    std_prs = prs.std()

    # Salvar estatísticas
    with open(OUTPUT_DIR / 'resultado_rq02.md', 'w', encoding='utf-8') as f:
        f.write(f"# Resultado RQ02 - Pull Requests Aceitas\n\n")
        f.write(f"- **Mediana**: {median_prs:.2f}\n")
        f.write(f"- **Média**: {mean_prs:.2f}\n")
        f.write(f"- **Desvio padrão**: {std_prs:.2f}\n\n")
        f.write("A partir desses dados, avaliamos se os sistemas recebem muita contribuição externa (alto número de PRs).\n")
        
    # Gerar gráfico (Boxplot)
    plt.figure(figsize=(10, 6))
    sns.boxplot(x=prs)
    plt.title('Distribuição de Pull Requests Aceitas nos Repositórios Populares')
    plt.xlabel('Pull Requests Aceitas')
    plt.savefig(OUTPUT_DIR / 'boxplot_prs.png', bbox_inches='tight')
    plt.close()

    # Gerar Boxplot com escala Log
    # Muitas PRs podem ser outliers extremos (ex: dezenas de milhares vs poucas dezenas)
    plt.figure(figsize=(10, 6))
    sns.boxplot(x=prs)
    plt.xscale('log')
    plt.title('Distribuição de Pull Requests Aceitas (Escala Logarítmica)')
    plt.xlabel('Pull Requests Aceitas (Log)')
    plt.savefig(OUTPUT_DIR / 'boxplot_prs_log.png', bbox_inches='tight')
    plt.close()
    
    # Gerar Histograma (Escala Log)
    plt.figure(figsize=(10, 6))
    sns.histplot(prs, bins=30, kde=True, log_scale=True)
    plt.title('Histograma de Pull Requests Aceitas (Escala Logarítmica)')
    plt.xlabel('Pull Requests Aceitas (Log)')
    plt.ylabel('Frequência')
    plt.savefig(OUTPUT_DIR / 'histograma_prs_log.png', bbox_inches='tight')
    plt.close()

    print("Resultados da RQ02 gerados e salvos com sucesso.")

if __name__ == '__main__':
    main()
