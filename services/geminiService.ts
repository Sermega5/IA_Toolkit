// Mistral API Configuration
const API_KEY = 'r8WigkDi3ggu3ljMhAImAv1r31SPLLOl';
// Using CORS proxy to allow browser-side requests to Mistral API
const API_URL = 'https://corsproxy.io/?https://api.mistral.ai/v1/chat/completions';

/**
 * Helper to make requests to Mistral
 */
async function callMistral(messages: any[], jsonMode: boolean = false) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "mistral-large-latest",
            messages: messages,
            response_format: jsonMode ? { type: "json_object" } : undefined
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Sends a chat message to Mistral and returns the response.
 */
export const chatWithMistral = async (
    systemPrompt: string,
    userMessage: string
): Promise<string> => {
    try {
        const content = await callMistral([
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ]);
        return content || "No response from AI.";
    } catch (error) {
        console.error("Mistral Chat Error:", error);
        return "Error connecting to Mistral AI. Please check the console.";
    }
};

/**
 * Generates a pixel art texture JSON using Mistral (Text-to-Pixel).
 */
export const generateTextureWithMistral = async (
    prompt: string,
    resolution: number
): Promise<string[] | null> => {
    try {
        const systemPrompt = `You are a pixel art generator. 
        You must output a VALID JSON object with a single property 'pixels'.
        'pixels' must be an array of strings representing hex color codes (e.g., '#FF0000') or 'transparent'.
        The array must have exactly ${resolution * resolution} elements, representing a ${resolution}x${resolution} grid row by row.
        Do not include markdown formatting like \`\`\`json. Just the raw JSON object.`;

        const userPrompt = `Generate a pixel art texture of: ${prompt}.`;

        const content = await callMistral([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);

        // Parse response
        let jsonStr = content.trim();
        // Remove markdown code blocks if present despite instructions
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');

        const json = JSON.parse(jsonStr);

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
        console.error("Mistral Texture Error:", error);
        return null;
    }
};

/**
 * Generates layout commands for the Background Designer.
 */
export const generateLayoutWithMistral = async (
    prompt: string
): Promise<any[] | null> => {
    try {
        const systemPrompt = `You are a Minecraft GUI Layout generator. 
        Output a VALID JSON object with a property 'elements'.
        'elements' is an array of objects. Each object has:
        - type: "slot" or "text"
        - x: number (canvas width is 176)
        - y: number (canvas height is 166)
        - text: string (optional, only for type "text")
        Standard slot size is 18x18.
        Do not include markdown formatting.`;

        const userPrompt = `Generate a layout for: "${prompt}".`;

        const content = await callMistral([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], true);

         // Parse response
         let jsonStr = content.trim();
         if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
         if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
 
        const json = JSON.parse(jsonStr);
        return json.elements || null;
    } catch (error) {
        console.error("Mistral Layout Error:", error);
        return null;
    }
};