const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
};

export function employmentStatusLabel(value: string): string {
  return EMPLOYMENT_STATUS_LABELS[value] ?? humanizeToken(value);
}

export function employmentStatusOptions(values: readonly string[]) {
  return values.map((value) => ({
    value,
    label: employmentStatusLabel(value),
  }));
}

function humanizeToken(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
