import { AgentInput, AgentOutput, AgentExecutionResult } from './types';
import { runChatAgent } from './cocreator/chat/handler';
import { runPlanAgent } from './cocreator/plan/handler';
import { runBuildAgent } from './cocreator/build/handler';
import { runThinkerAgent } from './cocreator/thinker/handler';
import { runSuperAgent } from './cocreator/super_agent/handler';
import { runProMaxAgent } from './cocreator/pro_max/handler';
import { runAutonomousAgent } from './autonomous/handler';
import { getUserFriendlyError } from './errorUtils';
import { summarizeOldHistory } from './historyService';
import { loadMemoriesForPrompt } from '../services/databaseService';

export const runAgent = async (input: AgentInput): Promise<AgentExecutionResult> => {
    try {
        // Summarize conversation history if it's too long
        const optimizedHistory = await summarizeOldHistory(input.history, input.apiKey);

        // Fetch and inject the memory context, now project-aware and using the prompt for semantic search.
        const memoryContext = await loadMemoriesForPrompt(input.supabase, input.user.id, input.prompt, input.chat.project_id);
        
        const agentInputWithContext = { 
            ...input, 
            history: optimizedHistory,
            memoryContext: memoryContext // Add memory to the input object
        };

        // Route to the dedicated autonomous agent if in that mode.
        if (input.workspaceMode === 'autonomous') {
            return await runAutonomousAgent(agentInputWithContext);
        }

        // In Co-Creator mode, respect the user's selected chat agent.
        switch (input.chat.mode) {
            case 'chat':
                return await runChatAgent(agentInputWithContext);
            case 'plan':
                return await runPlanAgent(agentInputWithContext);
            case 'build':
                return await runBuildAgent(agentInputWithContext);
            case 'thinker':
                return await runThinkerAgent(agentInputWithContext);
            case 'super_agent':
                return await runSuperAgent(agentInputWithContext);
            case 'pro_max':
                return await runProMaxAgent(agentInputWithContext);
            default:
                // Fallback to the build agent for any undefined modes that should create plans.
                return await runBuildAgent(agentInputWithContext);
        }
    } catch(error) {
        console.error(`Error running agent for mode "${input.chat.mode}" in workspace "${input.workspaceMode}":`, error);
        const errorMessage = getUserFriendlyError(error);
        const fallbackMessage: AgentOutput[0] = {
            project_id: input.chat.project_id,
            chat_id: input.chat.id,
            text: `I'm sorry, but I encountered an error while processing your request. ${errorMessage}`,
            sender: 'ai',
        };
        return { messages: [fallbackMessage] };
    }
};
