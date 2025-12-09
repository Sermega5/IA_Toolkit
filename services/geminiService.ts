import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a chat message to Gemini and returns the response.
 */
export const chatWithGemini = async (
    systemPrompt: string,
    userMessage: string
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemPrompt,
            }
        });
        return response.text || "No response from AI.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Error connecting to AI. Please check the console.";
    }
};

/**
 * Generates a pixel art texture JSON using Gemini.
 */
export const generateTextureWithGemini = async (
    prompt: string,
    resolution: number
): Promise<string[] | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a pixel art texture of: ${prompt}.`,
            config: {
                systemInstruction: `You are a pixel art generator. 
        You must output a VALID JSON object with a single property 'pixels'.
        'pixels' must be an array of strings representing hex color codes (e.g., '#FF0000') or 'transparent'.
        The array must have exactly ${resolution * resolution} elements, representing a ${resolution}x${resolution} grid row by row.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pixels: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        if (json.pixels && Array.isArray(json.pixels)) {
            // Ensure size match
            if (json.pixels.length !== resolution * resolution) {
                // Pad or trim if necessary (fallback)
                const safe = json.pixels.slice(0, resolution * resolution);
                while (safe.length < resolution * resolution) safe.push('transparent');
                return safe;
            }
            return json.pixels;
        }
        return null;
    } catch (error) {
        console.error("Gemini Texture Error:", error);
        return null;
    }
};

/**
 * Generates layout commands for the Background Designer using Gemini.
 */
export const generateLayoutWithGemini = async (
    prompt: string
): Promise<any[] | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a layout for: "${prompt}".`,
            config: {
                systemInstruction: `You are a Minecraft GUI Layout generator. 
        Output a VALID JSON object with a property 'elements'.
        'elements' is an array of objects. Each object has:
        - type: "slot" or "text"
        - x: number (canvas width is 176)
        - y: number (canvas height is 166)
        - text: string (optional, only for type "text")
        Standard slot size is 18x18.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        elements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    x: { type: Type.INTEGER },
                                    y: { type: Type.INTEGER },
                                    text: { type: Type.STRING, nullable: true }
                                },
                                required: ['type', 'x', 'y']
                            }
                        }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        return json.elements || null;
    } catch (error) {
        console.error("Gemini Layout Error:", error);
        return null;
    }
};