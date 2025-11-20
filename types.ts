

import { Session } from '@supabase/supabase-js';

export type WorkspaceMode = 'autonomous' | 'cocreator';
export type ChatMode = 'chat' | 'plan' | 'build' | 'thinker' | 'super_agent' | 'pro_max';
export type ProjectPlatform = 'Roblox Studio' | 'Web App';
export type ProjectType = 'roblox_game' | 'video' | 'story' | 'design' | 'website' | 'presentation' | 'document' | 'conversation';
export type ProjectStatus = 'In Progress' | 'Archived';
// NEW: Split memory layers into two distinct types for clarity and type safety.
export type ChatMemoryLayer = 'inner_personal' | 'outer_personal' | 'interests' | 'preferences' | 'custom';
export type ProjectMemoryLayer = 'context' | 'technical' | 'decisions' | 'progress';
// FIX: Define MemoryLayer as a union of all new and old layer types to resolve import errors across the application.
export type MemoryLayer = ChatMemoryLayer | ProjectMemoryLayer | 'personal' | 'project' | 'codebase' | 'aesthetic';


export type Membership = 'na' | 'pro' | 'max' | 'admin';
// NOTE FOR DB ADMIN: If you add new values, run: ALTER TYPE public.imagemodel ADD VALUE 'imagen_4';
export type ImageModel = 'nano_banana' | 'imagen_2' | 'imagen_3' | 'imagen_4';
export type ChatModel = 'gemini_1.5_flash' | 'gemini_2.5_flash';

// This new type represents the data returned from the joined query for chats and projects
export interface ChatWithProjectData extends Chat {
  projects: Project | null;
}

export interface Profile {
  id: string;
  roblox_id: string;
  roblox_username: string;
  avatar_url: string;
  email?: string; // Added optional email field for admin views
  role?: 'user' | 'admin';
  status?: 'active' | 'banned';
  banned_until?: string | null; // Added for temporary bans
  gemini_api_key?: string | null;
  onboarding_preferences?: OnboardingPreferences | null;
  // New Credit System Fields
  credits: number;
  membership: Membership;
  last_credit_award_date?: string | null;
  // Model Preferences
  preferred_image_model: ImageModel;
  preferred_chat_model: ChatModel;
  ui_theme?: 'light' | 'dark' | 'auto';
  // Community Fields
  bio?: string;
  follower_count?: number;
  following_count?: number;
}

export interface AppSettings {
    id: number;
    daily_credits_na: number;
    daily_credits_pro: number;
    daily_credits_max: number;
    daily_credits_admin: number;
    cost_per_100_credits: number;
    cost_image_nano_banana: number;
    cost_image_imagen_2: number;
    cost_image_imagen_3: number;
    cost_chat_gemini_1_5_flash: number;
    cost_chat_gemini_2_5_flash: number;
    updated_at: string;
}

export interface OnboardingPreferences {
  experience_level: 'beginner' | 'intermediate' | 'expert';
  ui_style: 'minimal' | 'standard' | 'advanced';
  ui_density: 'comfortable' | 'compact' | 'spacious';
  ui_theme: 'light' | 'dark' | 'auto';
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  platform: ProjectPlatform;
  project_type: ProjectType;
  default_model: string;
  project_memory?: string;
  created_at: string;
  updated_at: string;
  // The new files property for the dynamic file system
  files?: { [path: string]: { content: string } };
}

export interface Chat {
  id: string;
  project_id?: string | null;
  user_id: string;
  name: string;
  mode: ChatMode;
  created_at: string;
  updated_at: string;
}

export interface Task {
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
  code?: string | null;
  explanation?: string;
}

export interface Plan {
  title: string;
  features: string[];
  mermaidGraph: string;
  tasks: Task[];
  isComplete: boolean;
}

export interface Clarification {
  prompt: string;
  questions: string[];
  answers?: string[];
}

export interface ThinkerResponse {
  thought: string;
  response: string;
}

export interface Message {
  id: string;
  project_id?: string | null;
  chat_id: string;
  user_id?: string;
  sender: 'user' | 'ai';
  text: string;
  created_at?: string;
  plan?: Plan;
  clarification?: Clarification;
  standing_response?: ThinkerResponse;
  opposing_response?: ThinkerResponse;
  image_base64?: string;
  imageStatus?: 'generating' | 'complete' | 'error';
  code?: string | null;
  language?: string | null;
  raw_ai_response?: string | null;
  groundingMetadata?: any | null;
}

// FIX: Updated Memory type to reflect the new dual memory system.
export interface Memory {
    id: string;
    user_id: string;
    key: string;
    value: any; // Stored as JSONB { "data": ... }
    timestamp?: string;
    // Layer is determined by table name, but useful for UI grouping
    // FIX: Use the comprehensive MemoryLayer type to support both old and new memory systems during transition.
    layer: MemoryLayer;
    // Specific to custom_slots
    slot_name?: string; 
    privacy_level?: string;
}


export interface MCPRequest {
  prompt: string;
  userId: string;
}

export interface StorageConfig {
  userId: string;
  githubToken: string;
  githubUsername: string;
  driveAccessToken: string;
  driveFolderId: string;
}
export interface ProjectFiles {
  code: CodeFile[];
  assets: Asset[];
  metadata: any;
}
export interface CodeFile { 
  path: string; 
  content: string; 
}
export interface Asset { 
  name: string; 
  type: string;
  // This could be a path to a local file, a URL, or raw data
  source: string | File | Blob;
}


// --- NEW COMMUNITY TYPES ---

export type TemplateStatus = 'pending' | 'approved' | 'rejected';
export type CollaborationRole = 'owner' | 'editor' | 'viewer';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  files: any; // jsonb
  preview_image?: string;
  created_by: string;
  status: TemplateStatus;
  downloads: number;
  stars: number;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachments?: any; // jsonb
  read_at?: string;
  created_at: string;
}

export interface Collaboration {
  id: string;
  project_id: string;
  user_id: string;
  role: CollaborationRole;
  invited_by: string;
  accepted_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'system' | 'message';
  title: string;
  content: string;
  link?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  related_user_id?: string;
  related_user?: Profile;
  friendship_id?: string;
}

export interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
    // Virtual fields for UI convenience after joins
    other_user: Profile; 
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}