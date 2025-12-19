
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSmartSuggestions = async (existingItems: string[]): Promise<GeminiSuggestion[]> => {
  try {
    // Update model to gemini-3-flash-preview for basic text tasks
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Eu tenho uma lista de compras com os seguintes itens: ${existingItems.join(', ')}.
      Com base nesta lista, sugira 5 itens que são comumente comprados junto com estes ou que podem estar faltando para um plano de refeições completo.
      Responda APENAS em Português do Brasil.
      Retorne o resultado no formato JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["name", "category", "reason"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as GeminiSuggestion[];
  } catch (error) {
    console.error("Error fetching suggestions from Gemini:", error);
    return [];
  }
};

export const organizeRawInput = async (rawInput: string): Promise<{ name: string; category: string }[]> => {
  try {
    // Update model to gemini-3-flash-preview for basic text tasks
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Analise o texto de entrada de compras bruto a seguir e transforme em uma lista estruturada de itens.
      A entrada pode ser confusa, como "leite ovos e 2 kg de carne".
      Extraia o nome do item (incluindo a quantidade, se especificada) e uma categoria ampla (por exemplo, Laticínios, Hortifruti, Carnes).
      Responda APENAS em Português do Brasil.
      
      Entrada: "${rawInput}"
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["name", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing input:", error);
    return [];
  }
};
