/**
 * Reduz um array para um tamanho máximo preservando a distribuição,
 * selecionando elementos em intervalos regulares.
 */
export function sampleData<T>(data: T[], maxPoints = 2000): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}
