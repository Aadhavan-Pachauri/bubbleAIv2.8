
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { motion } from 'framer-motion';

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

const CreditPack: React.FC<{ amount: number, price: string, onBuy: (amount: number) => void }> = ({ amount, price, onBuy }) => (
    <motion.div 
        className="p-4 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center text-center"
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          whileHover: { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        }}
    >
        <p className="text-2xl font-bold text-primary-start">{amount.toLocaleString()}</p>
        <p className="text-sm text-gray-300 mb-3">Credits</p>
        <button 
            onClick={() => onBuy(amount)}
            className="w-full px-4 py-2 bg-primary-start text-white rounded-md text-sm font-semibold"
        >
            Buy for {price}
        </button>
    </motion.div>
);


export const BillingSettings: React.FC = () => {
    const { profile, updateUserProfile } = useAuth();
    const { addToast } = useToast();

    const handleBuyCredits = async (amount: number) => {
        if (!profile) return;
        // This is a mock purchase. In a real app, you would integrate a payment provider.
        const newTotal = (profile.credits || 0) + amount;
        try {
            await updateUserProfile({ credits: newTotal });
            addToast(`Successfully added ${amount} credits!`, 'success');
        } catch (error) {
            addToast(`Failed to add credits.`, 'error');
        }
    };
    
    return (
        <Section title="Billing & Usage" description="Manage your credits and membership plan.">
            <SectionCard>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Current Balance</h3>
                        <p className="text-4xl font-bold text-primary-start mt-1">{(profile?.credits || 0).toLocaleString()} <span className="text-2xl text-gray-400">Credits</span></p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Membership Plan</h3>
                        <p className="text-xl font-semibold capitalize text-gray-300 mt-1">{profile?.membership}</p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard>
                <h3 className="text-lg font-semibold text-white mb-4">Purchase Credits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <CreditPack amount={100} price="$1.00" onBuy={handleBuyCredits} />
                   <CreditPack amount={550} price="$5.00" onBuy={handleBuyCredits} />
                   <CreditPack amount={1200} price="$10.00" onBuy={handleBuyCredits} />
                   <CreditPack amount={3000} price="$20.00" onBuy={handleBuyCredits} />
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">Purchases are simulated for this demo.</p>
            </SectionCard>
        </Section>
    )
};
