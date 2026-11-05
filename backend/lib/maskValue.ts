export function maskValue(value: string): string {
  if (value === '') return '';
  const len = value.length;
  if (len <= 4) {
    return '*'.repeat(len);
  }
  return value.slice(0, 2) + '*'.repeat(len - 4) + value.slice(-2);
}
