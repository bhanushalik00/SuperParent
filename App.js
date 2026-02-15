import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { 
  Plus, Settings, Home, List, Trophy, Lock, UserPlus, 
  User, CheckCircle2, Star, History, Trash2, X 
} from 'lucide-react';
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
const AVATARS = ['🦁', '🐘', '🦒', '🦓', '🐼', '🐨', '🦊', '🦉', '🐢', '🦖', '👨‍🚀', '👩‍🔬', '👨‍🚒', '👩‍🎨'];

const DEFAULT_TASKS = [
  { id: 't1', title: 'Brush Teeth', description: 'Clean your teeth for 2 minutes', type: TaskType.INDIVIDUAL, starValue: 2, completedBy: [], isRecurring: 'daily' },
  { id: 't2', title: 'Finish Homework', description: 'All school work done for the day', type: TaskType.INDIVIDUAL, starValue: 5, completedBy: [], isRecurring: 'daily' },
  { id: 't3', title: 'Morning Walk', description: 'Parent & Child walk together', type: TaskType.JOINT, starValue: 10, completedBy: [], isRecurring: 'daily' }
];

const triggerHaptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// --- Sub-components ---

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

  if (isLoading) return html`<div className="fixed inset-0 bg-[#6750a4] flex items-center justify-center text-white">Loading Security...</div>`;

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
  const [isDbReady, setIsDbReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [profiles, setProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [mascotState, setMascotState] = useState('IDLE');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Initialize DB and load data
  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      const [p, t, h, s] = await Promise.all([
        storage.get(PROFILES_KEY, []),
        storage.get(TASKS_KEY, DEFAULT_TASKS),
        storage.get(HISTORY_KEY, []),
        storage.get(STREAKS_KEY, {})
      ]);
      setProfiles(p);
      setTasks(t);
      setHistory(h);
      setStreaks(s);
      setIsDbReady(true);
    };
    initApp();
  }, []);

  // Sync state to DB on changes
  useEffect(() => { if (isDbReady) storage.set(PROFILES_KEY, profiles); }, [profiles, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(TASKS_KEY, tasks); }, [tasks, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(HISTORY_KEY, history); }, [history, isDbReady]);
  useEffect(() => { if (isDbReady) storage.set(STREAKS_KEY, streaks); }, [streaks, isDbReady]);

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
  };

  const handleAddProfile = (name, role, avatar) => {
    const newProfile = { id: Date.now().toString(), name, role, avatar, stars: 0 };
    setProfiles([...profiles, newProfile]);
    setIsProfileModalOpen(false);
    triggerHaptic(20);
  };

  const parentStars = profiles.filter(p => p.role === Role.PARENT).reduce((s, p) => s + (p.stars || 0), 0);
  const childStars = profiles.filter(p => p.role === Role.CHILD).reduce((s, p) => s + (p.stars || 0), 0);

  if (!isDbReady) return html`<div className="flex h-screen items-center justify-center bg-[#fdfbff] text-[#6750a4]">Waking up the Database...</div>`;
  if (!isAuthenticated) return html`<${PinScreen} onUnlock=${() => setIsAuthenticated(true)} />`;

  return html`
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#fdfbff] overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-36 px-6">
        <header className="pt-14 pb-8 flex justify-between items-start">
          <div>
            <h1 className="text-[32px] font-normal text-[#1c1b1f]">SuperParent</h1>
            <p className="text-[#49454f] text-sm mt-1 font-medium">Secure SQLite Rewards</p>
          </div>
          <button onClick=${() => setActiveTab('settings')} className="p-3 bg-[#e7e0eb] rounded-full text-[#49454f]"><${Settings} size=${20} /></button>
        </header>

        ${activeTab === 'dashboard' && html`
          <div className="space-y-6">
            <${Mascot} state=${mascotState} onAnimationEnd=${() => setMascotState('IDLE')} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#6750a4] rounded-[32px] p-6 text-white shadow-lg">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Parents</div>
                <div className="text-3xl font-medium flex items-center gap-2">${parentStars} <${Star} size=${24} fill="gold" /></div>
              </div>
              <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#6750a4]/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6750a4] opacity-80 mb-2">Kids</div>
                <div className="text-3xl font-medium flex items-center gap-2">${childStars} <${Star} size=${24} fill="#6750a4" /></div>
              </div>
            </div>
          </div>
        `}

        ${activeTab === 'tasks' && html`
          <div className="space-y-4">
            ${tasks.map(task => html`
              <div key=${task.id} className="bg-[#f7f2fa] rounded-[28px] p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/60 px-2 py-1 rounded-full">${task.type}</span>
                    <h3 className="text-xl font-bold mt-2">${task.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">${task.description}</p>
                  </div>
                  <div className="text-xl font-bold text-[#6750a4] flex items-center gap-1">+${task.starValue} <${Star} size=${16} fill="#6750a4" /></div>
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
              onClick=${() => setIsTaskModalOpen(true)}
              className="fixed bottom-32 right-6 w-16 h-16 bg-[#d3e3fd] rounded-[24px] shadow-xl text-[#041e49] flex items-center justify-center active:scale-90 transition-all z-50 ripple"
            >
              <${Plus} size=${36} />
            </button>
          </div>
        `}

        ${activeTab === 'history' && html`
          <div className="space-y-6 pt-4">
            ${history.length === 0 ? html`<div className="text-center py-20 opacity-30"><p className="mt-4">No activities yet</p></div>` : 
              history.map(item => html`
                <div key=${item.id} className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl">${profiles.find(p => p.id === item.profileId)?.avatar}</div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">${item.taskTitle}</div>
                    <div className="text-xs text-slate-400">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${profiles.find(p => p.id === item.profileId)?.name}</div>
                  </div>
                  <div className="font-bold text-[#6750a4]">+${item.starsEarned} ★</div>
                </div>
              `)
            }
          </div>
        `}

        ${activeTab === 'profiles' && html`
          <div className="grid grid-cols-2 gap-4">
            ${profiles.map(p => html`
              <div key=${p.id} className="bg-[#f7f2fa] rounded-[32px] p-6 text-center">
                <div className="text-5xl mb-3 bg-white w-20 h-20 flex items-center justify-center rounded-full mx-auto shadow-sm">${p.avatar}</div>
                <div className="font-bold text-lg">${p.name}</div>
                <div className="mt-4 text-xl font-bold text-slate-700 flex items-center justify-center gap-1">
                  <${Star} size={18} fill="#6750a4" className="text-[#6750a4]" /> ${p.stars || 0}
                </div>
              </div>
            `)}
            <button 
              onClick=${() => setIsProfileModalOpen(true)}
              className="rounded-[32px] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 active:bg-slate-50 transition-all"
            >
              <${UserPlus} size=${40} className="mb-2 opacity-40" />
              <span className="text-sm font-bold uppercase">Add Member</span>
            </button>
          </div>
        `}

        ${activeTab === 'settings' && html`
          <div className="space-y-4">
            <div className="bg-[#f7f2fa] rounded-[28px] p-6">
              <h3 className="font-bold mb-4">Admin Controls</h3>
              <button 
                onClick=${() => { if(confirm("Clear SQLite Database and settings?")) { storage.clearAll().then(() => window.location.reload()); } }}
                className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold ripple"
              >
                <${Trash2} size=${20} /> Clear SQLite Data
              </button>
            </div>
          </div>
        `}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#f3edf7]/95 backdrop-blur-md h-28 flex items-center justify-around px-4 border-t border-slate-200 z-[80]">
        ${[
          { id: 'dashboard', icon: Home, label: 'Home' },
          { id: 'tasks', icon: List, label: 'Tasks' },
          { id: 'history', icon: History, label: 'Log' },
          { id: 'profiles', icon: User, label: 'Team' }
        ].map(tab => html`
          <button 
            key=${tab.id}
            onClick=${() => setActiveTab(tab.id)} 
            className=${`flex flex-col items-center gap-1 w-1/4 transition-all ${activeTab === tab.id ? 'text-[#6750a4]' : 'text-slate-400'}`}
          >
            <div className=${`p-2 px-5 rounded-full transition-all ${activeTab === tab.id ? 'bg-[#e8def8]' : ''}`}>
              <${tab.icon} size=${24} strokeWidth=${activeTab === tab.id ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">${tab.label}</span>
          </button>
        `)}
      </nav>

      <${M3BottomSheet} isOpen=${isProfileModalOpen} onClose=${() => setIsProfileModalOpen(false)} title="New Profile">
        <form onSubmit=${(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          handleAddProfile(fd.get('name'), fd.get('role'), fd.get('avatar'));
        }} className="space-y-6 pb-10">
          <input name="name" required placeholder="Name (e.g. Leo)" className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-xl outline-none" />
          <div className="flex gap-4">
            ${[Role.PARENT, Role.CHILD].map(r => html`
              <label key=${r} className="flex-1">
                <input type="radio" name="role" value=${r} defaultChecked=${r === Role.PARENT} className="hidden peer" />
                <div className="text-center p-4 rounded-2xl border border-slate-200 peer-checked:bg-[#e8def8] peer-checked:border-[#6750a4] font-bold transition-all">${r}</div>
              </label>
            `)}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            ${AVATARS.map(a => html`
              <label key=${a}>
                <input type="radio" name="avatar" value=${a} defaultChecked=${a === AVATARS[0]} className="hidden peer" />
                <div className="w-14 h-14 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-2xl peer-checked:bg-[#e8def8] peer-checked:border-[#6750a4] transition-all shadow-sm">${a}</div>
              </label>
            `)}
          </div>
          <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-bold text-lg shadow-xl ripple">Create Profile</button>
        </form>
      <//>

      <${M3BottomSheet} isOpen=${isTaskModalOpen} onClose=${() => setIsTaskModalOpen(false)} title="New Task">
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
          <input name="title" required placeholder="Goal Title" className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-xl outline-none" />
          <textarea name="description" placeholder="Short description..." className="w-full bg-white border border-slate-200 p-4 rounded-2xl h-24 outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <select name="type" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold outline-none">
              <option value=${TaskType.INDIVIDUAL}>Child Task</option>
              <option value=${TaskType.JOINT}>Joint Goal</option>
            </select>
            <input name="stars" type="number" defaultValue="5" className="bg-white border border-slate-200 p-4 rounded-2xl font-bold outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#6750a4] text-white py-5 rounded-full font-bold text-lg shadow-xl ripple">Save Goal</button>
        </form>
      <//>
    </div>
  `;
}