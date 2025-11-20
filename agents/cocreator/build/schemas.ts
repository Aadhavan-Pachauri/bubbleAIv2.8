import { Type } from "@google/genai";

export const codeGenerationSchema = (platform: 'Web App' | 'Roblox Studio') => ({
    type: Type.OBJECT,
    properties: {
        code: {
            type: Type.STRING,
            description: `The generated code (${platform === 'Web App' ? 'self-contained HTML' : 'Luau'}) to complete the task.`,
        },
        explanation: {
             type: Type.STRING,
             description: "A friendly explanation of the code.",
        }
    },
    required: ["explanation", "code"]
});

export const planSchema = {
    type: Type.OBJECT,
    description: "A full project plan for a clear build request.",
    properties: {
        title: { type: Type.STRING, description: "A short, descriptive title for the overall plan." },
        introduction: { type: Type.STRING, description: "A friendly introductory sentence to present the plan." },
        features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of high-level features for the user." },
        mermaidGraph: { type: Type.STRING, description: "A Mermaid.js graph definition string representing the project structure." },
        tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of specific, actionable sub-tasks." }
    },
    required: ["title", "introduction", "features", "mermaidGraph", "tasks"]
};

export const agentResponseSchema = {
    type: Type.OBJECT,
    description: "The AI's response, which can be ONE OF a simple conversation, a set of clarifying questions, or a full project plan, based on the user's intent.",
    properties: {
        responseText: {
            type: Type.STRING,
            description: "A simple conversational text response. Use this for non-build commands or simple chat.",
        },
        clarification: {
            type: Type.OBJECT,
            description: "A set of questions to ask the user for ambiguous build requests.",
            properties: {
                prompt: { type: Type.STRING, description: "The original user prompt that needs clarification." },
                questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of questions to ask the user." }
            },
            required: ["prompt", "questions"]
        },
        plan: planSchema
    },
};