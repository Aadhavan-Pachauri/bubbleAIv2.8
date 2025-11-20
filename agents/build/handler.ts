import { GoogleGenAI, Type } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../types';
import { buildAgentInstruction } from './instructions';
import { getUserFriendlyError } from '../errorUtils';

// New, simpler schema for the Build agent
const buildAgentSchema = {
    type: Type.OBJECT,
    description: "The AI's response, which can be ONE OF a conversational reply OR a code block with an explanation.",
    properties: {
        responseText: {
            type: Type.STRING,
            description: "A conversational text response. Use this for non-code-related chat.",
        },
        code: {
            type: Type.STRING,
            description: "The generated code string."
        },
        language: {
            type: Type.STRING,
            description: "The programming language of the code (e.g., 'lua', 'html')."
        },
        explanation: {
            type: Type.STRING,
            description: "A brief, friendly explanation of what the code does."
        }
    },
};


export const runBuildAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { project, chat, prompt, apiKey, model, history, memoryContext, onStreamChunk } = input;
    const ai = new GoogleGenAI({ apiKey });

    onStreamChunk?.("Alright, let's get building... 🛠️");

    const geminiHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        // For build agent history, include plan details if they exist to give it context
        parts: [{ text: msg.plan ? `[SYSTEM PLAN]: ${JSON.stringify(msg.plan)}` : msg.text }],
    })).filter(msg => msg.parts[0].text.trim() !== '');

    const contents = [...geminiHistory, { role: 'user', parts: [{ text: prompt }] }];
    
    const systemInstruction = `${buildAgentInstruction}\n\nMEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: buildAgentSchema,
                temperature: 0.5,
                topP: 0.9,
            }
        });

        const rawResponseText = response.text.trim();
        const agentResponse = JSON.parse(rawResponseText);
        let messages: AgentOutput = [];

        // Case 1: The AI chose to write code
        if (agentResponse.code) {
            const message: AgentOutput[0] = {
                project_id: project.id,
                chat_id: chat.id,
                sender: 'ai',
                text: agentResponse.explanation || "Here's the code you asked for:",
                code: agentResponse.code,
                language: agentResponse.language || (project.platform === 'Web App' ? 'html' : 'lua'),
            };
            if (input.profile?.role === 'admin') {
                message.raw_ai_response = rawResponseText;
            }
            messages.push(message);
        }
        // Case 2: The AI chose to have a conversation
        else if (agentResponse.responseText) {
            const message: AgentOutput[0] = {
                project_id: project.id,
                chat_id: chat.id,
                sender: 'ai',
                text: agentResponse.responseText,
            };
            if (input.profile?.role === 'admin') {
                message.raw_ai_response = rawResponseText;
            }
            messages.push(message);
        }
        // Fallback
        else {
            throw new Error("The Build AI returned an unexpected response format.");
        }
        
        return { messages };

    } catch (error) {
        console.error("Error in runBuildAgent:", error);
        const errorMessage = getUserFriendlyError(error);
        const fallbackMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: `I'm sorry, but I encountered an error while trying to build. ${errorMessage}`
        };
        return { messages: [fallbackMessage] };
    }
};