import { Type } from "@google/genai";

export const thinkerSchema = {
    type: Type.OBJECT,
    properties: {
        thought: { type: Type.STRING, description: "A brief summary of your thinking process and how you are approaching the request based on your persona." },
        response: { type: Type.STRING, description: "Your main response, following the instructions for your persona (e.g., the plan, the critique)." }
    },
    required: ["thought", "response"]
};
