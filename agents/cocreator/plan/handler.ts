import { GoogleGenAI } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../../types';
import { planAgentInstruction } from './instructions';
import { agentResponseSchema } from '../build/schemas'; // Re-use the comprehensive schema from build agent
import { Task, Message } from '../../../types';
import { getUserFriendlyError } from "../../errorUtils";

interface AgentResponse {
    responseText?: string;
    clarification?: {
        prompt: string;
        questions: string[];
    };
    plan?: {
        title: string;
        introduction: string;
        features: string[];
        mermaidGraph: string;
        tasks: string[];
    };
}

const sanitizeMermaidGraph = (graph: string): string => {
    if (!graph) return '';
    
    // Remove markdown fences like ```mermaid ... ``` or ``` ... ```
    let sanitizedGraph = graph.trim().replace(/^```(?:mermaid)?\s*|```\s*$/g, '');

    // The original logic to remove invalid trailing labels is good, let's keep it.
    sanitizedGraph = sanitizedGraph.split('\n').map(line => {
        const trimmedLine = line.trim();
        // This regex removes labels that are not part of the node definition, a common AI mistake.
        // e.g., A[Start] --> B[End] C  (The 'C' is invalid)
        const sanitized = trimmedLine.replace(/(\]|\))\s*([A-Za-z0-9_]+)$/, '$1');
        return sanitized;
    }).join('\n');
    
    return sanitizedGraph;
};


export const runPlanAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { profile, project, chat, prompt, apiKey, model, history, answers, memoryContext, onStreamChunk } = input;
    const ai = new GoogleGenAI({ apiKey });
    const uiStyle = profile?.onboarding_preferences?.ui_style ?? 'standard';

    onStreamChunk?.("Analyzing your request to create a plan... ✍️");

    let fullPrompt = `Target Platform: ${project.platform}\n\nUser request: "${prompt}"`;
    if (answers) {
        fullPrompt += "\n\nUser's answers to clarifying questions:\n" + answers.map((a, i) => `${i + 1}. ${a}`).join("\n");
    }

    const geminiHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.text }],
    })).filter(msg => msg.parts[0].text.trim() !== '');

    const contents = [...geminiHistory, { role: 'user', parts: [{ text: fullPrompt }] }];
    
    const systemInstruction = `${planAgentInstruction}\n\nMEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: agentResponseSchema,
                temperature: 0.7,
                topP: 0.95,
            }
        });

        const rawResponseText = response.text.trim();
        const agentResponse = JSON.parse(rawResponseText) as AgentResponse;
        let messages: AgentOutput = [];

        if (agentResponse.responseText) {
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
        else if (agentResponse.clarification) {
             const clarificationLeadIn = "Sounds like a plan! I just have a couple of quick questions to make sure I get the design right:";
                
            const message: AgentOutput[0] = {
                project_id: project.id,
                chat_id: chat.id,
                sender: 'ai',
                text: clarificationLeadIn,
                clarification: agentResponse.clarification,
            };
            if (input.profile?.role === 'admin') {
                message.raw_ai_response = rawResponseText;
            }
            messages.push(message);
        }
        else if (agentResponse.plan) {
            const planTasks: Task[] = agentResponse.plan.tasks.map(t => ({ text: t, status: 'pending' }));
            const message: AgentOutput[0] = {
                project_id: project.id,
                chat_id: chat.id,
                sender: 'ai',
                text: agentResponse.plan.introduction,
                plan: {
                    title: agentResponse.plan.title,
                    features: agentResponse.plan.features,
                    mermaidGraph: sanitizeMermaidGraph(agentResponse.plan.mermaidGraph),
                    tasks: planTasks,
                    isComplete: false,
                },
            };
             if (input.profile?.role === 'admin') {
                message.raw_ai_response = rawResponseText;
            }
            messages.push(message);
        }
        else {
            throw new Error("The AI returned an unexpected or empty response for the plan.");
        }
        
        return { messages };

    } catch (error) {
        console.error("Error in runPlanAgent:", error);
        const errorMessage = getUserFriendlyError(error);
        const fallbackMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: `I'm sorry, but I encountered an error while trying to create a plan. ${errorMessage}`
        };
        return { messages: [fallbackMessage] };
    }
};