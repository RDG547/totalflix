import {
  authenticateAdminRequest,
  adminAuthErrorResponse,
  requireFirebaseAdmin,
} from '@/lib/admin-server';
import { isAdminEmail } from '@/lib/admin';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase-admin';
import { uploadAdminProfilePhoto, writeAdminAuditLog } from '@/lib/admin-user-service';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_UID = /^[A-Za-z0-9_-]{1,128}$/;

export async function POST(
  request: Request,
  { params }: { params: { uid: string } },
) {
  try {
    const actor = await authenticateAdminRequest(request);
    requireFirebaseAdmin();
    if (!VALID_UID.test(params.uid)) {
      return Response.json({ error: 'Usuário inválido.' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Selecione uma imagem.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'Use uma imagem JPG, PNG ou WebP de até 5 MB.' },
        { status: 400 },
      );
    }

    const auth = getFirebaseAdminAuth();
    const target = await auth.getUser(params.uid);
    const targetIsAdmin = isAdminEmail(target.email)
      || target.customClaims?.admin === true
      || target.customClaims?.role === 'admin';
    if (!actor.isPrimaryAdmin && targetIsAdmin && target.uid !== actor.uid) {
      return Response.json(
        { error: 'Somente o administrador principal pode gerenciar outro administrador.' },
        { status: 403 },
      );
    }
    const photoURL = await uploadAdminProfilePhoto(params.uid, file);
    await Promise.all([
      auth.updateUser(params.uid, { photoURL }),
      getFirebaseAdminDb().doc(`users/${params.uid}`).set({
        photoURL,
        updatedAt: Date.now(),
      }, { merge: true }),
      writeAdminAuditLog({
        action: 'user.photo.updated',
        actorUid: actor.uid,
        actorEmail: actor.email,
        targetUid: params.uid,
      }),
    ]);

    return Response.json({ photoURL });
  } catch (error) {
    return adminAuthErrorResponse(error);
  }
}
