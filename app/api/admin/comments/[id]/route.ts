import { authenticateAdminRequest, adminAuthErrorResponse } from '@/lib/admin-server';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  deleteFirestoreDocument,
  FirestoreRequestError,
  queryFirestoreDocuments,
} from '@/lib/firestore-rest';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  let admin;
  try {
    admin = await authenticateAdminRequest(request);
  } catch (error) {
    return adminAuthErrorResponse(error);
  }

  const commentId = params.id;
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(commentId)) {
    return Response.json({ error: 'Comentário inválido.' }, { status: 400 });
  }

  try {
    if (isFirebaseAdminConfigured()) {
      const db = getFirebaseAdminDb();
      const replies = await db.collection('comments').where('parentId', '==', commentId).get();
      const writer = db.bulkWriter();
      replies.docs.forEach((reply) => writer.delete(reply.ref));
      writer.delete(db.doc(`comments/${commentId}`));
      await writer.close();

      return Response.json({
        ok: true,
        deleted: 1 + replies.size,
      });
    }

    const replies = await queryFirestoreDocuments(
      'comments',
      'parentId',
      commentId,
      admin.idToken,
    );

    await Promise.all(
      replies.map((reply) => deleteFirestoreDocument('comments', reply.id, admin.idToken)),
    );
    await deleteFirestoreDocument('comments', commentId, admin.idToken);

    return Response.json({
      ok: true,
      deleted: 1 + replies.length,
    });
  } catch (error) {
    console.error(`Admin could not delete comment "${commentId}":`, error);

    if (error instanceof FirestoreRequestError && error.status === 403) {
      return Response.json(
        { error: 'As regras atuais do Firestore não permitem moderar comentários.' },
        { status: 403 },
      );
    }

    return Response.json(
      { error: 'Não foi possível excluir o comentário.' },
      { status: 500 },
    );
  }
}
