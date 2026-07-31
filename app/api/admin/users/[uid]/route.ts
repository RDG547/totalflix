import type { UpdateRequest, UserRecord } from 'firebase-admin/auth';
import {
  authenticateAdminRequest,
  adminAuthErrorResponse,
  requireFirebaseAdmin,
} from '@/lib/admin-server';
import { normalizeRole, type UserRole } from '@/lib/access-control';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/admin';
import {
  deleteUserProfilePhotos,
  deleteUserData,
  getAdminUserDetail,
  writeAdminAuditLog,
} from '@/lib/admin-user-service';

export const dynamic = 'force-dynamic';

function validUid(uid: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(uid);
}

function canManageTarget(
  actor: Awaited<ReturnType<typeof authenticateAdminRequest>>,
  target: UserRecord,
  action: 'edit' | 'role' | 'delete',
) {
  const targetPrimary = isAdminEmail(target.email);
  const targetAdmin = targetPrimary
    || target.customClaims?.admin === true
    || target.customClaims?.role === 'admin';

  if (targetPrimary && action === 'delete') {
    throw new Error('PRIMARY_ADMIN_PROTECTED');
  }
  if (!actor.isPrimaryAdmin && targetAdmin && target.uid !== actor.uid) {
    throw new Error('ADMIN_TARGET_PROTECTED');
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;
    await authenticateAdminRequest(request);
    requireFirebaseAdmin();
    if (!validUid(uid)) {
      return Response.json({ error: 'Usuário inválido.' }, { status: 400 });
    }
    return Response.json(await getAdminUserDetail(uid), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;
    const actor = await authenticateAdminRequest(request);
    requireFirebaseAdmin();
    if (!validUid(uid)) {
      return Response.json({ error: 'Usuário inválido.' }, { status: 400 });
    }

    const auth = getFirebaseAdminAuth();
    const target = await auth.getUser(uid);
    canManageTarget(actor, target, 'edit');

    const payload = await request.json() as {
      displayName?: unknown;
      email?: unknown;
      password?: unknown;
      photoURL?: unknown;
      disabled?: unknown;
      role?: unknown;
      vip?: unknown;
      vipExpiresAt?: unknown;
    };

    const authUpdates: UpdateRequest = {};
    const profileUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    const auditFields: string[] = [];
    let claimsChanged = false;
    let revokeSessions = false;

    if (payload.displayName !== undefined) {
      const displayName = String(payload.displayName).trim().slice(0, 80);
      authUpdates.displayName = displayName || null;
      profileUpdates.displayName = displayName;
      auditFields.push('displayName');
    }

    if (payload.email !== undefined) {
      const email = String(payload.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: 'E-mail inválido.' }, { status: 400 });
      }
      if (isAdminEmail(target.email) && email !== target.email?.toLowerCase()) {
        return Response.json(
          { error: 'O e-mail da conta administrativa principal é protegido.' },
          { status: 403 },
        );
      }
      authUpdates.email = email;
      profileUpdates.email = email;
      auditFields.push('email');
      revokeSessions = true;
    }

    if (payload.password !== undefined && String(payload.password)) {
      const password = String(payload.password);
      if (password.length < 8) {
        return Response.json(
          { error: 'A nova senha deve ter pelo menos 8 caracteres.' },
          { status: 400 },
        );
      }
      authUpdates.password = password;
      auditFields.push('password');
      revokeSessions = true;
    }

    if (payload.photoURL !== undefined) {
      const photoURL = payload.photoURL === null || payload.photoURL === ''
        ? null
        : String(payload.photoURL).trim();
      if (photoURL) {
        let hostname = '';
        try {
          const parsed = new URL(photoURL);
          if (parsed.protocol !== 'https:') throw new Error('protocolo inválido');
          hostname = parsed.hostname;
        } catch {
          return Response.json({ error: 'A foto deve usar uma URL HTTPS válida.' }, { status: 400 });
        }
        if (!['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'].includes(hostname)) {
          return Response.json(
            { error: 'Envie a foto pelo painel para armazená-la com segurança.' },
            { status: 400 },
          );
        }
      }
      authUpdates.photoURL = photoURL;
      profileUpdates.photoURL = photoURL || '';
      auditFields.push('photoURL');
    }

    if (typeof payload.disabled === 'boolean') {
      if (target.uid === actor.uid && payload.disabled) {
        return Response.json({ error: 'Você não pode desativar sua própria conta.' }, { status: 403 });
      }
      authUpdates.disabled = payload.disabled;
      auditFields.push('disabled');
      revokeSessions = payload.disabled;
    }

    const existingClaims = { ...(target.customClaims || {}) };
    const nextClaims: Record<string, unknown> = { ...existingClaims };

    if (payload.role !== undefined) {
      canManageTarget(actor, target, 'role');
      const role = normalizeRole(payload.role);
      if (payload.role !== role) {
        return Response.json({ error: 'Cargo inválido.' }, { status: 400 });
      }
      const targetAlreadyAdmin = isAdminEmail(target.email)
        || existingClaims.admin === true
        || existingClaims.role === 'admin';
      if (isAdminEmail(target.email) && role !== 'admin') {
        throw new Error('PRIMARY_ADMIN_PROTECTED');
      }
      if (role === 'admin' && !actor.isPrimaryAdmin && !targetAlreadyAdmin) {
        return Response.json(
          { error: 'Somente o administrador principal pode conceder o cargo de administrador.' },
          { status: 403 },
        );
      }
      nextClaims.role = role;
      nextClaims.admin = role === 'admin';
      profileUpdates.role = role;
      auditFields.push('role');
      claimsChanged = true;
      if (existingClaims.role === 'admin' && role !== 'admin') revokeSessions = true;
    }

    if (typeof payload.vip === 'boolean') {
      let expirationMs: number | null = null;
      if (payload.vip && payload.vipExpiresAt !== null && payload.vipExpiresAt !== undefined) {
        expirationMs = Number(payload.vipExpiresAt);
        if (!Number.isFinite(expirationMs) || expirationMs <= Date.now()) {
          return Response.json({ error: 'A expiração VIP deve estar no futuro.' }, { status: 400 });
        }
      }

      nextClaims.vip = payload.vip;
      nextClaims.vipExpiresAt = expirationMs ? Math.floor(expirationMs / 1000) : null;
      profileUpdates.vip = payload.vip;
      profileUpdates.vipExpiresAt = expirationMs;
      auditFields.push('vip');
      claimsChanged = true;
      if (existingClaims.vip === true && !payload.vip) revokeSessions = true;
    }

    if (Object.keys(authUpdates).length > 0) {
      await auth.updateUser(target.uid, authUpdates);
    }
    if (claimsChanged) {
      await auth.setCustomUserClaims(target.uid, nextClaims);
    }

    await getFirebaseAdminDb().doc(`users/${target.uid}`).set(profileUpdates, { merge: true });
    if (payload.photoURL === null || payload.photoURL === '') {
      await deleteUserProfilePhotos(target.uid);
    }
    if (revokeSessions) await auth.revokeRefreshTokens(target.uid);

    await writeAdminAuditLog({
      action: 'user.updated',
      actorUid: actor.uid,
      actorEmail: actor.email,
      targetUid: target.uid,
      metadata: { fields: auditFields },
    });

    return Response.json(await getAdminUserDetail(target.uid));
  } catch (error) {
    if (error instanceof Error && error.message === 'PRIMARY_ADMIN_PROTECTED') {
      return Response.json(
        { error: 'A conta administrativa principal não pode ser rebaixada ou excluída.' },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === 'ADMIN_TARGET_PROTECTED') {
      return Response.json(
        { error: 'Somente o administrador principal pode gerenciar outro administrador.' },
        { status: 403 },
      );
    }
    return adminAuthErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;
    const actor = await authenticateAdminRequest(request);
    requireFirebaseAdmin();
    if (!validUid(uid)) {
      return Response.json({ error: 'Usuário inválido.' }, { status: 400 });
    }
    if (uid === actor.uid) {
      return Response.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 403 });
    }

    const auth = getFirebaseAdminAuth();
    const target = await auth.getUser(uid);
    canManageTarget(actor, target, 'delete');

    await writeAdminAuditLog({
      action: 'user.deleted',
      actorUid: actor.uid,
      actorEmail: actor.email,
      targetUid: target.uid,
      metadata: { email: target.email || '' },
    });
    await deleteUserData(target.uid);
    await auth.deleteUser(target.uid);

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && ['PRIMARY_ADMIN_PROTECTED', 'ADMIN_TARGET_PROTECTED'].includes(error.message)) {
      return Response.json({ error: 'Esta conta administrativa é protegida.' }, { status: 403 });
    }
    return adminAuthErrorResponse(error);
  }
}
