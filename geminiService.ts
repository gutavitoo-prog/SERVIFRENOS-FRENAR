
import { GoogleGenAI, Type } from "@google/genai";
import { Product, ExternalSource } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractProductsFromText(rawText: string): Promise<Partial<Product>[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract product information from the following raw web data or text. 
      Focus on finding: Product Name, Price, and a Product ID/Code if available.
      Data: ${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              code: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "price"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to extract products with Gemini", e);
    return [];
  }
}

/**
 * Realiza una búsqueda de precios externos en tiempo real.
 * Se eliminó responseMimeType y responseSchema para evitar errores 500 con googleSearch.
 */
export async function getExternalPrices(query: string, sources: ExternalSource[]): Promise<{ sourceId: string, price: number, url: string }[]> {
  if (sources.length === 0 || !query) return [];

  try {
    const sourceContext = sources.map(s => `- ${s.nombre} (URL: ${s.url_base})`).join('\n');
    
    // Usamos gemini-3-flash-preview para mayor estabilidad con grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the current price for exactly "${query}" on these specific retailers:
      ${sourceContext}

      Instructions:
      1. Use Google Search to find the real current price.
      2. Return ONLY a JSON array of objects with: "siteName", "price" (number), and "url".
      3. If you can't find a price for a retailer, omit it from the array.
      
      Example: [{"siteName": "Retailer Name", "price": 1250.50, "url": "https://..."}]`,
      config: {
        tools: [{ googleSearch: {} }],
        // IMPORTANTE: No usar responseMimeType ni responseSchema con googleSearch para evitar error 500
      }
    });

    const text = response.text || "";
    
    // Extraer JSON del texto (por si el modelo añade explicaciones)
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.warn("No se encontró formato JSON en la respuesta de Gemini Search");
      return [];
    }

    const results = JSON.parse(jsonMatch[0]);
    
    return results.map((res: any) => {
      const source = sources.find(s => 
        s.nombre.toLowerCase().includes(res.siteName.toLowerCase()) || 
        res.siteName.toLowerCase().includes(s.nombre.toLowerCase())
      );
      
      return {
        sourceId: source?.id || 'unknown',
        price: Number(res.price),
        url: res.url
      };
    }).filter((r: any) => r.sourceId !== 'unknown' && !isNaN(r.price));

  } catch (e) {
    console.error("External price search failed (Gemini 500/Network)", e);
    // Retornamos array vacío para que el sistema siga funcionando con el scraping local
    return [];
  }
}
