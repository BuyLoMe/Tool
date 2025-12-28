
export interface PriceDetails {
  bankSettlement: number;
  gstPercentage: number;
  shippingCharges: number;
  platformFee: number;
  fixedFee: number;
}

export interface CalculationResult {
  listingPrice: number;
  gstAmount: number;
  totalFees: number;
  netMargin: number;
}

export interface GeneratedContent {
  title: string;
  keywords: string[];
  longDescription: string;
  features: string[];
}

export type ActiveView = 'dashboard' | 'listing';

export interface DashboardStats {
  revenue: number;
  orders: number;
  listings: number;
  profit: number;
}
