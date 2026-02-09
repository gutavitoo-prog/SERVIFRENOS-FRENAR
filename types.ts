
export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image?: string;
}

export interface SaleItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface BrandConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  receiptFooter: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  SALES_HISTORY = 'SALES_HISTORY',
  IMPORT = 'IMPORT',
  SCRAPING = 'SCRAPING',
  SETTINGS = 'SETTINGS'
}
