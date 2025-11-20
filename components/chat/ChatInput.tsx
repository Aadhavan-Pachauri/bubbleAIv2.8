
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ChevronDownIcon, SparklesIcon, PlusIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Chat, ChatMode, WorkspaceMode, Project, ChatWithProjectData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChatBubbleLeftEllipsisIcon, 
    CpuChipIcon, 
    PuzzlePieceIcon, 
    AcademicCapIcon, 
    PaperClipIcon, 
    PhotoIcon, 
    LightBulbIcon, 
    BeakerIcon, 
    BookOpenIcon, 
    EllipsisHorizontalIcon, 
    GlobeAltIcon, 
    PaintBrushIcon,
    ComputerDesktopIcon,
    FilmIcon,
    ChartPieIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { VoiceControls } from './VoiceControls';

const CubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9.75v9.75" />
    </svg>
);

type ActionId = 'default' | 'files' | 'image' | 'think' | 'research' | 'study' | 'search' | 'canvas' | 'roblox' | 'website' | 'video' | 'story' | 'presentation' | 'document' | 'deep_research' | 'quick_research';


interface ChatInputProps {
  onSendMessage: (text: string, files?: File[] | null) => void;
  isLoading: boolean;
  chat: ChatWithProjectData | null; // Can be null for new chat
  onChatUpdate: ((updates: Partial<Chat>) => void) | null;
  isAdmin: boolean;
  workspaceMode: WorkspaceMode;
  isInitialView: boolean;
  loadingMessage: string;
  project: Project | null;
  selectedAction: string;
  onActionSelect: (action: string) => void;
}

const actionMap: Record<string, { name: string, icon: React.ReactElement, placeholder: string }> = {
    default: { name: 'Ask anything', icon: <PlusIcon />, placeholder: 'Ask anything, or attach a file...' },
    files: { name: 'Files', icon: <PaperClipIcon />, placeholder: 'Describe the file(s) or add a prompt' },
    image: { name: 'Image', icon: <PhotoIcon />, placeholder: 'Describe an image to generate' },
    think: { name: 'Think', icon: <LightBulbIcon />, placeholder: 'Ask anything' },
    study: { name: 'Study', icon: <BookOpenIcon />, placeholder: 'Learn something new' },
    // Research actions
    research: { name: 'Research', icon: <BeakerIcon />, placeholder: 'What should we research?' },
    deep_research: { name: 'Deep Research', icon: <BeakerIcon />, placeholder: 'Get a detailed report on a topic...' },
    quick_research: { name: 'Quick Search', icon: <MagnifyingGlassIcon />, placeholder: 'Get a quick summary on a topic...' },
    search: { name: 'Web Search', icon: <GlobeAltIcon />, placeholder: 'Search the web for real-time information' },
    // Project type actions
    canvas: { name: 'Canvas', icon: <PaintBrushIcon />, placeholder: 'Describe your canvas idea' },
    roblox: { name: 'Roblox Project', icon: <CubeIcon />, placeholder: 'Describe the Roblox game you want to create...' },
    website: { name: 'Website Project', icon: <ComputerDesktopIcon />, placeholder: 'Describe the website you want to build...' },
    video: { name: 'Video Project', icon: <FilmIcon />, placeholder: 'Describe the video you want to make...' },
    story: { name: 'Story Project', icon: <BookOpenIcon />, placeholder: 'Describe the story you want to write...' },
    presentation: { name: 'Presentation', icon: <ChartPieIcon />, placeholder: 'Describe the presentation you want to create...' },
    document: { name: 'Document', icon: <DocumentTextIcon />, placeholder: 'Describe the document you need help with...' },
};

const imageStyles = [
    { name: 'Cyberpunk', img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=200' },
    { name: 'Anime', img: 'https://images.unsplash.com/photo-1607338148906-4444b3c15432?q=80&w=200' },
    { name: 'Dramatic Headshot', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200' },
    { name: 'Coloring Book', img: 'https://images.unsplash.com/photo-1588275582395-57d45479261a?q=80&w=200' },
    { name: 'Photo Shoot', img: 'https://images.unsplash.com/photo-1520423465853-27bde2bf3133?q=80&w=200' },
    { name: 'Retro Cartoon', img: 'https://images.unsplash.com/photo-1634636979027-18a034d687a8?q=80&w=200' },
];


// FIX: Replaced React.cloneElement with icon.type to correctly apply classNames and fix typing errors.
const MenuItem: React.FC<{ icon: React.ReactElement, text: string, onClick: () => void, hasChevron?: boolean, isSelected?: boolean }> = ({ icon, text, onClick, hasChevron = false, isSelected = false }) => {
    const Icon = icon.type;
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10 hover:text-white transition-colors text-left">
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{text}</span>
            {hasChevron && <ChevronRightIcon className="w-4 h-4 text-gray-400" />}
            {isSelected && <span className="text-primary-start">✓</span>}
        </button>
    );
};

const FilePreview: React.FC<{ file: File; onRemove: () => void; }> = ({ file, onRemove }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative flex-shrink-0 flex items-center gap-2 p-1.5 pl-2 bg-zinc-700/50 rounded-lg text-sm text-zinc-200 h-12"
        >
            {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-9 h-9 rounded-md object-cover" />
            ) : (
                <div className="w-9 h-9 flex items-center justify-center bg-zinc-600 rounded-md flex-shrink-0"><PaperClipIcon className="w-5 h-5"/></div>
            )}
            <span className="truncate max-w-[120px] text-xs font-mono" title={file.name}>{file.name}</span>
            <button type="button" onClick={onRemove} className="ml-1 flex-shrink-0 p-1 bg-black/20 rounded-full text-zinc-400 hover:bg-zinc-600 hover:text-white transition-colors"><XMarkIcon className="w-4 h-4"/></button>
        </motion.div>
    );
};


export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, chat, onChatUpdate, isAdmin, workspaceMode, isInitialView, loadingMessage, project, selectedAction, onActionSelect }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [isStylesMenuOpen, setIsStylesMenuOpen] = useState(false);
  const stylesMenuRef = useRef<HTMLDivElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // FIX: Added state to control sub-menus
  const [isResearchSubMenuOpen, setIsResearchSubMenuOpen] = useState(false);
  const [isMoreSubMenuOpen, setIsMoreSubMenuOpen] = useState(false);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
    // Reset the input value so the same file can be selected again
    if (event.target) event.target.value = '';
  };
  
  const handleRemoveFile = (fileToRemove: File) => {
    setAttachedFiles(prev => prev.filter(f => f !== fileToRemove));
  };
  
  const handleActionSelect = (action: string) => {
    if (action === 'files') {
      fileInputRef.current?.click();
      setIsActionsMenuOpen(false);
      return;
    }
    onActionSelect(action === selectedAction ? 'default' : action);
    setIsActionsMenuOpen(false);
  };
  
  const currentActionDetails = attachedFiles.length > 0 ? actionMap['files'] : actionMap[selectedAction] || actionMap.default;
  const ActionIcon = currentActionDetails.icon.type;

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(adjustTextareaHeight, [text]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) setIsActionsMenuOpen(false);
        if (stylesMenuRef.current && !stylesMenuRef.current.contains(event.target as Node)) setIsStylesMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || attachedFiles.length > 0) && !isLoading) {
      let promptText = text;
      if (selectedAction === 'search' || selectedAction === 'quick_research') {
          promptText = `[SEARCH] ${text}`;
      } else if (selectedAction === 'deep_research') {
          promptText = `[DEEP_RESEARCH] ${text}`;
      }
      onSendMessage(promptText, attachedFiles);
      setText('');
      setAttachedFiles([]);
      onActionSelect('default');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  };
  
  const formClasses = `bg-zinc-900/80 backdrop-blur-md border border-zinc-700/80 rounded-5xl shadow-2xl flex flex-col overflow-hidden relative`;

  return (
    <div className="relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple style={{ display: 'none' }} />
        {/* Quick Actions Dropdown */}
        <AnimatePresence>
            {isActionsMenuOpen && (
                <motion.div
                    ref={actionsMenuRef}
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: 10, scale: 0.95 },
                      animate: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, y: 10, scale: 0.95 },
                      transition: { duration: 0.15, ease: 'easeOut' },
                    }}
                    className="absolute bottom-full left-2 mb-2 w-64 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl z-20"
                >
                    <div className="p-1.5">
                        <MenuItem icon={<PaperClipIcon />} text="Add photos & files" onClick={() => handleActionSelect('files')} />
                         <div className="border-t border-zinc-700/50 my-1"></div>
                        <MenuItem icon={<PhotoIcon />} text="Create image" onClick={() => handleActionSelect('image')} />
                        <MenuItem icon={<LightBulbIcon />} text="Thinking" onClick={() => handleActionSelect('think')} />
                        <MenuItem icon={<BookOpenIcon />} text="Study and learn" onClick={() => handleActionSelect('study')} />
                         <div className="border-t border-zinc-700/50 my-1"></div>
                        
                        {/* Research Sub-menu */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setIsResearchSubMenuOpen(true)}
                            onMouseLeave={() => setIsResearchSubMenuOpen(false)}
                        >
                            <MenuItem icon={<BeakerIcon />} text="Research" onClick={() => setIsResearchSubMenuOpen(prev => !prev)} hasChevron />
                            <AnimatePresence>
                            {isResearchSubMenuOpen && (
                                <motion.div
                                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                                    {...{
                                      initial: { opacity: 0, x: -10 },
                                      animate: { opacity: 1, x: 0 },
                                      exit: { opacity: 0, x: -10 },
                                      transition: { duration: 0.15 },
                                    }}
                                    className="absolute left-full -top-1 ml-2 w-48 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-30"
                                >
                                    <MenuItem icon={<MagnifyingGlassIcon />} text="Quick Search" onClick={() => handleActionSelect('quick_research')} isSelected={selectedAction === 'quick_research'} />
                                    <MenuItem icon={<BeakerIcon />} text="Deep Research" onClick={() => handleActionSelect('deep_research')} isSelected={selectedAction === 'deep_research'} />
                                    <MenuItem icon={<GlobeAltIcon />} text="Web Search" onClick={() => handleActionSelect('search')} isSelected={selectedAction === 'search'} />
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>

                        {/* More Sub-menu */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setIsMoreSubMenuOpen(true)}
                            onMouseLeave={() => setIsMoreSubMenuOpen(false)}
                        >
                             <MenuItem icon={<EllipsisHorizontalIcon />} text="More..." onClick={() => setIsMoreSubMenuOpen(prev => !prev)} hasChevron />
                            <AnimatePresence>
                            {isMoreSubMenuOpen && (
                                <motion.div
                                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                                    {...{
                                      initial: { opacity: 0, x: -10 },
                                      animate: { opacity: 1, x: 0 },
                                      exit: { opacity: 0, x: -10 },
                                      transition: { duration: 0.15 },
                                    }}
                                    className="absolute left-full bottom-0 ml-2 w-48 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1.5 z-30"
                                >
                                    <MenuItem icon={<PaintBrushIcon />} text="Canvas" onClick={() => handleActionSelect('canvas')} isSelected={selectedAction === 'canvas'}/>
                                    <MenuItem icon={<CubeIcon />} text="Roblox Project" onClick={() => handleActionSelect('roblox')} isSelected={selectedAction === 'roblox'}/>
                                    <MenuItem icon={<ComputerDesktopIcon />} text="Website Project" onClick={() => handleActionSelect('website')} isSelected={selectedAction === 'website'}/>
                                    <MenuItem icon={<FilmIcon />} text="Video Project" onClick={() => handleActionSelect('video')} isSelected={selectedAction === 'video'}/>
                                    <MenuItem icon={<BookOpenIcon />} text="Story Project" onClick={() => handleActionSelect('story')} isSelected={selectedAction === 'story'}/>
                                    <MenuItem icon={<ChartPieIcon />} text="Presentation" onClick={() => handleActionSelect('presentation')} isSelected={selectedAction === 'presentation'}/>
                                    <MenuItem icon={<DocumentTextIcon />} text="Document" onClick={() => handleActionSelect('document')} isSelected={selectedAction === 'document'}/>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        {/* Image Styles Dropdown */}
        <AnimatePresence>
            {isStylesMenuOpen && (
                <motion.div
                    ref={stylesMenuRef}
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: 10, scale: 0.95 },
                      animate: { opacity: 1, y: 0, scale: 1 },
                      exit: { opacity: 0, y: 10, scale: 0.95 },
                    }}
                    className="absolute bottom-full left-32 mb-2 p-2 bg-zinc-800/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl z-20"
                >
                    <div className="grid grid-cols-3 gap-2">
                        {imageStyles.map(style => (
                            <button
                                key={style.name}
                                onClick={() => {
                                    setText(prev => `${prev}, in ${style.name.toLowerCase()} style`);
                                    setIsStylesMenuOpen(false);
                                }}
                                className="text-center group"
                            >
                                <img src={style.img} alt={style.name} className="w-20 h-20 object-cover rounded-md border-2 border-transparent group-hover:border-primary-start transition-colors" />
                                <span className="text-xs text-zinc-300 mt-1 block">{style.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      <motion.form
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          layout: true,
          transition: { type: 'spring', stiffness: 300, damping: 25 },
        }}
        onSubmit={handleSubmit}
        className={formClasses}
    >
        <AnimatePresence>
            {attachedFiles.length > 0 && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pt-2"
                >
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {attachedFiles.map((file, i) => (
                            <FilePreview key={`${file.name}-${i}`} file={file} onRemove={() => handleRemoveFile(file)} />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {selectedAction !== 'default' && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full px-4 pt-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-700/50 rounded-md text-sm text-zinc-200">
                        <ActionIcon className="w-4 h-4" />
                        <span>{currentActionDetails.name}</span>
                    </div>

                    {selectedAction === 'image' && (
                        <button
                            type="button"
                            onClick={() => setIsStylesMenuOpen(prev => !prev)}
                            className="flex items-center gap-1 px-2 py-1 bg-zinc-700/50 rounded-md text-sm text-zinc-200 hover:bg-zinc-700"
                        >
                            <span>Styles</span>
                            <ChevronDownIcon className="w-4 h-4" />
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
        
        <div className={`flex w-full gap-2 p-2 items-center ${attachedFiles.length > 0 ? "pt-1" : ""}`}>
           <button
              type="button"
              onClick={() => setIsActionsMenuOpen(prev => !prev)}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Add file or use action"
          >
              <PlusIcon className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentActionDetails.placeholder}
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary focus:outline-none resize-none px-2 py-3 max-h-48 overflow-y-auto"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
          />
           <div className="flex items-center gap-2">
              <VoiceControls onTranscript={(t) => setText(prev => prev + t)} />
              <button
                  type="submit"
                  disabled={isLoading || (!text.trim() && attachedFiles.length === 0)}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/80 flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-zinc-700"
                  aria-label="Send message"
              >
                  <PaperAirplaneIcon className="w-5 h-5" />
              </button>
           </div>
        </div>
      </motion.form>
    </div>
  );
};