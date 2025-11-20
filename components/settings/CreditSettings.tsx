import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AppSettings } from '../../types';
import { getAppSettings, updateAppSettings } from '../../services/databaseService';
import { useToast } from '../../hooks/useToast';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const NumberInput: React.FC<{ label: string; value: number; onChange: (value: number) => void; description?: string, isCurrency?: boolean }> = ({ label, value, onChange, description, isCurrency }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(isCurrency ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md"
            min="0"
            step={isCurrency ? "0.01" : "1"}
        />
    </div>
);

export const CreditSystemSettings: React.FC = () => {
    const { supabase } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<Partial<AppSettings>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [initialSettings, setInitialSettings] = useState<Partial<AppSettings>>({});

    useEffect(() => {
        const fetchSettings = async () => {
            if (!supabase) return;
            try {
                const data = await getAppSettings(supabase);
                setSettings(data);
                setInitialSettings(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                addToast(`Failed to load settings: ${message}`, 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [supabase, addToast]);
    
    const handleSettingChange = (key: keyof Omit<AppSettings, 'id' | 'updated_at'>, value: number) => {
        setSettings(prev => ({...prev, [key]: value}));
    };
    
    const handleSave = async () => {
        if (!supabase) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const updates: Partial<Omit<AppSettings, 'id' | 'updated_at'>> = { ...settings };
            delete (updates as any).id;
            delete (updates as any).updated_at;
            
            const updatedSettings = await updateAppSettings(supabase, updates);
            setSettings(updatedSettings);
            setInitialSettings(updatedSettings);
            addToast("Settings saved successfully!", "success");
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
             const message = error instanceof Error ? error.message : "An unknown error occurred.";
             addToast(`Failed to save settings: ${message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

    if (isLoading) {
        return <div className="text-center p-8 text-gray-400">Loading settings...</div>
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Daily Credit Allowances</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberInput label="NA Tier" value={settings.daily_credits_na || 0} onChange={v => handleSettingChange('daily_credits_na', v)} />
                <NumberInput label="Pro Tier" value={settings.daily_credits_pro || 0} onChange={v => handleSettingChange('daily_credits_pro', v)} />
                <NumberInput label="Max Tier" value={settings.daily_credits_max || 0} onChange={v => handleSettingChange('daily_credits_max', v)} />
                <NumberInput label="Admin Tier" value={settings.daily_credits_admin || 0} onChange={v => handleSettingChange('daily_credits_admin', v)} />
            </div>

            <h3 className="text-lg font-semibold text-white pt-4 border-t border-white/10">Image Model Costs (per generation)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <NumberInput label="Nano Banana" value={settings.cost_image_nano_banana || 0} onChange={v => handleSettingChange('cost_image_nano_banana', v)} />
                 <NumberInput label="Imagen 2" value={settings.cost_image_imagen_2 || 0} onChange={v => handleSettingChange('cost_image_imagen_2', v)} />
                 <NumberInput label="Imagen 3" value={settings.cost_image_imagen_3 || 0} onChange={v => handleSettingChange('cost_image_imagen_3', v)} />
            </div>
            
            <h3 className="text-lg font-semibold text-white pt-4 border-t border-white/10">Chat Model Costs (per interaction)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <NumberInput label="Gemini 1.5 Flash" value={settings.cost_chat_gemini_1_5_flash || 0} onChange={v => handleSettingChange('cost_chat_gemini_1_5_flash', v)} />
                 <NumberInput label="Gemini 2.5 Flash" value={settings.cost_chat_gemini_2_5_flash || 0} onChange={v => handleSettingChange('cost_chat_gemini_2_5_flash', v)} />
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-end">
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
        </div>
    );
};
