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

const LOAN_PURPOSE_LABELS: Record<string, string> = {
  debt_consolidation: 'Debt consolidation',
  home_improvement: 'Home improvement',
  education: 'Education',
  medical: 'Medical expenses',
  other: 'Other',
};

export function loanPurposeLabel(value: string): string {
  return LOAN_PURPOSE_LABELS[value] ?? humanizeToken(value);
}

export function loanPurposeOptions(values: readonly string[]) {
  return values.map((value) => ({
    value,
    label: loanPurposeLabel(value),
  }));
}

const RISK_CATEGORY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function riskCategoryLabel(value: string): string {
  return RISK_CATEGORY_LABELS[value] ?? humanizeToken(value);
}

const AFFORDABILITY_SCORE_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export function affordabilityScoreLabel(value: string): string {
  return AFFORDABILITY_SCORE_LABELS[value] ?? humanizeToken(value);
}

function humanizeToken(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
