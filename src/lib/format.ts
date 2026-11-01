/** Shared display helpers. Do not format money, percents, or months inline. */

const wholeRandFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 0,
});

export function formatWholeRand(amount: number): string {
  return wholeRandFormatter.format(amount);
}

export function formatMonthDuration(months: number): string {
  const monthLabel = months === 1 ? '1 month' : `${months} months`;

  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    const yearLabel = years === 1 ? '1 year' : `${years} years`;
    return `${monthLabel} = ${yearLabel}`;
  }

  return monthLabel;
}
