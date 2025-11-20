import React, { useState, useEffect } from 'react';
import { PlusIcon, ExclamationTriangleIcon, SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { ProjectCard } from '../dashboard/ProjectCard';
import { Project, Profile, ProjectPlatform, ProjectType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects, deleteProject } from '../../services/databaseService';
import { NewProjectModal } from '../dashboard/NewProjectModal';
import { useToast } from '../../hooks/useToast';
import { AdminConfirmationModal } from '../admin/AdminConfirmationModal';
import { ImportWizard } from '../import/ImportWizard';
import { AutonomousNewProjectModal } from '../dashboard/AutonomousNewProjectModal';

interface ProjectsPageProps {
  profile: Profile | null;
  onSelectProject: (project: Project) => void | Promise<void>;
  projects?: Project[];
  isLoading?: boolean;
  error?: string | null;
  onDeleteProject?: (project: Project) => void;
  onCreateCoCreatorProject: (name: string, platform: ProjectPlatform, projectType: ProjectType) => Promise<void>;
  onCreateAutonomousProject: (prompt: string) => Promise<void>;
}

// UPDATED: Added EmptyState component
const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/5 border-2 border-dashed border-white/10 rounded-2xl"
    >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-start/20 to-primary-end/20 rounded-full flex items-center justify-center mb-6">
            <SparklesIcon className="w-10 h-10 text-primary-start" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
        <p className="text-gray-400 max-w-md mb-8">
            This is your creative space. Start a new project to begin building with the Co-Creator agent.
        </p>
        <button
            onClick={onCreate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
        >
            <PlusIcon className="w-5 h-5" />
            <span>Create New Project</span>
        </button>
    </motion.div>
);

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ 
  profile, 
  onSelectProject, 
  projects: providedProjects, 
  isLoading: providedIsLoading, 
  error: providedError, 
  onDeleteProject,
  onCreateCoCreatorProject,
  onCreateAutonomousProject,
}) => {
  const { supabase, user } = useAuth();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<Project[]>(providedProjects || []);
  const [isLoading, setIsLoading] = useState(providedIsLoading ?? !providedProjects);
  const [error, setError] = useState<string | null>(providedError || null);
  
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAutonomousModalOpen, setIsAutonomousModalOpen] = useState(false);

  useEffect(() => {
    if (providedProjects) {
        setProjects(providedProjects.filter(p => p.name !== 'Autonomous Chats'));
        setIsLoading(providedIsLoading ?? false);
        setError(providedError || null);
        return;
    }
      
    const fetchProjects = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const userProjects = await getProjects(supabase, user.id);
        setProjects(userProjects.filter(p => p.name !== 'Autonomous Chats'));
      } catch (err) {
        setError("Could not load projects. Please check your network connection.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [user, supabase, providedProjects, providedIsLoading, providedError]);

  const handleConfirmDelete = async () => {
    if (!projectToDelete || !supabase) return;
    try {
        await deleteProject(supabase, projectToDelete.id);
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        addToast(`Project "${projectToDelete.name}" was deleted.`, 'info');
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        addToast(`Failed to delete project: ${message}`, 'error');
    } finally {
        setProjectToDelete(null);
    }
  };

  const handleSwitchToAutonomous = () => {
    setIsNewProjectModalOpen(false);
    setIsAutonomousModalOpen(true);
  };

  const deleteHandler = onDeleteProject || setProjectToDelete;
  const projectsToRender = providedProjects ? projects : projects.filter(p => p.name !== 'Autonomous Chats');

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-8">
              <ExclamationTriangleIcon className="w-12 h-12 text-error mb-4" />
              <h2 className="text-xl font-semibold text-white">Could Not Load Projects</h2>
              <p className="text-gray-400 max-w-md">{error}</p>
          </div>
      );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="flex flex-col gap-4 text-center md:flex-row md:text-left md:justify-between md:items-center mb-8">
          <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">My Projects</h1>
              <p className="text-gray-400 mt-1">Manage all your projects created with Bubble AI.</p>
          </div>
           <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => setIsImportWizardOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Import Project</span>
                </button>
                 <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-start to-primary-end rounded-lg shadow-lg hover:scale-105 transition-transform"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>New Project</span>
                </button>
            </div>
        </div>

          {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-bg-secondary rounded-xl p-5 border border-bg-tertiary animate-pulse">
                          <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 rounded-lg bg-bg-tertiary"></div>
                               <div className="w-20 h-6 rounded-full bg-bg-tertiary"></div>
                          </div>
                          <div className="h-6 w-3/4 bg-bg-tertiary rounded mb-2"></div>
                          <div className="h-4 w-full bg-bg-tertiary rounded"></div>
                          <div className="h-4 w-1/2 bg-bg-tertiary rounded mt-1"></div>
                          <div className="border-t border-bg-tertiary mt-4 pt-4">
                               <div className="h-4 w-1/3 bg-bg-tertiary rounded"></div>
                          </div>
                      </div>
                   ))}
               </div>
          ) : projectsToRender.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projectsToRender.map(project => (
                      <ProjectCard key={project.id} project={project} onSelect={onSelectProject} onDelete={deleteHandler} />
                  ))}
              </div>
          ) : (
              // UPDATED: Show Empty State when no projects exist
              <EmptyState onCreate={() => setIsNewProjectModalOpen(true)} />
          )}
      </div>
      <AdminConfirmationModal
        isOpen={!!projectToDelete && !onDeleteProject}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        config={projectToDelete ? {
            title: `Delete "${projectToDelete.name}"?`,
            message: "This action is permanent and cannot be undone. All associated chats and messages for this project will also be deleted.",
            confirmText: "Yes, delete project",
            confirmClassName: 'bg-red-600 text-white hover:bg-red-700'
        } : null}
      />
       <ImportWizard
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
          userId={user?.id || ''}
          onComplete={(project) => {
              console.log('Import complete!', project);
              addToast('Project imported successfully!', 'success');
              // Here you would typically refresh the project list
          }}
      />
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={onCreateCoCreatorProject}
        onSwitchToAutonomous={handleSwitchToAutonomous}
        isAdmin={profile?.role === 'admin'}
      />
       <AutonomousNewProjectModal
        isOpen={isAutonomousModalOpen}
        onClose={() => setIsAutonomousModalOpen(false)}
        onCreate={onCreateAutonomousProject}
      />
    </>
  );
};