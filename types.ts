
export enum Role {
  PARENT = 'PARENT',
  CHILD = 'CHILD'
}

export enum TaskType {
  INDIVIDUAL = 'INDIVIDUAL',
  JOINT = 'JOINT'
}

export interface Profile {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  stars: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  starValue: number;
  assignedTo: string[]; // Profile IDs
  completedBy: string[]; // Profile IDs who finished their part (for today/current cycle)
  isRecurring: 'daily' | 'weekly' | 'none';
  category: string;
}

export interface HistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  profileId: string;
  timestamp: number;
  starsEarned: number;
}

export interface StreakInfo {
  count: number;
  lastCompletionDate: string; // ISO Date string (YYYY-MM-DD)
}

export type ProfileTaskStats = Record<string, StreakInfo>; // key: "profileId_taskId"

export type MascotState = 'IDLE' | 'PARENT_SUCCESS' | 'CHILD_SUCCESS' | 'JOINT_SUCCESS' | 'CHEER' | 'STREAK_BOOST';
