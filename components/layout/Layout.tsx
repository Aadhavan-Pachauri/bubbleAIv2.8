
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { ChatView } from '../chat/ChatView';
import { ProjectsPage } from '../pages/ProjectsPage';
import { TopBar } from '../dashboard/TopBar';
import { Project, Message, Chat, WorkspaceMode, ProjectPlatform, ProjectType, ChatWithProjectData } from '../../types';
import { SettingsPage } from '../pages/SettingsPage';
import { useAuth } from '../../contexts/AuthContext';
import { updateProject as updateDbProject, createProject, createChat as createDbChat, getAllChatsForUser } from '../../services/databaseService';
import { StatusBar } from '../admin/ImpersonationBanner';
import { CoCreatorWorkspace } from '../cocreator/CoCreatorWorkspace';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { generateProjectDetails, classifyUserIntent } from '../../services/geminiService';
import { useToast } from '../../hooks/useToast';
import { useChat } from '../../hooks/useChat';
import { useWindowSize } from '../../hooks/useWindowSize';

// New Community Page Placeholders
import { MarketplacePage } from '../community/MarketplacePage';
import { MessagesPage } from '../community/MessagesPage';
import { DiscoverPage } from '../community/DiscoverPage';

type View = 'chat' | 'settings';
type HubView = 'projects' | 'marketplace' | 'messages' | 'discover';

interface LayoutProps {
  geminiApiKey: string;
}

export const Layout: React.FC<LayoutProps> = ({ geminiApiKey }) => {
  const { user, supabase, isImpersonating, profile, isAdmin, signOut, stopImpersonating } = useAuth();
  const { addToast } = useToast();
  
  // Initialize pathname with window location, but treat this state as the source of truth
  const [pathname, setPathname] = useState(window.location.pathname);

  // UPDATED: Default to 'autonomous' for new users so they land in chat, not an empty hub
  const [workspaceMode, setWorkspaceMode] = useLocalStorage<WorkspaceMode>('workspaceMode', 'autonomous');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);

  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false; // md breakpoint
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('userSidebarCollapsed', false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
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
      handleDeleteChat,
      handleSendMessage,
  } = useChat({ user, geminiApiKey, workspaceMode });

  // --- URL-based Routing ---
  
  useEffect(() => {
    const handlePopState = () => {
        // Only update if the URL is actually different to prevent unnecessary renders
        if (window.location.pathname !== pathname) {
            setPathname(window.location.pathname);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pathname]);

  // Safe navigation function that updates UI even if History API fails (e.g. in sandboxes)
  const navigate = useCallback((path: string, replace: boolean = false) => {
    // 1. Update UI state immediately (Source of Truth)
    setPathname(path);
    setIsSidebarOpen(false); 

    // 2. Try to update URL, but don't crash if it fails (e.g. iframe restrictions)
    try {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        // Only push if different to avoid redundant history entries
        if (window.location.pathname !== path) {
          window.history.pushState({}, '', path);
        }
      }
    } catch (e) {
      // Fail silently. In restricted environments like sandboxes, 
      // history modification might be blocked. The app should still work 
      // because we updated the React state above.
    }
  }, []);

  const { view, hubView, chatId, isRoot } = useMemo(() => {
    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const parts = cleanPath.split('/').filter(Boolean);
    
    // Handle root or empty paths (common in sandboxes with blob URLs)
    if (parts.length === 0) return { view: 'root', isRoot: true };

    if (parts[0] === 'settings') return { view: 'settings' };
    
    // Autonomous route
    if (parts[0] === 'autonomous-chat') return { view: 'chat', chatId: 'new' };
    
    // Hub routes
    if (parts[0] === 'cocreator-hub') return { view: 'chat', hubView: 'projects' };
    if (parts[0] === 'projects') return { view: 'chat', hubView: 'projects' };
    if (parts[0] === 'marketplace') return { view: 'chat', hubView: 'marketplace' };
    if (parts[0] === 'messages') return { view: 'chat', hubView: 'messages' };
    if (parts[0] === 'discover') return { view: 'chat', hubView: 'discover' };
    
    // Specific Chat routes
    if (parts[0] === 'c') return { view: 'chat', chatId: parts[1] };
    if (parts[0] === 'p' && parts.length >= 3 && parts[2] === 'c') {
      return { view: 'chat', chatId: parts[3] };
    }

    // Fallback for unknown paths (e.g. random blob IDs) -> Treat as root to trigger preference-based redirect
    return { view: 'root', isRoot: true };
  }, [pathname]);

  // Effect to sync URL changes to application state
  useEffect(() => {
    // 1. Handle Root or Unknown Path - Redirect based on preference
    // This fixes the "teleporting" issue where reloading reset the app to Co-Creator mode.
    if (isRoot) {
        if (workspaceMode === 'autonomous') {
            navigate('/autonomous-chat', true);
        } else {
            navigate('/projects', true);
        }
        return;
    }

    // 2. Handle Explicit Routes
    if (chatId === 'new') {
        setWorkspaceMode('autonomous');
        setActiveChat(null);
    } else if (hubView) {
        // Only switch to cocreator if explicitly in a hub view
        setWorkspaceMode('cocreator');
        setActiveChat(null);
    } else if (chatId) {
      const chatToSelect = allChats.find(c => c.id === chatId);
      if (chatToSelect && chatToSelect.id !== activeChat?.id) {
        setActiveChat(chatToSelect);
        // Infer mode from project association
        setWorkspaceMode(chatToSelect.project_id ? 'cocreator' : 'autonomous');
      }
    } else if (view === 'settings') {
      setActiveChat(null);
    }
  }, [view, hubView, chatId, isRoot, allChats, activeChat?.id, setActiveChat, setWorkspaceMode, navigate, workspaceMode]);


  const isThinking = isLoading || isCreatingChat;
  const [loadingMessage, setLoadingMessage] = useState('Bubble is ready');
  const loadingTexts = useMemo(() => [
    "Thinking...", "Analyzing request...", "Consulting memory...", 
    "Formulating plan...", "Generating code...", "Adapting to updates..."
  ], []);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isThinking) {
        let currentIndex = 0;
        setLoadingMessage(loadingTexts[currentIndex]);
        intervalId = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % loadingTexts.length;
            setLoadingMessage(loadingTexts[currentIndex]);
        }, 2500);
    } else {
        setLoadingMessage('Bubble is ready');
    }
    return () => {
        if (intervalId) window.clearInterval(intervalId);
    };
  }, [isThinking, loadingTexts]);
  
  const handleLogoutAction = isImpersonating ? stopImpersonating : signOut;

  const autonomousChats = useMemo(() => {
    return allChats.filter(c => !c.project_id);
  }, [allChats]);
  
  const chatsForSidebar = useMemo(() => {
    if (workspaceMode === 'cocreator') {
        if (activeProject) {
            return allChats.filter(c => c.project_id === activeProject.id);
        } else {
            return autonomousChats;
        }
    }
    return autonomousChats;
  }, [allChats, workspaceMode, activeProject, autonomousChats]);
  
  // Sidebar Logic
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        const sidebar = document.getElementById('left-sidebar');
        const hamburger = document.getElementById('hamburger-button');
        
        // In Co-Creator mode (or mobile), the sidebar is often an overlay or needs to be manually toggled.
        // We treat it as "transient" in Co-Creator mode or on mobile.
        const isTransient = workspaceMode === 'cocreator' || isMobile;
        
        if (isTransient && isSidebarOpen && sidebar && !sidebar.contains(e.target as Node) && !hamburger?.contains(e.target as Node)) {
            closeSidebar();
        }
    };
    
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isSidebarOpen) closeSidebar();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
    }
  }, [isSidebarOpen, workspaceMode, isMobile]);

  const handleNewCoCreatorChat = async () => {
    if (!activeProject || !user || !supabase) return;
    setIsCreatingChat(true);
    try {
        const projectChats = allChats.filter(c => c.project_id === activeProject.id);
        const newChatName = `New Chat ${projectChats.length + 1}`;
        const newChat = await createDbChat(supabase, user.id, newChatName, 'build', activeProject.id);
        const newChatWithProjectData: ChatWithProjectData = { ...newChat, projects: activeProject };
        setAllChats(prev => [newChatWithProjectData, ...prev]);
        navigate(`/p/${activeProject.id}/c/${newChat.id}`);
    } catch (error) {
        console.error(error);
        addToast('Failed to create a new chat in this project.', 'error');
    } finally {
        setIsCreatingChat(false);
    }
  };

  const handleHamburgerClick = () => {
    const isPersistentNonMobile = workspaceMode === 'autonomous' && !isMobile;
    if (isPersistentNonMobile) {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
        toggleSidebar();
    }
  };

  const handleSelectProjectFromHub = async (project: Project) => {
      try {
          const chatForProject = allChats
              .filter(c => c.project_id === project.id)
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
          
          if (chatForProject) {
              navigate(`/p/${project.id}/c/${chatForProject.id}`);
          } else {
              const newChat = await createDbChat(supabase!, user!.id, `Main Chat`, 'build', project.id);
              const newChatWithProject: ChatWithProjectData = { ...newChat, projects: project };
              setAllChats(prev => [newChatWithProject, ...prev]);
              // Directly activate the chat to make the UI transition robust
              setActiveChat(newChatWithProject);
              navigate(`/p/${project.id}/c/${newChat.id}`);
          }
      } catch (e) {
          console.error("Error selecting project:", e);
          addToast("Failed to open project.", "error");
      }
  };

  const handleCreateCoCreatorProject = async (name: string, platform: ProjectPlatform, projectType: ProjectType): Promise<void> => {
    if (!user || !supabase) return;
    setIsCreatingChat(true);
    try {
        const newProject = await createProject(supabase, user.id, name, platform, projectType);
        addToast(`Created new project: ${name}!`, "success");
        const userChats = await getAllChatsForUser(supabase, user.id);
        setAllChats(userChats);
        await handleSelectProjectFromHub(newProject);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addToast(`Failed to create project: ${errorMessage}`, "error");
        console.error("Error creating co-creator project:", error);
    } finally {
        setIsCreatingChat(false);
    }
  };

  const createProjectFromPrompt = async (prompt: string): Promise<void> => {
    if (!user || !supabase) return;
    setIsCreatingChat(true);
    try {
      const { name, description, project_type } = await generateProjectDetails(prompt, geminiApiKey!);
      const platform = project_type === 'roblox_game' ? 'Roblox Studio' : 'Web App';
      
      const newProject = await createProject(supabase, user.id, name, platform, project_type);
      newProject.description = description;
      await updateDbProject(supabase, newProject.id, { description });

      const newChat = await createDbChat(supabase, user.id, name, 'build', newProject.id);
      const newChatWithProject: ChatWithProjectData = { ...newChat, projects: newProject };

      addToast(`Created new project: ${name}!`, "success");
      setAllChats(prev => [newChatWithProject, ...prev]);
      
      // Update state and replace URL safely
      const newPath = `/p/${newProject.id}/c/${newChat.id}`;
      navigate(newPath, true);
      
      setActiveChat(newChatWithProject);
      setWorkspaceMode('cocreator');
      
      const { projectUpdate } = await handleSendMessage(prompt, null, newChatWithProject);

      if (projectUpdate && newChatWithProject.project_id) {
          await updateDbProject(supabase, newChatWithProject.project_id, projectUpdate);
      }
      return;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addToast(`Failed to create project: ${errorMessage}`, "error");
    } finally {
        setIsCreatingChat(false);
    }
  };

  const handleFirstMessage = async (prompt: string, files: File[] | null = null) => {
    if (!user || !supabase || !geminiApiKey) return;
    setIsCreatingChat(true);
    try {
      if (chatId === 'new' && workspaceMode === 'autonomous') {
        const newChat = await createDbChat(supabase, user.id, prompt, 'chat', null);
        const newChatWithProject: ChatWithProjectData = { ...newChat, projects: null };
        setAllChats(prev => [newChatWithProject, ...prev]);

        // Update URL from '/c/new' to '/c/{id}' safely without adding to history
        const newPath = `/c/${newChat.id}`;
        navigate(newPath, true);
        
        setActiveChat(newChatWithProject);
        
        await handleSendMessage(prompt, files, newChatWithProject);
      } else {
        const { intent } = await classifyUserIntent(prompt, geminiApiKey);
        if (intent === 'creative_request') {
          await createProjectFromPrompt(prompt);
        } else {
          addToast("To start a conversation, please switch to Autonomous Mode.", "info");
        }
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Could not start your new chat.";
       addToast(errorMessage, "error");
       console.error("Error in handleFirstMessage:", error);
    } finally {
       setIsCreatingChat(false);
    }
  };
  
  const handleLocalSendMessage = async (text: string, files: File[] | null = null) => {
      try {
          const { projectUpdate } = await handleSendMessage(text, files);
          if (projectUpdate && activeProject) {
               await updateDbProject(supabase!, activeProject.id, projectUpdate);
               // Don't refetch all chats here to avoid UI flickering/reset, 
               // project update is local enough or specific hooks should handle it.
          }
      } catch (e) {
          console.error("Error sending message:", e);
          addToast("Failed to send message", "error");
      }
  }
  
  const renderMainContent = () => {
    try {
        if (view === 'settings') {
            return <SettingsPage onBack={() => navigate('/projects')} />;
        }
        
        if (workspaceMode === 'cocreator') {
            if (!activeProject) {
                switch (hubView) {
                    case 'marketplace': return <MarketplacePage />;
                    case 'messages': return <MessagesPage onNavigate={navigate} />;
                    case 'discover': return <DiscoverPage />;
                    case 'projects':
                    default:
                        const projectsForHub = allChats
                            .map(c => c.projects)
                            .filter((p): p is Project => !!p)
                            .reduce((acc, current) => {
                                if (!acc.find(item => item.id === current.id)) {
                                    acc.push(current);
                                }
                                return acc;
                            }, [] as Project[]);
                        
                        return (
                            <ProjectsPage
                                profile={profile}
                                onSelectProject={handleSelectProjectFromHub}
                                projects={projectsForHub}
                                onCreateCoCreatorProject={handleCreateCoCreatorProject}
                                onCreateAutonomousProject={createProjectFromPrompt}
                            />
                        );
                }
            }
            
            return (
                <CoCreatorWorkspace
                    project={activeProject}
                    chat={activeChat}
                    geminiApiKey={geminiApiKey!}
                    messages={messages}
                    isLoadingHistory={isLoading}
                    isCreatingChat={isCreatingChat}
                    setMessages={setMessages}
                    onSendMessage={activeChat ? handleLocalSendMessage : handleFirstMessage}
                    onChatUpdate={(updates) => activeChat && handleUpdateChat(activeChat.id, updates)}
                    onActiveProjectUpdate={async (updates) => {
                        if (activeProject) {
                            try {
                                await updateDbProject(supabase!, activeProject.id, updates);
                                // Don't show toast for auto-saves to avoid spam
                                // addToast('Project updated successfully.', 'success');
                            } catch (error) {
                                const message = error instanceof Error ? error.message : "An unknown error occurred";
                                addToast(`Error updating project: ${message}`, 'error');
                                console.error("Error in onActiveProjectUpdate:", error);
                            }
                        }
                    }}
                    searchQuery={searchQuery}
                    onSearchResultsChange={setSearchResults}
                    currentSearchResultMessageIndex={currentSearchResultIndex}
                    isAdmin={!!isAdmin}
                    workspaceMode={workspaceMode}
                    projectType={activeProject.project_type === 'website' ? 'website' : 'roblox_game'}
                    loadingMessage={loadingMessage}
                />
            );
        }

        return (
            <ChatView
                key={activeChat?.id || 'autonomous-new-chat'}
                project={activeProject}
                chat={activeChat}
                geminiApiKey={geminiApiKey!}
                messages={messages}
                isLoadingHistory={isLoading}
                isCreatingChat={isCreatingChat}
                setMessages={setMessages}
                onSendMessage={activeChat ? handleLocalSendMessage : handleFirstMessage}
                onChatUpdate={(updates) => activeChat && handleUpdateChat(activeChat.id, updates)}
                onActiveProjectUpdate={null}
                searchQuery={searchQuery}
                onSearchResultsChange={setSearchResults}
                currentSearchResultMessageIndex={currentSearchResultIndex}
                isAdmin={!!isAdmin}
                workspaceMode={workspaceMode}
                loadingMessage={loadingMessage}
            />
        );
    } catch (error) {
        console.error("Render error in main content:", error);
        return <div className="p-8 text-center text-red-400">An error occurred while rendering the application content. Please refresh.</div>;
    }
  };
  
  const handleNewChatClick = () => {
    try {
        if (workspaceMode === 'cocreator' && activeProject) {
            handleNewCoCreatorChat();
        } else {
            navigate('/autonomous-chat');
        }
    } catch (e) {
        console.error("Error handling new chat click:", e);
    }
  };

  const handleSelectChatFromSidebar = (chat: ChatWithProjectData) => {
    const path = chat.project_id ? `/p/${chat.project_id}/c/${chat.id}` : `/c/${chat.id}`;
    navigate(path);
  };

  return (
    <div className="flex flex-col h-screen w-full font-sans text-text-primary bg-bg-primary">
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          id="left-sidebar"
          allChats={chatsForSidebar}
          activeChatId={activeChat?.id}
          onSelectChat={handleSelectChatFromSidebar}
          onNewChatClick={handleNewChatClick}
          onUpdateChat={handleUpdateChat}
          onDeleteChat={handleDeleteChat}
          onSettingsClick={() => navigate('/settings')}
          onGoToHub={() => navigate('/cocreator-hub')}
          onSignOut={handleLogoutAction}
          profile={profile}
          isMobileOpen={isSidebarOpen}
          onMobileClose={closeSidebar}
          workspaceMode={workspaceMode}
          isAdmin={isAdmin}
          activeProject={activeProject}
          isPersistent={workspaceMode === 'autonomous' && !isMobile}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onGoToHub={() => navigate('/cocreator-hub')}
            onAccountSettingsClick={() => navigate('/settings')}
            onProjectSettingsClick={() => { /* TODO */ }}
            onLogout={handleLogoutAction}
            activeProjectName={activeProject?.name ?? null}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            workspaceMode={workspaceMode}
            onWorkspaceModeChange={(mode) => setWorkspaceMode(mode)}
            isProjectView={!!activeProject}
            onHamburgerClick={handleHamburgerClick}
            showHamburger={isMobile || workspaceMode === 'cocreator' || (workspaceMode === 'autonomous' && isSidebarCollapsed)}
            isThinking={isThinking}
            onSwitchToAutonomous={() => navigate('/autonomous-chat')}
            onSwitchToCocreator={() => navigate('/cocreator-hub')}
            hubView={hubView as HubView}
            onHubViewChange={(newHubView) => navigate(`/${newHubView}`)}
            loadingMessage={loadingMessage}
            hamburgerId="hamburger-button"
          />
          <main className="flex-1 overflow-y-auto px-2 md:px-0">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
};
