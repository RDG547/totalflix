"use client";

import { useState } from "react";
import { Film, Loader2, LockKeyhole, ShieldCheck, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MaintenanceScreen({ message }: { message: string }) {
  const { signIn, logout, refreshAccess } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signIn(email, password);
      const access = await refreshAccess();
      if (!access.admin) {
        await logout();
        throw new Error("Esta conta não possui acesso administrativo.");
      }
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar.");
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07060a] p-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_42%)]" />
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-800 shadow-xl shadow-purple-950/60">
          <Wrench className="h-8 w-8" />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
          Em manutenção
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Estamos preparando melhorias
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-400">{message}</p>

        {!showAdminLogin ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdminLogin(true)}
            className="mt-8 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          >
            <LockKeyhole className="mr-2 h-4 w-4" />
            Acesso administrativo
          </Button>
        ) : (
          <form
            onSubmit={handleAdminLogin}
            className="mx-auto mt-8 max-w-sm space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5 text-left"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                <ShieldCheck className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium">Entrada da equipe</p>
                <p className="text-xs text-zinc-600">Somente administradores</p>
              </div>
            </div>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail administrativo"
              autoComplete="username"
              required
              className="border-white/10 bg-black/40"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              required
              className="border-white/10 bg-black/40"
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-500">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Film className="mr-2 h-4 w-4" />
              )}
              Entrar no painel
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
