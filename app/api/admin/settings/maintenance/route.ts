import {
  authenticateAdminRequest,
  adminAuthErrorResponse,
  requireFirebaseAdmin,
} from '@/lib/admin-server';
import { getFirebaseAdminDb } from '@/lib/firebase-admin';
import { getMaintenanceSettings } from '@/lib/site-settings-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await authenticateAdminRequest(request);
    return Response.json(await getMaintenanceSettings(), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    requireFirebaseAdmin();

    const payload = await request.json() as {
      enabled?: unknown;
      message?: unknown;
    };
    if (typeof payload.enabled !== 'boolean') {
      return Response.json({ error: 'Estado de manutenção inválido.' }, { status: 400 });
    }

    const message = typeof payload.message === 'string'
      ? payload.message.trim().slice(0, 240)
      : '';
    if (payload.enabled && !message) {
      return Response.json(
        { error: 'Informe a mensagem exibida durante a manutenção.' },
        { status: 400 },
      );
    }

    const now = Date.now();
    const db = getFirebaseAdminDb();
    await Promise.all([
      db.doc('settings/site').set({
        maintenanceEnabled: payload.enabled,
        maintenanceMessage: message || 'Estamos realizando melhorias. Voltaremos em breve.',
        maintenanceUpdatedAt: now,
        maintenanceUpdatedBy: admin.uid,
      }, { merge: true }),
      db.collection('adminAuditLogs').add({
        action: payload.enabled ? 'maintenance.enabled' : 'maintenance.disabled',
        actorUid: admin.uid,
        actorEmail: admin.email,
        targetType: 'site',
        targetId: 'site',
        metadata: { message },
        createdAt: now,
      }),
    ]);

    return Response.json(await getMaintenanceSettings());
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}
