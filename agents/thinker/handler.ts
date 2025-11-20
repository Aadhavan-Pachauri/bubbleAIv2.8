import { GoogleGenAI } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../types';
import { standingInstruction, opposingInstruction, synthesisInstruction } from './instructions';
import { thinkerSchema } from './schemas';
import { ThinkerResponse, Message } from '../../types';
import { getUserFriendlyError } from "../errorUtils";

const mapMessagesToGeminiHistory = (messages: Message[]) => {
  // Thinker responses have complex objects, only use text for history
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
    parts: [{ text: msg.text }],
  })).filter(msg => msg.parts[0].text.trim() !== '');
};

export const runThinkerAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { prompt, apiKey, model, project, chat, history, memoryContext, onStreamChunk } = input;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const geminiHistory = mapMessagesToGeminiHistory(history);
        const contextPrompt = `MEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}\n\nUSER REQUEST: "${prompt}"`;

        // 1. Standing Response
        const standingContents = [...geminiHistory, { role: 'user', parts: [{ text: contextPrompt }] }];
        onStreamChunk?.("Thinking from one perspective... 🤔");
        const standingResponseObj = await ai.models.generateContent({
            model,
            contents: standingContents,
            config: {
                systemInstruction: standingInstruction,
                responseMimeType: "application/json",
                responseSchema: thinkerSchema,
                temperature: 0.7,
                topP: 0.9,
            }
        });
        const standing = JSON.parse(standingResponseObj.text.trim()) as ThinkerResponse;

        // 2. Opposing Response
        const opposingContents = [...geminiHistory, { role: 'user', parts: [{ text: `The user's request is: "${prompt}". The initial plan is: "${standing.response}". Now, provide your critique based on the memory context.` }] }];
        onStreamChunk?.("\nConsidering alternatives... 🧐");
        const opposingResponseObj = await ai.models.generateContent({
            model,
            contents: opposingContents,
            config: {
                systemInstruction: opposingInstruction,
                responseMimeType: "application/json",
                responseSchema: thinkerSchema,
                temperature: 0.5,
                topP: 0.9,
            }
        });
        const opposing = JSON.parse(opposingResponseObj.text.trim()) as ThinkerResponse;

        // 3. Synthesis Response (Streamed)
        onStreamChunk?.("\nSynthesizing the best approach... ✨\n\n");
        const synthesisContents = [...geminiHistory, { role: 'user', parts: [{ text: `User request: "${prompt}"\n\nInitial Plan:\n${standing.response}\n\nCritique/Alternatives:\n${opposing.response}\n\nNow, generate the final synthesized response for the user, taking the memory context into account.` }] }];
        
        const synthesisStream = await ai.models.generateContentStream({
            model,
            contents: synthesisContents,
            config: {
                systemInstruction: synthesisInstruction,
                temperature: 0.6,
                topP: 0.9,
            }
        });

        let finalText = '';
        for await (const chunk of synthesisStream) {
            const chunkText = chunk.text;
            if(chunkText) {
                finalText += chunkText;
                onStreamChunk?.(chunkText);
            }
        }

        const aiMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: finalText, // The synthesized response is the main text
            standing_response: standing,
            opposing_response: opposing,
        };
        
        return { messages: [aiMessage] };
    } catch (error) {
        console.error("Error in runThinkerAgent:", error);
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