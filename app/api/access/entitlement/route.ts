import { authenticateUserRequest } from '@/lib/admin-server';
import { GateTokenError, verifyGateToken } from '@/lib/gate-token';
import { getGateSubject } from '@/lib/gate-subject';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as {
    contentKey?: unknown;
    grant?: unknown;
  };
  const contentKey = String(payload.contentKey || '');
  const grant = String(payload.grant || '');

  if (!contentKey || contentKey.length > 200) {
    return Response.json({ authorized: false, reason: 'invalid' }, { status: 400 });
  }

  if (request.headers.get('authorization')) {
    try {
      const user = await authenticateUserRequest(request);
      if (user.vip) {
        return Response.json(
          {
            authorized: true,
            reason: 'vip',
            vipExpiresAt: user.vipExpiresAt,
          },
          { headers: { 'Cache-Control': 'private, no-store' } },
        );
      }
    } catch {
      // Um grant assinado ainda pode autorizar a sessão anônima atual.
    }
  }

  if (!grant) {
    return Response.json(
      { authorized: false, reason: 'gate_required' },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    const token = verifyGateToken(grant, 'access');
    const gateSubject = await getGateSubject(request);
    // A passagem concluída pelo encurtador concede 6 horas em todo o site.
    // Mantém compatibilidade com grants antigos restritos a um conteúdo.
    const authorized = token.subject === gateSubject.subject
      && (token.scope === 'site' || token.key === contentKey);

    return Response.json(
      {
        authorized,
        reason: authorized ? 'gate' : 'subject_mismatch',
        ...(authorized ? { expiresAt: token.exp } : {}),
      },
      {
        status: authorized ? 200 : 403,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  } catch (error) {
    const reason = error instanceof GateTokenError ? 'invalid_grant' : 'verification_failed';
    return Response.json(
      { authorized: false, reason },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
