
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProjectType, Message, ImageModel } from "../types";

// Helper for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleGeminiError = (error: any, context: string): never => {
    console.error(`${context}:`, error); // Log the full error object for debugging.

    // Gemini API often wraps errors in an `error` property. Let's extract the real message.
    const geminiError = error?.error;
    const errorMessage = geminiError?.message || (error instanceof Error ? error.message : JSON.stringify(error));


    // Check for the specific XHR/RPC error which often indicates a network/ad-block issue.
    if (errorMessage.includes('Rpc failed') || errorMessage.includes('fetch')) {
        throw new Error(`AI service connection failed. Please check your internet connection and disable any browser extensions (like ad-blockers), then try again.`);
    }

    // Handle other common AI errors.
    if (errorMessage.includes('API key not valid')) {
        throw new Error("Your API key is not valid. Please check it in your settings.");
    }
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        throw new Error("You've exceeded your API quota. Please try again later.");
    }
    
    // Throw a new error with a cleaner message for other cases.
    throw new Error(`An error occurred in ${context.toLowerCase()}. Details: ${errorMessage}`);
};

export const validateApiKey = async (apiKey: string): Promise<{ success: boolean, message?: string }> => {
    if (!apiKey) {
        return { success: false, message: "API key cannot be empty." };
    }
    // Create a new instance specifically for validation to ensure we test the provided key,
    // not any globally configured one.
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
        // Use a very simple prompt and avoid complex configs like 'thinkingConfig' 
        // to ensure the validation tests the KEY, not the model features.
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "test",
        });
        return { success: true };
    } catch (error: any) {
        console.error("API Key validation failed:", error);
        let message = "An unknown error occurred during validation.";
        
        const errorMsg = error?.message || JSON.stringify(error);

        if (errorMsg.includes('API key not valid')) {
             message = "The provided API key is not valid. Please ensure it is correct and has not expired.";
        } else if (errorMsg.includes('Rpc failed') || errorMsg.includes('fetch')) {
             message = "Could not connect to the AI service. Please check your internet connection and disable any ad-blockers.";
        } else if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
             // CRITICAL CHANGE: If the key is valid but out of quota, we return SUCCESS.
             // This prevents the user from being "softlocked" (unable to save the key) just because
             // they hit a limit. The key works, it's just busy.
             console.warn("Validation hit quota limit, but key is valid. Allowing save.");
             return { success: true }; 
        } else if (errorMsg.includes('permission')) {
             message = "The API key does not have permission for this operation. Please check its permissions.";
        } else {
             message = `Validation failed: ${errorMsg}`;
        }
        
        return { success: false, message };
    }
};

export const generateProjectDetails = async (prompt: string, apiKey: string): Promise<{ name: string, description: string, project_type: ProjectType }> => {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following user prompt and generate a suitable project name, a one-sentence description, and classify the project type. Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A concise, creative name for the project." },
                        description: { type: Type.STRING, description: "A one-sentence summary of the project." },
                        project_type: {
                            type: Type.STRING,
                            description: "The project type.",
                            enum: ['roblox_game', 'video', 'story', 'design', 'website', 'presentation', 'document']
                        }
                    },
                    required: ["name", "description", "project_type"]
                }
            }
        });
        const responseText = response.text;
        if (!responseText) {
            throw new Error("AI service returned an empty response when generating project details.");
        }
        return JSON.parse(responseText.trim());
    } catch (error) {
        handleGeminiError(error, "Error generating project details");
    }
};

// FIX: Add missing classifyUserIntent function to classify user prompts.
export const classifyUserIntent = async (prompt: string, apiKey: string): Promise<{ intent: 'creative_request' | 'general_query' }> => {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following user prompt and classify the intent. The intent can be "creative_request" if the user wants to start a new project (e.g., build a game, create an app) or "general_query" for anything else (e.g., asking a question, simple chat). Prompt: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: {
                            type: Type.STRING,
                            description: "The classified intent.",
                            enum: ['creative_request', 'general_query']
                        }
                    },
                    required: ["intent"]
                }
            }
        });
        const responseText = response.text;
        if (!responseText) {
            throw new Error("AI service returned an empty response when classifying intent.");
        }
        return JSON.parse(responseText.trim());
    } catch (error) {
        handleGeminiError(error, "Error classifying user intent");
    }
};

export const generateImage = async (prompt: string, apiKey: string, model: ImageModel = 'nano_banana'): Promise<{ imageBase64: string, fallbackOccurred: boolean }> => {
    const ai = new GoogleGenAI({ apiKey });
    let fallbackOccurred = false;

    // --- Primary Attempt: Use the selected (potentially premium) model ---
    if (model === 'imagen_2' || model === 'imagen_3' || model === 'imagen_4') {
        try {
            console.log(`Attempting to generate image with Imagen model for prompt: "${prompt}"`);
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: '1:1',
                },
            });
            if (response.generatedImages && response.generatedImages.length > 0) {
                return { imageBase64: response.generatedImages[0].image.imageBytes, fallbackOccurred: false }; // SUCCESS with premium model
            }
            console.warn("Imagen model returned an empty response. Falling back to Nano Banana.");
        } catch (error) {
            console.warn(`Error generating image with Imagen model: ${error instanceof Error ? error.message : String(error)}. Falling back to Nano Banana.`);
        }
        fallbackOccurred = true;
    }
    
    // --- Fallback or Default Attempt: Use Nano Banana ---
    try {
        console.log(`Attempting/Falling back to generate image with Nano Banana for prompt: "${prompt}"`);
        
        // Ensure prompt is a string
        const safePrompt = typeof prompt === 'string' ? prompt : String(prompt);

        // Use explicit Content[] format to be safe with SDK
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: safePrompt }]
                }
            ],
            config: { responseModalities: [Modality.IMAGE] },
        });

        if (!response) {
             throw new Error("No response received from AI service.");
        }

        // SAFE ACCESS: Check if candidates and parts exist before accessing
        const candidates = response.candidates;
        
        // Explicitly check candidates array
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
             // This often happens if the model blocks the prompt due to safety
             throw new Error("The AI service could not generate an image for this prompt. It may have been flagged by safety filters.");
        }
        
        const firstCandidate = candidates[0];
        if (!firstCandidate || !firstCandidate.content) {
             throw new Error("Candidate content is missing.");
        }
        
        const parts = firstCandidate.content.parts;
        if (!parts || !Array.isArray(parts) || parts.length === 0) {
             throw new Error("Content parts are missing.");
        }

        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return { imageBase64: part.inlineData.data, fallbackOccurred }; // SUCCESS with Nano Banana
            }
        }
        
        // If we get here, Nano Banana returned an empty response or structure was unexpected.
        throw new Error("Nano Banana model did not return an image. The prompt might have been blocked or the service is busy.");
    } catch (error) {
        // If even the fallback fails, then we must throw the final, unrecoverable error.
        handleGeminiError(error, "Error generating image");
    }
};

export const generateChatTitle = async (
  firstUserMessage: string,
  firstAiResponse: string,
  apiKey: string
): Promise<string> => {
  const fallbackTitle = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
  try {
    const ai = new GoogleGenAI({ apiKey });
    let titlePrompt: string;

    // If user message is very short, use the AI's response to generate a more descriptive title.
    if (firstUserMessage.trim().length < 15) {
      titlePrompt = `The user started a conversation with a short greeting: "${firstUserMessage}".
The AI responded: "${firstAiResponse.slice(0, 200)}..."
Analyze the AI's response. If it contains a suggestion or a question about a topic (e.g., "What can we create today?", "Ready to build a script?"), generate a title based on that topic (e.g., "New Creation", "Scripting Help"). If the AI's response is also just a generic greeting, return the title "General Conversation".
The title must be short (max 4 words). Do not add quotes.`;
    } else {
      titlePrompt = `Generate a short, descriptive title (max 4 words) for this conversation:
          
User: "${firstUserMessage.slice(0, 200)}..."
AI: "${firstAiResponse.slice(0, 200)}..."

The title should summarize what they're discussing. Be specific and concise. Do not add quotes.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: titlePrompt
    });
    
    const responseText = response.text;
    if (!responseText) {
        return fallbackTitle;
    }

    // Remove quotes if AI adds them and trim whitespace
    return responseText.trim().replace(/^["']|["']$/g, '');
  } catch (error: any) {
    // Use specific logic to detect quota errors AND overload errors and suppress them silently
    const errorMsg = error?.message || JSON.stringify(error);
    if (
        error?.status === 429 || 
        error?.code === 429 ||
        error?.status === 503 || // Service Unavailable
        error?.code === 503 ||
        errorMsg.includes('429') || 
        errorMsg.includes('503') ||
        errorMsg.includes('quota') || 
        errorMsg.includes('overloaded') || // "The model is overloaded"
        errorMsg.includes('UNAVAILABLE') ||
        errorMsg.includes('RESOURCE_EXHAUSTED')
    ) {
        // Silently return fallback title
        return fallbackTitle;
    }
    
    console.warn("Error generating chat title:", error);
    return fallbackTitle;
  }
};