"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithPopup,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { createUserProfile, updateUserProfile } from '@/lib/userProfile';
import { claimsFromRecord, type AccessClaims } from '@/lib/access-control';
import { isAdminEmail } from '@/lib/admin';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  access: AccessClaims;
  isAdmin: boolean;
  isVip: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<AccessClaims>;
  updateAccountEmail: (email: string, currentPassword?: string) => Promise<void>;
  updateAccountPassword: (password: string, currentPassword?: string) => Promise<void>;
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
    'auth/requires-recent-login': 'Confirme sua identidade novamente antes de alterar estes dados.',
    'auth/wrong-password': 'A senha atual está incorreta.',
    'auth/missing-password': 'Informe sua senha atual para confirmar a alteração.',
    'auth/user-mismatch': 'A conta escolhida não corresponde ao usuário conectado.',
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
  const [access, setAccess] = useState<AccessClaims>(() => claimsFromRecord(undefined));

  const readAccess = async (currentUser: User, forceRefresh = false) => {
    const tokenResult = await currentUser.getIdTokenResult(forceRefresh);
    const nextAccess = claimsFromRecord(tokenResult.claims, isAdminEmail(currentUser.email));
    setAccess(nextAccess);
    return nextAccess;
  };

  const syncServerSession = async (currentUser: User) => {
    const idToken = await currentUser.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    // Ambientes ainda sem credencial Admin continuam com autenticação cliente.
    if (!response.ok && ![401, 503].includes(response.status)) {
      throw new Error('Não foi possível sincronizar a sessão segura.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          await Promise.all([
            createUserProfile(
              currentUser.uid,
              currentUser.email || '',
              currentUser.displayName || undefined,
              currentUser.photoURL || undefined,
            ),
            readAccess(currentUser),
            syncServerSession(currentUser),
          ]);
        } else {
          setAccess(claimsFromRecord(undefined));
        }
      } catch (error) {
        console.error('Não foi possível sincronizar completamente a sessão:', error);
      } finally {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await Promise.all([
        readAccess(credential.user, true),
        syncServerSession(credential.user),
      ]);
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
      await Promise.all([
        readAccess(userCredential.user, true),
        syncServerSession(userCredential.user),
      ]);
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
      await Promise.all([
        readAccess(userCredential.user, true),
        syncServerSession(userCredential.user),
      ]);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    await signOut(auth);
    setAccess(claimsFromRecord(undefined));
  };

  const refreshAccess = async () => {
    if (!user) {
      const emptyAccess = claimsFromRecord(undefined);
      setAccess(emptyAccess);
      return emptyAccess;
    }

    return readAccess(user, true);
  };

  const reauthenticate = async (currentPassword?: string) => {
    if (!user) throw new Error('Entre na sua conta para alterar os dados de acesso.');
    const usesPassword = user.providerData.some((provider) => provider.providerId === 'password');

    try {
      if (usesPassword) {
        if (!user.email || !currentPassword) {
          throw new FirebaseError('auth/missing-password', 'Current password is required.');
        }
        await reauthenticateWithCredential(
          user,
          EmailAuthProvider.credential(user.email, currentPassword),
        );
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(user, provider);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const updateAccountEmail = async (email: string, currentPassword?: string) => {
    if (!user) throw new Error('Entre na sua conta para alterar o e-mail.');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Digite um endereço de e-mail válido.');
    }

    await reauthenticate(currentPassword);
    try {
      await updateEmail(user, normalizedEmail);
      await updateUserProfile(user.uid, { email: normalizedEmail });
      await user.getIdToken(true);
      await Promise.all([readAccess(user, true), syncServerSession(user)]);
      await user.reload();
      setUser(auth.currentUser);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const updateAccountPassword = async (password: string, currentPassword?: string) => {
    if (!user) throw new Error('Entre na sua conta para alterar a senha.');
    if (password.length < 8) throw new Error('A nova senha deve ter pelo menos 8 caracteres.');

    await reauthenticate(currentPassword);
    try {
      await updatePassword(user, password);
      await syncServerSession(user);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const value = {
    user,
    loading,
    access,
    isAdmin: access.admin,
    isVip: access.vip,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    refreshAccess,
    updateAccountEmail,
    updateAccountPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
