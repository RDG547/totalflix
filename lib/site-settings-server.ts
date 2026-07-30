import 'server-only';

import { getFirebaseAdminDb, isFirebaseAdminConfigured } from './firebase-admin';

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  updatedAt: number;
  updatedBy: string;
}

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  enabled: false,
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
    return {
      enabled: data.maintenanceEnabled === true,
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
