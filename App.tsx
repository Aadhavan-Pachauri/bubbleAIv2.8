import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { Layout } from './components/layout/Layout';
import { WelcomePage } from './components/pages/WelcomePage';
import { ApiKeySetupPage } from './components/auth/ApiKeySetupPage';
import { CompleteProfilePage } from './components/auth/CompleteProfilePage';
import { FullScreenError } from './components/ui/FullScreenError';
import { AdminPage } from './components/admin/AdminPage';
import { UpdateDisplayNamePage } from './components/auth/UpdateDisplayNamePage';
import { OnboardingPage } from './components/auth/OnboardingPage';


const AppContent: React.FC = () => {
    const { session, user, profile, loading, geminiApiKey, isAdmin, profileError } = useAuth();
    
    if (loading) {
        return (
          <div className="h-screen w-screen flex items-center justify-center bg-bg-primary">
            <svg className="animate-spin h-8 w-8 text-primary-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
    }
    
    if (profileError) {
        return <FullScreenError title="Connection Error" message={profileError} onRetry={() => window.location.reload()} />;
    }

    if (!session || !user) {
        return <WelcomePage />;
    }
    
    if (!profile) {
        return <CompleteProfilePage />;
    }

    if (profile.roblox_username.includes('@')) {
        return <UpdateDisplayNamePage />;
    }

    if (!profile.onboarding_preferences) {
        return <OnboardingPage />;
    }
    
    if (!geminiApiKey && !isAdmin) {
        return <ApiKeySetupPage />;
    }
    
    if (isAdmin) {
        return <AdminPage />;
    }

    return <Layout geminiApiKey={geminiApiKey!} />;
};


const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;