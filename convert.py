import pandas as pd
import numpy as np
import json
import sys
import os
import shutil

def optimize_and_convert(csv_file='data/repositorios_populares.csv', parquet_file='data/repositorios_populares.parquet'):
    print(f"Lendo {csv_file}...")
    df = pd.read_csv(csv_file)
    total_repos = len(df)
    print(f"Total de registros: {total_repos:,}")

    # Downcast numeric columns for optimized storage and compression
    for col in df.select_dtypes(include=['int64', 'float64']).columns:
        # If column has integer values
        if pd.api.types.is_integer_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], downcast='integer')
        else:
            # Check if floats are actually whole numbers
            non_null = df[col].dropna()
            if len(non_null) > 0 and (non_null % 1 == 0).all():
                df[col] = pd.to_numeric(df[col], downcast='integer')
            else:
                df[col] = pd.to_numeric(df[col], downcast='float')

    # Ensure boolean columns are proper boolean where applicable
    bool_cols = ['esta_arquivado', 'possui_wiki', 'recebe_doacoes', 'possui_issues', 'e_fork']
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].astype(bool)

    # Save to Parquet using ZSTD compression
    print(f"Salvando {parquet_file} com compressão ZSTD (nível 12)...")
    df.to_parquet(
        parquet_file,
        engine='pyarrow',
        compression='zstd',
        compression_level=12,
        index=False
    )

    csv_size_mb = os.path.getsize(csv_file) / (1024 * 1024)
    parquet_size_mb = os.path.getsize(parquet_file) / (1024 * 1024)
    reduction = ((csv_size_mb - parquet_size_mb) / csv_size_mb) * 100
    print(f"Tamanho CSV: {csv_size_mb:.2f} MB | Tamanho Parquet: {parquet_size_mb:.2f} MB (Redução de {reduction:.1f}%)")

    # Generate metadata.json for instant UI bootstrap
    print("Gerando metadata.json...")
    langs = set()
    if 'linguagens' in df.columns:
        for l_str in df['linguagens'].dropna():
            for l in str(l_str).split(','):
                l_clean = l.strip()
                if l_clean:
                    langs.add(l_clean)

    years = []
    if 'criado_em' in df.columns:
        valid_years = pd.to_datetime(df['criado_em'], errors='coerce').dt.year.dropna().astype(int).unique()
        years = sorted([str(y) for y in valid_years], reverse=True)

    metadata = {
        'total_repos': total_repos,
        'languages': sorted(list(langs)),
        'years': years,
        'parquet_size_mb': round(parquet_size_mb, 2)
    }

    metadata_path = os.path.join(os.path.dirname(parquet_file), 'metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    print(f"Metadados salvos em {metadata_path}")

    # Copy to dashboard/public/data if directory exists
    public_data_dir = 'dashboard/public/data'
    if os.path.exists('dashboard/public'):
        os.makedirs(public_data_dir, exist_ok=True)
        shutil.copy(metadata_path, os.path.join(public_data_dir, 'metadata.json'))
        shutil.copy(parquet_file, os.path.join(public_data_dir, 'repositorios_populares.parquet'))
        print(f"Copiados arquivos para {public_data_dir}/")

if __name__ == '__main__':
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else 'data/repositorios_populares.csv'
    parquet_arg = sys.argv[2] if len(sys.argv) > 2 else 'data/repositorios_populares.parquet'
    optimize_and_convert(csv_arg, parquet_arg)

