import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id: string;
  userId: string; // Usuário que receberá a notificação
  type: 'comment_reply' | 'comment_like' | 'favorite_activity';
  title: string;
  message: string;
  contentId?: number;
  contentType?: 'movie' | 'tv';
  commentId?: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserPhoto?: string;
  read: boolean;
  createdAt: number;
}

// Criar notificação
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  options?: {
    contentId?: number;
    contentType?: 'movie' | 'tv';
    commentId?: string;
    fromUserId?: string;
    fromUserName?: string;
    fromUserPhoto?: string;
  }
): Promise<void> {
  // Não criar notificação para si mesmo
  if (userId === options?.fromUserId) return;

  const notificationRef = doc(collection(db, 'notifications'));

  const notification: Notification = {
    id: notificationRef.id,
    userId,
    type,
    title,
    message,
    contentId: options?.contentId,
    contentType: options?.contentType,
    commentId: options?.commentId,
    fromUserId: options?.fromUserId,
    fromUserName: options?.fromUserName,
    fromUserPhoto: options?.fromUserPhoto,
    read: false,
    createdAt: Date.now(),
  };

  await setDoc(notificationRef, notification);
}

// Obter notificações do usuário
export async function getUserNotifications(
  userId: string,
  limitCount: number = 20
): Promise<Notification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Notification);
}

// Contar notificações não lidas
export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

// Marcar notificação como lida
export async function markAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

// Marcar todas como lidas
export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const updatePromises = querySnapshot.docs.map(doc =>
    updateDoc(doc.ref, { read: true })
  );

  await Promise.all(updatePromises);
}

// Excluir notificação
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

// Excluir todas as notificações
export async function deleteAllNotifications(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));

  await Promise.all(deletePromises);
}
