
export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image?: string;
  source?: 'local' | 'external';
}

export interface ExternalSource {
  id: string;
  nombre: string;
  url_base: string;
  color_identificador: string;
  logo_path?: string;
  selector_precio_css: string;
  cookies_config?: string;
  requires_login: boolean;
  active: boolean;
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
  searchMode: 'local' | 'global';
}

export interface UnifiedSearchResult {
  id: string;
  fuente: string;
  nombre: string;
  sku: string;
  precio: number | string; 
  link: string;
  tipo: 'local' | 'external';
  color: string;
  logo?: string;
  image?: string;
  stock?: number;
  isBestPrice?: boolean;
  status?: 'ok' | 'requires_login' | 'error';
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  SALES_HISTORY = 'SALES_HISTORY',
  IMPORT = 'IMPORT',
  SCRAPING = 'SCRAPING',
  SOURCES = 'SOURCES',
  SETTINGS = 'SETTINGS'
}
