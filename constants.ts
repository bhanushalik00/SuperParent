
import { Role, TaskType } from './types';

export const COLORS = {
  PARENT: 'indigo',
  CHILD: 'orange',
  JOINT: 'emerald',
  ACCENT: 'rose'
};

export const AVATARS = [
  '🦁', '🐘', '🦒', '🦓', '🐼', '🐨', '🦊', '🦉', '🐢', '🦖', '👨‍🚀', '👩‍🔬', '👨‍🚒', '👩‍🎨'
];

export const PIN_KEY = 'superparent_pin';
export const PROFILES_KEY = 'superparent_profiles';
export const TASKS_KEY = 'superparent_tasks';
export const HISTORY_KEY = 'superparent_history';

export const DEFAULT_TASKS = [
  {
    id: 't1',
    title: 'Brush Teeth',
    description: 'Clean your teeth for 2 minutes',
    type: TaskType.INDIVIDUAL,
    starValue: 2,
    assignedTo: [],
    completedBy: [],
    isRecurring: 'daily',
    category: 'Hygiene'
  },
  {
    id: 't2',
    title: 'Finish Homework',
    description: 'All school work done for the day',
    type: TaskType.INDIVIDUAL,
    starValue: 5,
    assignedTo: [],
    completedBy: [],
    isRecurring: 'daily',
    category: 'Education'
  },
  {
    id: 't3',
    title: 'Morning Walk',
    description: 'Parent & Child walk together',
    type: TaskType.JOINT,
    starValue: 10,
    assignedTo: [],
    completedBy: [],
    isRecurring: 'daily',
    category: 'Health'
  }
];
