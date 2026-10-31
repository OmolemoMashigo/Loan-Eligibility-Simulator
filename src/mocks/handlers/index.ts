import { productsHandlers } from './products';
import { validationRulesHandlers } from './validationRules';

export const handlers = [...productsHandlers, ...validationRulesHandlers];
