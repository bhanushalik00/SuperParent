
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { 
  Plus, Settings, Home, List, Trophy, Lock, UserPlus, 
  User, CheckCircle2, ChevronRight, Star, History, 
  Flame, Rocket, ShieldCheck, Cpu, Github, X, Trash2, Key, Download 
} from 'lucide-react';

const html = htm.bind(React.createElement);

// --- Constants & Types (Simplified) ---
const Role = { PARENT: 'PARENT', CHILD: 'CHILD' };
const TaskType = { INDIVIDUAL: 'INDIVIDUAL', JOINT: 'JOINT' };
const PIN_KEY = 'superparent_pin';
const PROFILES_KEY = 'superparent_profiles';
const TASKS_KEY = 'superparent_tasks';
const HISTORY_KEY = 'superparent_history';
const STREAKS_KEY = 'superparent_streaks';
const AVATARS = ['🦁', '🐘', '🦒', '🦓', '🐼', '🐨', '🦊', '🦉', '🐢', '🦖', '👨‍🚀', '👩‍🔬', '👨‍🚒', '👩‍🎨'];

const DEFAULT_TASKS = [
  { id: 't1', title: 'Brush Teeth', description: 'Clean your teeth for 2 minutes', type: TaskType.INDIVIDUAL, starValue: 2, completedBy: [], isRecurring: 'daily' },
  { id: 't2', title: 'Finish Homework', description: 'All school work done for the day', type: TaskType.INDIVIDUAL, starValue: 5, completedBy: [], isRecurring: 'daily' },
  { id: 't3', title: 'Morning Walk', description: 'Parent & Child walk together', type: TaskType.JOINT, starValue: 10, completedBy: [], isRecurring: 'daily' }
];

const storage = {
  get: (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch { return defaultValue; }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};

const triggerHaptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// --- Components ---

const Mascot = ({ state, onAnimationEnd }) => {
  const [displayText, setDisplayText] = useState("Hi Super Parent!");
  
  useEffect(() => {
    const texts = {
      CHILD_SUCCESS: "Awesome job, kiddo! 🎉",
      PARENT_SUCCESS: "Great role modeling! ⭐",
      JOINT_SUCCESS: "Teamwork makes the dream work! 🤝",
      STREAK_BOOST: "Wow! A new streak record! 🔥",
      CHEER: "Keep going! You're doing great!",
      IDLE: "Ready for today's goals?"
    };
    setDisplayText(texts[state] || texts.IDLE);
    if (state !== 'IDLE' && onAnimationEnd) {
      const timer = setTimeout(onAnimationEnd, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, onAnimationEnd]);

  const emojis = { IDLE: '🐶', CHILD_SUCCESS: '🥳', PARENT_SUCCESS: '😎', JOINT_SUCCESS: '🤩', STREAK_BOOST: '🔥', CHEER: '🐕' };

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

const PinScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [savedPin] = useState(() => storage.get(PIN_KEY, ''));
  const [error, setError] = useState(false);

  const handleInput = (val) => {
    triggerHaptic(8);
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (!savedPin || newPin === savedPin) {
          if (!savedPin) storage.set(PIN_KEY, newPin);
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

  return html`
    <div className="fixed inset-0 bg-[#6750a4] flex flex-col items-center justify-center p-8 z-[200] text-white">
      <div className="mb-12 text-center">
        <div className="bg-white/20 p-8 rounded-[32px] inline-block mb-6 shadow-xl">
          <${Lock} size=${48} className="text-white" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight mb-2">${savedPin ? 'Parent Access' : 'Create Admin PIN'}</h1>
        <p className="text-[#eaddff] text-sm font-medium opacity-80">Only parents should know this PIN</p>
      </div>
      <div className="flex gap-6 mb-20">
        ${[0, 1, 2, 3].map(i => html`
          <div key=${i} className=${`w-4 h-4 rounded-full border-2 border-white transition-all ${pin.length > i ? 'bg-white scale-125' : 'bg-transparent'} ${error ? 'bg-red-400 border-red-400' : ''}`} />
        `)}
      </div>
      <div className="grid grid-cols-3 gap-x-10 gap-y-8">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(btn => html`
          <button key=${btn} onClick=${() => btn === 'C' ? setPin('') : btn === '←' ? setPin(p => p.slice(0, -1)) : handleInput(btn.toString())}
            className="w-20 h-20 rounded-full bg-white/10 active:bg-white/30 flex items-center justify-center text-3xl font-medium ripple">
            ${btn}
          </button>
        `)}
      </div>
    </div>
  `;
};

const M3BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return html`
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick=${onClose}></div>
      <div className="bg-[#f3edf7] w-full rounded-t-[32px] p-6 pb-14 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-[#79747e]/30 rounded-full mx-auto mb-8"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-[#1c1b1f]">${title}</h2>
          <button onClick=${onClose} className="p-3 bg-white/50 rounded-full"><${X} size=${20} /></button>
        </div>
        ${children}
      </div>
    </div>
  `;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profiles, setProfiles] = useState(() => storage.get(PROFILES_KEY, []));
  const [tasks, setTasks] = useState(() => storage.get(TASKS_KEY, DEFAULT_TASKS));
  const [history, setHistory] = useState(() => storage.get(HISTORY_KEY, []));
  const [streaks, setStreaks] = useState(() => storage.get(STREAKS_KEY, {}));
  const [mascotState, setMascotState] = useState('IDLE');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => { storage.set(PROFILES_KEY, profiles); }, [profiles]);
  useEffect(() => { storage.set(TASKS_KEY, tasks); }, [tasks]);
  useEffect(() => { storage.set(HISTORY_KEY, history); }, [history]);
  useEffect(() => { storage.set(STREAKS_KEY, streaks); }, [streaks]);

  const handleTaskCompletion = (taskId, profileId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(profileId)) return;
    
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    triggerHaptic([40, 30, 40]);
    setHistory([{ id: Date.now().toString(), taskId, taskTitle: task.title, profileId, timestamp: Date.now(), starsEarned: task.starValue }, ...history]);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, stars: p.stars + task.starValue } : p));
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completedBy: [...t.completedBy, profileId] } : t));
    setMascotState(task.type === TaskType.JOINT ? 'JOINT_SUCCESS' : profile.role === Role.PARENT ? 'PARENT_SUCCESS' : 'CHILD_SUCCESS');
  };

  const parentStars = profiles.filter(p => p.role === Role.PARENT).reduce((s, p) => s + p.stars, 0);
  const childStars = profiles.filter(p => p.role === Role.CHILD).reduce((s, p) => s + p.stars, 0);

  if (!isAuthenticated) return html`<${PinScreen} onUnlock=${() => setIsAuthenticated(true)} />`;

  return html`
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#fdfbff] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-36 px-6">
        <header className="pt-14 pb-8 flex justify-between items-start">
          <div>
            <h1 className="text-[32px] font-normal text-[#1c1b1f]">SuperParent</h1>
            <p className="text-[#49454f] text-sm mt-1">Family Rewards Hub</p>
          </div>
          <button onClick=${() => setActiveTab('settings')} className="p-3 bg-[#e7e0eb] rounded-full"><${Settings} size=${20} /></button>
        </header>

        ${activeTab === 'dashboard' && html`
          <div>
            <${Mascot} state=${mascotState} onAnimationEnd=${() => setMascotState('IDLE')} />
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-[#6750a4] rounded-[32px] p-6 text-white shadow-lg">
                <div className="text-[11px] font-bold uppercase mb-2">Parents</div>
                <div className="text-3xl font-medium flex items-center gap-2">${parentStars} <${Star} size=${24} fill="gold" /></div>
              </div>
              <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#6750a4]/10">
                <div className="text-[11px] font-bold uppercase mb-2 text-[#6750a4]">Kids</div>
                <div className="text-3xl font-medium flex items-center gap-2">${childStars} <${Star} size=${24} fill="#6750a4" /></div>
              </div>
            </div>
            <div className="mt-6 p-6 bg-[#d7effb] rounded-[28px] flex items-center justify-between">
              <div>
                <h3 className="font-bold">Goal Status</h3>
                <p className="text-sm opacity-70">${childStars >= parentStars ? "Kids are winning! 🚀" : "Parents lead by example! 💪"}</p>
              </div>
              <${Trophy} size=${32} className="opacity-40" />
            </div>
          </div>
        `}

        ${activeTab === 'tasks' && html`
          <div className="space-y-4 pt-4">
            ${tasks.map(task => html`
              <div key=${task.id} className="bg-[#f7f2fa] rounded-[28px] p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-white/50 px-2 py-1 rounded-full">${task.type}</span>
                    <h3 className="text-lg font-bold mt-1">${task.title}</h3>
                  </div>
                  <div className="text-xl font-bold text-[#6750a4]">+${task.starValue} ★</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  ${profiles.map(p => {
                    const done = task.completedBy.includes(p.id);
                    if (task.type === TaskType.INDIVIDUAL && p.role !== Role.CHILD) return null;
                    return html`
                      <button onClick=${() => handleTaskCompletion(task.id, p.id)} disabled=${done}
                        className=${`px-4 py-2 rounded-full text-sm font-medium transition-all ${done ? 'bg-gray-200 text-gray-500' : 'bg-[#6750a4] text-white'}`}>
                        ${p.avatar} ${p.name} ${done ? '✓' : ''}
                      </button>
                    `;
                  })}
                </div>
              </div>
            `)}
          </div>
        `}

        ${activeTab === 'history' && html`
          <div className="space-y-4 pt-4">
            ${history.map(item => html`
              <div key=${item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <div className="text-2xl">${profiles.find(p => p.id === item.profileId)?.avatar}</div>
                <div className="flex-1">
                  <div className="font-bold">${item.taskTitle}</div>
                  <div className="text-xs text-gray-500">${new Date(item.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="font-bold text-[#6750a4]">+${item.starsEarned} ★</div>
              </div>
            `)}
          </div>
        `}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md h-24 flex items-center justify-around border-t border-gray-100 z-50">
        ${[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'tasks', icon: List, label: 'Tasks' },
          { id: 'history', icon: History, label: 'Log' },
          { id: 'profiles', icon: User, label: 'Team' }
        ].map(tab => html`
          <button onClick=${() => setActiveTab(tab.id)} className=${`flex flex-col items-center gap-1 w-1/4 ${activeTab === tab.id ? 'text-[#6750a4]' : 'text-gray-400'}`}>
            <${tab.icon} size=${24} />
            <span className="text-[10px] font-bold uppercase">${tab.label}</span>
          </button>
        `)}
      </nav>

      <${M3BottomSheet} isOpen=${isTaskModalOpen} onClose=${() => setIsTaskModalOpen(false)} title="New Goal">
        <p className="text-center py-10">Task editor form goes here...</p>
      <//>
    </div>
  `;
}
