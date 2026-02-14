
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Settings, Home, List, Trophy, Lock, UserPlus, User, CheckCircle2, ChevronRight, Star, ArrowRight, History, Flame, Calendar, Clock, X, Trash2, Key, Download, Rocket, ShieldCheck, Globe, Server, Cpu } from 'lucide-react';
import { Profile, Role, Task, TaskType, HistoryItem, MascotState, ProfileTaskStats } from './types';
import { storage } from './services/storage';
import { PIN_KEY, PROFILES_KEY, TASKS_KEY, HISTORY_KEY, STREAKS_KEY, COLORS, AVATARS, DEFAULT_TASKS } from './constants';
import Mascot from './components/Mascot';

// --- Haptic Feedback Helper ---
const triggerHaptic = (pattern: number | number[] = 10) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// --- Android Material 3 Design Components ---

const PinScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [savedPin] = useState(() => storage.get(PIN_KEY, ''));
  const [error, setError] = useState(false);

  const handleInput = (val: string) => {
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
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 400);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#6750a4] flex flex-col items-center justify-center p-8 z-[200] text-white">
      <div className="mb-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-white/20 p-8 rounded-[32px] inline-block mb-6 shadow-xl">
          <Lock size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight mb-2">
          {savedPin ? 'Parent Access' : 'Create Admin PIN'}
        </h1>
        <p className="text-[#eaddff] text-sm font-medium opacity-80">
          {savedPin ? 'Confirm PIN to manage rewards' : 'Only parents should know this PIN'}
        </p>
      </div>

      <div className="flex gap-6 mb-20">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
              pin.length > i ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-transparent'
            } ${error ? 'border-red-400 bg-red-400 animate-pulse' : ''}`} 
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-10 gap-y-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((btn) => (
          <button
            key={btn.toString()}
            onClick={() => {
              if (btn === 'C') { triggerHaptic(5); setPin(''); }
              else if (btn === '←') { triggerHaptic(5); setPin(p => p.slice(0, -1)); }
              else handleInput(btn.toString());
            }}
            className="w-20 h-20 rounded-full bg-white/10 active:bg-white/30 flex items-center justify-center text-3xl font-medium transition-all ripple"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

const M3Header: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <header className="px-6 pt-14 pb-8 bg-[#fdfbff] flex justify-between items-start sticky top-0 z-30 animate-in slide-in-from-top duration-500">
    <div>
      <h1 className="text-[32px] font-normal text-[#1c1b1f] tracking-tight">{title}</h1>
      {subtitle && <p className="text-[#49454f] text-sm mt-1 font-medium">{subtitle}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </header>
);

const M3Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-[#f7f2fa] rounded-[28px] p-6 mb-4 active:scale-[0.97] transition-all cursor-pointer ripple border border-transparent shadow-sm hover:shadow-md ${className}`}
  >
    {children}
  </div>
);

const M3BottomSheet: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] transition-all flex items-end backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-[#f3edf7] w-full rounded-t-[32px] p-6 pb-14 z-[101] animate-in slide-in-from-bottom duration-400 ease-out shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-[#79747e]/30 rounded-full mx-auto mb-8"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-[#1c1b1f]">{title}</h2>
          <button onClick={onClose} className="p-3 bg-white/50 rounded-full text-[#49454f]"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'history' | 'profiles' | 'settings'>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>(() => storage.get(PROFILES_KEY, []));
  const [tasks, setTasks] = useState<Task[]>(() => storage.get(TASKS_KEY, DEFAULT_TASKS));
  const [history, setHistory] = useState<HistoryItem[]>(() => storage.get(HISTORY_KEY, []));
  const [streaks, setStreaks] = useState<ProfileTaskStats>(() => storage.get(STREAKS_KEY, {}));
  const [mascotState, setMascotState] = useState<MascotState>('IDLE');
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLaunchGuideOpen, setIsLaunchGuideOpen] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Open this app in Chrome to install it as a native Android app!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Persistence Effects
  useEffect(() => { storage.set(PROFILES_KEY, profiles); }, [profiles]);
  useEffect(() => { storage.set(TASKS_KEY, tasks); }, [tasks]);
  useEffect(() => { storage.set(HISTORY_KEY, history); }, [history]);
  useEffect(() => { storage.set(STREAKS_KEY, streaks); }, [streaks]);

  // Handle Daily Reset
  useEffect(() => {
    const checkReset = () => {
      const lastReset = storage.get('superparent_last_reset', '');
      const today = new Date().toDateString();
      if (lastReset !== today) {
        setTasks(prev => prev.map(t => ({ ...t, completedBy: [] })));
        storage.set('superparent_last_reset', today);
      }
    };
    checkReset();
    const interval = setInterval(checkReset, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleAddProfile = (name: string, role: Role, avatar: string) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      role,
      avatar,
      stars: 0
    };
    setProfiles([...profiles, newProfile]);
    setIsProfileModalOpen(false);
    triggerHaptic(25);
  };

  const handleTaskCompletion = (taskId: string, profileId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completedBy.includes(profileId)) return;

    triggerHaptic([40, 30, 40]);
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const historyItem: HistoryItem = {
      id: crypto.randomUUID(),
      taskId,
      taskTitle: task.title,
      profileId,
      timestamp: Date.now(),
      starsEarned: task.starValue
    };

    setHistory([historyItem, ...history]);

    // Update Streaks
    if (task.isRecurring !== 'none') {
      const streakKey = `${profileId}_${taskId}`;
      const currentStreakInfo = streaks[streakKey] || { count: 0, lastCompletionDate: '' };
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCount = 1;
      if (currentStreakInfo.lastCompletionDate === yesterdayStr) {
        newCount = currentStreakInfo.count + 1;
        if (newCount % 3 === 0) {
          setMascotState('STREAK_BOOST');
          triggerHaptic([60, 40, 60, 40, 60]);
        }
      } else if (currentStreakInfo.lastCompletionDate === today) {
        newCount = currentStreakInfo.count;
      }

      setStreaks(prev => ({
        ...prev,
        [streakKey]: { count: newCount, lastCompletionDate: today }
      }));
    }

    setProfiles(prev => prev.map(p => 
      p.id === profileId ? { ...p, stars: p.stars + task.starValue } : p
    ));

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, completedBy: [...t.completedBy, profileId] };
      }
      return t;
    }));

    if (task.type === TaskType.JOINT) setMascotState('JOINT_SUCCESS');
    else setMascotState(profile.role === Role.PARENT ? 'PARENT_SUCCESS' : 'CHILD_SUCCESS');
  };

  const handleClearData = () => {
    if (confirm("Are you sure? This will delete all history, tasks, and profiles.")) {
      triggerHaptic([100, 50, 100]);
      localStorage.clear();
      window.location.reload();
    }
  };

  const parentStars = useMemo(() => profiles.filter(p => p.role === Role.PARENT).reduce((sum, p) => sum + p.stars, 0), [profiles]);
  const childStars = useMemo(() => profiles.filter(p => p.role === Role.CHILD).reduce((sum, p) => sum + p.stars, 0), [profiles]);
  
  const topStreaks = useMemo(() => {
    return Object.entries(streaks)
      .map(([key, info]) => {
        const [pId, tId] = key.split('_');
        const p = profiles.find(p => p.id === pId);
        const t = tasks.find(t => t.id === tId);
        return { p, t, count: info.count };
      })
      .filter(s => s.p && s.t && s.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [streaks, profiles, tasks]);

  if (!isAuthenticated) return <PinScreen onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#fdfbff] overflow-hidden">
      
      {/* Scrollable View Area */}
      <div className="flex-1 overflow-y-auto pb-36">
        
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            <M3Header title="SuperParent" subtitle="Daily Family Overview" action={
              <button onClick={() => setActiveTab('settings')} className="p-3 bg-[#e7e0eb] rounded-full text-[#49454f]"><Settings size={20} /></button>
            } />
            
            <div className="px-6">
              <Mascot state={mascotState} onAnimationEnd={() => setMascotState('IDLE')} />
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-[#6750a4] rounded-[32px] p-6 text-white shadow-lg transform active:scale-95 transition-transform">
                  <div className="flex items-center gap-2 opacity-80 text-[11px] font-bold uppercase tracking-widest mb-3">
                    <User size={12} /> Parents
                  </div>
                  <div className="text-3xl font-medium flex items-center gap-2">
                    {parentStars} <Star className="fill-[#ffd700] text-[#ffd700]" size={24} />
                  </div>
                </div>
                <div className="bg-[#f7f2fa] rounded-[32px] p-6 border border-[#6750a4]/10 transform active:scale-95 transition-transform">
                  <div className="flex items-center gap-2 text-[#6750a4] opacity-80 text-[11px] font-bold uppercase tracking-widest mb-3">
                    <Star size={12} /> Kids
                  </div>
                  <div className="text-3xl font-medium text-[#1c1b1f] flex items-center gap-2">
                    {childStars} <Star className="fill-[#6750a4] text-[#6750a4]" size={24} />
                  </div>
                </div>
              </div>

              {topStreaks.length > 0 && (
                <div className="mt-10">
                   <h2 className="text-xs font-bold text-[#49454f] uppercase tracking-widest mb-5 ml-1">Family Streaks 🔥</h2>
                   <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
                      {topStreaks.map((s, idx) => (
                        <div key={idx} className="bg-white border border-[#e7e0eb] p-5 rounded-[28px] flex flex-col items-center min-w-[150px] shadow-sm">
                           <div className="text-4xl mb-3">{s.p?.avatar}</div>
                           <div className="text-[11px] font-bold text-[#49454f] uppercase text-center mb-2 line-clamp-1">{s.t?.title}</div>
                           <div className="text-3xl font-medium text-[#ba1a1a] flex items-center gap-1.5">
                             {s.count} <Flame size={24} fill="currentColor" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <M3Card className="mt-8 bg-[#d7effb] border-transparent flex items-center justify-between p-7">
                <div className="flex-1">
                  <h3 className="font-bold text-[#001e2e] text-lg">Goal Status</h3>
                  <p className="text-[#001e2e]/70 text-sm mt-1 font-medium">
                    {childStars > parentStars ? "The kids are leading! Keep it up! 🚀" : "Parents are leading! Great example! 💪"}
                  </p>
                </div>
                <Trophy className="text-[#001e2e] opacity-40" size={40} />
              </M3Card>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-in slide-in-from-right duration-400">
            <M3Header title="Active Goals" subtitle="Mark off completed daily habits" />
            <div className="px-6">
               {tasks.length === 0 ? (
                 <div className="text-center py-32">
                    <div className="text-8xl mb-6 grayscale opacity-20">📋</div>
                    <p className="text-[#49454f] font-medium text-lg">No habits defined yet.</p>
                 </div>
               ) : (
                 tasks.map(task => {
                   const isJoint = task.type === TaskType.JOINT;
                   return (
                     <M3Card key={task.id} className="mb-6">
                       <div className="flex justify-between items-start mb-5">
                         <div className="flex-1 pr-6">
                            <div className="flex gap-2 mb-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${isJoint ? 'bg-[#34e0a1]/20 text-[#005139]' : 'bg-[#6750a4]/10 text-[#6750a4]'}`}>
                                {isJoint ? 'Joint' : 'Child'}
                              </span>
                              {task.isRecurring !== 'none' && (
                                <span className="bg-[#f3edf7] text-[#49454f] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                                  {task.isRecurring}
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-[#1c1b1f] text-xl leading-snug">{task.title}</h3>
                            <p className="text-[#49454f] text-sm mt-2 leading-relaxed">{task.description}</p>
                         </div>
                         <div className="bg-white p-3 rounded-[20px] shadow-sm flex flex-col items-center min-w-[50px]">
                            <span className="text-[#6750a4] font-black text-xl">{task.starValue}</span>
                            <Star size={16} className="fill-[#ffd700] text-[#ffd700]" />
                         </div>
                       </div>
                       
                       <div className="mt-2 flex flex-wrap gap-4">
                         {profiles.length === 0 && <p className="text-xs text-[#49454f] opacity-50 italic">Add profiles to track goals</p>}
                         {profiles.map(profile => {
                           const isCompleted = task.completedBy?.includes(profile.id);
                           const isIndividualChildTask = task.type === TaskType.INDIVIDUAL && profile.role === Role.CHILD;
                           const isJointTask = task.type === TaskType.JOINT;
                           if (!isIndividualChildTask && !isJointTask) return null;

                           return (
                             <button
                               key={profile.id}
                               disabled={isCompleted}
                               onClick={() => handleTaskCompletion(task.id, profile.id)}
                               className={`flex items-center gap-3 pl-3 pr-5 py-3 rounded-full text-sm font-medium transition-all ripple ${
                                 isCompleted 
                                   ? 'bg-[#e1e2e1] text-[#717271] opacity-70 cursor-default shadow-none' 
                                   : 'bg-[#6750a4] text-white shadow-md active:scale-90'
                               }`}
                             >
                               <span className="text-xl bg-white/20 w-10 h-10 flex items-center justify-center rounded-full">
                                {isCompleted ? <CheckCircle2 size={20} /> : profile.avatar}
                               </span>
                               {profile.name} {isCompleted ? 'Done' : 'Confirm'}
                             </button>
                           );
                         })}
                       </div>
                     </M3Card>
                   );
                 })
               )}
            </div>
            
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="fixed bottom-32 right-6 w-16 h-16 bg-[#d3e3fd] rounded-[24px] shadow-xl text-[#041e49] flex items-center justify-center active:scale-90 transition-all z-50 ripple"
            >
              <Plus size={36} />
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in slide-in-from-right duration-400">
            <M3Header title="Activity Log" subtitle="Track family progress over time" />
            <div className="px-6">
               {history.length === 0 ? (
                 <div className="text-center py-32 opacity-20">
                    <History size={80} className="mx-auto mb-6" />
                    <p className="text-xl font-medium">No history yet.</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {history.map((item) => {
                     const p = profiles.find(p => p.id === item.profileId);
                     return (
                       <div key={item.id} className="bg-white border-b border-[#e7e0eb] pb-6 flex items-center gap-5">
                          <div className="text-4xl bg-[#f7f2fa] w-16 h-16 flex items-center justify-center rounded-[20px] shadow-sm">{p?.avatar}</div>
                          <div className="flex-1">
                             <h4 className="font-bold text-[#1c1b1f] text-base leading-tight">{item.taskTitle}</h4>
                             <p className="text-sm text-[#49454f] mt-1 font-medium">{p?.name} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="text-[#6750a4] font-black text-lg">+{item.starsEarned} ★</div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="animate-in slide-in-from-right duration-400">
            <M3Header title="The Family" subtitle="Manage parents and children" />
            <div className="px-6 grid grid-cols-2 gap-5">
                {profiles.map(p => (
                   <div key={p.id} className="bg-[#f7f2fa] rounded-[32px] p-8 flex flex-col items-center text-center shadow-sm">
                      <div className="text-6xl mb-5 bg-white w-24 h-24 flex items-center justify-center rounded-full shadow-md">{p.avatar}</div>
                      <h3 className="font-bold text-[#1c1b1f] text-lg">{p.name}</h3>
                      <span className="text-[11px] font-bold text-[#6750a4] uppercase mt-2 tracking-widest px-3 py-1 bg-white rounded-full border border-[#6750a4]/10">{p.role}</span>
                      <div className="mt-5 flex items-center gap-2 text-slate-700 font-black text-xl">
                        <Star size={20} fill="#6750a4" className="text-[#6750a4]" /> {p.stars}
                      </div>
                   </div>
                ))}
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-transparent rounded-[32px] border-2 border-dashed border-[#e7e0eb] p-8 flex flex-col items-center justify-center text-[#49454f] active:bg-[#6750a4]/5 transition-all shadow-sm"
                >
                  <UserPlus size={40} className="mb-3 opacity-40" />
                  <span className="text-base font-bold">Add Member</span>
                </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-400">
            <M3Header title="Settings" subtitle="Application controls" />
            <div className="px-6 space-y-4">
              <M3Card onClick={() => setIsLaunchGuideOpen(true)} className="bg-[#1d192b] text-white border-none shadow-indigo-200 shadow-md">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl"><Rocket size={24} className="text-[#d0bcff]" /></div>
                   <div className="flex-1">
                     <h3 className="font-bold">Play Store (No-Hosting) Guide</h3>
                     <p className="text-xs text-[#d0bcff]">Launch without monthly costs</p>
                   </div>
                   <ChevronRight size={20} className="opacity-50" />
                 </div>
              </M3Card>

              <M3Card onClick={handleInstallClick} className="bg-[#6750a4] text-white">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/20 rounded-2xl"><Download size={24} className="text-white" /></div>
                   <div>
                     <h3 className="font-bold">Fast Installation</h3>
                     <p className="text-sm opacity-80">Add to home screen instantly</p>
                   </div>
                 </div>
              </M3Card>

              <M3Card onClick={() => { triggerHaptic(10); storage.set(PIN_KEY, ''); window.location.reload(); }}>
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl"><Key size={24} className="text-[#6750a4]" /></div>
                   <div>
                     <h3 className="font-bold text-[#1c1b1f]">Reset Admin PIN</h3>
                     <p className="text-sm text-[#49454f]">Change your parent-only code</p>
                   </div>
                 </div>
              </M3Card>
              
              <M3Card onClick={handleClearData} className="border-red-100">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-2xl"><Trash2 size={24} className="text-red-600" /></div>
                   <div>
                     <h3 className="font-bold text-red-600">Clear All Local Data</h3>
                     <p className="text-sm text-[#49454f]">Wipe history and family members</p>
                   </div>
                 </div>
              </M3Card>

              <div className="pt-10 text-center opacity-40">
                <p className="text-sm font-medium">SuperParent Tracker v1.5</p>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Zero-Hosting Architecture Ready</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Android Material 3 Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#f3edf7]/95 backdrop-blur-md h-28 flex items-center justify-around px-4 max-w-md mx-auto z-[80] border-t border-[#e7e0eb]">
        {[
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'tasks', label: 'Tasks', icon: List },
          { id: 'history', label: 'Activity', icon: History },
          { id: 'profiles', label: 'Team', icon: User },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { 
              if (activeTab !== tab.id) {
                triggerHaptic(6); 
                setActiveTab(tab.id as any); 
              }
            }}
            className="flex flex-col items-center gap-2 group w-1/4"
          >
            <div className={`px-6 py-1.5 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-[#e8def8] text-[#1d192b] shadow-sm' : 'text-[#49454f] active:bg-[#49454f]/10'}`}>
              <tab.icon size={26} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
            </div>
            <span className={`text-[12px] font-bold tracking-wide transition-colors ${activeTab === tab.id ? 'text-[#1d192b]' : 'text-[#49454f] font-medium'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile Modal */}
      <M3BottomSheet 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Create Profile"
      >
         <form onSubmit={(e) => {
           e.preventDefault();
           const formData = new FormData(e.currentTarget);
           handleAddProfile(formData.get('name') as string, formData.get('role') as Role, formData.get('avatar') as string);
         }} className="space-y-8">
            <div>
              <label className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Full Name</label>
              <input required name="name" type="text" placeholder="e.g. Charlie" className="w-full bg-white border border-[#79747e]/30 rounded-2xl px-5 py-5 outline-none focus:border-[#6750a4] focus:ring-4 focus:ring-[#6750a4]/10 text-xl mt-2 transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Member Role</label>
              <div className="flex gap-4 mt-2">
                 {[Role.PARENT, Role.CHILD].map(role => (
                   <label key={role} className="flex-1 cursor-pointer group">
                      <input type="radio" name="role" value={role} defaultChecked={role === Role.PARENT} className="hidden peer" />
                      <div className="text-center p-5 rounded-[24px] border border-[#79747e]/30 peer-checked:border-[#6750a4] peer-checked:bg-[#e8def8] text-[#1c1b1f] font-bold text-sm transition-all group-active:scale-95">{role}</div>
                   </label>
                 ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Choose Icon</label>
              <div className="flex flex-wrap gap-3 justify-start mt-3">
                 {AVATARS.map(emoji => (
                   <label key={emoji} className="cursor-pointer">
                     <input type="radio" name="avatar" value={emoji} defaultChecked={emoji === '🦁'} className="hidden peer" />
                     <div className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-transparent peer-checked:border-[#6750a4] peer-checked:bg-[#e8def8] text-3xl transition-all shadow-sm active:scale-90">
                       {emoji}
                     </div>
                   </label>
                 ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-[#6750a4] text-white font-bold py-5 rounded-full shadow-xl ripple text-lg mt-4 active:scale-95 transition-transform">Create Member</button>
         </form>
      </M3BottomSheet>

      {/* Task Modal */}
      <M3BottomSheet 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title="Add New Daily Goal"
      >
         <form onSubmit={(e) => {
           e.preventDefault();
           const formData = new FormData(e.currentTarget);
           const newTask: Task = {
             id: crypto.randomUUID(),
             title: formData.get('title') as string,
             description: formData.get('description') as string,
             type: formData.get('type') as TaskType,
             starValue: parseInt(formData.get('stars') as string),
             assignedTo: [],
             completedBy: [],
             isRecurring: formData.get('isRecurring') as any,
             category: 'General'
           };
           setTasks([...tasks, newTask]);
           setIsTaskModalOpen(false);
           triggerHaptic(25);
         }} className="space-y-6">
            <input required name="title" type="text" placeholder="Goal Title (e.g. Morning Walk)" className="w-full bg-white border border-[#79747e]/30 rounded-2xl px-5 py-5 outline-none focus:border-[#6750a4] text-xl font-medium" />
            <textarea name="description" placeholder="Optional details..." className="w-full bg-white border border-[#79747e]/30 rounded-2xl px-5 py-4 outline-none resize-none h-28" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Type</label>
                <select name="type" className="w-full bg-white border border-[#79747e]/30 rounded-2xl px-4 py-4 mt-1 outline-none font-bold text-sm">
                  <option value={TaskType.INDIVIDUAL}>Child Only</option>
                  <option value={TaskType.JOINT}>Parent + Child</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Stars</label>
                <input required name="stars" type="number" defaultValue="5" className="w-full bg-white border border-[#79747e]/30 rounded-2xl px-5 py-4 mt-1 outline-none font-bold text-lg" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#49454f] uppercase tracking-widest ml-1">Recurrence</label>
              <div className="flex gap-2 mt-1">
                 {['none', 'daily', 'weekly'].map(r => (
                   <label key={r} className="flex-1 cursor-pointer">
                     <input type="radio" name="isRecurring" value={r} defaultChecked={r === 'daily'} className="hidden peer" />
                     <div className="text-center py-3 rounded-full border border-[#79747e]/30 peer-checked:bg-[#6750a4] peer-checked:text-white peer-checked:border-transparent text-[11px] font-bold uppercase transition-all">{r}</div>
                   </label>
                 ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-[#6750a4] text-white font-bold py-5 rounded-full shadow-xl ripple text-lg active:scale-95 transition-transform mt-4">Save Daily Goal</button>
         </form>
      </M3BottomSheet>

      {/* Play Store Launch Guide Modal */}
      <M3BottomSheet 
        isOpen={isLaunchGuideOpen} 
        onClose={() => setIsLaunchGuideOpen(false)} 
        title="Zero-Hosting Launch Plan"
      >
        <div className="space-y-6 pb-6">
           <div className="bg-[#1d192b] p-4 rounded-2xl border border-white/10 text-white">
              <h4 className="font-bold text-base flex items-center gap-2 mb-2"><Cpu size={18} className="text-[#d0bcff]" /> Local Bundling</h4>
              <p className="text-xs text-[#d0bcff] leading-relaxed">Instead of a website, we package all files into the APK. This is <strong>100% free</strong> (after Google's one-time developer fee).</p>
           </div>
           
           <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#e7e0eb] flex gap-4 items-start">
                 <div className="bg-[#6750a4]/10 p-2 rounded-lg"><Cpu size={20} className="text-[#6750a4]" /></div>
                 <div>
                    <h4 className="font-bold text-sm">1. Install Capacitor CLI</h4>
                    <p className="text-xs text-[#49454f] mt-1">Run <code>npm install @capacitor/cli @capacitor/android</code> in your project folder.</p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e7e0eb] flex gap-4 items-start">
                 <div className="bg-[#6750a4]/10 p-2 rounded-lg"><Globe size={20} className="text-[#6750a4]" /></div>
                 <div>
                    <h4 className="font-bold text-sm">2. Free Hosting Alternative</h4>
                    <p className="text-xs text-[#49454f] mt-1">If you want a verified app, <strong>Vercel</strong> and <strong>GitHub Pages</strong> offer 100% free hosting forever for small apps.</p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e7e0eb] flex gap-4 items-start">
                 <div className="bg-[#6750a4]/10 p-2 rounded-lg"><Rocket size={20} className="text-[#6750a4]" /></div>
                 <div>
                    <h4 className="font-bold text-sm">3. Build the .AAB</h4>
                    <p className="text-xs text-[#49454f] mt-1">Open your project in <strong>Android Studio</strong>, go to <code>Build > Generate Signed Bundle</code>. No server needed!</p>
                 </div>
              </div>
           </div>

           <div className="bg-[#e8def8] p-5 rounded-2xl border border-[#d0bcff]">
              <h4 className="font-bold text-[#1d192b] text-sm flex items-center gap-2"><Rocket size={16} /> Important Note</h4>
              <p className="text-xs text-[#49454f] mt-1 leading-relaxed">Google charges a one-time <strong>$25 fee</strong> to open a developer account. This is paid to Google, not for hosting. Once paid, you can publish unlimited apps for free!</p>
           </div>
           
           <button onClick={() => setIsLaunchGuideOpen(false)} className="w-full bg-[#6750a4] text-white font-bold py-4 rounded-full shadow-md">Start Building!</button>
        </div>
      </M3BottomSheet>

    </div>
  );
};

export default App;
