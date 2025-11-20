import { SupabaseClient } from '@supabase/supabase-js';
import { Project, Message, Plan, ProjectPlatform, Profile, Chat, ChatMode, Memory, ProjectType, MemoryLayer, AppSettings, ChatWithProjectData } from '../types';
// FIX: Import GoogleGenAI and Type for the new memory extraction function.
import { GoogleGenAI, Type } from "@google/genai";

// Helper to extract a clean error message from various error formats.
const getErrorMessage = (error: any): string => {
    if (!error) {
        return "An unknown error occurred.";
    }
    if (typeof error === 'string') {
        return error;
    }
    // Prioritize standard error message property
    if (error && typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
    }
    // Handle Supabase/PostgREST specific error shapes
    if (error && typeof error.details === 'string' && error.details.trim() !== '') {
        return error.details;
    }
    if (error && typeof error.error_description === 'string' && error.error_description.trim() !== '') {
        return error.error_description;
    }
    if (error && typeof error.hint === 'string' && error.hint.trim() !== '') {
        return error.hint;
    }
    // Fallback to stringifying the whole object safely
    try {
        const str = JSON.stringify(error);
        if (str !== '{}') {
            return str;
        }
    } catch (e) {
        // This can happen with circular references
        return "A non-serializable error object was thrown. Check the developer console for details.";
    }
    // Final fallback if nothing else works
    return "An unknown error occurred. The error object could not be stringified.";
};


// Centralized error handler for Supabase calls to provide better user feedback.
const handleSupabaseError = (error: any, context: string): never => {
    console.error(`${context}:`, error); // Log the full error object for debugging.

    const message = getErrorMessage(error);

    // Specific check for schema cache errors, which are often transient.
    if (message.includes('schema cache')) {
        throw new Error(`There was a problem syncing with the database schema. A page refresh usually fixes this. Please refresh and try again.`);
    }
    
    // Check for common network-related fetch errors that manifest differently in browsers.
    if (message.includes('fetch') || message.includes('Load failed') || message.includes('NetworkError')) {
        throw new Error(`Network error: Could not connect to the database. Please check your internet connection and disable any ad-blockers.`);
    }
    
    // Throw a new error with a cleaner message for other database issues.
    throw new Error(`Database operation failed in ${context.toLowerCase()}. Reason: ${message}`);
};

// === App Settings ===
export const getAppSettings = async (supabase: SupabaseClient): Promise<AppSettings> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) handleSupabaseError(error, 'Error fetching app settings');
    return data;
};

export const updateAppSettings = async (supabase: SupabaseClient, updates: Partial<Omit<AppSettings, 'id' | 'updated_at'>>): Promise<AppSettings> => {
    const { data, error } = await supabase
        .from('app_settings')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();
    
    if (error) handleSupabaseError(error, 'Error updating app settings');
    return data;
};

// === Projects ===

export const getProjects = async (supabase: SupabaseClient, userId: string): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) handleSupabaseError(error, 'Error fetching projects');
    return data || [];
};

export const getAllProjects = async (supabase: SupabaseClient): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'Error fetching all projects for admin');
    return data || [];
};

export const createProject = async (supabase: SupabaseClient, userId: string, name: string, platform: ProjectPlatform, projectType: ProjectType, description?: string): Promise<Project> => {
    // First, create the project
    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({ 
            user_id: userId,
            name,
            platform,
            description: description || 'Newly created project.', // Default description
            status: 'In Progress', // Default status
            default_model: 'gemini-2.5-flash',
            project_type: projectType,
        })
        .select()
        .single();
    
    if (projectError) handleSupabaseError(projectError, 'Error creating project');
    return projectData;
}

export const updateProject = async (supabase: SupabaseClient, projectId: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select()
        .single();

    if (error) handleSupabaseError(error, 'Error updating project');
    return data;
};

export const deleteProject = async (supabase: SupabaseClient, projectId: string): Promise<void> => {
    // Manual cascade delete to ensure dependencies are removed first.
    // This is more reliable than relying on database-level cascade deletes which can be complex with RLS.

    // 1. Get all chats associated with the project
    const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .eq('project_id', projectId);

    if (chatsError) handleSupabaseError(chatsError, 'Error fetching chats for project deletion');

    if (chats && chats.length > 0) {
        const chatIds = chats.map(c => c.id);

        // 2. Delete all messages associated with those chats
        const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .in('chat_id', chatIds);

        if (messagesError) handleSupabaseError(messagesError, 'Error deleting messages for project deletion');
        
        // 3. Delete all chats for the project
        const { error: deleteChatsError } = await supabase
            .from('chats')
            .delete()
            .eq('project_id', projectId);

        if (deleteChatsError) handleSupabaseError(deleteChatsError, 'Error deleting chats for project deletion');
    }

    // 4. Finally, delete the project itself
    const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (projectError) handleSupabaseError(projectError, 'Error deleting project');
};


// === Chats ===

export const getAllChatsForUser = async (supabase: SupabaseClient, userId: string): Promise<ChatWithProjectData[]> => {
    const { data, error } = await supabase
        .from('chats')
        .select('*, projects(*)') // This performs the join
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) handleSupabaseError(error, 'Error fetching all user chats with projects');
    // The type assertion is needed because Supabase TS inference isn't perfect on joins
    return (data as ChatWithProjectData[]) || [];
};


export const getChatsForProject = async (supabase: SupabaseClient, projectId: string): Promise<Chat[]> => {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) handleSupabaseError(error, 'Error fetching chats for project');
    return data || [];
};

export const createChat = async (supabase: SupabaseClient, userId: string, name: string, mode: ChatMode, projectId?: string | null): Promise<Chat> => {
    const { data, error } = await supabase
        .from('chats')
        .insert({
            project_id: projectId,
            user_id: userId,
            name: name,
            mode: mode,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    
    if (error) handleSupabaseError(error, 'Error creating chat');
    return data;
};

export const updateChat = async (supabase: SupabaseClient, chatId: string, updates: Partial<Chat>): Promise<Chat> => {
    const { data, error } = await supabase
        .from('chats')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', chatId)
        .select()
        .single();
    
    if (error) handleSupabaseError(error, 'Error updating chat');
    return data;
};

export const deleteChat = async (supabase: SupabaseClient, chatId: string): Promise<void> => {
    const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
    if (error) handleSupabaseError(error, 'Error deleting chat');
};


// === Profiles ===

export const createProfile = async (supabase: SupabaseClient, userId: string, displayName: string, avatarUrl: string): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            roblox_username: displayName, // Re-purposing this field for display name
            avatar_url: avatarUrl,
            roblox_id: userId, // Fallback value
        })
        .select()
        .single();

    if (error) handleSupabaseError(error, 'Error creating profile');
    return data;
};

export const updateProfile = async (supabase: SupabaseClient, userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) handleSupabaseError(error, 'Error updating profile');
    return data;
};

export const deductUserCredits = async (supabase: SupabaseClient, userId: string, amount: number): Promise<Profile> => {
    const { data, error } = await supabase.rpc('deduct_credits', { p_user_id: userId, p_amount: amount });
    if (error) handleSupabaseError(error, 'Error deducting credits');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileError) handleSupabaseError(profileError, 'Error fetching profile after credit deduction');
    return profile;
}


export const getAllProfiles = async (supabase: SupabaseClient): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('roblox_username', { ascending: true });
        
    if (error) handleSupabaseError(error, 'Error fetching all profiles for admin');
    return data || [];
};

export const updateProfileForAdmin = async (supabase: SupabaseClient, userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) handleSupabaseError(error, 'Error updating profile for admin');
    return data;
};

// FIX: Added missing function to increment the user's daily thinking usage count.
export const incrementThinkingCount = async (supabase: SupabaseClient, userId: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.rpc('increment_thinking_count', {
      p_user_id: userId,
      p_date: today
    });
    if (error) {
        // Log as a warning since this is a non-critical tracking operation.
        console.warn(`Could not increment thinking count for user ${userId}:`, error);
    }
};


// === Messages ===

export const getMessages = async (supabase: SupabaseClient, chatId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) handleSupabaseError(error, 'Error fetching messages');
    return data || [];
};

export const addMessage = async (supabase: SupabaseClient, message: Omit<Message, 'id' | 'created_at'>): Promise<Message> => {
    // Create a copy of the message object to avoid mutating the original
    const messageToInsert = { ...message };

    // The 'imageStatus' property is for UI state management only and does not exist
    // in the database schema. It must be removed before insertion to prevent an error.
    delete (messageToInsert as Partial<Message>).imageStatus;

    const { data, error } = await supabase
        .from('messages')
        .insert(messageToInsert)
        .select()
        .single();
    
    if (error) handleSupabaseError(error, 'Error adding message');
    return data;
};

export const updateMessage = async (supabase: SupabaseClient, messageId: string, updates: Partial<Message>): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single();
    if (error) handleSupabaseError(error, 'Error updating message');
    return data;
};

export const deleteMessage = async (supabase: SupabaseClient, messageId: string): Promise<void> => {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
    if (error) handleSupabaseError(error, 'Error deleting message');
};

export const updateMessagePlan = async (supabase: SupabaseClient, messageId: string, plan: Plan): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .update({ plan })
        .eq('id', messageId)
        .select()
        .single();

    if (error) handleSupabaseError(error, 'Error updating message plan');
    return data;
};

export const updateMessageClarification = async (supabase: SupabaseClient, messageId: string, clarification: any): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .update({ clarification })
        .eq('id', messageId)
        .select()
        .single();
    
    if (error) handleSupabaseError(error, 'Error updating message clarification');
    return data;
};

// === Memories (New AI-Controlled System) ===

// FIX: Add missing extractAndSaveMemory function to fix import error in Layout.tsx.
export const extractAndSaveMemory = async (supabase: SupabaseClient, userId: string, userText: string, aiText: string, projectId?: string | null): Promise<void> => {
    // 1. Get user's API key from their profile to make a Gemini call.
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', userId)
        .single();
    
    if (profileError || !profileData || !profileData.gemini_api_key) {
        console.warn("Could not extract memory: user has no API key.", profileError);
        return; // Don't throw, as this is a background, non-critical task.
    }
    const apiKey = profileData.gemini_api_key;

    // 2. Call Gemini to extract memories.
    const ai = new GoogleGenAI({ apiKey });

    const instruction = `You are an AI assistant that extracts important facts from a conversation to be saved to a long-term memory system.
Analyze the user's message and the AI's response. Identify any new, significant information that should be remembered.
This could include personal facts, project details, or user preferences.
If you find something to save, format it as a JSON object. If there is nothing to save, return an empty JSON object.

The memory system has 4 layers: 'personal', 'project', 'codebase', 'aesthetic'.

Respond with a JSON object containing a single key "memoriesToCreate", which is an array of memory objects.
Each memory object must have "layer", "key", and "value".
The "key" should be a concise identifier (e.g., "user_name", "project_goal").
The "value" is the information to store. **This should be a detailed, paragraph-length string capturing the full context.**

Example:
User: "I'm Alex, I'm 13 and someone at school keeps bullying me"
AI: "I'm really sorry to hear that, Alex..."
Your output:
{
  "memoriesToCreate": [
    {
      "layer": "personal",
      "key": "user_background",
      "value": "User is Alex, 13 years old, currently dealing with bullying at school from a classmate. This is causing stress and affecting their daily life."
    }
  ]
}

If nothing needs to be saved, output:
{
  "memoriesToCreate": []
}
`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            memoriesToCreate: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        layer: { type: Type.STRING, enum: ['personal', 'project', 'codebase', 'aesthetic'] },
                        key: { type: Type.STRING },
                        value: { type: Type.STRING }
                    },
                    required: ["layer", "key", "value"]
                }
            }
        },
        required: ["memoriesToCreate"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `PROJECT_ID: ${projectId || 'N/A'}\nCONVERSATION TURN:\nUser: "${userText}"\nAI: "${aiText}"`,
            config: {
                systemInstruction: instruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const result = JSON.parse(response.text);
        
        if (result.memoriesToCreate && result.memoriesToCreate.length > 0) {
            for (const mem of result.memoriesToCreate) {
                await saveMemory(supabase, userId, mem.layer, mem.key, mem.value, projectId);
            }
        }
    } catch (error) {
        console.warn("Failed to extract and save memory:", error);
        // Don't throw, as this is a background, non-critical task.
    }
};


export const loadMemoriesForPrompt = async (supabase: SupabaseClient, userId: string, prompt: string, projectId?: string | null): Promise<string> => {
    const { data, error } = await supabase
        .from('memories')
        .select('layer, content, metadata')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    
    if (error) handleSupabaseError(error, 'Failed to load memories for prompt');
    
    if (!data || data.length === 0) {
        return "=== MEMORIES LOADED ===\nNone yet!\n=======================";
    }

    const relevantMemories = data.filter(m => {
        // Rule 1: Always include global memories.
        if (m.layer === 'personal' || m.layer === 'aesthetic') {
            return true;
        }
        
        // Rule 2: If we are in a project, include memories specific to that project.
        if (projectId && (m.layer === 'project' || m.layer === 'codebase')) {
            const memoryProjectId = m.metadata?.project_id;
            return memoryProjectId === projectId;
        }

        // Rule 3: Otherwise (e.g., in an autonomous chat), don't include project-specific memories.
        return false;
    });
    
    let finalMemories = relevantMemories;

    // If we have more than 50 memories, perform a relevance-ranking search to simulate semantic search.
    if (relevantMemories.length > 50) {
        const keywords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        
        const scoredMemories = relevantMemories.map(memory => {
            const content = memory.content?.toLowerCase() || '';
            const key = memory.metadata?.memory_key?.toLowerCase() || '';
            let score = 0;
            
            // Global memories are highly important and should always be considered.
            if (memory.layer === 'personal' || memory.layer === 'aesthetic') {
                score += 100;
            }

            for (const keyword of keywords) {
                if (key.includes(keyword)) score += 5; // Higher score for matching the key
                if (content.includes(keyword)) score += 1;
            }
            return { memory, score };
        });

        scoredMemories.sort((a, b) => b.score - a.score);
        finalMemories = scoredMemories.slice(0, 50).map(item => item.memory);
    }
    
    if (finalMemories.length === 0) {
        return "=== MEMORIES LOADED ===\nNone relevant to this context yet.\n=======================";
    }

    const byLayer: Record<string, string[]> = {
        personal: [], project: [], codebase: [], aesthetic: []
    };
    
    finalMemories.forEach(m => {
        const key = m.metadata?.memory_key || m.metadata?.key;
        const value = m.content;
        
        if (m.layer && key && value) {
           byLayer[m.layer as MemoryLayer].push(`[${key}]\n${value}`);
        }
    });
    
    return `
=== MEMORIES LOADED ===

PERSONAL:
${byLayer.personal.join('\n\n') || 'None'}

PROJECT:
${byLayer.project.join('\n\n') || 'None'}

CODEBASE:
${byLayer.codebase.join('\n\n') || 'None'}

AESTHETIC:
${byLayer.aesthetic.join('\n\n') || 'None'}

========================
    `.trim();
};

function validateMemoryLength(key: string, content: string): { valid: boolean; warning?: string } {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    if (paragraphCount > 2) {
        return {
            valid: false,
            warning: `Memory "${key}" is ${paragraphCount} paragraphs (max 2 allowed). Consider splitting into separate memories.`
        };
    }
    
    const estimatedTokens = content.length / 4;
    if (estimatedTokens > 500) {
        return {
            valid: false,
            warning: `Memory "${key}" is too long (~${Math.round(estimatedTokens)} tokens). Keep under 500 tokens (~2 paragraphs).`
        };
    }

    return { valid: true };
}


// FIX: Implemented a manual upsert to map the app's key/value system to the DB's content/metadata schema.
export const saveMemory = async (supabase: SupabaseClient, userId: string, layer: MemoryLayer, key: string, value: string, projectId?: string | null): Promise<Memory> => {
    // Validate length before saving.
    const validation = validateMemoryLength(key, value);
    if (!validation.valid) {
        console.warn(`Memory validation failed: ${validation.warning}`);
        // We still save it but log the warning as requested.
    }

    // Since we can't use onConflict with a jsonb key without a special index,
    // we perform a manual SELECT then INSERT/UPDATE to achieve an upsert.
    const { data: existing, error: findError } = await supabase
        .from('memories')
        .select('id')
        .eq('user_id', userId)
        .eq('layer', layer)
        .eq('metadata->>memory_key', key) // Query the JSONB field for our key
        .limit(1);

    if (findError) handleSupabaseError(findError, 'Failed to check for existing memory');

    const metadata: { memory_key: string, project_id?: string } = { memory_key: key };
    if (projectId) {
        metadata.project_id = projectId;
    }

    const memoryPayload = {
        user_id: userId,
        layer,
        content: value, // The `value` goes into the `content` column.
        metadata: metadata, // The `key` and optional `projectId` are stored in metadata.
        updated_at: new Date().toISOString()
    };

    let savedData;
    if (existing && existing.length > 0) {
        // --- UPDATE existing memory ---
        const { data, error } = await supabase
            .from('memories')
            .update(memoryPayload)
            .eq('id', existing[0].id)
            .select()
            .single();
        if (error) handleSupabaseError(error, 'Failed to update memory');
        savedData = data;
    } else {
        // --- INSERT new memory ---
        const { data, error } = await supabase
            .from('memories')
            .insert(memoryPayload)
            .select()
            .single();
        if (error) handleSupabaseError(error, 'Failed to create memory');
        savedData = data;
    }
    
    // Map the database result back to the application's expected format.
    return {
        ...savedData,
        key: savedData.metadata?.memory_key || key,
        value: savedData.content || value
    };
};

// FIX: Rewrote to fetch from the correct columns and map the result to the key/value format used by the UI.
export const getMemoriesForUser = async (supabase: SupabaseClient, userId: string): Promise<Memory[]> => {
    const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('layer')
        .order('updated_at', { ascending: false }); // Order by a column that exists.
        
    if (error) handleSupabaseError(error, 'Failed to get memories');
    
    // Map from DB schema (content, metadata) to application type (key, value)
    return (data || []).map((dbMemory: any) => ({
        ...dbMemory,
        key: dbMemory.metadata?.memory_key || dbMemory.metadata?.key || '[No Key]',
        value: dbMemory.content,
    }));
};

// FIX: Rewrote to handle mapping UI updates (key/value) back to the database schema (content/metadata).
export const updateMemory = async (supabase: SupabaseClient, memoryId: string, updates: Partial<Omit<Memory, 'id' | 'user_id' | 'created_at'>>): Promise<Memory> => {
    // The 'updates' object from the UI will have 'key' and/or 'value'.
    // We need to map this back to 'content' and 'metadata'.
    const dbUpdates: { content?: string; layer?: MemoryLayer; metadata?: any; updated_at: string } = {
        updated_at: new Date().toISOString()
    };

    if ('layer' in updates && updates.layer) dbUpdates.layer = updates.layer;
    if ('value' in updates && updates.value) {
        // Validate the new content length
        const validation = validateMemoryLength(updates.key || 'unknown', updates.value);
        if (!validation.valid) {
            console.warn(`Memory validation failed during update: ${validation.warning}`);
        }
        dbUpdates.content = updates.value as string;
    }

    // Handling the key update requires a read-modify-write on the metadata JSONB object.
    if ('key' in updates && updates.key) {
        const { data: existing, error: fetchError } = await supabase
            .from('memories')
            .select('metadata')
            .eq('id', memoryId)
            .single();
        if (fetchError) handleSupabaseError(fetchError, 'Failed to fetch memory to update key');
        
        const newMetadata = { ...(existing?.metadata || {}), memory_key: updates.key };
        dbUpdates.metadata = newMetadata;
    }
    
    const { data, error } = await supabase
        .from('memories')
        .update(dbUpdates)
        .eq('id', memoryId)
        .select()
        .single();
    if (error) handleSupabaseError(error, 'Failed to update memory');
    
    // Map the database result back to the application's expected format
    return {
        ...data,
        key: data.metadata?.memory_key || data.metadata?.key || '[No Key]',
        value: data.content,
    };
};

// Deletes a memory entry, used by the dashboard.
export const deleteMemory = async (supabase: SupabaseClient, memoryId: string): Promise<void> => {
    const { error } = await supabase.from('memories').delete().eq('id', memoryId);
    if (error) handleSupabaseError(error, 'Error deleting memory');
};

// FIX: Export ChatWithProjectData since it is used in the return type of an exported function.
export type { ChatWithProjectData };