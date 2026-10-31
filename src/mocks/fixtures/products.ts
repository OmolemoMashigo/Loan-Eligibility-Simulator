import { PERSONAL_LOAN_PRODUCT } from '@/mocks/engine';
import type { LoanProduct, ProductsResponse } from '@/mocks/engine';

/** Vehicle Finance is listed on the products API (SI-1) but is out of scope for calculations. */
export const VEHICLE_LOAN_PRODUCT: LoanProduct = {
  id: 'vehicle_loan',
  name: 'Vehicle Finance',
  description: 'Financing for new and used vehicles',
  minAmount: 50_000,
  maxAmount: 1_500_000,
  minTerm: 12,
  maxTerm: 72,
  interestRateRange: {
    min: 8.5,
    max: 15.0,
  },
  purposes: ['new_vehicle', 'used_vehicle'],
};

export const PRODUCTS_RESPONSE: ProductsResponse = {
  products: [PERSONAL_LOAN_PRODUCT, VEHICLE_LOAN_PRODUCT],
};
