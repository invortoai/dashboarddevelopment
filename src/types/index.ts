
export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  credit: number;
  signupTime: string;
  lastLogin?: string;
}

export interface CallDetails {
  id: string;
  userId: string;
  number: string;
  developer: string;
  project: string;
  callAttempted?: boolean;
  callLogId?: string;
  callStatus?: string;
  summary?: string;
  callRecording?: string;
  transcript?: string;
  callDuration?: number;
  callTime?: string;
  creditsConsumed?: number;
  feedback?: string;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  timestamp: string;
  callDetailId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface SessionInfo {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DateFormatOptions {
  day?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
  timeZone?: string;
}
