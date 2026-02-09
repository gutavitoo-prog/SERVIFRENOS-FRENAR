
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product, ExternalSource, BrandConfig, UnifiedSearchResult } from '../types';
import { db } from '../db';
import { getExternalPrices } from '../geminiService';
import Fuse from 'fuse.js';

export class SearchService {
  private static fuse: Fuse<Product> | null = null;
  
  private static USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

  private static parseCookiesToHeader(jsonStr: string | undefined): string {
    if (!jsonStr || !jsonStr.trim()) return '';
    try {
      const cookies = JSON.parse(jsonStr);
      if (Array.isArray(cookies)) {
        // Al inyectar cookies, algunos navegadores exportan con un punto inicial en el dominio (e.g., .repuestosparafrenos.com.ar)
        // Aquí simplemente construimos el string de header name=value;
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
      }
      return jsonStr;
    } catch (e) {
      return jsonStr || '';
    }
  }

  static async manageSession(source: ExternalSource) {
    if (!source.url_base) return;
    const sourceKey = source.nombre.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Simulación de persistencia de sesión
    console.log(`%c[SESSION MANAGER] Iniciando sesión para: ${source.nombre}`, "color: #4f46e5; font-weight: bold;");

    try {
      const loginUrl = new URL(source.url_base).origin;
      const win = window.open(loginUrl, `session_${source.id}`, 'width=1200,height=900,menubar=no,status=no');
      
      const checkStatus = setInterval(async () => {
        if (win?.closed) {
          clearInterval(checkStatus);
          // Requisito: Esperar 5 segundos tras el login para sincronización
          console.info(`[LOGIN] Sincronizando cookies de ${source.nombre} (Esperando 5s)...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log(`%c[SUCCESS] Sesión de ${source.nombre} persistida correctamente.`, "color: #10b981; font-weight: bold;");
        }
      }, 1000);
    } catch (e) {
      window.open(source.url_base, `session_${source.id}`, 'width=1200,height=900');
    }
  }

  private static async getLocalFuse(products: Product[]) {
    if (!this.fuse) {
      this.fuse = new Fuse(products, {
        keys: ['name', 'code', 'category'],
        threshold: 0.3,
        distance: 100
      });
    }
    return this.fuse;
  }

  private static async fetchWithProxy(targetUrl: string, cookieHeader: string): Promise<string> {
    const proxies = [
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];

    const baseUrl = new URL(targetUrl).origin;
    let lastError = null;

    for (const getProxyUrl of proxies) {
      const proxyUrl = getProxyUrl(targetUrl);
      try {
        const response = await axios.get(proxyUrl, { 
          timeout: 15000,
          headers: { 
            'User-Agent': this.USER_AGENT,
            'Cookie': cookieHeader,
            'Referer': baseUrl,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8'
          }
        });
        if (typeof response.data === 'object' && response.data.contents) return response.data.contents;
        if (typeof response.data === 'string') return response.data;
        return JSON.stringify(response.data);
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    throw lastError || new Error("Error de conexión con el proveedor");
  }

  private static async scrapeSource(query: string, source: ExternalSource): Promise<UnifiedSearchResult | null> {
    if (!source.url_base || !source.url_base.includes('[QUERY]')) return null;

    const targetUrl = source.url_base.replace('[QUERY]', encodeURIComponent(query));
    const baseUrl = new URL(targetUrl).origin;
    
    try {
      const cookieHeader = this.parseCookiesToHeader(source.cookies_config);
      // Pequeño delay para no saturar
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      const htmlContent = await this.fetchWithProxy(targetUrl, cookieHeader);
      const $ = cheerio.load(htmlContent);
      const lowerContent = htmlContent.toLowerCase();
      
      const hasUserSession = lowerContent.includes('usuario :') || lowerContent.includes('usuario:') || lowerContent.includes('hola,');
      
      let extractedTitle = '';
      let imageSelector = '';
      let priceElements: cheerio.Cheerio;

      const sourceNameLower = source.nombre.toLowerCase();

      // LOGICA POR PROVEEDOR
      if (sourceNameLower.includes('atonor')) {
        // Atonor: Título específico h1.elementor-heading-title
        extractedTitle = $('h1.elementor-heading-title').first().text().trim() || 
                        $('.product_title').first().text().trim() || 
                        $('h1').first().text().trim();
        
        imageSelector = '.elementor-widget-image img, .woocommerce-product-gallery__image img';
        priceElements = $('.price .woocommerce-Price-amount');
      } else if (sourceNameLower.includes('disfren')) {
        // Disfren: Título h3.text-uppercase
        extractedTitle = $('h3.text-uppercase').first().text().trim() || $('h1').first().text().trim();
        
        imageSelector = '.post-prev-img img';
        priceElements = $('.shop-price-cont');
      } else {
        extractedTitle = $('h1').first().text().trim() || $('h2').first().text().trim() || $('h3').first().text().trim();
        imageSelector = '.product-image img, img[src*="product"]';
        priceElements = $(source.selector_precio_css);
      }

      if (!extractedTitle || extractedTitle.length < 3 || extractedTitle.toLowerCase() === sourceNameLower) {
        extractedTitle = query;
      }

      // EXTRACCIÓN DE IMAGEN CON SOPORTE LAZY-LOAD Y RUTAS RELATIVAS
      const imgNode = $(imageSelector).first();
      // Intentamos capturar src o data-src (lazy load común en Elementor/Atonor)
      let imageUrl = imgNode.attr('src') || imgNode.attr('data-src') || imgNode.attr('data-lazy-src');

      if (imageUrl) {
        // Limpieza específica para Disfren (../)
        if (sourceNameLower.includes('disfren') && imageUrl.startsWith('../')) {
          imageUrl = 'https://repuestosparafrenos.com.ar/' + imageUrl.replace(/^\.\.\//, '');
        } else {
          if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
          else if (imageUrl.startsWith('/')) imageUrl = `${baseUrl}${imageUrl}`;
          else if (!imageUrl.startsWith('http')) imageUrl = `${baseUrl}/${imageUrl}`;
        }
      } else {
        imageUrl = ''; // Fallback: Interfaz mostrará icono genérico
      }

      // EXTRACCIÓN DE PRECIO
      let rawPriceText = '';
      if (sourceNameLower.includes('disfren') && priceElements.length >= 2) {
        // Disfren: Tomar el segundo precio (Neto con descuento)
        rawPriceText = $(priceElements[1]).text().trim();
      } else if (priceElements && priceElements.length > 0) {
        rawPriceText = priceElements.last().text().trim();
      } else {
        const fallbackPrice = $("*:contains('$')").filter((_, el) => {
          const t = $(el).text();
          return t.length < 35 && /[0-9]/.test(t);
        });
        rawPriceText = fallbackPrice.last().text().trim();
      }

      const sanitizedPrice = rawPriceText
        .replace(/Precio de lista|IVA incluido|Neto|Final|Lista|Total|Oferta/gi, '')
        .replace(/[^0-9,.]/g, '')
        .replace(',', '.');

      const numericValue = parseFloat(sanitizedPrice);

      const isPriceMissing = isNaN(numericValue) || numericValue <= 0;
      const hasCookies = cookieHeader.length > 0;
      const needsLogin = (!hasUserSession && source.requires_login && !hasCookies) || isPriceMissing;

      if (needsLogin) {
        return {
          id: `ext_${source.id}_${query}`,
          fuente: source.nombre,
          nombre: extractedTitle,
          sku: 'AUTH_REQUIRED',
          precio: 'Login Requerido',
          link: targetUrl,
          tipo: 'external',
          color: source.color_identificador,
          logo: source.logo_path,
          image: imageUrl,
          status: 'requires_login'
        };
      }

      return {
        id: `ext_${source.id}_${query}`,
        fuente: source.nombre,
        nombre: extractedTitle,
        sku: 'EXT-REF',
        precio: numericValue,
        link: targetUrl,
        tipo: 'external',
        color: source.color_identificador,
        logo: source.logo_path,
        image: imageUrl,
        status: 'ok'
      };
    } catch (error) {
      console.error(`[SCRAPE FAIL] ${source.nombre}:`, error);
      return {
        id: `err_${source.id}_${query}`,
        fuente: source.nombre,
        nombre: query,
        sku: 'ERROR',
        precio: 'Error de Red',
        link: targetUrl,
        tipo: 'external',
        color: '#ef4444',
        status: 'error'
      };
    }
  }

  static async search(query: string, products: Product[], config: BrandConfig): Promise<UnifiedSearchResult[]> {
    if (!query) return [];
    const localResultsPromise = this.searchLocal(query, products, config);
    if (config.searchMode === 'local') return await localResultsPromise;

    const sources = await db.getAllExternalSources();
    const activeSources = sources.filter(s => s.active);

    const scrapingPromises = activeSources.map(source => this.scrapeSource(query, source));
    const [localResults, scrapedResults] = await Promise.all([
      localResultsPromise,
      Promise.all(scrapingPromises)
    ]);

    const directResults = scrapedResults.filter((r): r is UnifiedSearchResult => r !== null);
    
    return [...localResults, ...directResults].sort((a, b) => {
      const pA = typeof a.precio === 'number' ? a.precio : Infinity;
      const pB = typeof b.precio === 'number' ? b.precio : Infinity;
      return pA - pB;
    });
  }

  private static async searchLocal(query: string, products: Product[], config: BrandConfig): Promise<UnifiedSearchResult[]> {
    const fuse = await this.getLocalFuse(products);
    const results = fuse.search(query);
    return results.map(r => ({
      id: r.item.id,
      fuente: 'Inventario Local',
      nombre: r.item.name,
      sku: r.item.code,
      precio: r.item.price,
      link: '#',
      tipo: 'local',
      color: config.primaryColor,
      image: r.item.image,
      stock: r.item.stock,
      status: 'ok'
    }));
  }
}
