import React from 'react';
import { Cog8ToothIcon } from '@heroicons/react/24/outline';
import { CreditSystemSettings } from '../settings/CreditSettings';

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

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
        <p className="text-gray-400 mt-1">Manage global application settings and configurations.</p>
      </div>
      
      <div className="space-y-12">
        <Section 
            title="Credit System"
            description="Manage daily credit allowances, purchase costs, and AI model usage costs."
        >
            <SectionCard>
                <CreditSystemSettings />
            </SectionCard>
        </Section>
        
        <Section 
            title="AI Agent Configuration"
            description="Manage system prompts, default models, and other settings for the AI agents."
        >
            <SectionCard>
                 <div className="text-center py-12 text-gray-500">
                    <Cog8ToothIcon className="w-12 h-12 mx-auto animate-spin [animation-duration:5s]" />
                    <h3 className="text-lg font-semibold mt-4">Agent Configuration Coming Soon</h3>
                    <p>Controls for modifying AI behavior will be available here.</p>
                </div>
            </SectionCard>
        </Section>
      </div>
    </div>
  );
};