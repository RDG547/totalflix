import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notifications';

export interface Comment {
  id: string;
  contentId: number;
  contentType: 'movie' | 'tv';
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  likes: string[]; // Array de UIDs que curtiram
  dislikes: string[]; // Array de UIDs que deram dislike
  parentId?: string; // ID do comentário pai (para respostas)
  createdAt: number;
  updatedAt: number;
}

// Adicionar comentário
export async function addComment(
  contentId: number,
  contentType: 'movie' | 'tv',
  userId: string,
  userName: string,
  text: string,
  userPhoto?: string,
  parentId?: string
): Promise<Comment> {
  const commentRef = doc(collection(db, 'comments'));

  const newComment: Comment = {
    id: commentRef.id,
    contentId,
    contentType,
    userId,
    userName,
    userPhoto,
    text,
    likes: [],
    dislikes: [],
    ...(parentId && { parentId }), // Apenas adiciona parentId se não for undefined
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(commentRef, newComment);

  // Se for uma resposta, criar notificação para o autor do comentário original
  if (parentId) {
    const parentCommentSnap = await getDoc(doc(db, 'comments', parentId));
    if (parentCommentSnap.exists()) {
      const parentComment = parentCommentSnap.data() as Comment;
      await createNotification(
        parentComment.userId,
        'comment_reply',
        'Nova resposta',
        `${userName} respondeu seu comentário: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        {
          contentId,
          contentType,
          commentId: newComment.id,
          fromUserId: userId,
          fromUserName: userName,
          fromUserPhoto: userPhoto,
        }
      );
    }
  }

  return newComment;
}

// Obter comentários de um conteúdo
export async function getComments(
  contentId: number,
  contentType: 'movie' | 'tv'
): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('contentId', '==', contentId),
    where('contentType', '==', contentType),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Comment);
}

// Curtir comentário
export async function likeComment(commentId: string, userId: string, userName: string, userPhoto?: string) {
  const commentRef = doc(db, 'comments', commentId);
  const commentSnap = await getDoc(commentRef);

  if (commentSnap.exists()) {
    const comment = commentSnap.data() as Comment;

    // Remove dislike se existir
    let updates: any = {
      dislikes: arrayRemove(userId),
    };

    // Toggle like
    const wasLiked = comment.likes.includes(userId);
    if (wasLiked) {
      updates.likes = arrayRemove(userId);
    } else {
      updates.likes = arrayUnion(userId);

      // Criar notificação para o autor do comentário
      await createNotification(
        comment.userId,
        'comment_like',
        'Curtida no comentário',
        `${userName} curtiu seu comentário`,
        {
          contentId: comment.contentId,
          contentType: comment.contentType,
          commentId: comment.id,
          fromUserId: userId,
          fromUserName: userName,
          fromUserPhoto: userPhoto,
        }
      );
    }

    await updateDoc(commentRef, updates);
  }
}

// Dar dislike em comentário
export async function dislikeComment(commentId: string, userId: string) {
  const commentRef = doc(db, 'comments', commentId);
  const commentSnap = await getDoc(commentRef);

  if (commentSnap.exists()) {
    const comment = commentSnap.data() as Comment;

    // Remove like se existir
    let updates: any = {
      likes: arrayRemove(userId),
    };

    // Toggle dislike
    if (comment.dislikes.includes(userId)) {
      updates.dislikes = arrayRemove(userId);
    } else {
      updates.dislikes = arrayUnion(userId);
    }

    await updateDoc(commentRef, updates);
  }
}

// Excluir comentário
export async function deleteComment(commentId: string, userId: string) {
  const commentRef = doc(db, 'comments', commentId);
  const commentSnap = await getDoc(commentRef);

  if (commentSnap.exists()) {
    const comment = commentSnap.data() as Comment;

    // Verificar se o usuário é o autor
    if (comment.userId !== userId) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }

    // Excluir respostas também
    const repliesQuery = query(
      collection(db, 'comments'),
      where('parentId', '==', commentId)
    );
    const repliesSnapshot = await getDocs(repliesQuery);

    const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Excluir o comentário principal
    await deleteDoc(commentRef);
  }
}
