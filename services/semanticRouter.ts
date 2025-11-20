
import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryLayer } from '../types';

export type RouterAction = 'SEARCH' | 'DEEP_SEARCH' | 'THINK' | 'IMAGE' | 'CANVAS' | 'PROJECT' | 'STUDY' | 'SIMPLE';

export interface RoutingDecision {
    action: RouterAction;
    parameters: any;
    confidence: number;
    memoryLayers: MemoryLayer[];
    quotaOK: boolean;
    reasoning: string;
}

export class BubbleSemanticRouter {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async route(query: string, userId: string, apiKey: string, fileCount: number = 0): Promise<RoutingDecision> {
        const lowerQuery = query.toLowerCase();

        let action: RouterAction = 'SIMPLE';
        let parameters: any = {};
        let reasoning = "Defaulting to conversation.";

        // Keyword-based overrides for speed and reliability
        if (lowerQuery.includes('image of') || lowerQuery.includes('generate image') || lowerQuery.includes('create an image')) {
            action = 'IMAGE';
            parameters = { prompt: query };
            reasoning = "Detected image generation request.";
        } else if (lowerQuery.includes('html file') || lowerQuery.includes('single file') || lowerQuery.includes('one file') || lowerQuery.includes('canvas')) {
            action = 'CANVAS';
            reasoning = "Detected request for single-file code artifact.";
        } else if (lowerQuery.includes('search for') || lowerQuery.includes('google')) {
             action = 'SEARCH';
             reasoning = "Detected search request.";
        }

        return {
            action,
            parameters,
            confidence: 1,
            // Include ALL layers to ensure personal details (names) and preferences are always available
            memoryLayers: ['inner_personal', 'outer_personal', 'personal', 'interests', 'preferences', 'custom', 'codebase', 'aesthetic', 'project'], 
            quotaOK: true,
            reasoning
        };
    }
}
