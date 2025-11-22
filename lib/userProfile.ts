import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  favorites: number[];
  history: {
    id: number;
    type: 'movie' | 'tv';
    timestamp: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

// Criar ou atualizar perfil do usuário
export async function createUserProfile(uid: string, email: string, displayName?: string, photoURL?: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      bio: '',
      favorites: [],
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  }

  return userSnap.data() as UserProfile;
}

// Obter perfil do usuário
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
}

// Atualizar informações do perfil
export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; photoURL?: string; bio?: string }
) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

// Adicionar aos favoritos
export async function addToFavorites(uid: string, contentId: number) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    favorites: arrayUnion(contentId),
    updatedAt: Date.now(),
  });
}

// Remover dos favoritos
export async function removeFromFavorites(uid: string, contentId: number) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    favorites: arrayRemove(contentId),
    updatedAt: Date.now(),
  });
}

// Adicionar ao histórico
export async function addToHistory(uid: string, contentId: number, type: 'movie' | 'tv') {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    const history = userData.history || [];

    // Remove entrada anterior do mesmo conteúdo
    const filteredHistory = history.filter(item => item.id !== contentId);

    // Adiciona nova entrada no início
    const newHistory = [
      { id: contentId, type, timestamp: Date.now() },
      ...filteredHistory,
    ].slice(0, 50); // Mantém apenas os últimos 50 itens

    await updateDoc(userRef, {
      history: newHistory,
      updatedAt: Date.now(),
    });
  }
}

// Limpar histórico
export async function clearHistory(uid: string) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    history: [],
    updatedAt: Date.now(),
  });
}

// Upload de foto de perfil
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `profile-photos/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const photoURL = await getDownloadURL(storageRef);

  // Atualizar perfil com nova URL
  await updateUserProfile(uid, { photoURL });

  return photoURL;
}
