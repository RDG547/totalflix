import 'server-only';

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export class FirebaseAdminConfigurationError extends Error {
  constructor(message = 'O Firebase Admin ainda não está configurado no servidor.') {
    super(message);
    this.name = 'FirebaseAdminConfigurationError';
  }
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (raw) {
    let decoded = raw;
    if (!raw.startsWith('{')) {
      try {
        decoded = Buffer.from(raw, 'base64').toString('utf8');
      } catch {
        throw new FirebaseAdminConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON não é um JSON/Base64 válido.');
      }
    }

    try {
      const account = JSON.parse(decoded) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };

      if (!account.project_id || !account.client_email || !account.private_key) {
        throw new Error('campos obrigatórios ausentes');
      }

      return {
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, '\n'),
      };
    } catch {
      throw new FirebaseAdminConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON está incompleto ou inválido.');
    }
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
    || process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && projectId) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  throw new FirebaseAdminConfigurationError();
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
