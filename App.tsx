
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Settings, Home, List, Trophy, Lock, UserPlus, User, CheckCircle2, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { Profile, Role, Task, TaskType, HistoryItem, MascotState } from './types';
import { storage } from './services/storage';
import { PIN_KEY, PROFILES_KEY, TASKS_KEY, HISTORY_KEY, COLORS, AVATARS, DEFAULT_TASKS } from './constants';
import Mascot from './components/Mascot';

// --- Components ---

const PinScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [savedPin] = useState(() => storage.get(PIN_KEY, ''));
  const [error, setError] = useState(false);

  const handleInput = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (!savedPin || newPin === savedPin) {
          if (!savedPin) storage.set(PIN_KEY, newPin);
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center p-8 z-50 text-white">
      <div className="mb-8 text-center">
        <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
          <Lock size={48} />
        </div>
        <h1 className="text-2xl font-bold">{savedPin ? 'Parent Login' : 'Setup Admin PIN'}</h1>
        <p className="text-indigo-100 mt-2">Only parents should access this app</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 border-white transition-all ${pin.length > i ? 'bg-white scale-125' : ''} ${error ? 'border-rose-400 bg-rose-400' : ''}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((btn) => (
          <button
            key={btn.toString()}
            onClick={() => {
              if (btn === 'C') setPin('');
              else if (btn === '←') setPin(p => p.slice(0, -1));
              else handleInput(btn.toString());
            }}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-semibold active:scale-95 transition-transform"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <header className="px-6 pt-8 pb-4 bg-white border-b border-slate-100">
    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
    {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
  </header>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4 active:scale-[0.98] transition-all cursor-pointer ${className}`}
  >
    {children}
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'profiles'>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>(() => storage.get(PROFILES_KEY, []));
  const [tasks, setTasks] = useState<Task[]>(() => storage.get(TASKS_KEY, DEFAULT_TASKS));
  const [history, setHistory] = useState<HistoryItem[]>(() => storage.get(HISTORY_KEY, []));
  const [mascotState, setMascotState] = useState<MascotState>('IDLE');
  
  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskAssignModalOpen, setIsTaskAssignModalOpen] = useState<string | null>(null);

  // Persistence
  useEffect(() => { storage.set(PROFILES_KEY, profiles); }, [profiles]);
  useEffect(() => { storage.set(TASKS_KEY, tasks); }, [tasks]);
  useEffect(() => { storage.set(HISTORY_KEY, history); }, [history]);

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
  };

  const handleTaskCompletion = (taskId: string, profileId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    // Record history
    const historyItem: HistoryItem = {
      id: crypto.randomUUID(),
      taskId,
      taskTitle: task.title,
      profileId,
      timestamp: Date.now(),
      starsEarned: task.starValue
    };

    setHistory([historyItem, ...history]);

    // Update Profile Stars
    setProfiles(prev => prev.map(p => 
      p.id === profileId ? { ...p, stars: p.stars + task.starValue } : p
    ));

    // Update Task Completion State for Joint Tasks
    if (task.type === TaskType.JOINT) {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const newCompletedBy = [...(t.completedBy || []), profileId];
          return { ...t, completedBy: newCompletedBy };
        }
        return t;
      }));
    }

    // Set Mascot React
    if (task.type === TaskType.JOINT) {
      setMascotState('JOINT_SUCCESS');
    } else {
      setMascotState(profile.role === Role.PARENT ? 'PARENT_SUCCESS' : 'CHILD_SUCCESS');
    }
  };

  const resetDailyTasks = () => {
    setTasks(prev => prev.map(t => ({ ...t, completedBy: [] })));
  };

  const parentStars = useMemo(() => 
    profiles.filter(p => p.role === Role.PARENT).reduce((sum, p) => sum + p.stars, 0)
  , [profiles]);

  const childStars = useMemo(() => 
    profiles.filter(p => p.role === Role.CHILD).reduce((sum, p) => sum + p.stars, 0)
  , [profiles]);

  const whoIsWinning = useMemo(() => {
    if (childStars > parentStars) return "Kids are taking the lead! 🚀";
    if (parentStars > childStars) return "Parents are doing great! 💪";
    return "It's a tie! Everyone is awesome! ✨";
  }, [childStars, parentStars]);

  const todayCompletedCount = useMemo(() => {
    const startOfDay = new Date().setHours(0,0,0,0);
    return history.filter(h => h.timestamp >= startOfDay).length;
  }, [history]);

  if (!isAuthenticated) return <PinScreen onUnlock={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-slate-50 overflow-hidden">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        
        {activeTab === 'dashboard' && (
          <>
            <Header title="Hi, Parent!" subtitle="Let's build healthy habits today." />
            
            <div className="px-6 pt-4">
              <Mascot state={mascotState} onAnimationEnd={() => setMascotState('IDLE')} />
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-200">
                  <div className="flex items-center gap-2 opacity-80 text-xs font-semibold uppercase tracking-wider mb-1">
                    <User size={14} /> Parent Stars
                  </div>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {parentStars} <Star className="fill-yellow-400 text-yellow-400" size={24} />
                  </div>
                </div>
                <div className="bg-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-200">
                  <div className="flex items-center gap-2 opacity-80 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Star size={14} /> Kids' Stars
                  </div>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {childStars} <Star className="fill-yellow-400 text-yellow-400" size={24} />
                  </div>
                </div>
              </div>

              <Card className="mt-4 bg-emerald-50 border-emerald-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-800 text-sm">Leaderboard</h3>
                  <p className="text-emerald-600 text-xs mt-0.5 font-medium">{whoIsWinning}</p>
                </div>
                <Trophy className="text-emerald-500" />
              </Card>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Quick Stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-slate-400 text-xs mb-1">Completed Today</div>
                      <div className="text-xl font-bold text-slate-800">{todayCompletedCount} Tasks</div>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-slate-400 text-xs mb-1">Active Profiles</div>
                      <div className="text-xl font-bold text-slate-800">{profiles.length} Total</div>
                   </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8 mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                {history.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-4 mb-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                      {profiles.find(p => p.id === item.profileId)?.avatar || '👤'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700">
                        {profiles.find(p => p.id === item.profileId)?.name} completed "{item.taskTitle}"
                      </p>
                      <p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-emerald-600 font-bold text-sm">+{item.starsEarned} ★</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <>
            <Header title="Daily Tasks" subtitle="Mark them as they're completed" />
            <div className="px-6 pt-4">
               {tasks.length === 0 ? (
                 <div className="text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-slate-500 font-medium">No tasks yet. Create one!</p>
                 </div>
               ) : (
                 tasks.map(task => {
                   const isJoint = task.type === TaskType.JOINT;
                   return (
                     <Card key={task.id} className="relative overflow-hidden">
                       <div className="flex justify-between items-start mb-2">
                         <div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block ${isJoint ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {isJoint ? 'Joint Task' : 'Child Only'}
                            </span>
                            <h3 className="font-bold text-slate-800 text-lg">{task.title}</h3>
                            <p className="text-slate-500 text-sm">{task.description}</p>
                         </div>
                         <div className="flex flex-col items-end">
                            <div className="text-yellow-500 font-black text-xl flex items-center gap-1">
                              {task.starValue} <Star size={18} fill="currentColor" />
                            </div>
                         </div>
                       </div>
                       
                       <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                         {profiles.length === 0 && <p className="text-xs text-slate-400 italic">Add profiles to mark completion</p>}
                         
                         {profiles.map(profile => {
                           const isCompleted = task.completedBy.includes(profile.id);
                           const isIndividualChildTask = task.type === TaskType.INDIVIDUAL && profile.role === Role.CHILD;
                           const isJointTask = task.type === TaskType.JOINT;

                           if (!isIndividualChildTask && !isJointTask) return null;

                           return (
                             <button
                               key={profile.id}
                               disabled={isCompleted}
                               onClick={() => handleTaskCompletion(task.id, profile.id)}
                               className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                 isCompleted 
                                   ? 'bg-slate-100 text-slate-400 cursor-default' 
                                   : profile.role === Role.PARENT 
                                     ? 'bg-indigo-600 text-white active:scale-95' 
                                     : 'bg-orange-500 text-white active:scale-95'
                               }`}
                             >
                               {isCompleted ? <CheckCircle2 size={14} /> : profile.avatar}
                               {profile.name} {isCompleted ? 'Done' : 'Mark Done'}
                             </button>
                           );
                         })}
                       </div>
                     </Card>
                   );
                 })
               )}
            </div>
            
            {/* FAB for Adding Tasks */}
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={28} />
            </button>
          </>
        )}

        {activeTab === 'profiles' && (
          <>
            <Header title="Profiles" subtitle="Manage parents and children" />
            <div className="px-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                {profiles.map(p => (
                   <Card key={p.id} className="flex flex-col items-center justify-center text-center py-8">
                      <div className="text-5xl mb-3">{p.avatar}</div>
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <p className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full ${p.role === Role.PARENT ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                        {p.role}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-slate-500 font-semibold text-sm">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" /> {p.stars} Stars
                      </div>
                   </Card>
                ))}
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-slate-400 hover:text-slate-500 hover:border-slate-400 transition-all"
                >
                  <UserPlus size={32} className="mb-2" />
                  <span className="font-bold text-sm">Add New</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-20 px-6 max-w-md mx-auto z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-bold">DASHBOARD</span>
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <List size={24} />
          <span className="text-[10px] font-bold">TASKS</span>
        </button>
        <button onClick={() => setActiveTab('profiles')} className={`flex flex-col items-center gap-1 ${activeTab === 'profiles' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <User size={24} />
          <span className="text-[10px] font-bold">PROFILES</span>
        </button>
      </nav>

      {/* Add Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 animate-in slide-in-from-bottom duration-300">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Profile</h2>
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               handleAddProfile(
                 formData.get('name') as string,
                 formData.get('role') as Role,
                 formData.get('avatar') as string
               );
             }}>
               <div className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                   <input required name="name" type="text" placeholder="Enter name..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-indigo-500 transition-colors" />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role Type</label>
                   <div className="flex gap-4">
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value={Role.PARENT} defaultChecked className="hidden peer" />
                        <div className="text-center p-4 rounded-2xl border-2 border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition-all">
                          <p className="text-sm font-bold text-slate-700">Parent</p>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value={Role.CHILD} className="hidden peer" />
                        <div className="text-center p-4 rounded-2xl border-2 border-slate-200 peer-checked:border-orange-500 peer-checked:bg-orange-50 transition-all">
                          <p className="text-sm font-bold text-slate-700">Child</p>
                        </div>
                      </label>
                   </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Avatar</label>
                    <div className="flex flex-wrap gap-2">
                       {AVATARS.slice(0, 7).map(emoji => (
                         <label key={emoji} className="cursor-pointer">
                           <input type="radio" name="avatar" value={emoji} defaultChecked={emoji === '🦁'} className="hidden peer" />
                           <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-transparent peer-checked:border-indigo-600 peer-checked:bg-white text-2xl transition-all">
                             {emoji}
                           </div>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl">Cancel</button>
                   <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200">Save Profile</button>
                 </div>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 animate-in slide-in-from-bottom duration-300">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">New Task</h2>
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
                 isRecurring: 'daily',
                 category: 'General'
               };
               setTasks([...tasks, newTask]);
               setIsTaskModalOpen(false);
             }}>
               <div className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                   <input required name="title" type="text" placeholder="e.g. Clean room" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-indigo-500 transition-colors" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                   <input name="description" type="text" placeholder="Short details..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-indigo-500 transition-colors" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Type</label>
                     <select name="type" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none">
                       <option value={TaskType.INDIVIDUAL}>Child Only</option>
                       <option value={TaskType.JOINT}>Parent + Child</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Star Reward</label>
                     <input required name="stars" type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none" />
                   </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl">Cancel</button>
                   <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200">Add Task</button>
                 </div>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
