export const loanQueryKeys = {
  all: ['loans'] as const,
  products: () => [...loanQueryKeys.all, 'products'] as const,
  validationRules: () => [...loanQueryKeys.all, 'validation-rules'] as const,
};
