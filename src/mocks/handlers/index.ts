import { calculateRateHandlers } from './calculateRate';
import { eligibilityHandlers } from './eligibility';
import { productsHandlers } from './products';
import { validationRulesHandlers } from './validationRules';

export const handlers = [
  ...productsHandlers,
  ...validationRulesHandlers,
  ...eligibilityHandlers,
  ...calculateRateHandlers,
];
