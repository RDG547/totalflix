"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollLock } from "@/hooks/useScrollLock";

export type AccountSettingsModalType = "email" | "password" | null;

interface AccountFormValues {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AccountSettingsModalProps {
  type: AccountSettingsModalType;
  values: AccountFormValues;
  saving: boolean;
  onChange: (field: keyof AccountFormValues, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function AccountSettingsModal({
  type,
  values,
  saving,
  onChange,
  onSubmit,
  onClose,
}: AccountSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  useScrollLock(Boolean(type));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!type) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving, type]);

  if (!mounted || !type) return null;

  const isEmail = type === "email";
  const Icon = isEmail ? Mail : KeyRound;
  const title = isEmail ? "Alterar e-mail" : "Alterar senha";
  const description = isEmail
    ? "Informe o novo endereço e confirme sua identidade."
    : "Defina uma nova senha com pelo menos 8 caracteres.";

  return createPortal(
    <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={() => {
          if (!saving) onClose();
        }}
        className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0b0810] shadow-2xl shadow-black"
      >
        <div className="flex items-start gap-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/70 to-transparent p-6">
          <div className="rounded-xl bg-purple-500/15 p-2.5">
            <Icon className="h-5 w-5 text-purple-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="account-modal-title" className="text-xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form
          className="space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {isEmail ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Novo e-mail</span>
              <input
                autoFocus
                type="email"
                required
                value={values.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                autoComplete="email"
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Nova senha</span>
                <input
                  autoFocus
                  type="password"
                  required
                  minLength={8}
                  value={values.newPassword}
                  onChange={(event) => onChange("newPassword", event.target.value)}
                  className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Confirmar nova senha</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={values.confirmPassword}
                  onChange={(event) => onChange("confirmPassword", event.target.value)}
                  className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                  autoComplete="new-password"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Senha atual</span>
            <input
              type="password"
              value={values.currentPassword}
              onChange={(event) => onChange("currentPassword", event.target.value)}
              className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              placeholder="Solicitada para contas com senha"
              autoComplete="current-password"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border-white/10 bg-white/5"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-500">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar alteração
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
