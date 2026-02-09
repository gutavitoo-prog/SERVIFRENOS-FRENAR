
import { Product, Sale, BrandConfig, ExternalSource } from './types';

const DB_NAME = 'NovaPOS_DB';
const DB_VERSION = 4; 

export class POSDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('fuentes_scraping')) {
          db.createObjectStore('fuentes_scraping', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject('Error opening database');
    });
  }

  async getAllProducts(): Promise<Product[]> {
    return this.getAll<Product>('products');
  }

  async saveProduct(product: Product): Promise<void> {
    await this.put('products', product);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.delete('products', id);
  }

  async getAllSales(): Promise<Sale[]> {
    return this.getAll<Sale>('sales');
  }

  async saveSale(sale: Sale): Promise<void> {
    await this.put('sales', sale);
    for (const item of sale.items) {
      const product = await this.get<Product>('products', item.id);
      if (product) {
        product.stock -= item.quantity;
        await this.put('products', product);
      }
    }
  }

  async getConfig(): Promise<BrandConfig | null> {
    const res = await this.get<{ key: string, value: BrandConfig }>('config', 'brand');
    return res?.value || null;
  }

  async saveConfig(config: BrandConfig): Promise<void> {
    await this.put('config', { key: 'brand', value: config });
  }

  async getAllExternalSources(): Promise<ExternalSource[]> {
    return this.getAll<ExternalSource>('fuentes_scraping');
  }

  async saveExternalSource(source: ExternalSource): Promise<void> {
    await this.put('fuentes_scraping', source);
  }

  async deleteExternalSource(id: string): Promise<void> {
    await this.delete('fuentes_scraping', id);
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(`Error fetching from ${storeName}`);
    });
  }

  private async get<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(`Error getting ${id} from ${storeName}`);
    });
  }

  private async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Error saving to ${storeName}`);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Error deleting from ${storeName}`);
    });
  }
}

export const db = new POSDatabase();
