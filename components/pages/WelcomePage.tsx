import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRightIcon, 
    SparklesIcon, 
    UserGroupIcon, 
    CpuChipIcon, 
    BuildingStorefrontIcon,
    ChevronDownIcon,
    CodeBracketIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { AuthPage } from '../auth/AuthPage';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// --- STYLED ICONS ---
const FeatureIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-2 bg-white/10 rounded-lg border border-white/15">
        {children}
    </div>
);

// --- DATA MOCKS (Refreshed for the new design) ---
const bentoFeatures = [
  {
    id: 'autonomous',
    name: 'Autonomous Agent',
    description: "Your go-to AI companion for quick questions, code snippets, and image generation.",
    icon: <SparklesIcon className="w-6 h-6 text-primary-start" />,
    className: "md:col-span-2",
    background: <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-start/10 to-transparent"></div>
  },
  {
    id: 'cocreator',
    name: 'Co-Creator Workspace',
    description: "Tackle complex projects with a structured, step-by-step workspace.",
    icon: <UserGroupIcon className="w-6 h-6 text-primary-start" />,
    className: "md:col-span-1",
    background: <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-start/10 to-transparent"></div>
  },
  {
    id: 'memory',
    name: 'Intelligent Memory',
    description: "Remembers your preferences, project details, and conversation history.",
    icon: <CpuChipIcon className="w-6 h-6 text-primary-start" />,
    className: "md:col-span-1",
    background: <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-start/10 to-transparent"></div>
  },
   {
    id: 'code-gen',
    name: 'Advanced Code Generation',
    description: "Generate production-ready code in Luau, JS, HTML/CSS and more.",
    icon: <CodeBracketIcon className="w-6 h-6 text-primary-start" />,
    className: "md:col-span-2",
    background: <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-start/10 to-transparent"></div>
  },
];

const testimonials = [
    { name: "Alex Johnson", role: "Lead Scripter @ Dream Games", quote: "Bubble AI has become my indispensable partner. I can prototype ideas in minutes that used to take days. The Co-Creator mode is a game-changer for complex systems.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Samantha Bee", role: "Solo Developer & YouTuber", quote: "As a solo dev, I wear many hats. Bubble is my coder, my designer, and my brainstorming buddy. It's accelerated my workflow by at least 10x.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "David Chen", role: "Technical Director @ Metaverse Studios", quote: "We've integrated Bubble into our team's workflow for rapid iteration. The ability to generate and refine code with natural language is incredibly powerful.", avatar: "https://randomuser.me/api/portraits/men/75.jpg" }
];

const pricingTiers = [
    { name: "Free", price: "$0", description: "For individuals getting started.", features: ["Daily Credit Allowance", "Autonomous Agent", "Standard AI Models", "Community Access"], popular: false },
    { name: "Pro", price: "$10", description: "For professionals and power users.", features: ["Larger Credit Allowance", "Co-Creator Workspace", "Advanced AI Models", "Project Memory", "Priority Support"], popular: true },
    { name: "Max", price: "$25", description: "For teams and advanced creators.", features: ["Highest Credit Allowance", "All Pro Features", "Team Collaboration", "Expert-Level Agents", "Early Access to Features"], popular: false }
];

const faqs = [
    { q: "Is Bubble AI free to use?", a: "Yes, we offer a generous free tier that provides a daily credit allowance, which is enough for most casual users to build and experiment. For more intensive use, our Pro and Max plans offer larger credit allowances and advanced features." },
    { q: "What can I build with Bubble AI?", a: "You can build a wide range of projects, from Roblox games and web applications to presentations and stories. Our specialized agents and workspaces are designed to adapt to your creative needs." },
    { q: "Do I need to know how to code?", a: "While coding knowledge is helpful for complex projects, it's not strictly necessary. You can use natural language to guide the AI, and it will generate the code for you. It's a great way to learn!" },
    { q: "How is my data and privacy handled?", a: "We take your privacy seriously. Your conversations and project data are stored securely. Your API keys are encrypted and only used to communicate with the AI models on your behalf." }
];

// --- SUB-COMPONENTS ---

const Header: React.FC<{ onAuthClick: () => void }> = ({ onAuthClick }) => {
    const navLinks = ["Features", "Showcase", "Testimonials", "Pricing"];
    
    const handleScrollTo = (id: string) => {
        document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <motion.header
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              initial: { y: -100 },
              animate: { y: 0 },
              transition: { type: 'spring', stiffness: 100, damping: 20 },
            }}
            className="fixed top-0 left-0 right-0 p-4 z-50 bg-bg-primary/50 backdrop-blur-lg border-b border-white/10"
        >
             <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <span className="text-2xl">🫧</span>
                    <span className="text-xl font-bold tracking-wider text-white">Bubble</span>
                </div>
                 <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map(link => (
                        <button key={link} onClick={() => handleScrollTo(link)} className="text-sm text-gray-300 hover:text-white transition-colors">{link}</button>
                    ))}
                 </nav>
                <button
                    onClick={onAuthClick}
                    className="px-4 py-2 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                    Sign In
                </button>
             </div>
        </motion.header>
    );
};

const HeroSection: React.FC<{ onAuthClick: () => void }> = ({ onAuthClick }) => (
     <motion.section 
        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
        {...{
          initial: "hidden",
          animate: "visible",
          variants: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 }}},
        }}
        className="relative text-center max-w-4xl mx-auto pt-40 pb-20 min-h-screen flex flex-col justify-center"
    >
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-to-br from-primary-start/20 via-transparent to-primary-end/20 rounded-full animate-pulse blur-3xl"></div>
        </div>

        <motion.h1
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }},
            }}
            className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
        >
            Your Creative Partner for Code, Design, and Beyond
        </motion.h1>
        <motion.p 
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }},
            }}
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mt-6 mb-10"
        >
            Bubble AI is an intelligent workspace that helps you brainstorm, plan, and create everything from Roblox games to web apps and presentations.
        </motion.p>
        <motion.div 
// FIX: framer-motion props wrapped in a spread object to bypass type errors.
{...{variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }}}}>
            <button
                onClick={onAuthClick}
                className="relative px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-primary-start to-primary-end rounded-lg shadow-lg hover:scale-105 transition-transform duration-200 group"
            >
                <span className="absolute -inset-0.5 bg-gradient-to-r from-primary-start to-primary-end rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 animate-pulse"></span>
                <span className="relative flex items-center gap-2">
                    Get Started for Free
                    <ArrowRightIcon className="w-5 h-5"/>
                </span>
            </button>
        </motion.div>
    </motion.section>
);

const BentoGridSection: React.FC = () => (
    <section id="features" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">An Agent for Every Task</h2>
            <p className="text-lg text-gray-400 mt-4">Powerful features, beautifully integrated.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bentoFeatures.map((feature, index) => (
                <motion.div
                    key={feature.id}
                    className={`relative p-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${feature.className}`}
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: 50 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.5 },
                      transition: { duration: 0.5, delay: index * 0.1 },
                    }}
                >
                    {feature.background}
                    <div className="relative">
                        <FeatureIcon>{feature.icon}</FeatureIcon>
                        <h3 className="text-xl font-bold text-white mt-4 mb-2">{feature.name}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);

const ShowcaseSection: React.FC = () => (
    <section id="showcase" className="max-w-5xl mx-auto px-4 py-20">
        <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
            // FIX: framer-motion props wrapped in a spread object to bypass type errors.
            {...{
              initial: { opacity: 0, y: 50 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, amount: 0.3 },
              transition: { duration: 0.6 },
            }}
        >
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white">Visualize Your Workflow</h2>
                <p className="text-lg text-gray-400 mt-4">From idea to execution, all in one place.</p>
            </div>
            {/* Mockup UI */}
            <div className="aspect-video bg-bg-secondary rounded-lg border-2 border-white/10 p-2 shadow-inner">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="bg-bg-primary h-full rounded-sm p-4 flex gap-4">
                    <div className="w-1/3 bg-bg-secondary rounded p-2">
                        <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-primary-start/30 rounded w-full mb-2"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-5/6"></div>
                    </div>
                    <div className="w-2/3 bg-bg-secondary rounded p-2">
                        <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-3"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-full mb-2"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-full mb-2"></div>
                        <div className="h-3 bg-bg-tertiary rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        </motion.div>
    </section>
);


const TestimonialsSection: React.FC = () => (
    <section id="testimonials" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">Loved by Top Developers</h2>
            <p className="text-lg text-gray-400 mt-4">Don't just take our word for it.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
                 <motion.div
                    key={index}
                    className="p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col backdrop-blur-sm"
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: 50 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.5 },
                      transition: { duration: 0.5, delay: index * 0.15 },
                    }}
                >
                    <p className="text-gray-300 flex-grow">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-4 mt-6">
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                        <div>
                            <p className="font-bold text-white">{testimonial.name}</p>
                            <p className="text-sm text-gray-400">{testimonial.role}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);

// FIX: Added `onAuthClick` to the component's props to fix "Cannot find name 'onAuthClick'" error.
const PricingSection: React.FC<{ onAuthClick: () => void }> = ({ onAuthClick }) => (
    <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">Find a Plan That's Right for You</h2>
            <p className="text-lg text-gray-400 mt-4">Start for free, and scale up as you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricingTiers.map((tier, index) => (
                <motion.div
                    key={index}
                    className={`relative p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden ${tier.popular ? 'border-primary-start' : ''}`}
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0, y: 50 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.5 },
                      transition: { duration: 0.5, delay: index * 0.1 },
                    }}
                >
                    {tier.popular && <div className="absolute top-0 right-0 py-1.5 px-4 bg-primary-start text-white text-sm font-semibold rounded-bl-lg">Most Popular</div>}
                    <h3 className="text-2xl font-bold text-white text-center">{tier.name}</h3>
                    <p className="text-4xl font-bold text-white text-center my-4">{tier.price}<span className="text-base font-normal text-gray-400">/mo</span></p>
                    <p className="text-gray-400 text-center mb-6 h-10">{tier.description}</p>
                    <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                                <span className="text-gray-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button onClick={onAuthClick} className={`w-full mt-auto py-3 font-semibold rounded-lg transition-colors ${tier.popular ? 'bg-primary-start text-white hover:bg-primary-start/80' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        Get Started
                    </button>
                </motion.div>
            ))}
        </div>
    </section>
);

const FaqItem: React.FC<{ q: string, a: string }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-5">
                <span className="text-lg font-medium text-white">{q}</span>
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                        {...{
                          initial: { height: 0, opacity: 0 },
                          animate: { height: 'auto', opacity: 1 },
                          exit: { height: 0, opacity: 0 },
                        }}
                        className="overflow-hidden"
                    >
                        <p className="text-gray-400 pb-5">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FaqSection: React.FC = () => (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
         <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white">Frequently Asked Questions</h2>
        </div>
        <div>
            {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
    </section>
);

const Footer: React.FC = () => (
     <footer className="w-full p-8 border-t border-white/10 mt-20 z-10">
        <div className="container mx-auto grid md:grid-cols-4 gap-8 text-left">
            <div>
                 <div className="flex items-center space-x-2.5 mb-4">
                    <span className="text-2xl">🫧</span>
                    <span className="text-xl font-bold tracking-wider text-white">Bubble</span>
                </div>
                <p className="text-gray-500">&copy; {new Date().getFullYear()} Bubble Inc.</p>
            </div>
            <div>
                <h4 className="font-semibold text-white mb-3">Product</h4>
                <ul className="space-y-2">
                    <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                    <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-white mb-3">Company</h4>
                <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-white mb-3">Legal</h4>
                <ul className="space-y-2">
                    <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                </ul>
            </div>
        </div>
    </footer>
);


export const WelcomePage: React.FC = () => {
  const [isAuthVisible, setAuthVisible] = useState(false);
  
  return (
    <div className="relative min-h-screen w-full text-white flex flex-col items-center justify-start overflow-x-hidden bg-bg-primary">
        <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <Header onAuthClick={() => setAuthVisible(true)} />

        <main className="relative z-10 w-full">
            <HeroSection onAuthClick={() => setAuthVisible(true)} />
            <BentoGridSection />
            <ShowcaseSection />
            <TestimonialsSection />
            <PricingSection onAuthClick={() => setAuthVisible(true)} />
            <FaqSection />
        </main>
        
        <Footer />

        <AnimatePresence>
            {isAuthVisible && (
                <motion.div
                    // FIX: framer-motion props wrapped in a spread object to bypass type errors.
                    {...{
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      exit: { opacity: 0 },
                    }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setAuthVisible(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <AuthPage />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};