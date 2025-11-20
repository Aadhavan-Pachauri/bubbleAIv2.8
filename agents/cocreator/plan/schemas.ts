import { Type } from "@google/genai";

export const planAgentSchema = {
    type: Type.OBJECT,
    properties: {
        projectMemory: {
            type: Type.STRING,
            description: "The detailed project memory/blueprint text. Use this when the user wants to update the memory."
        },
        responseText: {
            type: Type.STRING,
            description: "A conversational text response. Use this when the user is asking a question or chatting."
        }
    },
};