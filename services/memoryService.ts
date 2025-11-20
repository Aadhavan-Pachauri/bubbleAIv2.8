import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryLayer } from '../types';

export class Memory5Layer {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  // Store memory in unified table
  async store(layer: MemoryLayer, key: string, value: any): Promise<void> {
    // We need to check if it exists first because we can't easily UPSERT on a jsonb field key
    const { data: existing } = await this.supabase
      .from('memories')
      .select('id')
      .eq('user_id', this.userId)
      .eq('layer', layer)
      .eq('metadata->>memory_key', key)
      .single();

    const contentStr = typeof value === 'string' ? value : JSON.stringify(value);

    if (existing) {
      const { error } = await this.supabase
        .from('memories')
        .update({ 
          content: contentStr,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase
        .from('memories')
        .insert({
          user_id: this.userId,
          layer,
          content: contentStr,
          metadata: { memory_key: key },
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    }
  }

  // Get memory from unified table
  async get(layer: MemoryLayer, key: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('memories')
      .select('content')
      .eq('user_id', this.userId)
      .eq('layer', layer)
      .eq('metadata->>memory_key', key)
      .single();
    
    if (error || !data) return null;
    return data.content;
  }

  // Get all memories from layer
  async getAll(layer: MemoryLayer): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('memories')
      .select('content, metadata')
      .eq('user_id', this.userId)
      .eq('layer', layer);
    
    if (error || !data) return {};
    
    return data.reduce((acc, item) => {
      const key = item.metadata?.memory_key;
      if (key) {
        acc[key] = item.content;
      }
      return acc;
    }, {} as Record<string, any>);
  }

  // Get context for AI (selected layers)
  async getContext(layers: MemoryLayer[]): Promise<Record<string, any>> {
    const context: Record<string, any> = {};
    
    for (const layer of layers) {
      context[layer] = await this.getAll(layer);
    }
    
    return context;
  }
}