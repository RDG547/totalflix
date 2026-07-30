import { NextResponse } from 'next/server';
import { createGateToken, GateTokenError, verifyGateToken } from '@/lib/gate-token';
import { getGateSubject } from '@/lib/gate-subject';

export const dynamic = 'force-dynamic';

function isSafeReturnPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const challenge = url.searchParams.get('challenge') || '';
    const payload = verifyGateToken(challenge, 'challenge');
    const gateSubject = await getGateSubject(request);

    if (payload.subject !== gateSubject.subject) {
      return NextResponse.json({ error: 'Esta concessão pertence a outra sessão.' }, { status: 403 });
    }

    const returnTo = payload.returnTo || '/';
    if (!isSafeReturnPath(returnTo)) {
      return NextResponse.json({ error: 'Destino inválido.' }, { status: 400 });
    }

    const grant = createGateToken({
      kind: 'access',
      key: payload.key,
      subject: payload.subject,
      exp: Date.now() + (30 * 60 * 1000),
    });
    const destination = new URL(returnTo, url.origin);
    destination.searchParams.set('gate_grant', grant);
    return NextResponse.redirect(destination, { status: 303 });
  } catch (error) {
    const message = error instanceof GateTokenError
      ? error.message
      : 'Não foi possível validar o retorno do parceiro.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
