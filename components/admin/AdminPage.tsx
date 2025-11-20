import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LeftSidebar } from '../layout/LeftSidebar';
import { ChatView } from '../chat/ChatView';
import { ProjectsPage } from '../pages/ProjectsPage';
import { AdminTopBar } from './AdminTopBar';
import { Project, Message, Chat, WorkspaceMode, ProjectPlatform, ProjectType, ChatWithProjectData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getAllProjects, 
    createProject, 
    updateProject as updateDbProject,
    createChat as createDbChat,
    // FIX: Imported missing deleteProject function.
    deleteProject,
} from '../../services/databaseService';
import { validateApiKey, classifyUserIntent, generateProjectDetails } from '../../services/geminiService';
import { motion } from 'framer-motion';
import { KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AdminUsersPage } from './AdminUsersPage';
import { ProjectSettingsModal } from '../../scripts/ProjectSettingsModal';
import { AdminSettingsPage } from './AdminSettingsPage';
import { CoCreatorWorkspace } from '../cocreator/CoCreatorWorkspace';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../hooks/useToast';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { SettingsPage } from '../pages/SettingsPage';
import { MarketplacePage } from '../community/MarketplacePage';
import { MessagesPage } from '../community/MessagesPage';
import { DiscoverPage } from '../community/DiscoverPage';
import { useChat } from '../../hooks/useChat';
import { useWindowSize } from '../../hooks/useWindowSize';
import AuroraCanvas from '../ui/AuroraCanvas';

const AdminApiKeySetup: React.FC = () => {
    const { setGeminiApiKey } = useAuth();
    const [adminKeyInput, setAdminKeyInput] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleAdminKeySave = async () => {
        if (!adminKeyInput.trim() || isValidating) return;
        setIsValidating(true);
        setValidationError(null);
        const { success, message } = await validateApiKey(adminKeyInput);
        if (success) {
            setGeminiApiKey(adminKeyInput);
        } else {
            setValidationError(message || 'Invalid API Key. Please check the key and try again.');
        }
        setIsValidating(false);
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAdminKeyInput(e.target.value);
        if (validationError) setValidationError(null);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-bg-primary text-white">
            <motion.div
                // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                {...{
                  initial: { scale: 0.95, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { duration: 0.3 },
                }}
                className="w-full max-w-md p-8 bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-center"
            >
                <KeyIcon className="w-10 h-10 mx-auto text-primary-start mb-4" />
                <h1 className="text-2xl font-bold mb-2">Admin API Key Setup</h1>
                <p className="text-gray-400 mb-6">A Gemini API Key is required to view project data. Please provide one to continue.</p>

                <div className="space-y-2 text-left">
                    <input
                        type="password"
                        value={adminKeyInput}
                        onChange={handleKeyChange}
                        placeholder="Enter your Gemini API Key"
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationError ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-primary-start'}`}
                    />
                    <button
                        onClick={handleAdminKeySave}
                        disabled={!adminKeyInput.trim() || isValidating}
                        className="w-full px-4 py-3 bg-primary-start text-white rounded-lg font-semibold hover:bg-primary-start/80 transition-colors disabled:opacity-50 flex items-center justify-center h-[51px]"
                    >
                        {isValidating ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : 'Save & Continue'}
                    </button>
                </div>
                {validationError && (
                    <motion.p 
// FIX: framer-motion props wrapped in a spread object to bypass type errors.
{...{initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }}} className="text-red-400 text-sm mt-3 text-left flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {validationError}
                    </motion.p>
                )}
                 <p className="text-center mt-4"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-primary-start/80 hover:text-primary-start underline">Where can I get a Gemini API key?</a></p>
            </motion.div>
        </div>
    );
};

type AdminView = 'projects' | 'users' | 'settings' | 'personal-settings' | 'credit-system' | 'marketplace' | 'messages' | 'discover';

export const AdminPage: React.FC = () => {
  const { geminiApiKey, user, supabase, profile, isAdmin, signOut } = useAuth();
  const { addToast } = useToast();
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;
  
  // FIX: Added missing state for search functionality.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(-1);

  const [view, setView] = useState<AdminView>('projects');
  const [workspaceMode, setWorkspaceMode] = useLocalStorage<WorkspaceMode>('adminWorkspaceMode', 'autonomous');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('adminSidebarCollapsed', false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data for cocreator mode (all projects in the system)
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [activeCocreatorProject, setActiveCocreatorProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isProjectSettingsModalOpen, setProjectSettingsModalOpen] = useState(false);

  const {
      allChats,
      setAllChats,
      activeChat,
      setActiveChat,
      messages,
      setMessages,
      isLoading: isLoadingChat,
      isCreatingChat,
      setIsCreatingChat,
      activeProject: activeChatProject,
      handleUpdateChat,
      handleSelectChat,
      handleDeleteChat,
      handleSendMessage,
  } = useChat({ user, geminiApiKey, workspaceMode, adminProject: activeCocreatorProject });
  
  const activeProject = useMemo(() => activeCocreatorProject || activeChatProject || null, [activeCocreatorProject, activeChatProject]);

  const isLoading = isLoadingProjects || isLoadingChat;
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

  // Always start in autonomous mode on app load for admin.
  useEffect(() => {
    setWorkspaceMode('autonomous');
  }, []);

  const autonomousChats = useMemo(() => {
    return allChats.filter(c => !c.project_id);
  }, [allChats]);
  
  const chatsForSidebar = useMemo(() => {
    if (workspaceMode === 'cocreator') {
        if (activeCocreatorProject) {
            // Project view: show only project chats
            return allChats.filter(c => c.project_id === activeCocreatorProject.id);
        } else {
            // Hub view: show admin's autonomous chats
            return autonomousChats;
        }
    }
    // Autonomous view: show admin's autonomous chats
    return autonomousChats;
  }, [allChats, workspaceMode, activeCocreatorProject, autonomousChats]);

  // Fetch all projects for the Co-Creator hub view
  const fetchAdminProjects = useCallback(async () => {
      if (!supabase) return;
      setIsLoadingProjects(true);
      setProjectsError(null);
      try {
          const projectsData = await getAllProjects(supabase);
          setAllProjects(projectsData);
      } catch (error) {
          setProjectsError("An error occurred while fetching projects.");
      } finally {
          setIsLoadingProjects(false);
      }
  }, [supabase]);

  useEffect(() => {
    if (supabase && geminiApiKey) {
        fetchAdminProjects();
        const channel = supabase.channel('admin-projects-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchAdminProjects).subscribe();
        return () => { supabase.removeChannel(channel); };
    }
  }, [supabase, geminiApiKey, fetchAdminProjects]);
  
  const handleGoToHub = () => {
    setWorkspaceMode('cocreator');
    setActiveChat(null);
    setActiveCocreatorProject(null);
    setView('projects');
    setIsMobileSidebarOpen(false);
  };
  
  const handleGoToSettings = () => {
    setView('personal-settings');
    setIsMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveChat(null);
    setActiveCocreatorProject(null);
    setWorkspaceMode('autonomous');
    setView('projects'); // Go back to a neutral view
    setIsMobileSidebarOpen(false);
  };
  
  const handleNewCoCreatorChat = async () => {
    if (!activeCocreatorProject || !user || !supabase) return;
    setIsCreatingChat(true);
    try {
        const projectChats = allChats.filter(c => c.project_id === activeCocreatorProject.id);
        const newChatName = `New Chat ${projectChats.length + 1}`;
        const newChat = await createDbChat(supabase, user.id, newChatName, 'build', activeCocreatorProject.id);
        const newChatWithProjectData: ChatWithProjectData = { ...newChat, projects: activeCocreatorProject };
        setAllChats(prev => [newChatWithProjectData, ...prev]);
        setActiveChat(newChatWithProjectData);
        setIsMobileSidebarOpen(false);
    } catch (error) {
        addToast('Failed to create a new chat in this project.', 'error');
    } finally {
        setIsCreatingChat(false);
    }
  };

  const handleSelectProjectFromHub = (project: Project) => {
    if (!supabase) return;
    setActiveCocreatorProject(project);
    setWorkspaceMode('cocreator');
    setView('projects');
  };

  const handleCreateCoCreatorProject = async (name: string, platform: ProjectPlatform, projectType: ProjectType): Promise<void> => {
    if (!user || !supabase) return;
    setIsCreatingChat(true);
    try {
        const newProject = await createProject(supabase, user.id, name, platform, projectType);
        addToast(`Created new admin project: ${name}!`, "success");
        fetchAdminProjects(); // Refetch all projects
        handleSelectProjectFromHub(newProject);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addToast(`Failed to create project: ${errorMessage}`, "error");
        throw error;
    } finally {
        setIsCreatingChat(false);
    }
  };

  const createProjectFromPrompt = async (prompt: string): Promise<void> => {
    if (!user || !supabase || !geminiApiKey) return;
    setIsCreatingChat(true);
    try {
      const { name, description, project_type } = await generateProjectDetails(prompt, geminiApiKey);
      const platform = project_type === 'roblox_game' ? 'Roblox Studio' : 'Web App';
      const newProject = await createProject(supabase, user.id, name, platform, project_type);
      newProject.description = description;
      await updateDbProject(supabase, newProject.id, { description });

      const newChat = await createDbChat(supabase, user.id, `Main Chat`, 'build', newProject.id);
      const newChatWithProject: ChatWithProjectData = { ...newChat, projects: newProject };
      
      addToast(`Created new admin project: ${name}!`, "success");
      setAllChats(prev => [newChatWithProject, ...prev]);
      setActiveChat(newChatWithProject);
      setWorkspaceMode('cocreator'); // Switch to cocreator
      setActiveCocreatorProject(newProject);
      
      // FIX: Correctly pass arguments to handleSendMessage. The second argument is for a file (null here), and the third is for the chat object.
      await handleSendMessage(prompt, null, newChatWithProject);

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
      if (workspaceMode === 'autonomous') {
        const newChat = await createDbChat(supabase, user.id, prompt, 'chat', null);
        const newChatWithProject: ChatWithProjectData = { ...newChat, projects: null };
        setAllChats(prev => [newChatWithProject, ...prev]);
        setActiveChat(newChatWithProject);
        await handleSendMessage(prompt, files, newChatWithProject);
      } else { // Co-Creator mode for admin
          addToast("To start a new project, please create one from the hub.", "info");
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "Could not start your new chat.";
       addToast(errorMessage, "error");
    } finally {
       setIsCreatingChat(false);
    }
  };
  
  const handleLocalSendMessage = async (text: string, files: File[] | null = null) => {
      const { projectUpdate } = await handleSendMessage(text, files);
      if (projectUpdate && activeProject) {
           await handleUpdateProjectForAdmin(activeProject.id, projectUpdate);
      }
  }

  const handleUpdateProjectForAdmin = async (projectId: string, updates: Partial<Project>) => {
    if (!supabase) return;
    try {
        const updatedProject = await updateDbProject(supabase, projectId, updates);
        setAllProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        if (activeCocreatorProject?.id === projectId) {
            setActiveCocreatorProject(prev => prev ? {...prev, ...updatedProject} : null);
        }
        setAllChats(prev => prev.map(c => c.project_id === projectId && c.projects ? { ...c, projects: { ...c.projects, ...updatedProject }} : c));
        addToast('Project updated successfully.', 'success');
    } catch (error) { 
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        addToast(`Error updating project: ${message}`, 'error');
    }
  };
  
  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete || !supabase) return;
    try {
        await deleteProject(supabase, projectToDelete.id);
        setAllProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        if (activeCocreatorProject?.id === projectToDelete.id) {
            setActiveCocreatorProject(null);
        }
        addToast(`Project "${projectToDelete.name}" was deleted.`, 'info');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        addToast(`Failed to delete project: ${message}`, 'error');
    } finally {
        setProjectToDelete(null);
    }
  };

  const handleWorkspaceModeChange = (mode: WorkspaceMode) => {
    setView('projects');
    setActiveCocreatorProject(null);
    setActiveChat(null);
    setWorkspaceMode(mode);
  };
  
  const handleNewChatClick = () => {
    if (workspaceMode === 'cocreator' && activeCocreatorProject) {
        handleNewCoCreatorChat();
    } else {
        handleNewChat();
    }
  };
  
  if (!geminiApiKey) {
    return <AdminApiKeySetup />;
  }

  const renderContent = () => {
    if (workspaceMode === 'cocreator') {
        switch (view) {
            case 'users': return <AdminUsersPage />;
            case 'settings': return <AdminSettingsPage />;
            case 'personal-settings': return <SettingsPage onBack={() => setView('projects')} />;
            case 'marketplace': return <MarketplacePage />;
            case 'messages': return <MessagesPage />;
            case 'discover': return <DiscoverPage />;
            case 'projects':
            default:
                if (activeCocreatorProject) {
                    return <CoCreatorWorkspace 
                        project={activeCocreatorProject}
                        chat={activeChat}
                        geminiApiKey={geminiApiKey}
                        messages={messages}
                        isLoadingHistory={isLoading}
                        isCreatingChat={isCreatingChat}
                        setMessages={setMessages}
                        onSendMessage={activeChat ? handleLocalSendMessage : handleFirstMessage}
                        onChatUpdate={(updates) => activeChat && handleUpdateChat(activeChat.id, updates)}
                        onActiveProjectUpdate={(updates) => activeCocreatorProject && handleUpdateProjectForAdmin(activeCocreatorProject.id, updates)}
                        searchQuery={searchQuery}
                        onSearchResultsChange={setSearchResults}
                        currentSearchResultMessageIndex={currentSearchResultIndex}
                        isAdmin={!!isAdmin}
                        workspaceMode={workspaceMode}
                        projectType={activeCocreatorProject.project_type === 'website' ? 'website' : 'roblox_game'}
                        loadingMessage={loadingMessage}
                    />;
                }
                const projectsForHub = allProjects;
                return <ProjectsPage 
                    profile={profile} 
                    onSelectProject={handleSelectProjectFromHub} 
                    projects={projectsForHub} 
                    isLoading={isLoadingProjects} 
                    error={projectsError} 
                    onDeleteProject={setProjectToDelete}
                    onCreateCoCreatorProject={handleCreateCoCreatorProject}
                    onCreateAutonomousProject={createProjectFromPrompt}
                />;
        }
    }
    
    // Autonomous mode
    return (
        <ChatView
            key={activeChat?.id || 'new-chat-admin'}
            project={activeProject}
            chat={activeChat}
            geminiApiKey={geminiApiKey}
            messages={messages}
            isLoadingHistory={isLoading}
            isCreatingChat={isCreatingChat}
            setMessages={setMessages}
            onSendMessage={activeChat ? handleLocalSendMessage : handleFirstMessage}
            onChatUpdate={(updates) => activeChat && handleUpdateChat(activeChat.id, updates)}
            onActiveProjectUpdate={(updates) => activeProject && handleUpdateProjectForAdmin(activeProject.id, updates)}
            searchQuery={searchQuery}
            onSearchResultsChange={setSearchResults}
            currentSearchResultMessageIndex={currentSearchResultIndex}
            isAdmin={!!isAdmin}
            workspaceMode={workspaceMode}
            loadingMessage={loadingMessage}
        />
    );
  };

  const handleHamburgerClick = () => {
    const isPersistentNonMobile = workspaceMode === 'autonomous' && !isMobile;
    if (isPersistentNonMobile) {
        setIsSidebarCollapsed(false);
    } else {
        setIsMobileSidebarOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-bg-primary">
        <LeftSidebar
          allChats={chatsForSidebar}
          activeChatId={activeChat?.id}
          onSelectChat={handleSelectChat}
          onNewChatClick={handleNewChatClick}
          onUpdateChat={handleUpdateChat}
          onDeleteChat={handleDeleteChat}
          onSettingsClick={handleGoToSettings}
          onGoToHub={handleGoToHub}
          onSignOut={signOut}
          profile={profile}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          workspaceMode={workspaceMode}
          isAdmin={isAdmin}
          activeProject={activeCocreatorProject}
          isPersistent={workspaceMode === 'autonomous' && !isMobile}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar 
            currentView={view} 
            setView={(newView) => {
                setActiveChat(null);
                setActiveCocreatorProject(null);
                setView(newView);
            }}
            workspaceMode={workspaceMode}
            onWorkspaceModeChange={handleWorkspaceModeChange}
            onHamburgerClick={handleHamburgerClick}
            showHamburger={isMobile || workspaceMode === 'cocreator' || (workspaceMode === 'autonomous' && isSidebarCollapsed)}
            isThinking={isThinking}
            onSwitchToAutonomous={handleNewChat}
            onSwitchToCocreator={handleGoToHub}
            onAccountSettingsClick={handleGoToSettings}
            onSignOut={signOut}
            loadingMessage={loadingMessage}
        />
        <main className="flex-1 overflow-y-auto px-2 md:px-0">
          {renderContent()}
        </main>
      </div>
      <ProjectSettingsModal
        isOpen={isProjectSettingsModalOpen}
        onClose={() => setProjectSettingsModalOpen(false)}
        project={activeCocreatorProject}
        onSave={handleUpdateProjectForAdmin}
      />
      <AdminConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
        config={projectToDelete ? {
            title: `Delete "${projectToDelete.name}"?`,
            message: "This action is permanent and cannot be undone. All associated chats and messages for this project will also be deleted.",
            confirmText: "Yes, delete project",
            confirmClassName: 'bg-red-600 text-white hover:bg-red-700'
        } : null}
      />
    </div>
  );
};