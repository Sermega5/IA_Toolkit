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
            text: `Edit this Minecraft texture based on the following instruction. Maintain the pixel-art style if applicable. Return ONLY the image. Instruction: ${prompt}`,
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
