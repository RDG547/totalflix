import { NextResponse } from 'next/server';
import { shortenUrl } from '@/lib/softurl-server';
import { createGateToken, GateTokenError } from '@/lib/gate-token';
import { GATE_ANONYMOUS_COOKIE, getGateSubject } from '@/lib/gate-subject';

export const dynamic = 'force-dynamic';

// Só permite redirecionar de volta para um caminho relativo do próprio site,
// evitando open-redirect via "returnTo" (ex.: "//evil.com" ou "/\\evil.com").
function isSafeReturnPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const key = searchParams.get('key');
  const returnTo = searchParams.get('returnTo') || '/';

  if (!key || key.length > 200 || !/^[A-Za-z0-9:_-]+$/.test(key) || !isSafeReturnPath(returnTo)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  try {
    const gateSubject = await getGateSubject(request);
    const challenge = createGateToken({
      kind: 'challenge',
      key,
      subject: gateSubject.subject,
      returnTo,
      exp: Date.now() + (15 * 60 * 1000),
    });
    const destination = new URL('/api/linkgate/unlock', origin);
    destination.searchParams.set('challenge', challenge);

    let redirectUrl: string;
    try {
      redirectUrl = await shortenUrl(destination.toString());
    } catch (error) {
      console.error('Erro ao encurtar link via Softurl:', error);
      return NextResponse.json(
        { error: 'O parceiro de liberação está temporariamente indisponível.' },
        { status: 503 },
      );
    }

    const response = NextResponse.redirect(redirectUrl, { status: 307 });
    if (gateSubject.anonymousId && gateSubject.isNewAnonymousId) {
      response.cookies.set(GATE_ANONYMOUS_COOKIE, gateSubject.anonymousId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
        path: '/',
      });
    }
    return response;
  } catch (error) {
    if (error instanceof GateTokenError) {
      return NextResponse.json(
        { error: 'O acesso seguro ao player ainda não está configurado.' },
        { status: 503 },
      );
    }
    console.error('Não foi possível iniciar o LinkGate:', error);
    return NextResponse.json({ error: 'Não foi possível iniciar o acesso.' }, { status: 500 });
  }
}
