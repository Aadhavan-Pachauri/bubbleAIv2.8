
import { GoogleGenAI, Type } from "@google/genai";
import { AgentInput, AgentOutput, AgentExecutionResult } from '../../types';
import { buildAgentInstruction } from './instructions';
import { getUserFriendlyError } from '../../errorUtils';
import { Project, Plan, Task } from '../../../types';

// New schema for the Build agent to handle multiple files
const buildAgentSchema = {
    type: Type.OBJECT,
    description: "The AI's response, which can be ONE OF a conversational reply OR an explanation with a list of code files.",
    properties: {
        responseText: {
            type: Type.STRING,
            description: "A conversational text response. Use this for non-code-related chat.",
        },
        explanation: {
            type: Type.STRING,
            description: "A brief, friendly explanation of what the code does."
        },
        files: {
            type: Type.ARRAY,
            description: "An array of file objects to be created or updated.",
            items: {
                type: Type.OBJECT,
                properties: {
                    filePath: {
                        type: Type.STRING,
                        description: "The full path for the file (e.g., 'ServerScriptService/GameManager.server.lua')."
                    },
                    code: {
                        type: Type.STRING,
                        description: "The generated code string."
                    },
                    language: {
                        type: Type.STRING,
                        description: "The programming language of the code (e.g., 'lua', 'html')."
                    }
                },
                required: ["filePath", "code", "language"]
            }
        }
    },
};


export const runBuildAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    const { project, chat, prompt, apiKey, model, history, memoryContext, onStreamChunk } = input;
    const ai = new GoogleGenAI({ apiKey });

    // --- Task Runner Logic ---
    let effectivePrompt = prompt;
    let planToUpdate: { messageId: string, plan: Plan } | null = null;
    let taskToExecute: Task | null = null;

    const planMessage = [...history].reverse().find(m => m.sender === 'ai' && m.plan);
    if (planMessage && planMessage.plan) {
        const firstPendingTask = planMessage.plan.tasks.find(t => t.status === 'pending');
        if (firstPendingTask) {
            onStreamChunk?.(`Starting task: "${firstPendingTask.text}"... 🛠️`);
            effectivePrompt = `Based on the project plan, execute ONLY this task: "${firstPendingTask.text}". Provide all necessary code and file paths.`;
            planToUpdate = { messageId: planMessage.id, plan: JSON.parse(JSON.stringify(planMessage.plan)) };
            taskToExecute = firstPendingTask;
        } else {
            onStreamChunk?.("All tasks in the plan are complete! What should we build next?");
        }
    } else {
        onStreamChunk?.("Alright, let's get building... 🛠️");
    }
    // --- End Task Runner Logic ---
    
    // Create a string representation of the current files to give context to the AI
    let fileContext = '';
    if (project.files && Object.keys(project.files).length > 0) {
        fileContext += '\n\n--- CURRENT PROJECT FILES ---\n';
        for (const [path, file] of Object.entries(project.files)) {
            fileContext += `--- FILE: ${path} ---\n${file.content}\n\n`;
        }
    } else {
        fileContext = '\n\n--- CURRENT PROJECT FILES ---\nThis project is currently empty.\n';
    }


    const geminiHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.plan ? `[SYSTEM PLAN]: ${JSON.stringify(msg.plan)}` : msg.text }],
    })).filter(msg => msg.parts[0].text.trim() !== '');

    const contents = [...geminiHistory, { role: 'user', parts: [{ text: effectivePrompt }] }];
    const systemInstruction = `${buildAgentInstruction}\n\nMEMORY CONTEXT:\n${memoryContext || 'No memory context available.'}${fileContext}`;

    // FIX: Declare updatedPlanForReturn here so it's accessible in both try and catch blocks.
    let updatedPlanForReturn: { messageId: string, plan: Plan } | undefined = undefined;

    try {
        const response = await ai.models.generateContent({
            model, contents, config: { systemInstruction, responseMimeType: "application/json", responseSchema: buildAgentSchema, temperature: 0.5, topP: 0.9, }
        });

        const rawResponseText = response.text.trim();
        const agentResponse = JSON.parse(rawResponseText);
        
        let messages: AgentOutput = [];
        let projectUpdate: Partial<Project> | undefined = undefined;

        if (agentResponse.files && Array.isArray(agentResponse.files) && agentResponse.files.length > 0) {
            const filePaths = agentResponse.files.map((f: any) => `\`${f.filePath}\``).join(', ');
            const message: AgentOutput[0] = {
                project_id: project.id,
                chat_id: chat.id,
                sender: 'ai',
                text: `${agentResponse.explanation || "Here's the code you asked for."}\n\nI've created/updated: ${filePaths}.`,
            };
            
            const newFiles = { ...(project.files || {}) };
            agentResponse.files.forEach((file: { filePath: string; code: string }) => {
                newFiles[file.filePath] = { content: file.code };
            });
            projectUpdate = { files: newFiles };

            if (planToUpdate && taskToExecute) {
                const taskIndex = planToUpdate.plan.tasks.findIndex(t => t.text === taskToExecute!.text);
                if (taskIndex > -1) {
                    planToUpdate.plan.tasks[taskIndex].status = 'complete';
                    planToUpdate.plan.tasks[taskIndex].code = agentResponse.files.map((f: any) => `--- ${f.filePath} ---\n\n${f.code}`).join('\n\n');
                    planToUpdate.plan.tasks[taskIndex].explanation = agentResponse.explanation;
                    updatedPlanForReturn = planToUpdate;
                }
            }

            if (input.profile?.role === 'admin') message.raw_ai_response = rawResponseText;
            messages.push(message);

        } else if (agentResponse.responseText) {
            const message: AgentOutput[0] = { project_id: project.id, chat_id: chat.id, sender: 'ai', text: agentResponse.responseText };
            if (input.profile?.role === 'admin') message.raw_ai_response = rawResponseText;
            messages.push(message);
        } else {
            throw new Error("The Build AI returned an unexpected response. It might have failed to generate code for the requested task.");
        }
        
        return { messages, projectUpdate, updatedPlan: updatedPlanForReturn };

    } catch (error) {
        console.error("Error in runBuildAgent:", error);
        const errorMessage = getUserFriendlyError(error);
        
        if (planToUpdate && taskToExecute) {
             const taskIndex = planToUpdate.plan.tasks.findIndex(t => t.text === taskToExecute!.text);
             if (taskIndex > -1) {
                planToUpdate.plan.tasks[taskIndex].status = 'complete'; // Mark as complete even on failure to avoid loops
                planToUpdate.plan.tasks[taskIndex].explanation = `Error: ${errorMessage}`;
             }
             updatedPlanForReturn = planToUpdate;
        }

        const fallbackMessage: AgentOutput[0] = {
            project_id: project.id,
            chat_id: chat.id,
            sender: 'ai',
            text: `I'm sorry, I encountered an error while working on that task. ${errorMessage}`
        };
        return { messages: [fallbackMessage], projectUpdate: undefined, updatedPlan: updatedPlanForReturn };
    }
};
