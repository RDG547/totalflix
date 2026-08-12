import 'server-only';

import { getFirebaseAdminDb, isFirebaseAdminConfigured } from './firebase-admin';

export interface MaintenanceSettings {
  enabled: boolean;
  scope: MaintenanceScope;
  message: string;
  updatedAt: number;
  updatedBy: string;
}

export type MaintenanceScope = 'all' | 'movies' | 'series' | 'tv';

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  enabled: false,
  scope: 'all',
  message: 'Estamos realizando melhorias. Voltaremos em breve.',
  updatedAt: 0,
  updatedBy: '',
};

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  if (!isFirebaseAdminConfigured()) return DEFAULT_MAINTENANCE_SETTINGS;

  try {
    const snapshot = await getFirebaseAdminDb().doc('settings/site').get();
    if (!snapshot.exists) return DEFAULT_MAINTENANCE_SETTINGS;

    const data = snapshot.data() || {};
    const scope = ['all', 'movies', 'series', 'tv'].includes(String(data.maintenanceScope))
      ? data.maintenanceScope as MaintenanceScope
      : 'all';
    return {
      enabled: data.maintenanceEnabled === true,
      scope,
      message: typeof data.maintenanceMessage === 'string' && data.maintenanceMessage.trim()
        ? data.maintenanceMessage.trim()
        : DEFAULT_MAINTENANCE_SETTINGS.message,
      updatedAt: Number(data.maintenanceUpdatedAt) || 0,
      updatedBy: typeof data.maintenanceUpdatedBy === 'string' ? data.maintenanceUpdatedBy : '',
    };
  } catch (error) {
    console.error('Could not read maintenance settings:', error);
    return DEFAULT_MAINTENANCE_SETTINGS;
  }
}
