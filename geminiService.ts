
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractProductsFromText(rawText: string): Promise<Partial<Product>[]> {
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

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
