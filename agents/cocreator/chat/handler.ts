import { GoogleGenAI } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../../types';
import { chatInstruction } from './instructions';
import { Message } from '../../../types';
import { getUserFriendlyError } from "../../errorUtils";

const mapMessagesToGeminiHistory = (messages: Message[]) => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
    parts: [{ text: msg.text }],
  })).filter(msg => msg.parts[0].text.trim() !== '');
};

export const runChatAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { prompt, apiKey, model, project, chat, onStreamChunk, history, memoryContext } = input;
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const geminiHistory = mapMessagesToGeminiHistory(history);
        const contents = [...geminiHistory, { role: 'user', parts: [{ text: prompt }] }];
        
        const systemInstruction = `${chatInstruction}\n\nMEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}`;

        const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                topP: 0.9,
                candidateCount: 1,
                maxOutputTokens: 2048,
            },
        });

        let fullText = '';
        // Stream the response, calling the callback with each new chunk
        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                onStreamChunk?.(chunkText);
            }
        }

        // Return the final, complete message for database saving
        const aiMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: fullText,
        };

        return { messages: [aiMessage] };
    } catch (error) {
        console.error("Error in runChatAgent:", error);
        const errorMessage = getUserFriendlyError(error);
        const fallbackMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: errorMessage
        };
        return { messages: [fallbackMessage] };
    }
};