"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/userProfile';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return 'Não foi possível concluir a autenticação. Tente novamente.';
  }

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/invalid-email': 'Digite um endereço de e-mail válido.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente entrar na sua conta.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes da conclusão.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/operation-not-allowed': 'Este método de login ainda não está habilitado no Firebase.',
  };

  return messages[error.code] || 'Não foi possível entrar. Tente novamente.';
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Criar ou atualizar perfil do usuário
        await createUserProfile(
          user.uid,
          user.email || '',
          user.displayName || undefined,
          user.photoURL || undefined
        );
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      await createUserProfile(userCredential.user.uid, normalizedEmail, name.trim());
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      await createUserProfile(
        userCredential.user.uid,
        userCredential.user.email || '',
        userCredential.user.displayName || undefined,
        userCredential.user.photoURL || undefined
      );
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
