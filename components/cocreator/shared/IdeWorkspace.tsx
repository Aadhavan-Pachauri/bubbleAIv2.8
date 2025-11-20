
import React, { useState, useEffect } from 'react';
import Split from 'react-split-grid';
import Editor from '@monaco-editor/react';
import { FileExplorer } from './FileExplorer';
// FIX: Moved ChatWithProjectData import from databaseService to types.
import { Message, Project, Chat, WorkspaceMode, ChatWithProjectData } from '../../../types';

export interface IdeWorkspaceProps {
  project: Project;
  chat: ChatWithProjectData | null;
  geminiApiKey: string;
  messages: Message[];
  isLoadingHistory: boolean;
  isCreatingChat: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSendMessage: (text: string, files?: File[] | null) => void;
  onChatUpdate: ((updates: Partial<Chat>) => void) | null;
  onActiveProjectUpdate: ((updates: Partial<Project>) => Promise<void>) | null;
  searchQuery: string;
  onSearchResultsChange: (indices: number[]) => void;
  currentSearchResultMessageIndex: number;
  isAdmin: boolean;
  workspaceMode: WorkspaceMode;
  projectType: 'website' | 'roblox_game';
  loadingMessage: string;
}

export const IdeWorkspace: React.FC<IdeWorkspaceProps> = (props) => {
    const { projectType, project, onActiveProjectUpdate } = props;
    
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');

    // When the project files change, automatically select the new file if none is selected.
    useEffect(() => {
        const filePaths = Object.keys(project.files || {});
        if (!selectedFile && filePaths.length > 0) {
            setSelectedFile(filePaths[filePaths.length - 1]); // Select the last added file
        } else if (selectedFile && !filePaths.includes(selectedFile)) {
            setSelectedFile(null); // Deselect if the file was deleted
        }
    }, [project.files, selectedFile]);

    // Update editor content when selected file or its content changes
    useEffect(() => {
        const content = selectedFile
            ? project.files?.[selectedFile]?.content ?? `// Error: Could not find content for ${selectedFile}`
            : `// Select a file to view its code`;
        setEditorContent(content);
    }, [selectedFile, project.files]);

    const handleFileSelect = (filePath: string) => {
        setSelectedFile(filePath);
    };

    // This function will be called by the editor when the user stops typing.
    const handleEditorChange = (value: string | undefined) => {
        if (selectedFile && value !== undefined && onActiveProjectUpdate) {
            const updatedFiles = {
                ...(project.files || {}),
                [selectedFile]: { content: value }
            };
            // This updates the project state in the Layout component.
            onActiveProjectUpdate({ files: updatedFiles });
        }
    };

    return (
        <div className="h-full w-full bg-bg-primary text-white">
            <Split
                gridTemplateColumns="250px 8px 1fr"
                minSize={200}
                cursor="col-resize"
            >
                {/* FIX: The 'render' prop is not valid for 'react-split-grid'. The render function should be passed as a child. */}
                {(split: any) => (
                    <div className="grid h-full" {...split.getGridProps()}>
                        <div className="h-full bg-bg-secondary overflow-hidden">
                           <FileExplorer onFileSelect={handleFileSelect} project={project} />
                        </div>

                        <div className="h-full bg-bg-tertiary cursor-col-resize" {...split.getGutterProps('column', 1)} />
                        
                        <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
                            <Editor
                                height="100%"
                                path={selectedFile || 'default'} // Key changes when file changes to force re-render
                                language={projectType === 'website' ? 'html' : 'lua'}
                                theme="vs-dark"
                                value={editorContent}
                                onChange={handleEditorChange}
                                options={{ 
                                    minimap: { enabled: false }, 
                                    fontSize: 14, 
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    </div>
                )}
            </Split>
        </div>
    );
};
