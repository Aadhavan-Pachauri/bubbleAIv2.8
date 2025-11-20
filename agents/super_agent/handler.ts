import { GoogleGenAI } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../types';
import { superAgentInstruction } from './instructions';
import { runBuildAgent } from '../build/handler';
import { Message } from '../../types';
import { getUserFriendlyError } from "../errorUtils";

// Helper function to parse the AI's special output format
const parseSuperAgentResponse = (responseText: string) => {
    const userMessageMatch = responseText.match(/\/\/show user\/\/(.*?)\/\/show user end\/\//s);
    const userMessage = userMessageMatch ? userMessageMatch[1].trim() : "Sorry, I got a bit confused. Could you try that again?";

    const createThreadMatch = responseText.match(/\/\/create thread\/\/(.*?)\/\//s);
    const threadName = createThreadMatch ? createThreadMatch[1].trim() : null;

    const givePromptMatch = responseText.match(/\/\/give prompt.*?\/\/(.*?)\/\/end prompt\/\//s);
    const promptForThread = givePromptMatch ? givePromptMatch[1].trim() : null;

    const askClarificationMatch = responseText.match(/\/\/ask clarification\/\/(.*?)\/\/ask clarification end\/\//s);
    const clarificationQuestion = askClarificationMatch ? askClarificationMatch[1].trim() : null;

    return {
        userMessage,
        threadName,
        promptForThread,
        clarificationQuestion,
    };
};

const mapMessagesToGeminiHistory = (messages: Message[]) => {
    // Super agent responses can be complex, so we simplify history.
    // We only include the user-facing text to keep the context clean for the AI.
    return messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.text }],
    })).filter(msg => msg.parts[0].text.trim() !== '');
};

export const runSuperAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { prompt, apiKey, model, project, chat, history, memoryContext } = input;
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const geminiHistory = mapMessagesToGeminiHistory(history);
        const contextPrompt = `MEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}\n\nMy request is: "${prompt}". My target platform is: "${project.platform}".`;
        const contents = [...geminiHistory, { role: 'user', parts: [{ text: contextPrompt }] }];

        // 1. Get the orchestrated response from the Super Agent
        const response = await ai.models.generateContent({
            model,
            contents: contents,
            config: {
                systemInstruction: superAgentInstruction,
                temperature: 0.8,
                topP: 0.9,
            }
        });

        const rawResponseText = response.text;
        const { userMessage, threadName, promptForThread, clarificationQuestion } = parseSuperAgentResponse(rawResponseText);
        
        // 2. Prepare the base user-facing message
        const baseAiMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: userMessage,
        };
        if (input.profile?.role === 'admin') {
            baseAiMessage.raw_ai_response = rawResponseText;
        }

        // 3. Handle actions based on parsed tags
        
        // Handle Clarification
        if (clarificationQuestion) {
            baseAiMessage.clarification = {
                prompt: prompt, // The original user prompt
                questions: [clarificationQuestion], // The AI's parsed question
            };
            return { messages: [baseAiMessage] };
        }

        // Handle Thread Creation (currently supporting 'Planner' threads, which now maps to the Build agent)
        if (threadName && (threadName.toLowerCase().includes('plan') || threadName.toLowerCase().includes('build')) && promptForThread) {
            // This is a request to create a plan. We'll call the build agent as a sub-task.
            try {
                const buildAgentInput: AgentInput = {
                    ...input,
                    prompt: promptForThread, // Use the prompt from the super agent
                    history: [], // Give the build agent a clean slate to avoid confusion
                };
                const { messages: buildAgentMessages } = await runBuildAgent(buildAgentInput);
                
                // Check if the build agent returned a valid plan
                const planResult = buildAgentMessages.find(m => m.plan);
                if (planResult && planResult.plan) {
                    // Merge the plan into our base message
                    baseAiMessage.plan = planResult.plan;
                    // We can also use the intro from the plan agent if it's more specific
                    baseAiMessage.text = `${userMessage}\n\n${planResult.text}`;
                    return { messages: [baseAiMessage] };
                } else {
                     // The sub-agent didn't return a plan, just return the chat.
                     console.warn("Super Agent tried to run Builder, but no plan was returned.");
                     return { messages: [baseAiMessage] };
                }
            } catch (error) {
                console.error("Super Agent failed to run sub-agent 'Builder':", error);
                baseAiMessage.text = `${userMessage}\n\nI tried to create a plan, but ran into an issue. Please try again!`;
                return { messages: [baseAiMessage] };
            }
        }

        // If no specific actions were parsed, just return the conversational message
        return { messages: [baseAiMessage] };
    } catch (error) {
        console.error("Error in runSuperAgent:", error);
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