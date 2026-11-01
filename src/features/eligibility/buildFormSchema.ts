import { z, type ZodType } from 'zod';
import type { EligibilityRequest } from '@/api';
import {
  FORM_VALIDATION_DEFAULTS,
  type FormEnumRule,
  type FormNumericRule,
  type FormValidationDefaults,
  requiresEmploymentDuration,
} from './formDefaults';

export type EligibilityFormRules = {
  personalInfo: {
    age: FormNumericRule;
    employmentStatus: FormEnumRule;
    employmentDuration: FormNumericRule;
  };
  financialInfo: {
    monthlyIncome: FormNumericRule;
    monthlyExpenses: FormNumericRule;
    creditScore: FormNumericRule;
  };
  loanDetails: {
    requestedAmount: FormNumericRule;
    loanTerm: FormNumericRule;
  };
};

export type EligibilityFormSchema = ZodType<EligibilityRequest>;

export type FormFieldMeta = {
  personalInfo: {
    age: FormNumericRule;
    employmentStatus: FormEnumRule;
    employmentDuration: FormNumericRule;
  };
  financialInfo: {
    monthlyIncome: FormNumericRule;
    monthlyExpenses: FormNumericRule;
    existingDebt: FormNumericRule;
    creditScore: FormNumericRule;
  };
  loanDetails: {
    requestedAmount: FormNumericRule;
    loanTerm: FormNumericRule;
    loanPurpose: FormEnumRule;
  };
};

const rawNumberInput = z.union([z.string(), z.number()]);

export function parseNumericInput(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const compact = trimmed.replace(/\s/g, '');
  const normalised =
    compact.includes(',') && !compact.includes('.')
      ? compact.replace(',', '.')
      : compact;

  if (!/^[+-]?\d+(\.\d+)?$/.test(normalised)) {
    return Number.NaN;
  }

  return Number(normalised);
}

export function buildFormFieldMeta(
  rules: EligibilityFormRules,
  defaults: FormValidationDefaults = FORM_VALIDATION_DEFAULTS,
): FormFieldMeta {
  return {
    personalInfo: {
      age: { ...rules.personalInfo.age },
      employmentStatus: { ...rules.personalInfo.employmentStatus },
      employmentDuration: {
        ...rules.personalInfo.employmentDuration,
        max:
          rules.personalInfo.employmentDuration.max ??
          defaults.employmentDurationMax,
      },
    },
    financialInfo: {
      monthlyIncome: {
        ...rules.financialInfo.monthlyIncome,
        max: rules.financialInfo.monthlyIncome.max ?? defaults.monthlyIncomeMax,
      },
      monthlyExpenses: {
        ...rules.financialInfo.monthlyExpenses,
        max:
          rules.financialInfo.monthlyExpenses.max ??
          defaults.monthlyExpensesMax,
      },
      existingDebt: { ...defaults.existingDebt },
      creditScore: { ...rules.financialInfo.creditScore },
    },
    loanDetails: {
      requestedAmount: { ...rules.loanDetails.requestedAmount },
      loanTerm: { ...rules.loanDetails.loanTerm },
      loanPurpose: { ...defaults.loanPurpose },
    },
  };
}

export function buildEligibilityFormSchema(
  rules: EligibilityFormRules,
  defaults: FormValidationDefaults = FORM_VALIDATION_DEFAULTS,
): EligibilityFormSchema {
  const meta = buildFormFieldMeta(rules, defaults);

  return z.object({
    personalInfo: z
      .object({
        age: numericField(meta.personalInfo.age, { integer: true }),
        employmentStatus: enumField(meta.personalInfo.employmentStatus),
        employmentDuration: numericField(meta.personalInfo.employmentDuration, {
          integer: true,
          treatAsOptional: true,
        }),
      })
      .transform((value, ctx) => {
        if (!requiresEmploymentDuration(value.employmentStatus)) {
          return {
            age: value.age,
            employmentStatus:
              value.employmentStatus as EligibilityRequest['personalInfo']['employmentStatus'],
          };
        }

        if (value.employmentDuration === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: meta.personalInfo.employmentDuration.errorMessage,
            path: ['employmentDuration'],
          });
          return z.NEVER;
        }

        return {
          age: value.age,
          employmentStatus:
            value.employmentStatus as EligibilityRequest['personalInfo']['employmentStatus'],
          employmentDuration: value.employmentDuration,
        };
      }),
    financialInfo: z
      .object({
        monthlyIncome: numericField(meta.financialInfo.monthlyIncome),
        monthlyExpenses: numericField(meta.financialInfo.monthlyExpenses),
        existingDebt: numericField(meta.financialInfo.existingDebt),
        creditScore: numericField(meta.financialInfo.creditScore, {
          integer: true,
        }),
      })
      .transform((value) => {
        if (value.creditScore === undefined) {
          return {
            monthlyIncome: value.monthlyIncome,
            monthlyExpenses: value.monthlyExpenses,
            existingDebt: value.existingDebt,
          };
        }

        return value;
      }),
    loanDetails: z.object({
      requestedAmount: numericField(meta.loanDetails.requestedAmount),
      loanTerm: numericField(meta.loanDetails.loanTerm, { integer: true }),
      loanPurpose: enumField(meta.loanDetails.loanPurpose),
    }),
  }) as EligibilityFormSchema;
}

export function formFieldErrors(error: {
  issues: readonly { path: PropertyKey[]; message: string }[];
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');

    if (path.length > 0 && !(path in fieldErrors)) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

function numericField(
  rule: FormNumericRule,
  options: { integer?: boolean; treatAsOptional?: boolean } = {},
) {
  const required = options.treatAsOptional ? false : rule.required;

  return rawNumberInput.transform((value, ctx) => {
    const parsed = parseNumericInput(value);

    if (parsed === undefined) {
      if (!required) {
        return undefined;
      }

      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    if (options.integer && !Number.isInteger(parsed)) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    if (rule.min !== undefined && parsed < rule.min) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    if (rule.max !== undefined && parsed > rule.max) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    return parsed;
  });
}

function enumField(rule: FormEnumRule) {
  const allowed = new Set(rule.options);

  return z.string().transform((value, ctx) => {
    if (value.trim().length === 0 || !allowed.has(value)) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    return value;
  });
}
