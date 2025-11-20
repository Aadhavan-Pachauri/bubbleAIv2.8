import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectPlatform } from '../../types';
import { robloxCodeGenerationInstruction, webCodeGenerationInstruction } from './instructions';
import { codeGenerationSchema } from './schemas';

export interface GeminiResponse {
    explanation: string;
    code: string | null;
}

// Helper for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateCodeForTask = async (task: string, platform: ProjectPlatform, apiKey: string, model: string): Promise<GeminiResponse> => {
     if (!apiKey) {
        throw new Error("Gemini API key is not set.");
    }
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    const codeGenerationInstruction = platform === 'Web App' ? webCodeGenerationInstruction : robloxCodeGenerationInstruction;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: `Task: "${task}"`,
                config: {
                    systemInstruction: codeGenerationInstruction,
                    responseMimeType: "application/json",
                    responseSchema: codeGenerationSchema(platform),
                    temperature: 0.3,
                    topP: 0.8,
                },
            });

            const jsonString = response.text.trim();
            const parsed = JSON.parse(jsonString) as GeminiResponse;
            return parsed; // Success
        } catch (error) {
            lastError = error as Error;
            console.error(`Attempt ${attempt} failed for task "${task}":`, error);
            if (attempt < maxRetries) {
                await delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    // All retries failed
    console.error(`All ${maxRetries} retries failed for task "${task}". Last error:`, lastError);
    const errorMessage = lastError instanceof Error ? lastError.message : "An unknown error occurred.";
    return {
        explanation: `Sorry, I was unable to complete the task: "${task}". The AI service seems to be unavailable after multiple attempts. Please try again later. (Details: ${errorMessage})`,
        code: null
    };
};