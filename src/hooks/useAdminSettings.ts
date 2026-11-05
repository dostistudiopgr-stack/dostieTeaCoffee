import { useSyncExternalStore } from 'react';
import { loadSettings } from '../utils/productStore';
import { subscribeToLocalData } from '../utils/storage';

let lastRaw: string | null | undefined;
let lastSettings = loadSettings();

function getSnapshot() {
  const raw = localStorage.getItem('dtc_admin_settings');
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastSettings = loadSettings();
  }
  return lastSettings;
}

export function useAdminSettings() {
  return useSyncExternalStore(subscribeToLocalData, getSnapshot, () => lastSettings);
}

