
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { ChatModel, ImageModel } from '../../types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, children, description }) => (
    <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="w-16 border-b-2 border-primary-start mt-2 mb-6"></div>
        {description && <p className="text-gray-400 mb-6 max-w-2xl">{description}</p>}
        <div className="space-y-6">{children}</div>
    </div>
);

const SectionCard: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="p-6 bg-bg-secondary/50 rounded-xl border border-white/10">{children}</div>
);

export const ModelPreferences: React.FC = () => {
    const { profile, updateUserProfile } = useAuth();
    const { addToast } = useToast();
    const [chatModel, setChatModel] = useState<ChatModel>('gemini_2.5_flash');
    const [imageModel, setImageModel] = useState<ImageModel>('nano_banana');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setChatModel(profile.preferred_chat_model || 'gemini_2.5_flash');
            setImageModel(profile.preferred_image_model || 'nano_banana');
        }
    }, [profile]);
    
    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await updateUserProfile({
                preferred_chat_model: chatModel,
                preferred_image_model: imageModel,
            });
            setSaveSuccess(true);
            addToast("Model preferences saved!", "success");
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            addToast("Failed to save preferences.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = profile && (profile.preferred_chat_model !== chatModel || profile.preferred_image_model !== imageModel);

    return (
        <Section title="Model Preferences" description="Choose the default AI models for different tasks. Costs may vary.">
            <SectionCard>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="chatModel" className="block text-sm font-medium text-gray-300 mb-1">Default Chat Model</label>
                        <p className="text-xs text-gray-500 mb-2">Used for general conversation and brainstorming.</p>
                        <select
                            id="chatModel"
                            value={chatModel}
                            onChange={(e) => setChatModel(e.target.value as ChatModel)}
                            className="w-full p-2 bg-white/5 border border-white/20 rounded-md"
                        >
                            <option value="gemini_2.5_flash">Gemini 2.5 Flash (Recommended)</option>
                            <option value="gemini_1.5_flash">Gemini 1.5 Flash</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="imageModel" className="block text-sm font-medium text-gray-300 mb-1">Default Image Model</label>
                         <p className="text-xs text-gray-500 mb-2">Used when you ask the AI to generate an image.</p>
                        <select
                            id="imageModel"
                            value={imageModel}
                            onChange={(e) => setImageModel(e.target.value as ImageModel)}
                            className="w-full p-2 bg-white/5 border border-white/20 rounded-md"
                        >
                            <option value="nano_banana">Nano Banana (Fast &amp; Cheap)</option>
                            <option value="imagen_2">Imagen 2 (Balanced)</option>
                            <option value="imagen_3">Imagen 3 (High Quality)</option>
                            <option value="imagen_4">Imagen 4 (Highest Quality)</option>
                        </select>
                    </div>
                </div>
                 <div className="mt-6 pt-6 border-t border-border-color flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || saveSuccess || !hasChanges}
                        className="px-6 h-[42px] bg-primary-start text-white rounded-md font-semibold text-sm hover:bg-primary-start/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-32 flex items-center justify-center"
                    >
                        {isSaving ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        : saveSuccess ? <CheckCircleIcon className="h-6 w-6 text-white" />
                        : 'Save Changes'}
                    </button>
                </div>
            </SectionCard>
        </Section>
    );
};
