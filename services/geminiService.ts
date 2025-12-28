
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateProductContent = async (shortDescription: string): Promise<GeneratedContent> => {
  const prompt = `
    Task: Act as an expert E-commerce SEO Copywriter.
    Input Product Description: "${shortDescription}"
    
    Requirements:
    1. Create an eye-catching, SEO-optimized Product Title (max 80 characters).
    2. Generate 10 high-converting search keywords.
    3. Write a detailed, SEO-friendly long description (approx 200 words) incorporating the keywords naturally.
    4. Extract 5 key features or benefits as bullet points.
    
    Output must be in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "SEO optimized product title"
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 10 search keywords"
          },
          longDescription: {
            type: Type.STRING,
            description: "Detailed product description"
          },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5 key product features"
          }
        },
        required: ["title", "keywords", "longDescription", "features"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as GeneratedContent;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Failed to generate content. Please try again.");
  }
};
