import { z } from 'zod';
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

export type EligibilityFormSchema = ReturnType<
  typeof buildEligibilityFormSchema
>;

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

const rawNumberInput = z.string();

export function parseNumericInput(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

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
) {
  const meta = buildFormFieldMeta(rules, defaults);

  /**
   * The request type needs age, income, expenses, debt, amount, and term
   * on every submit, so these are always required here whatever `required`
   * says. Only duration (SI-3) and credit score (SI-8) may be left out.
   */
  return z.object({
    personalInfo: z
      .object({
        age: requiredNumberField(meta.personalInfo.age, { integer: true }),
        employmentStatus: enumField(meta.personalInfo.employmentStatus),
        employmentDuration: optionalNumberField(
          meta.personalInfo.employmentDuration,
          { integer: true },
        ),
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
        monthlyIncome: requiredNumberField(meta.financialInfo.monthlyIncome),
        monthlyExpenses: requiredNumberField(
          meta.financialInfo.monthlyExpenses,
        ),
        existingDebt: requiredNumberField(meta.financialInfo.existingDebt),
        creditScore: optionalNumberField(meta.financialInfo.creditScore, {
          integer: true,
        }),
      })
      .transform(({ creditScore, ...rest }) =>
        creditScore === undefined ? rest : { ...rest, creditScore },
      ),
    loanDetails: z
      .object({
        requestedAmount: requiredNumberField(meta.loanDetails.requestedAmount),
        loanTerm: requiredNumberField(meta.loanDetails.loanTerm, {
          integer: true,
        }),
        loanPurpose: enumField(meta.loanDetails.loanPurpose),
      })
      .transform((value) => ({
        ...value,
        loanPurpose:
          value.loanPurpose as EligibilityRequest['loanDetails']['loanPurpose'],
      })),
  });
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

type NumericOptions = { integer?: boolean };

/** A number the request always needs. Blank input is an error. */
function requiredNumberField(
  rule: FormNumericRule,
  options: NumericOptions = {},
) {
  return rawNumberInput.transform((value, ctx): number => {
    const parsed = parseNumericInput(value);

    if (parsed === undefined) {
      ctx.addIssue({ code: 'custom', message: rule.errorMessage });
      return z.NEVER;
    }

    return checkNumberRule(parsed, rule, options, ctx);
  });
}

/** A number the request may leave out. Blank input becomes undefined. */
function optionalNumberField(
  rule: FormNumericRule,
  options: NumericOptions = {},
) {
  return rawNumberInput.transform((value, ctx): number | undefined => {
    const parsed = parseNumericInput(value);

    if (parsed === undefined) {
      return undefined;
    }

    return checkNumberRule(parsed, rule, options, ctx);
  });
}

function checkNumberRule(
  parsed: number,
  rule: FormNumericRule,
  options: NumericOptions,
  ctx: z.RefinementCtx,
): number {
  const valid =
    Number.isFinite(parsed) &&
    (!options.integer || Number.isInteger(parsed)) &&
    (rule.min === undefined || parsed >= rule.min) &&
    (rule.max === undefined || parsed <= rule.max);

  if (!valid) {
    ctx.addIssue({ code: 'custom', message: rule.errorMessage });
    return z.NEVER;
  }

  return parsed;
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
