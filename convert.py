import pandas as pd
import sys

csv_file = sys.argv[1]
parquet_file = sys.argv[2]

df = pd.read_csv(csv_file)
df.to_parquet(parquet_file, engine='pyarrow', compression='snappy')
print(f"Converted {csv_file} to {parquet_file}")
