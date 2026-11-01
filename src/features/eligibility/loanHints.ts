import { formatWholeRand } from '@/lib/format';
import type { FormNumericRule } from './formDefaults';

export function loanAmountHint(rule: FormNumericRule): string | undefined {
  return rule.min !== undefined && rule.max !== undefined
    ? `Between ${formatWholeRand(rule.min)} and ${formatWholeRand(rule.max)}`
    : undefined;
}

export function loanTermHint(rule: FormNumericRule): string {
  return rule.min !== undefined && rule.max !== undefined
    ? `In months, between ${rule.min} and ${rule.max}`
    : 'In months';
}
