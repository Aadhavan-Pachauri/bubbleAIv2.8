
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './useToast';
import { Project, Message, Chat, WorkspaceMode, ProjectPlatform, ProjectType, ChatWithProjectData } from '../types';
import { 
    getAllChatsForUser, 
    addMessage, 
    createProject, 
    updateProject as updateDbProject, 
    createChat as createDbChat, 
    updateChat as updateDbChat, 
    getMessages, 
    deleteChat, 
    extractAndSaveMemory, 
    updateMessagePlan,
    getChatsForProject,
    saveMemory
} from '../services/databaseService';
import { generateProjectDetails, classifyUserIntent, generateChatTitle } from '../services/geminiService';
import { runAgent } from '../agents';
import { User } from '@supabase/supabase-js';
import { AgentExecutionResult } from '../agents/types';

const DUMMY_AUTONOMOUS_PROJECT: Project = {
  id: 'autonomous-project',
  user_id: 'unknown',
  name: 'Autonomous Chat',
  description: 'A personal chat with the AI.',
  status: 'In Progress',
  platform: 'Web App',
  project_type: 'conversation',
  default_model: 'gemini-2.5-flash',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface UseChatProps {
    user: User | null;
    geminiApiKey: string | null;
    workspaceMode: WorkspaceMode;
    // For admin page to view other users' projects
    adminProject?: Project | null; 
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const useChat = ({ user, geminiApiKey, workspaceMode, adminProject }: UseChatProps) => {
    const { supabase, profile } = useAuth();
    const { addToast } = useToast();

    const [allChats, setAllChats] = useState<ChatWithProjectData[]>([]);
    const [activeChat, setActiveChat] = useState<ChatWithProjectData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    
    // Use a ref to track if a message is currently being processed to prevent duplicate calls
    const isSendingRef = useRef(false);

    const activeProject = useMemo(() => adminProject ?? activeChat?.projects ?? null, [adminProject, activeChat]);
    
    // Fetch user's chats (or project's chats for admin)
    useEffect(() => {
        if (!supabase || !user) return;
        
        const fetchChats = async () => {
            setIsLoading(true);
            try {
                let chats: ChatWithProjectData[] = [];
                if (adminProject) { // Admin viewing a specific project
                    const projectChats = await getChatsForProject(supabase, adminProject.id);
                    chats = projectChats.map(c => ({...c, projects: adminProject }));
                } else if(user) { // Regular user or admin in autonomous mode
                    chats = await getAllChatsForUser(supabase, user.id);
                }
                setAllChats(chats);
            } catch (error) {
                const msg = error instanceof Error ? error.message : "Unknown error";
                console.error("Error fetching chats:", msg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChats();
    }, [user, supabase, addToast, adminProject]);

    // Fetch messages for active chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (activeChat && supabase) {
                setIsLoading(true);
                try {
                    const history = await getMessages(supabase, activeChat.id);
                    setMessages(history);
                } catch (error) { 
                    // Improved error parsing to handle non-Error objects (like Supabase errors) gracefully
                    let msg = "Unknown error";
                    if (error instanceof Error) msg = error.message;
                    else if (typeof error === 'object' && error !== null && 'message' in error) msg = String((error as any).message);
                    else if (typeof error === 'string') msg = error;
                    else try { msg = JSON.stringify(error); } catch {}
                    
                    console.error("Error fetching messages:", msg);
                    setMessages([]); 
                } 
                finally { setIsLoading(false); }
            } else {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [activeChat, supabase]);

    const handleSelectChat = useCallback((chat: ChatWithProjectData) => {
        setActiveChat(chat);
    }, []);

    const handleUpdateChat = useCallback(async (chatId: string, updates: Partial<Chat>) => {
        if (!supabase) return;
        try {
            const updatedChat = await updateDbChat(supabase, chatId, updates);
            setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, ...updatedChat } : c));
            setActiveChat(prev => (prev?.id === chatId ? { ...prev, ...updatedChat } : prev));
        } catch (error) { 
             const msg = error instanceof Error ? error.message : "Unknown error";
             console.error("Failed to update chat:", msg);
        }
    }, [supabase]);

    // Auto-generate chat title
    useEffect(() => {
        if (messages.length === 2 && activeChat && geminiApiKey && messages[0].sender === 'user' && messages[1].sender === 'ai' && activeChat.name === messages[0].text) {
            generateChatTitle(messages[0].text, messages[1].text, geminiApiKey).then(title => {
                if (activeChat) {
                    handleUpdateChat(activeChat.id, { name: title });
                }
            });
        }
    }, [messages, activeChat, geminiApiKey, handleUpdateChat]);

    const handleDeleteChat = async (chatId: string) => {
        if (!supabase) return;
        try {
            await deleteChat(supabase, chatId);
            setAllChats(prev => prev.filter(c => c.id !== chatId));
            if (activeChat?.id === chatId) {
                setActiveChat(null);
            }
            addToast('Chat deleted.', 'info');
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            console.error("Failed to delete chat:", msg);
            addToast('Failed to delete chat.', 'error');
        }
    };
    
    const handleSendMessage = useCallback(async (text: string, files: File[] | null = null, chatToUse: ChatWithProjectData | null = activeChat): Promise<AgentExecutionResult> => {
      if ((!text.trim() && (!files || files.length === 0)) || !supabase || !user || !chatToUse || !geminiApiKey) return { messages: [] };
      
      // Strict lock to prevent double processing
      if (isSendingRef.current) {
          return { messages: [] };
      }
      isSendingRef.current = true;

      const tempId = `temp-ai-${Date.now()}`;
      let currentText = '';

      try {
        const userMessageData: Omit<Message, 'id' | 'created_at'> = {
          project_id: chatToUse.project_id,
          chat_id: chatToUse.id,
          user_id: user.id, text, sender: 'user',
        };

        if (files && files.length > 0) {
            try {
                const base64Strings = await Promise.all(files.map(fileToBase64));
                userMessageData.image_base64 = files.length === 1 ? base64Strings[0] : JSON.stringify(base64Strings);
            } catch (error) {
                addToast("Failed to read the attached file(s).", 'error');
                isSendingRef.current = false; // Release lock early
                return { messages: [] };
            }
        }
        
        const savedUserMessage = await addMessage(supabase, userMessageData);
        const historyWithPlan = [...messages, savedUserMessage];
        
        const tempAiMessage: Message = { id: tempId, project_id: chatToUse.project_id, chat_id: chatToUse.id, text: '', sender: 'ai' };
        setMessages(prev => [...prev, savedUserMessage, tempAiMessage]);
        setIsLoading(true);

        const onStreamChunk = (chunk: string) => {
            try {
                const event = JSON.parse(chunk);
                if (event.type === 'image_generation_start') {
                     // Don't append event JSON to text
                     setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: currentText, imageStatus: 'generating' } : m));
                     return;
                }
            } catch (e) { 
                // Not JSON, treat as text
            }
            
            // If we get here, it's text content (either from partial JSON or just text)
            currentText += chunk;
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, text: currentText } : m));
        };

        const projectForAgent = chatToUse.projects ?? { ...DUMMY_AUTONOMOUS_PROJECT, user_id: user.id };
        const promptForAI = text;

        const agentResult = await runAgent({
            prompt: promptForAI,
            files, 
            apiKey: geminiApiKey, 
            model: projectForAgent.default_model,
            project: projectForAgent, 
            chat: chatToUse, 
            user, 
            profile, 
            supabase,
            history: historyWithPlan, 
            onStreamChunk, 
            workspaceMode
        });
        
        const { messages: agentMessages, updatedPlan } = agentResult;
        
        const savedAiMessages: Message[] = [];
        for (const messageContent of agentMessages) {
            // Process manual memories from agent
            const msgAny = messageContent as any;
            if (msgAny.memoryToCreate && Array.isArray(msgAny.memoryToCreate)) {
                for (const mem of msgAny.memoryToCreate) {
                     saveMemory(supabase, user.id, mem.layer, mem.key, mem.value, chatToUse.project_id)
                        .catch(e => console.warn("Failed to save agent memory:", e));
                }
            }

            // Ensure we use the accumulated text if available, as it might be more complete than what agent returned if stream ended abruptly
            const finalContent = messageContent.text || currentText; 
            const savedAiMessage = await addMessage(supabase, { ...messageContent, text: finalContent, project_id: chatToUse.project_id });
            savedAiMessages.push(savedAiMessage);
        }

        if (savedUserMessage && savedAiMessages.length > 0) {
            extractAndSaveMemory(supabase, user.id, savedUserMessage.text, savedAiMessages[0].text, chatToUse.project_id)
                .catch(err => console.warn("Background memory extraction failed (quota check recommended):", err));
        }
        
        setMessages(prev => {
            const newMessages = [...prev];
            const tempMessageIndex = newMessages.findIndex(m => m.id === tempId);

            if (tempMessageIndex !== -1 && savedAiMessages.length > 0) {
                // Replace the temporary message with the saved ones
                newMessages.splice(tempMessageIndex, 1, ...savedAiMessages);
            } else {
                // Fallback if temp message not found or AI returned no messages
                const finalMessages = newMessages.filter(m => m.id !== tempId);
                finalMessages.push(...savedAiMessages);
                return finalMessages;
            }

            if (updatedPlan) {
                return newMessages.map(m => m.id === updatedPlan.messageId ? { ...m, plan: updatedPlan.plan } : m);
            }
            
            return newMessages;
        });

        if (updatedPlan) await updateMessagePlan(supabase, updatedPlan.messageId, updatedPlan.plan);
        return agentResult;

      } catch (e: any) {
        // Extract clean error message from object or string
        let errorMessage = "An unknown error occurred.";
        if (typeof e === 'string') errorMessage = e;
        else if (e instanceof Error) errorMessage = e.message;
        else if (e?.message) errorMessage = e.message;
        else try { errorMessage = JSON.stringify(e); } catch {}

        addToast(errorMessage, "error");
        console.error("Error in handleSendMessage:", errorMessage);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return { messages: [] };
      } finally {
        setIsLoading(false);
        // Small delay before releasing lock to prevent accidental double-clicks
        setTimeout(() => {
            isSendingRef.current = false;
        }, 500);
      }
    }, [activeChat, supabase, user, geminiApiKey, messages, addToast, profile, workspaceMode]);
    
    return {
        allChats,
        setAllChats,
        activeChat,
        setActiveChat,
        messages,
        setMessages,
        isLoading,
        isCreatingChat,
        setIsCreatingChat,
        activeProject,
        handleUpdateChat,
        handleSelectChat,
        handleDeleteChat,
        handleSendMessage,
    };
};
