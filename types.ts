
export interface TimeEntry {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  category?: 'work' | 'personal' | 'study' | 'waste' | 'other';
}

export enum ViewMode {
  WINDOW = 'WINDOW',
  SIDEBAR = 'SIDEBAR',
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  entries: TimeEntry[];
}

// Add global window type definition for Electron
declare global {
  interface Window {
    electron?: {
      setMode: (mode: 'window' | 'sidebar') => void;
      expandSidebar: () => void;
      collapseSidebar: () => void;
      minimizeApp: () => void;
      closeApp: () => void;
    };
  }
}
