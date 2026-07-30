import 'server-only';

import { isAdminEmail } from './admin';

interface FirebaseAccount {
  localId?: string;
  email?: string;
  disabled?: boolean;
}

interface FirebaseLookupResponse {
  users?: FirebaseAccount[];
}

export interface VerifiedAdmin {
  uid: string;
  email: string;
  idToken: string;
}

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 | 500,
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export async function authenticateAdminRequest(request: Request): Promise<VerifiedAdmin> {
  const authorization = request.headers.get('authorization');
  const [scheme, idToken] = authorization?.split(' ') || [];

  if (scheme?.toLowerCase() !== 'bearer' || !idToken) {
    throw new AdminAuthError('Faça login com uma conta administrativa.', 401);
  }

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
    throw new AdminAuthError('Sua sessão expirou. Entre novamente.', 401);
  }

  const payload = await response.json() as FirebaseLookupResponse;
  const account = payload.users?.[0];

  if (!account?.localId || !account.email || account.disabled) {
    throw new AdminAuthError('Sua sessão não é válida.', 401);
  }

  if (!isAdminEmail(account.email)) {
    throw new AdminAuthError('Esta conta não possui acesso administrativo.', 403);
  }

  return {
    uid: account.localId,
    email: account.email.toLowerCase(),
    idToken,
  };
}

export function adminAuthErrorResponse(error: unknown): Response {
  if (error instanceof AdminAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error('Admin authentication failed:', error);
  return Response.json(
    { error: 'Não foi possível validar o acesso administrativo.' },
    { status: 500 },
  );
}
