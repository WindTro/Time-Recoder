
import { TimeEntry } from '../types';

const STORAGE_KEY = 'chronomark_entries_v1';

export const saveEntry = (entry: TimeEntry): TimeEntry[] => {
  const existing = getEntries();
  const index = existing.findIndex(e => e.id === entry.id);
  
  let updated;
  if (index !== -1) {
    // Update existing
    updated = [...existing];
    updated[index] = entry;
    // Sort by start time desc just in case time changed
    updated.sort((a, b) => b.startTime - a.startTime);
  } else {
    // Create new
    updated = [entry, ...existing];
    // We assume existing is already sorted, but strictly speaking we should sort
    updated.sort((a, b) => b.startTime - a.startTime);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const getEntries = (): TimeEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse entries", e);
    return [];
  }
};

export const deleteEntry = (id: string): TimeEntry[] => {
  const existing = getEntries();
  const updated = existing.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearEntries = () => {
  localStorage.removeItem(STORAGE_KEY);
};
