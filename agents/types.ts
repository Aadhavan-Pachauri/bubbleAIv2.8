import { SupabaseClient, User } from '@supabase/supabase-js';
import { Project, Chat, Message, WorkspaceMode, Profile, Plan } from '../types';

export interface AgentInput {
    prompt: string;
    apiKey: string;
    model: string;
    project: Project;
    chat: Chat;
    user: User;
    profile: Profile | null;
    supabase: SupabaseClient;
    history: Message[];
    workspaceMode: WorkspaceMode;
    files?: File[] | null; // <-- ADDED
    // Optional, for when a plan is being generated from answers
    answers?: string[];
    // Optional callback for streaming responses
    onStreamChunk?: (chunk: string) => void;
    // Optional pre-fetched memory context
    memoryContext?: string;
}

// The output is just the message content. The ChatView will handle saving it to the DB.
export type AgentOutput = Omit<Message, 'id' | 'created_at'>[];

export interface AgentExecutionResult {
    messages: AgentOutput;
    projectUpdate?: Partial<Project>;
    updatedPlan?: { messageId: string; plan: Plan };
}