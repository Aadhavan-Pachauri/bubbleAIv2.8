import React, { useState, useMemo } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Project } from '../../../types';

interface TreeNode {
    name: string;
    type: 'folder' | 'file';
    path: string;
    children?: TreeNode[];
}

const buildTreeFromPaths = (files: Project['files']): TreeNode[] => {
    if (!files || Object.keys(files).length === 0) {
        return [];
    }

    const root: TreeNode = { name: 'root', type: 'folder', path: '', children: [] };

    for (const path in files) {
        const parts = path.split('/');
        let currentNode = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            
            let childNode = currentNode.children?.find(child => child.name === part);

            if (!childNode) {
                childNode = {
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: parts.slice(0, i + 1).join('/'),
                    children: isFile ? undefined : [],
                };
                currentNode.children?.push(childNode);
            }
            
            if (childNode.type === 'folder') {
                currentNode = childNode;
            }
        }
    }
    
    // Sort so folders come before files
    const sortNodes = (nodes: TreeNode[] | undefined) => {
        if (!nodes) return;
        nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
        nodes.forEach(node => sortNodes(node.children));
    }
    
    sortNodes(root.children);
    return root.children || [];
};


interface FileTreeProps {
    nodes: TreeNode[];
    onFileSelect: (path: string) => void;
    level?: number;
}

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileSelect, level = 0 }) => {
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = (folderPath: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
    };

    return (
        <div>
            {nodes.map(node => {
                const isExpanded = expandedFolders[node.path] || false;
                
                if (node.type === 'folder') {
                    return (
                        <div key={node.path}>
                            <div 
                                className="flex items-center gap-1 py-1 px-2 rounded-md hover:bg-white/5 cursor-pointer"
                                style={{ paddingLeft: `${level * 16}px` }}
                                onClick={() => toggleFolder(node.path)}
                            >
                                <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                <FolderIcon className="w-5 h-5 text-gray-400 flex-shrink-0" /> 
                                <span className="text-sm text-gray-300 truncate">{node.name}</span>
                            </div>
                            {isExpanded && node.children && node.children.length > 0 && (
                                <FileTree nodes={node.children} onFileSelect={onFileSelect} level={level + 1} />
                            )}
                        </div>
                    )
                }
                
                return (
                     <div 
                        key={node.path} 
                        style={{ paddingLeft: `${level * 16}px` }}
                        onClick={() => onFileSelect(node.path)}
                    >
                        <div className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-white/5 cursor-pointer ml-3">
                            <DocumentIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-300 truncate">{node.name}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

interface FileExplorerProps {
    onFileSelect: (path: string) => void;
    project: Project;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, project }) => {
  const fileTree = useMemo(() => buildTreeFromPaths(project.files), [project.files]);
  
  return (
    <div className="bg-bg-secondary h-full flex flex-col p-2">
      <h2 className="text-lg font-semibold text-white p-2 mb-2">File Explorer</h2>
      <div className="flex-1 overflow-y-auto">
        {fileTree.length > 0 ? (
            <FileTree nodes={fileTree} onFileSelect={onFileSelect} />
        ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
                <p>This project is empty.</p>
                <p>Use the Build agent to create new files.</p>
            </div>
        )}
      </div>
    </div>
  );
};
