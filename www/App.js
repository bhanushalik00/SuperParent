import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { 
  Plus, Settings, Home, List, Trophy, Lock, UserPlus, 
  User, CheckCircle2, Star, History, Trash2, X, WifiOff, CloudOff, 
  AlertTriangle, ShoppingBag, Palette, Crown, ChevronRight, Check,
  BookOpen, Lightbulb, Heart, CreditCard
} from 'lucide-react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { storage } from './services/storage.js';

const html = htm.bind(React.createElement);

// --- Constants ---
const Role = { PARENT: 'PARENT', CHILD: 'CHILD' };
const TaskType = { INDIVIDUAL: 'INDIVIDUAL', JOINT: 'JOINT' };
const PIN_KEY = 'superparent_pin';
const PROFILES_KEY = 'superparent_profiles';
const TASKS_KEY = 'superparent_tasks';
const HISTORY_KEY = 'superparent_history';
const STREAKS_KEY = 'superparent_streaks';
const LAST_RESET_KEY = 'superparent_last_reset';
const PREMIUM_KEY = 'superparent_is_premium';
const REWARDS_KEY = 'superparent_rewards';
const THEME_KEY = 'superparent_theme';
const ALLOWANCE_KEY = 'superparent_allowance_settings';
const TOUR_COMPLETED_KEY = 'superparent_tour_completed';

const AVATARS = [
  { char: '🦁', premium: false }, { char: '🐘', premium: false }, 
  { char: '🦒', premium: false }, { char: '🦓', premium: false }, 
  { char: '🐼', premium: true }, { char: '🐨', premium: true }, 
  { char: '🦊', premium: true }, { char: '🦉', premium: true }, 
  { char: '🐢', premium: true }, { char: '🦖', premium: true }, 
  { char: '👨‍🚀', premium: true }, { char: '👩‍🔬', premium: true }, 
  { char: '👨‍🚒', premium: true }, { char: '👩‍🎨', premium: true }
];

const THEMES = {
  DEFAULT: { primary: '#6750a4', surface: '#fdfbff', bg: '#f3edf7', name: 'Classic Purple' },
  MIDNIGHT: { primary: '#3d4975', surface: '#fbfcff', bg: '#ecf0f9', name: 'Midnight Blue' },
  FOREST: { primary: '#386a20', surface: '#fdfcf4', bg: '#e8f3d6', name: 'Forest Green' },
  OCEAN: { primary: '#0061a4', surface: '#fdfbff', bg: '#d1e4ff', name: 'Ocean Breeze' }
};

const DEFAULT_TASKS = [
  { id: 't1', title: 'Brush Teeth', description: 'Clean your teeth for 2 minutes', type: TaskType.INDIVIDUAL, starValue: 2, completedBy: [], isRecurring: 'daily' },
  { id: 't2', title: 'Pack School Bag', description: 'Check your schedule and pack everything', type: TaskType.INDIVIDUAL, starValue: 3, completedBy: [], isRecurring: 'daily' },
  { id: 't3', title: '15 Mins Reading', description: 'Read a book of your choice', type: TaskType.INDIVIDUAL, starValue: 5, completedBy: [], isRecurring: 'daily' },
  { id: 't4', title: 'Family Dinner Help', description: 'Help set or clear the table', type: TaskType.JOINT, starValue: 10, completedBy: [], isRecurring: 'daily' }
];

const PARENTING_TIPS = [
  { 
    id: 'p1', 
    age: '4-6', 
    title: 'Handling Big Emotions', 
    author: 'Dr. Sarah Chen, Child Psychologist',
    readTime: '5 min read',
    content: 'At this age, kids are still learning to regulate. Use "co-regulation" by staying calm yourself first.',
    details: 'When your child has a meltdown, their logical brain is offline. Instead of reasoning, try: \n1. Get on their eye level. \n2. Use a soft voice. \n3. Validate: "I see you are really frustrated." \nOnce they are calm, then you can talk about what happened.',
    actionPlan: [
      'Identify triggers (hunger, tiredness, transitions)',
      'Create a "Calm Down Corner" with soft pillows',
      'Practice deep breathing exercises during calm times'
    ]
  },
  { 
    id: 'p2', 
    age: '7-9', 
    title: 'Building Independence', 
    author: 'Mark Thompson, Educator',
    readTime: '7 min read',
    content: 'Give them small responsibilities like packing their own lunch to boost confidence.',
    details: 'Independence is built through small wins. \n- Let them choose their clothes (even if they don\'t match). \n- Teach them to use the toaster or make a sandwich. \n- Encourage them to solve their own small conflicts with friends before stepping in.',
    actionPlan: [
      'Assign one "Big Kid" chore per week',
      'Let them manage a small weekly budget',
      'Encourage self-correction before offering help'
    ]
  },
  { 
    id: 'p3', 
    age: '10+', 
    title: 'Digital Safety', 
    author: 'Jessica Lee, Cyber-Safety Expert',
    readTime: '10 min read',
    content: 'Start conversations about online privacy early. Set clear boundaries for screen time.',
    details: 'The "Digital Handshake" rule: \n- No devices in bedrooms at night. \n- Parents have passwords to all accounts. \n- Discuss "Permanent Footprints": anything posted online stays there. \n- Focus on being a "Digital Citizen" rather than just restricting time.',
    actionPlan: [
      'Draft a "Family Media Contract"',
      'Set up parental controls on all devices',
      'Schedule "Tech-Free" family hours daily'
    ]
  }
];

const EXPERT_QA = [
  { q: "How do I stop the bedtime battles?", a: "Consistency is key. A 30-minute wind-down routine without screens is essential for melatonin production." },
  { q: "My child refuses to do chores. What now?", a: "Tie chores to privileges, not just money. 'First chores, then screen time' is a powerful motivator." }
];

const DEFAULT_REWARDS = [
  { id: 'r1', title: 'Extra Screen Time', cost: 20, icon: '📱' },
  { id: 'r2', title: 'Ice Cream Trip', cost: 50, icon: '🍦' }
];

const triggerHaptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

// --- Components ---

const Mascot = ({ state, onAnimationEnd, isOnline }) => {
  const [displayText, setDisplayText] = useState("Hi Super Parent!");
  
  useEffect(() => {
    if (!isOnline && state === 'IDLE') {
      setDisplayText("Working offline! Data is safe locally. 💾");
      return;
    }
    const texts = {
      CHILD_SUCCESS: "Awesome job, kiddo! 🎉",
      PARENT_SUCCESS: "Great role modeling! ⭐",
      JOINT_SUCCESS: "Teamwork makes the dream work! 🤝",
      REWARD_REDEEMED: "Woohoo! Reward earned! 🎁",
      IDLE: "Ready for today's goals?"
    };
    setDisplayText(texts[state] || texts.IDLE);
    if (state !== 'IDLE' && onAnimationEnd) {
      const timer = setTimeout(onAnimationEnd, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, onAnimationEnd, isOnline]);

  const emojis = { IDLE: isOnline ? '🐶' : '🤖', CHILD_SUCCESS: '🥳', PARENT_SUCCESS: '😎', JOINT_SUCCESS: '🤩', REWARD_REDEEMED: '🎁' };

  return html`
    <div className="flex flex-col items-center justify-center p-4">
      <div className=${`text-6xl mb-2 transition-transform duration-300 ${state !== 'IDLE' ? 'scale-125' : 'scale-100'}`}>
        ${emojis[state] || emojis.IDLE}
      </div>
      <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 relative">
        <p className="text-sm font-medium text-slate-700 text-center">${displayText}</p>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-l border-t border-slate-100"></div>
      </div>
    </div>
  `;
};

const PinScreen = ({ onUnlock, theme }) => {
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storage.get(PIN_KEY, '').then(val => {
      setSavedPin(val);
      setIsLoading(false);
    });
  }, []);

  const handleInput = async (val) => {
    triggerHaptic(8);
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (!savedPin || newPin === savedPin) {
          if (!savedPin) await storage.set(PIN_KEY, newPin);
          triggerHaptic([30, 20, 30]);
          onUnlock();
        } else {
          setError(true);
          triggerHaptic(150);
          setTimeout(() => { setPin(''); setError(false); }, 400);
        }
      }
    }
  };

  if (isLoading) return html`<div className="fixed inset-0 bg-[#fdfbff] flex items-center justify-center">Loading Security...</div>`;

  return html`
    <div style=${{ backgroundColor: theme.primary }} className="fixed inset-0 flex flex-col items-center justify-start overflow-y-auto pt-10 pb-10 z-[200] text-white">
      <div className="w-full max-w-xs px-4 flex flex-col items-center">
        <div className="mb-6 text-center">
          <div className="bg-white/20 p-6 rounded-[24px] inline-block mb-4 shadow-xl">
            <${Lock} size=${32} className="text-white" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight mb-1">${savedPin ? 'Parent Access' : 'Create Admin PIN'}</h1>
          <p className="text-[#eaddff] text-xs font-medium opacity-80">Only parents should know this PIN</p>
        </div>
        
        <div className="flex gap-4 mb-8">
          ${[0, 1, 2, 3].map(i => html`
            <div key=${i} className=${`w-3 h-3 rounded-full border-2 border-white transition-all ${pin.length > i ? 'bg-white scale-110' : 'bg-transparent'} ${error ? 'bg-red-400 border-red-400' : ''}`} />
          `)}
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(btn => html`
            <button key=${btn} onClick=${() => btn === 'C' ? setPin('') : btn === '←' ? setPin(p => p.slice(0, -1)) : handleInput(btn.toString())}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 active:bg-white/30 flex items-center justify-center text-2xl sm:text-3xl font-medium ripple">
              ${btn}
            </button>
          `)}
        </div>
      </div>
    </div>
  `;
};

const M3BottomSheet = ({ isOpen, onClose, title, children, theme }) => {
  if (!isOpen) return null;
  return html`
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick=${onClose}></div>
      <div style=${{ backgroundColor: theme.bg }} className="w-full rounded-t-[32px] p-6 pb-14 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-[#79747e]/30 rounded-full mx-auto mb-8"></div>
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-medium text-[#1c1b1f]">${title}</h2>
          <button onClick=${onClose} className="p-3 bg-white/50 rounded-full text-[#49454f]"><${X} size=${20} /></button>
        </div>
        ${children}
      </div>
    </div>
  `;
};

const PremiumUpsell = ({ onClose, onUpgrade, theme }) => {
  return html`
    <div className="px-2">
      <div className="bg-gradient-to-br from-[#6750a4] to-[#3d4975] p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-white/20 p-2 rounded-xl"><${Crown} size=${20} /></div>
             <span className="font-medium text-xs tracking-wider">PREMIUM EDITION</span>
          </div>
          <h3 className="text-2xl font-medium mb-2">Unleash Full Potential</h3>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">Upgrade to unlock unlimited family members, the Star Store, exclusive themes, and pro avatars.</p>
          
          <div className="space-y-3 mb-8">
            ${[
              'Unlimited Family Profiles',
              'Star Rewards Store access',
              'Allowance Tracking Mode',
              'Expert Parenting Guides',
              'Exclusive Themes & Avatars'
            ].map(f => html`
              <div key=${f} className="flex items-center gap-3 text-sm font-medium">
                <${CheckCircle2} size=${16} className="text-[#d3e3fd]" /> ${f}
              </div>
            `)}
          </div>

          <button onClick=${onUpgrade} className="w-full bg-white text-[#6750a4] py-4 rounded-full font-medium shadow-lg active:scale-95 transition-all ripple">
            GET LIFETIME ACCESS
          </button>
          <button onClick=${onClose} className="w-full mt-4 text-white/60 text-xs font-medium uppercase tracking-widest">Maybe later</button>
        </div>
      </div>
    </div>
  `;
};

export default function App() {
  const isOnline = useOnlineStatus();
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isPremium, setIsPremium] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES.DEFAULT);
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [mascotState, setMascotState] = useState('IDLE');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [allowanceSettings, setAllowanceSettings] = useState({ enabled: false, currency: '$', ratio: 10 });
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, icon = '✨') => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const tourSteps = [
    { 
      target: 'dashboard', 
      title: 'Welcome to SuperParent! 🐶', 
      content: 'I\'m your parenting sidekick. Let\'s take a quick tour of your new command center.' 
    },
    { 
      target: 'dashboard', 
      title: 'The Scoreboard ⭐️', 
      content: 'Track total stars earned by parents and kids. Stars are the currency of good habits!' 
    },
    { 
      target: 'tasks', 
      title: 'Daily Goals 📝', 
      content: 'This is where the magic happens. Kids complete tasks here to earn stars for their hard work.' 
    },
    { 
      target: 'shop', 
      title: 'The Star Store 🎁', 
      content: 'Trade stars for real-world rewards like extra screen time or a special treat. You decide the prizes!' 
    },
    { 
      target: 'hub', 
      title: 'Parenting Hub 💡', 
      content: 'Get expert tips on handling big emotions, building independence, and digital safety for kids 4+.' 
    },
    { 
      target: 'profiles', 
      title: 'Your Team 👨‍👩‍👧‍👦', 
      content: 'Manage your family profiles here. Everyone gets their own avatar and star balance.' 
    },
    { 
      target: 'settings', 
      title: 'Pro Power ⚙️', 
      content: 'In Settings, you can enable Allowance Mode to turn stars into virtual cash, or change your app theme!' 
    }
  ];

  const nextTourStep = () => {
    triggerHaptic(10);
    if (tourStep < tourSteps.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      setActiveTab(tourSteps[nextStep].target);
    } else {
      completeTour();
    }
  };

  const completeTour = async () => {
    setShowTour(false);
    await storage.set(TOUR_COMPLETED_KEY, true);
    triggerHaptic([50, 50]);
  };

  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      
      // Initialize RevenueCat (Mock for Web, Real for Android)
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
          await Purchases.configure({ 
            apiKey: "goog_YOUR_GOOGLE_PLAY_API_KEY", // Replace with your RevenueCat Google API Key
          });
          
          // Check if user is already premium via RevenueCat
          const customerInfo = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active['pro_access']) {
            setIsPremium(true);
            await storage.set(PREMIUM_KEY, true);
          }
        } catch (e) {
          console.error("RevenueCat Init Error:", e);
        }
      }

      const [p, h, s, lastReset, prem, themeKey, rew, allow, tourDone] = await Promise.all([
        storage.get(PROFILES_KEY, []),
        storage.get(HISTORY_KEY, []),
        storage.get(STREAKS_KEY, {}),
        storage.get(LAST_RESET_KEY, ''),
        storage.get(PREMIUM_KEY, false),
        storage.get(THEME_KEY, 'DEFAULT'),
        storage.get(REWARDS_KEY, DEFAULT_REWARDS),
        storage.get(ALLOWANCE_KEY, { enabled: false, currency: '$', ratio: 10 }),
        storage.get(TOUR_COMPLETED_KEY, false)
      ]);
      let t = await storage.get(TASKS_KEY, DEFAULT_TASKS);
      const today = new Date().toLocaleDateString('en-CA');
      if (lastReset !== today) {
        t = t.map(task => ({ ...task, completedBy: [] }));
        await storage.set(TASKS_KEY, t);
        await storage.set(LAST_RESET_KEY, today);
      }
      setProfiles(p);
      setTasks(t);
      setHistory(h);
      setIsPremium(prem);
      setCurrentTheme(THEMES[themeKey] || THEMES.DEFAULT);
      setRewards(rew);
      setAllowanceSettings(allow);
      if (!tourDone) {
        setShowTour(true);
        setActiveTab('dashboard');
      }
      setIsDbReady(true);
    };
    initApp();
  }, []);

  useEffect(() => { if (isDbReady) storage.set(PROFILES_KEY, profiles); }, [profiles, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(TASKS_KEY, tasks); }, [tasks, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(HISTORY_KEY, history); }, [history, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(PREMIUM_KEY, isPremium); }, [isPremium, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(REWARDS_KEY, rewards); }, [rewards, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(ALLOWANCE_KEY, allowanceSettings); }, [allowanceSettings, isDbReady]);

  const handleTaskCompletion = (taskId, profileId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(profileId)) return;
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    triggerHaptic([40, 30, 40]);
    setHistory([{ id: Date.now().toString(), taskId, taskTitle: task.title, profileId, timestamp: Date.now(), starsEarned: task.starValue }, ...history]);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, stars: (p.stars || 0) + task.starValue } : p));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completedBy: [...t.completedBy, profileId] } : t));
    setMascotState(task.type === TaskType.JOINT ? 'JOINT_SUCCESS' : profile.role === Role.PARENT ? 'PARENT_SUCCESS' : 'CHILD_SUCCESS');
    showToast(`${profile.name} earned ${task.starValue} stars!`, '⭐');
  };

  const handleRedeemReward = (rewardId, profileId) => {
    const reward = rewards.find(r => r.id === rewardId);
    const profile = profiles.find(p => p.id === profileId);
    if (!reward || !profile || profile.stars < reward.cost) return;
    triggerHaptic([100, 50, 100]);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, stars: p.stars - reward.cost } : p));
    setMascotState('REWARD_REDEEMED');
    showToast(`${profile.name} redeemed ${reward.title}!`, reward.icon || '🎁');
  };

  const handleAddProfile = (name, role, avatar) => {
    const kidsCount = profiles.filter(p => p.role === Role.CHILD).length;
    if (!isPremium && role === Role.CHILD && kidsCount >= 2) {
      setIsPremiumModalOpen(true);
      return;
    }
    const newProfile = { id: Date.now().toString(), name, role, avatar, stars: 0 };
    setProfiles([...profiles, newProfile]);
    setIsProfileModalOpen(false);
    triggerHaptic(20);
  };

  const handleUpgrade = async () => {
    setUpgradeSuccess(true);
    triggerHaptic([50, 50, 100]);
    
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // Real Google Play Purchase via RevenueCat
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          const purchaseResult = await Purchases.purchasePackage({ 
            aPackage: offerings.current.availablePackages[0] 
          });
          if (purchaseResult.customerInfo.entitlements.active['pro_access']) {
            setIsPremium(true);
            await storage.set(PREMIUM_KEY, true);
          }
        }
      } else {
        // Mock Mode for Preview Environment
        setTimeout(async () => {
          setIsPremium(true);
          await storage.set(PREMIUM_KEY, true);
          setIsPremiumModalOpen(false);
          setUpgradeSuccess(false);
        }, 1500);
        return;
      }
    } catch (e) {
      console.error("Purchase Error:", e);
      alert("Purchase failed. Please try again.");
    }
    
    setUpgradeSuccess(false);
    setIsPremiumModalOpen(false);
  };

  const handleFactoryReset = async () => {
    triggerHaptic([100, 100, 100]);
    await storage.clearAll();
    window.location.href = window.location.pathname + "?reset=" + Date.now();
  };

  const parentStars = profiles.filter(p => p.role === Role.PARENT).reduce((s, p) => s + (p.stars || 0), 0);
  const childStars = profiles.filter(p => p.role === Role.CHILD).reduce((s, p) => s + (p.stars || 0), 0);

  const formatCash = (stars) => {
    if (!allowanceSettings.enabled) return null;
    const amount = (stars / allowanceSettings.ratio).toFixed(2);
    return `${allowanceSettings.currency}${amount}`;
  };

  if (!isDbReady) return null;
  if (!isAuthenticated) return html`<${PinScreen} theme=${currentTheme} onUnlock=${() => setIsAuthenticated(true)} />`;

  return html`
    <div style=${{ backgroundColor: currentTheme.surface }} className="flex flex-col h-screen max-w-md mx-auto overflow-hidden relative">
      ${!isOnline && html`
        <div className="bg-[#ba1a1a] text-white py-1 px-4 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse z-[100] flex items-center justify-center gap-2">
          <${WifiOff} size=${10} /> Offline Mode - Working Locally
        </div>
      `}

      <div className="flex-1 overflow-y-auto pb-36 px-6">
        <header className="pt-14 pb-8 flex justify-between items-start">
          <div>
            <h1 className="text-[32px] font-normal text-[#1c1b1f]">SuperParent</h1>
            <p className="text-[#49454f] text-sm mt-1 font-medium">Practical Parenting App</p>
          </div>
          <button onClick=${() => setActiveTab('settings')} className="p-3 bg-[#e7e0eb] rounded-full text-[#49454f]"><${Settings} size=${20} /></button>
        </header>

        ${activeTab === 'dashboard' && html`
          <div className="space-y-6">
            <${Mascot} isOnline=${isOnline} state=${mascotState} onAnimationEnd=${() => setMascotState('IDLE')} />
            
            ${!isPremium && html`
              <div onClick=${() => setIsPremiumModalOpen(true)} className="bg-gradient-to-r from-[#6750a4] to-[#3d4975] p-6 rounded-[32px] shadow-sm cursor-pointer active:scale-95 transition-all text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Get Premium</h3>
                    <p className="text-[10px] opacity-70 font-medium uppercase tracking-wider">Unlimited kids, tasks & store</p>
                  </div>
                  <${ChevronRight} size=${18} />
                </div>
              </div>
            `}

            <div className="grid grid-cols-2 gap-4">
              <div style=${{ backgroundColor: currentTheme.primary }} className="rounded-[32px] p-6 text-white shadow-lg">
                <div className="text-[10px] font-medium uppercase tracking-widest opacity-80 mb-2">Parents</div>
                <div className="text-3xl font-medium flex items-center gap-2">${parentStars} <${Star} size={20} fill="gold" className="text-yellow-400" /></div>
              </div>
              <div style=${{ backgroundColor: currentTheme.bg }} className="rounded-[32px] p-6 border border-[#e7e0eb]">
                <div style=${{ color: currentTheme.primary }} className="text-[10px] font-medium uppercase tracking-widest opacity-80 mb-2">Kids</div>
                <div className="text-3xl font-medium text-[#1c1b1f] flex items-center gap-2">${childStars} <${Star} size={24} fill=${currentTheme.primary} /></div>
                ${allowanceSettings.enabled && html`
                  <div className="mt-2 text-sm font-bold text-green-600 flex items-center gap-1">
                    <${CreditCard} size=${14} /> ${formatCash(childStars)} Total
                  </div>
                `}
              </div>
            </div>
          </div>
        `}

        ${activeTab === 'tasks' && html`
          <div className="space-y-4">
            ${tasks.map(task => html`
              <div key=${task.id} className="bg-[#f7f2fa] rounded-[28px] p-6 border border-[#e7e0eb]/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-widest bg-white/60 px-2 py-1 rounded-full text-[#49454f]">${task.type}</span>
                    <h3 className="text-xl font-medium mt-2 text-[#1c1b1f]">${task.title}</h3>
                    <p className="text-sm text-[#49454f] mt-1 opacity-70">${task.description}</p>
                  </div>
                  <div style=${{ color: currentTheme.primary }} className="text-xl font-medium flex items-center gap-1">+${task.starValue} <${Star} size=${16} fill=${currentTheme.primary} /></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  ${profiles.map(p => {
                    const done = task.completedBy.includes(p.id);
                    if (task.type === TaskType.INDIVIDUAL && p.role !== Role.CHILD) return null;
                    return html`
                      <button 
                        key=${p.id}
                        onClick=${() => handleTaskCompletion(task.id, p.id)} 
                        disabled=${done}
                        className=${`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${done ? 'bg-gray-200 text-gray-500' : 'bg-[#6750a4] text-white shadow-md active:scale-95'}`}
                      >
                        <span className="text-lg">${done ? html`<${CheckCircle2} size=${16} />` : p.avatar}</span>
                        ${p.name}
                      </button>
                    `;
                  })}
                </div>
              </div>
            `)}
            <button 
              onClick=${() => {
                if(!isPremium && tasks.length >= 5) { setIsPremiumModalOpen(true); return; }
                setIsTaskModalOpen(true);
              }}
              className="fixed bottom-32 right-6 w-16 h-16 bg-[#d3e3fd] rounded-[24px] shadow-xl text-[#041e49] flex items-center justify-center active:scale-90 transition-all z-50 ripple"
            >
              <${Plus} size=${36} />
            </button>
          </div>
        `}

        ${activeTab === 'shop' && html`
          <div className="space-y-4">
            ${!isPremium ? html`
              <div className="text-center py-20 bg-[#f7f2fa] rounded-[40px] border border-dashed border-[#e7e0eb] p-8 mt-4">
                <${Lock} size=${40} className="mx-auto text-[#79747e]/40 mb-4" />
                <h3 className="text-xl font-medium text-[#1c1b1f]">Star Store Locked</h3>
                <p className="text-sm text-[#49454f] mt-2 mb-6">Upgrade to create custom real-world rewards for your kids.</p>
                <button onClick=${() => setIsPremiumModalOpen(true)} className="bg-[#6750a4] text-white px-8 py-3 rounded-full font-medium shadow-sm">Get SuperParent Pro</button>
              </div>
            ` : html`
               <div className="flex justify-between items-center mb-4 pt-2">
                 <h2 className="text-xl font-medium text-[#1c1b1f]">Star Store</h2>
                 <button onClick=${() => setIsRewardModalOpen(true)} className="p-2 bg-[#e7e0eb] rounded-full text-[#49454f]"><${Plus} size=${20} /></button>
               </div>
               ${rewards.map(r => html`
                 <div key=${r.id} className="bg-[#f7f2fa] p-5 rounded-[32px] border border-[#e7e0eb] mb-4">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="text-4xl">${r.icon}</div>
                        <div>
                          <h4 className="font-medium text-[#1c1b1f]">${r.title}</h4>
                          <span className="text-xs font-medium text-[#6750a4] uppercase tracking-widest">${r.cost} Stars</span>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2">
                       ${profiles.filter(p => p.role === Role.CHILD).map(p => html`
                         <button 
                           key=${p.id}
                           disabled=${p.stars < r.cost}
                           onClick=${() => handleRedeemReward(r.id, p.id)}
                           className=${`text-xs px-4 py-2 rounded-full font-medium ${p.stars >= r.cost ? 'bg-[#6750a4] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                         >
                           ${p.name}
                         </button>
                       `)}
                     </div>
                   </div>
                 </div>
               `)}
            `}
          </div>
        `}

        ${activeTab === 'hub' && html`
          <div className="space-y-8 pb-10">
            <div className="relative overflow-hidden rounded-[40px] bg-[#1c1b1f] p-8 text-white shadow-2xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#6750a4]/20 blur-3xl"></div>
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Expert Access</span>
                  <div className="h-1 w-1 rounded-full bg-white/40"></div>
                  <span className="text-[10px] font-medium text-white/60">${isPremium ? 'Pro Member' : 'Guest Access'}</span>
                </div>
                <h2 className="text-3xl font-medium leading-tight">Parenting <br/> Intelligence</h2>
                <p className="mt-2 text-sm text-white/60">Evidence-based strategies for modern families.</p>
              </div>
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#79747e]">Featured Guides</h3>
                <${ChevronRight} size=${16} className="text-[#79747e]" />
              </div>
              <div className="space-y-4">
                ${PARENTING_TIPS.map(tip => html`
                  <div key=${tip.id} 
                       onClick=${() => {
                         if (!isPremium && tip.id !== 'p1') {
                           setIsPremiumModalOpen(true);
                         } else {
                           setSelectedTip(tip);
                         }
                       }}
                       className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-sm border border-[#e7e0eb] active:scale-[0.98] transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded-full bg-[#f3edf7] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6750a4]">Ages ${tip.age}</span>
                          <span className="text-[10px] font-medium text-[#79747e]">• ${tip.readTime}</span>
                        </div>
                        <h4 className="text-xl font-medium text-[#1c1b1f] group-hover:text-[#6750a4] transition-colors">${tip.title}</h4>
                        <p className="mt-1 text-xs text-[#79747e] font-medium">By ${tip.author}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f2fa] text-[#6750a4]">
                        ${!isPremium && tip.id !== 'p1' ? html`<${Lock} size=${16} />` : html`<${ChevronRight} size=${18} />`}
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </section>

            <section className="rounded-[40px] bg-[#f7f2fa] p-8 border border-[#e7e0eb]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <${Lightbulb} className="text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#1c1b1f]">Expert Q&A</h3>
                  <p className="text-xs text-[#79747e]">Common challenges solved.</p>
                </div>
              </div>
              <div className="space-y-4">
                ${EXPERT_QA.map(qa => html`
                  <div className="rounded-2xl bg-white/60 p-4 border border-white/40">
                    <p className="text-sm font-bold text-[#1c1b1f] mb-1">Q: ${qa.q}</p>
                    <p className="text-sm text-[#49454f] leading-relaxed">${isPremium ? qa.a : 'Upgrade to Pro to see expert answers...'}</p>
                  </div>
                `)}
              </div>
            </section>

            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#6750a4] to-[#3d4975] p-8 text-white shadow-xl">
              <div className="relative z-10">
                <${Heart} className="mb-4 text-[#d3e3fd]" />
                <h3 className="text-2xl font-medium mb-2">${isPremium ? 'Pro Community' : 'Join the Inner Circle'}</h3>
                <p className="text-sm opacity-80 mb-6 leading-relaxed">
                  ${isPremium 
                    ? 'You have direct access to our monthly webinars and private forum. New expert content drops every Tuesday.' 
                    : 'Get direct access to child psychologists, monthly live Q&As, and our private community of 5,000+ parents.'}
                </p>
                ${!isPremium ? html`
                  <button onClick=${() => setIsPremiumModalOpen(true)} className="w-full rounded-full bg-white py-4 font-medium text-[#6750a4] shadow-lg active:scale-95 transition-all">
                    Unlock Expert Access
                  </button>
                ` : html`
                  <div className="flex items-center gap-2 rounded-2xl bg-white/20 p-4 justify-center font-medium">
                    <${CheckCircle2} size=${20} /> Pro Membership Active
                  </div>
                `}
              </div>
            </div>
          </div>
        `}

        ${activeTab === 'profiles' && html`
          <div className="grid grid-cols-2 gap-4 pt-2">
            ${profiles.map(p => html`
              <div className="bg-[#f7f2fa] rounded-[32px] p-6 text-center border border-[#e7e0eb]">
                <div className="text-5xl mb-3 bg-white w-20 h-20 flex items-center justify-center rounded-full mx-auto shadow-sm">${p.avatar}</div>
                <div className="font-medium text-lg text-[#1c1b1f]">${p.name}</div>
                <div style=${{ color: currentTheme.primary }} className="mt-4 text-xl font-medium flex items-center justify-center gap-1">
                  <${Star} size={18} fill=${currentTheme.primary} /> ${p.stars || 0}
                </div>
                ${allowanceSettings.enabled && p.role === Role.CHILD && html`
                  <div className="mt-2 text-sm font-bold text-green-600 flex items-center justify-center gap-1">
                    <${CreditCard} size=${14} /> ${formatCash(p.stars || 0)}
                  </div>
                `}
              </div>
            `)}
            <button 
              onClick=${() => setIsProfileModalOpen(true)}
              className="rounded-[32px] border-2 border-dashed border-[#e7e0eb] p-8 flex flex-col items-center justify-center text-[#79747e] active:bg-slate-50 transition-all"
            >
              <${UserPlus} size=${32} className="mb-2 opacity-50" />
              <span className="text-[10px] font-medium uppercase tracking-widest">Add Member</span>
            </button>
          </div>
        `}

        ${activeTab === 'settings' && html`
          <div className="space-y-4 pt-2">
            <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#e7e0eb]">
              <h3 className="font-medium text-[#1c1b1f] flex items-center gap-2 mb-6"><${CreditCard} size=${20} /> Allowance Mode</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-transparent">
                  <div>
                    <div className="font-medium text-sm text-[#1c1b1f]">Enable Allowance</div>
                    <div className="text-[10px] text-[#49454f] opacity-70">Convert stars to virtual cash</div>
                  </div>
                  <button 
                    onClick=${() => {
                      if (!isPremium) { setIsPremiumModalOpen(true); return; }
                      setAllowanceSettings(prev => ({ ...prev, enabled: !prev.enabled }));
                    }}
                    className=${`w-12 h-6 rounded-full transition-all relative ${allowanceSettings.enabled ? 'bg-[#6750a4]' : 'bg-gray-300'}`}
                  >
                    <div className=${`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowanceSettings.enabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                
                ${allowanceSettings.enabled && html`
                  <button 
                    onClick=${() => setIsAllowanceModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-white shadow-sm rounded-2xl border border-[#e7e0eb]"
                  >
                    <span className="font-medium text-sm text-[#1c1b1f]">Configure Rates</span>
                    <div className="flex items-center gap-2 text-[#6750a4] font-bold text-sm">
                      ${allowanceSettings.ratio} Stars = ${allowanceSettings.currency}1.00
                      <${ChevronRight} size=${16} />
                    </div>
                  </button>
                `}
                
                ${!isPremium && html`
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <${Lock} size=${14} className="text-yellow-600" />
                    <span className="text-[10px] font-medium text-yellow-700 uppercase tracking-wider">Pro Feature</span>
                  </div>
                `}
              </div>
            </div>

            <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#e7e0eb]">
              <h3 className="font-medium text-[#1c1b1f] flex items-center gap-2 mb-6"><${Palette} size=${20} /> Themes</h3>
              <div className="grid grid-cols-1 gap-2">
                ${Object.keys(THEMES).map(k => {
                  const t = THEMES[k];
                  const locked = !isPremium && k !== 'DEFAULT';
                  return html`
                    <button 
                      key=${k}
                      onClick=${() => {
                        if(locked) { setIsPremiumModalOpen(true); return; }
                        setCurrentTheme(t);
                        storage.set(THEME_KEY, k);
                      }}
                      className=${`flex items-center justify-between p-4 rounded-2xl border ${currentTheme.name === t.name ? 'border-[#6750a4] bg-white shadow-sm' : 'border-transparent bg-white/40'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div style=${{ backgroundColor: t.primary }} className="w-5 h-5 rounded-full" />
                        <span className="font-medium text-sm text-[#1c1b1f]">${t.name}</span>
                      </div>
                      ${locked && html`<${Lock} size=${14} className="text-gray-300" />`}
                      ${!locked && currentTheme.name === t.name && html`<${Check} size=${16} className="text-[#6750a4]" />`}
                    </button>
                  `;
                })}
              </div>
            </div>

            <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#e7e0eb]">
              <div className="flex items-center gap-2 mb-4 text-[#ba1a1a]">
                <${AlertTriangle} size=${20} />
                <h3 className="font-medium">Danger Zone</h3>
              </div>
              <p className="text-xs text-[#49454f] mb-6 font-medium leading-relaxed">Factory reset clears all data, profiles, and premium status. This cannot be undone.</p>
              <button 
                onClick=${() => setIsResetConfirmOpen(true)}
                className="w-full bg-white border border-[#ba1a1a]/20 text-[#ba1a1a] py-4 rounded-2xl flex items-center justify-center gap-2 font-medium active:scale-95 transition-all ripple"
              >
                <${Trash2} size=${20} /> Reset App
              </button>
            </div>
          </div>
        `}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#f3edf7]/95 backdrop-blur-md h-28 flex items-center justify-around px-2 border-t border-[#e7e0eb] z-[80] pb-6">
        ${[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'tasks', icon: List, label: 'Goals' },
          { id: 'shop', icon: ShoppingBag, label: 'Shop' },
          { id: 'hub', icon: BookOpen, label: 'Hub' },
          { id: 'profiles', icon: User, label: 'Team' }
        ].map(tab => html`
          <button 
            key=${tab.id}
            onClick=${() => {
              if (showTour) return;
              setActiveTab(tab.id);
            }} 
            className=${`flex flex-col items-center gap-1 w-1/5 transition-all ${activeTab === tab.id ? 'text-[#6750a4]' : 'text-[#49454f]'}`}
          >
            <div className=${`p-2 px-4 rounded-full transition-all ${activeTab === tab.id ? 'bg-[#e8def8]' : ''}`}>
              <${tab.icon} size=${22} strokeWidth=${activeTab === tab.id ? 2 : 1.5} />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-widest mt-1">${tab.label}</span>
          </button>
        `)}
      </nav>

      ${toast && html`
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1c1b1f] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <span className="text-xl">${toast.icon}</span>
            <span className="text-sm font-medium">${toast.message}</span>
          </div>
        </div>
      `}

      ${showTour && html`
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end p-6 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl mb-32 relative animate-in slide-in-from-bottom-10 duration-500">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg">🐶</div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-medium text-[#1c1b1f] leading-tight">${tourSteps[tourStep].title}</h3>
              <span className="text-[10px] font-bold text-[#6750a4] bg-[#e8def8] px-2 py-1 rounded-full">${tourStep + 1}/${tourSteps.length}</span>
            </div>
            <p className="text-[#49454f] leading-relaxed mb-8 font-medium opacity-80">${tourSteps[tourStep].content}</p>
            <div className="flex gap-3">
              <button onClick=${completeTour} className="flex-1 py-4 text-[#49454f] font-medium text-sm">Skip</button>
              <button onClick=${nextTourStep} className="flex-[2] bg-[#6750a4] text-white py-4 rounded-full font-medium shadow-lg active:scale-95 transition-all ripple">
                ${tourStep === tourSteps.length - 1 ? 'Get Started!' : 'Next'}
              </button>
            </div>
          </div>
          
          <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            ${tourSteps.map((_, i) => html`
              <div key=${i} className=${`h-1.5 rounded-full transition-all duration-300 ${i === tourStep ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`} />
            `)}
          </div>
        </div>
      `}

      <${M3BottomSheet} isOpen=${isProfileModalOpen} onClose=${() => setIsProfileModalOpen(false)} theme=${currentTheme} title="New Member">
        <form onSubmit=${(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          handleAddProfile(fd.get('name'), fd.get('role'), fd.get('avatar'));
        }} className="space-y-6 pb-10">
          <input name="name" required placeholder="Name (e.g. Leo)" className="w-full bg-white border border-[#e7e0eb] p-5 rounded-2xl text-lg outline-none focus:border-[#6750a4]" />
          <div className="flex gap-3">
            ${[Role.PARENT, Role.CHILD].map(r => html`
              <label key=${r} className="flex-1">
                <input type="radio" name="role" value=${r} defaultChecked=${r === Role.PARENT} className="hidden peer" />
                <div className="text-center p-4 rounded-2xl border border-[#e7e0eb] peer-checked:bg-[#6750a4] peer-checked:text-white font-medium transition-all">${r}</div>
              </label>
            `)}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            ${AVATARS.map(a => html`
              <label key=${a.char} className="relative">
                <input type="radio" name="avatar" value=${a.char} defaultChecked=${a.char === AVATARS[0].char} disabled=${!isPremium && a.premium} className="hidden peer" />
                <div className=${`w-14 h-14 flex items-center justify-center bg-white border border-[#e7e0eb] rounded-2xl text-2xl peer-checked:bg-[#e8def8] peer-checked:border-[#6750a4] transition-all shadow-sm ${!isPremium && a.premium ? 'opacity-30' : 'cursor-pointer'}`}>
                  ${a.char}
                </div>
                ${!isPremium && a.premium && html`<div className="absolute -top-1 -right-1 bg-yellow-400 p-0.5 rounded-full shadow-md"><${Lock} size=${10} /></div>`}
              </label>
            `)}
          </div>
          <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-medium text-lg shadow-lg ripple">Add to Team</button>
        </form>
      <//>

      <${M3BottomSheet} isOpen=${isTaskModalOpen} onClose=${() => setIsTaskModalOpen(false)} theme=${currentTheme} title="New Goal">
        <form onSubmit=${(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newTask = {
            id: Date.now().toString(),
            title: fd.get('title'),
            description: fd.get('description'),
            type: fd.get('type'),
            starValue: parseInt(fd.get('stars')),
            completedBy: [],
            isRecurring: 'daily'
          };
          setTasks([...tasks, newTask]);
          setIsTaskModalOpen(false);
          triggerHaptic(20);
        }} className="space-y-4 pb-10">
          <input name="title" required placeholder="Goal Title" className="w-full bg-white border border-[#e7e0eb] p-5 rounded-2xl text-lg outline-none" />
          <textarea name="description" placeholder="Short description..." className="w-full bg-white border border-[#e7e0eb] p-4 rounded-2xl h-24 outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <select name="type" className="bg-white border border-[#e7e0eb] p-4 rounded-2xl font-medium outline-none">
              <option value=${TaskType.INDIVIDUAL}>Child Task</option>
              <option value=${TaskType.JOINT}>Joint Goal</option>
            </select>
            <input name="stars" type="number" defaultValue="5" className="bg-white border border-[#e7e0eb] p-4 rounded-2xl font-medium outline-none text-center" />
          </div>
          <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-medium text-lg shadow-lg ripple">Create Goal</button>
        </form>
      <//>

      <${M3BottomSheet} isOpen=${isRewardModalOpen} onClose=${() => setIsRewardModalOpen(false)} theme=${currentTheme} title="New Reward">
        <form onSubmit=${(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const newReward = {
            id: Date.now().toString(),
            title: fd.get('title'),
            cost: parseInt(fd.get('cost')),
            icon: fd.get('icon') || '🎁'
          };
          setRewards([...rewards, newReward]);
          setIsRewardModalOpen(false);
        }} className="space-y-4 pb-10">
           <input name="title" required placeholder="Reward (e.g. Pizza Party)" className="w-full bg-white border border-[#e7e0eb] p-5 rounded-2xl text-lg outline-none" />
           <div className="grid grid-cols-2 gap-4">
             <input name="cost" type="number" placeholder="Star Cost" required className="bg-white border border-[#e7e0eb] p-4 rounded-2xl font-medium outline-none text-center" />
             <input name="icon" placeholder="Emoji" className="bg-white border border-[#e7e0eb] p-4 rounded-2xl text-center text-2xl outline-none" />
           </div>
           <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-medium text-lg shadow-lg ripple">Add to Store</button>
        </form>
      <//>

      <${M3BottomSheet} isOpen=${isPremiumModalOpen} onClose=${() => setIsPremiumModalOpen(false)} theme=${currentTheme} title="Pro Edition">
        ${upgradeSuccess ? html`
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
              <${Check} size=${48} />
            </div>
            <h3 className="text-2xl font-medium text-[#1c1b1f] mb-2">Welcome to Pro!</h3>
            <p className="text-[#49454f] font-medium opacity-70">Unlocking all features for your family...</p>
          </div>
        ` : html`
          <${PremiumUpsell} onClose=${() => setIsPremiumModalOpen(false)} onUpgrade=${handleUpgrade} theme=${currentTheme} />
        `}
      <//>

      <${M3BottomSheet} isOpen=${!!selectedTip} onClose=${() => setSelectedTip(null)} theme=${currentTheme} title="Expert Guide">
        <div className="p-2 space-y-8 pb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#f3edf7] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6750a4]">Ages ${selectedTip?.age}</span>
              <div className="h-1 w-1 rounded-full bg-[#79747e]/40"></div>
              <span className="text-xs font-medium text-[#79747e]">${selectedTip?.readTime}</span>
            </div>
            <${Lightbulb} size=${24} className="text-yellow-500" />
          </div>
          
          <div>
            <h3 className="text-3xl font-medium leading-tight text-[#1c1b1f]">${selectedTip?.title}</h3>
            <p className="mt-2 text-sm font-medium text-[#79747e]">Written by ${selectedTip?.author}</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-[#f7f2fa] p-8 border border-[#e7e0eb]">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#6750a4]">The Strategy</h4>
              <p className="text-lg leading-relaxed text-[#49454f] whitespace-pre-line">
                ${selectedTip?.details}
              </p>
            </div>

            <div className="rounded-[32px] bg-white p-8 border border-[#e7e0eb] shadow-sm">
              <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#6750a4]">Action Plan</h4>
              <div className="space-y-4">
                ${selectedTip?.actionPlan?.map((item, i) => html`
                  <div key=${i} className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6750a4] text-[10px] font-bold text-white">${i + 1}</div>
                    <p className="text-sm font-medium text-[#49454f]">${item}</p>
                  </div>
                `)}
              </div>
            </div>
          </div>

          <button onClick=${() => setSelectedTip(null)} className="w-full rounded-full bg-[#6750a4] py-5 text-lg font-medium text-white shadow-lg active:scale-95 transition-all">
            Mark as Read
          </button>
        </div>
      <//>

      <${M3BottomSheet} isOpen=${isAllowanceModalOpen} onClose=${() => setIsAllowanceModalOpen(false)} theme=${currentTheme} title="Allowance Settings">
        <form onSubmit=${(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          setAllowanceSettings(prev => ({
            ...prev,
            currency: fd.get('currency'),
            ratio: parseInt(fd.get('ratio'))
          }));
          setIsAllowanceModalOpen(false);
          triggerHaptic(20);
        }} className="space-y-6 pb-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#49454f] uppercase tracking-widest ml-1">Currency Symbol</label>
            <input name="currency" defaultValue=${allowanceSettings.currency} required className="w-full bg-white border border-[#e7e0eb] p-5 rounded-2xl text-lg outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#49454f] uppercase tracking-widest ml-1">Exchange Rate (Stars per ${allowanceSettings.currency}1.00)</label>
            <input name="ratio" type="number" defaultValue=${allowanceSettings.ratio} required className="w-full bg-white border border-[#e7e0eb] p-5 rounded-2xl text-lg outline-none" />
            <p className="text-[10px] text-[#49454f] opacity-70 ml-1 italic">Example: If set to 10, then 50 stars = ${allowanceSettings.currency}5.00</p>
          </div>
          <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-medium text-lg shadow-lg ripple">Save Settings</button>
        </form>
      <//>

      <${M3BottomSheet} isOpen=${isResetConfirmOpen} onClose=${() => setIsResetConfirmOpen(false)} theme=${currentTheme} title="Confirm Reset">
        <div className="p-2 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-[#ba1a1a]">
               <${AlertTriangle} size=${40} />
             </div>
             <h3 className="text-xl font-medium text-[#1c1b1f]">Are you absolutely sure?</h3>
             <p className="text-[#49454f] text-sm font-medium opacity-80 leading-relaxed">This will permanently delete all your kids' stars, history, profiles, and custom rewards. Even Premium status will be lost.</p>
          </div>
          <div className="space-y-3">
             <button onClick=${handleFactoryReset} className="w-full bg-[#ba1a1a] text-white py-5 rounded-full font-medium shadow-lg ripple">YES, DELETE EVERYTHING</button>
             <button onClick=${() => setIsResetConfirmOpen(false)} className="w-full bg-[#f7f2fa] text-[#49454f] py-4 rounded-full font-medium">CANCEL</button>
          </div>
        </div>
      <//>
    </div>
  `;
}