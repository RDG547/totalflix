import 'server-only';

import { claimsFromRecord, type AccessClaims } from './access-control';
import {
  FirebaseAdminConfigurationError,
  getFirebaseAdminAuth,
  isFirebaseAdminConfigured,
} from './firebase-admin';
import { isAdminEmail } from './admin';

interface FirebaseAccount {
  localId?: string;
  email?: string;
  disabled?: boolean;
}

interface FirebaseLookupResponse {
  users?: FirebaseAccount[];
}

export interface VerifiedUser extends AccessClaims {
  uid: string;
  email: string;
  idToken: string;
  isPrimaryAdmin: boolean;
}

export type VerifiedAdmin = VerifiedUser & {
  role: 'admin';
  admin: true;
};

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 500 | 503,
    public readonly code = 'ADMIN_AUTH_ERROR',
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  const [scheme, idToken] = authorization?.split(' ') || [];

  if (scheme?.toLowerCase() !== 'bearer' || !idToken) {
    throw new AdminAuthError('Faça login para continuar.', 401, 'AUTH_REQUIRED');
  }

  return idToken;
}

async function lookupWithIdentityToolkit(idToken: string): Promise<VerifiedUser> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new AdminAuthError('A autenticação do servidor não está configurada.', 500);
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new AdminAuthError('Sua sessão expirou. Entre novamente.', 401, 'INVALID_SESSION');
  }

  const payload = await response.json() as FirebaseLookupResponse;
  const account = payload.users?.[0];

  if (!account?.localId || !account.email || account.disabled) {
    throw new AdminAuthError('Sua sessão não é válida.', 401, 'INVALID_SESSION');
  }

  const primaryAdmin = isAdminEmail(account.email);
  return {
    uid: account.localId,
    email: account.email.toLowerCase(),
    idToken,
    isPrimaryAdmin: primaryAdmin,
    ...claimsFromRecord(undefined, primaryAdmin),
  };
}

export async function authenticateUserRequest(request: Request): Promise<VerifiedUser> {
  const idToken = bearerToken(request);

  if (!isFirebaseAdminConfigured()) {
    return lookupWithIdentityToolkit(idToken);
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const record = await auth.getUser(decoded.uid);

    if (!record.email || record.disabled) {
      throw new AdminAuthError('Sua conta não está disponível.', 401, 'ACCOUNT_UNAVAILABLE');
    }

    const primaryAdmin = isAdminEmail(record.email);
    return {
      uid: record.uid,
      email: record.email.toLowerCase(),
      idToken,
      isPrimaryAdmin: primaryAdmin,
      ...claimsFromRecord(record.customClaims, primaryAdmin),
    };
  } catch (error) {
    if (error instanceof AdminAuthError) throw error;
    console.error('Firebase token validation failed:', error);
    throw new AdminAuthError('Sua sessão expirou. Entre novamente.', 401, 'INVALID_SESSION');
  }
}

export async function authenticateAdminRequest(request: Request): Promise<VerifiedAdmin> {
  const user = await authenticateUserRequest(request);

  if (!user.admin || user.role !== 'admin') {
    throw new AdminAuthError('Esta conta não possui acesso administrativo.', 403, 'ADMIN_REQUIRED');
  }

  return user as VerifiedAdmin;
}

export function requireFirebaseAdmin(): void {
  if (!isFirebaseAdminConfigured()) {
    throw new AdminAuthError(
      'Configure FIREBASE_SERVICE_ACCOUNT_JSON para habilitar operações administrativas sensíveis.',
      503,
      'FIREBASE_ADMIN_NOT_CONFIGURED',
    );
  }

  try {
    getFirebaseAdminAuth();
  } catch (error) {
    if (error instanceof FirebaseAdminConfigurationError) {
      throw new AdminAuthError(error.message, 503, 'FIREBASE_ADMIN_NOT_CONFIGURED');
    }
    throw error;
  }
}

export function adminAuthErrorResponse(error: unknown): Response {
  if (error instanceof AdminAuthError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  if (error instanceof FirebaseAdminConfigurationError) {
    return Response.json(
      { error: error.message, code: 'FIREBASE_ADMIN_NOT_CONFIGURED' },
      { status: 503 },
    );
  }

  console.error('Admin authentication failed:', error);
  return Response.json(
    { error: 'Não foi possível validar o acesso administrativo.' },
    { status: 500 },
  );
}
