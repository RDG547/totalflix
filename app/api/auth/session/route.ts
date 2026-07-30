import { getFirebaseAdminAuth } from '@/lib/firebase-admin';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from '@/lib/session-server';
import {
  AdminAuthError,
  adminAuthErrorResponse,
  requireFirebaseAdmin,
} from '@/lib/admin-server';

export const dynamic = 'force-dynamic';

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function sessionCookie(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return [
    `${SESSION_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
    secure,
  ].filter(Boolean).join('; ');
}

export async function POST(request: Request) {
  try {
    requireFirebaseAdmin();
    if (!sameOrigin(request)) {
      throw new AdminAuthError('Origem da requisição não autorizada.', 403, 'INVALID_ORIGIN');
    }

    const authorization = request.headers.get('authorization');
    const [scheme, idToken] = authorization?.split(' ') || [];
    if (scheme?.toLowerCase() !== 'bearer' || !idToken) {
      throw new AdminAuthError('Token de sessão ausente.', 401, 'AUTH_REQUIRED');
    }

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const authAgeSeconds = Math.floor(Date.now() / 1000) - Number(decoded.auth_time || 0);

    if (authAgeSeconds > 5 * 60) {
      throw new AdminAuthError(
        'Entre novamente para renovar a sessão segura.',
        401,
        'RECENT_LOGIN_REQUIRED',
      );
    }

    const cookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    return Response.json(
      { ok: true, expiresAt: Date.now() + SESSION_DURATION_MS },
      {
        headers: {
          'Set-Cookie': sessionCookie(cookie, Math.floor(SESSION_DURATION_MS / 1000)),
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': sessionCookie('', 0),
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
