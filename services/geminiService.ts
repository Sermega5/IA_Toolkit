import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits a texture based on a text prompt using Gemini 2.5 Flash Image.
 * @param imageBase64 The base64 string of the image (without the data prefix).
 * @param prompt The user's instruction (e.g., "Make it look like gold").
 * @param mimeType The mime type of the image.
 */
export const editTextureWithAi = async (
  imageBase64: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
          {
            text: `You are a professional pixel artist assistant for Minecraft.
TASK: Edit the attached input image according to the User Instruction.

STRICT RULES:
1. RESPECT THE INPUT: The input image contains a drawing or sketch. You must use it as the base structure. Do not discard it. Do not generate a random image.
2. EDITING: Apply the requested changes (shading, recoloring, texturing) to the existing pixels. Maintain the silhouette/alpha channel unless asked to change shape.
3. EMPTY INPUT: Only if the input image is completely blank/transparent, you may generate the object from scratch.
4. STYLE: The output must be pixel art suitable for Minecraft.

User Instruction: ${prompt}`,
          },
        ],
      },
      config: {
        // We rely on the model to return an image in the parts
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    console.warn("No image data found in response");
    return null;
  } catch (error) {
    console.error("Error editing texture with Gemini:", error);
    throw error;
  }
};