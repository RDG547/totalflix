"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Ban,
  Camera,
  CheckCircle2,
  Crown,
  ExternalLink,
  Film,
  Heart,
  History,
  KeyRound,
  Loader2,
  Radio,
  Save,
  ShieldCheck,
  Trash2,
  Trophy,
  Tv,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRole = "user" | "moderator" | "admin";
type DetailTab = "account" | "consumption" | "library" | "achievements";

interface Metric {
  views: number;
  unique: number;
  lastViewedAt: number;
}

interface ContentItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string;
  timestamp?: number;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  requirement: number;
  unlocked: boolean;
  unlockedAt: number;
}

interface RecentConsumption {
  id: string;
  type: "movie" | "tv" | "live_tv";
  contentId: string;
  itemKey: string;
  title: string;
  viewCount: number;
  firstViewedAt: number;
  lastViewedAt: number;
}

interface AdminUserDetail {
  uid: string;
  email: string;
  emailVerified: boolean;
  disabled: boolean;
  displayName: string;
  photoURL: string;
  role: UserRole;
  isPrimaryAdmin: boolean;
  vip: boolean;
  vipExpiresAt: number | null;
  favoritesTotal: number;
  historyTotal: number;
  achievementsUnlocked: number;
  consumption: {
    movie: Metric;
    tv: Metric;
    liveTv: Metric;
  };
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number;
  providers: string[];
  bio: string;
  favorites: ContentItem[];
  history: ContentItem[];
  achievements: AchievementItem[];
  achievementStats: Record<string, unknown>;
  recentConsumption: RecentConsumption[];
}

interface UserManagementDialogProps {
  uid: string | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

function dateText(value: number | null | undefined, withTime = true) {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function dateTimeLocal(value: number | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function contentHref(item: ContentItem) {
  return `/details/${item.type}/${item.id}`;
}

function roleLabel(role: UserRole) {
  if (role === "admin") return "Administrador";
  if (role === "moderator") return "Moderador";
  return "Usuário";
}

export function UserManagementDialog({
  uid,
  onClose,
  onChanged,
}: UserManagementDialogProps) {
  const { user, refreshAccess } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [tab, setTab] = useState<DetailTab>("account");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [vip, setVip] = useState(false);
  const [vipIndefinite, setVipIndefinite] = useState(true);
  const [vipExpiresAt, setVipExpiresAt] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const hydrateForm = useCallback((nextDetail: AdminUserDetail) => {
    setDetail(nextDetail);
    setDisplayName(nextDetail.displayName);
    setEmail(nextDetail.email);
    setPassword("");
    setRole(nextDetail.role);
    setVip(nextDetail.vip);
    setVipIndefinite(!nextDetail.vipExpiresAt);
    setVipExpiresAt(dateTimeLocal(nextDetail.vipExpiresAt));
    setDisabled(nextDetail.disabled);
  }, []);

  const loadDetail = useCallback(async () => {
    if (!uid || !user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar o usuário.");
      hydrateForm(payload as AdminUserDetail);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o usuário.");
    } finally {
      setLoading(false);
    }
  }, [hydrateForm, uid, user]);

  useEffect(() => {
    if (!uid) return;
    setTab("account");
    setDetail(null);
    setDeleteConfirmation("");
    void loadDetail();
  }, [loadDetail, uid]);

  useEffect(() => {
    if (!uid) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [uid]);

  const patchUser = async (payload: Record<string, unknown>) => {
    if (!uid || !user) throw new Error("Sessão administrativa indisponível.");
    const token = await user.getIdToken();
    const response = await fetch(`/api/admin/users/${uid}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível atualizar o usuário.");
    hydrateForm(result as AdminUserDetail);
    if (uid === user.uid && ("role" in payload || "vip" in payload)) {
      await refreshAccess().catch(() => undefined);
    }
    await onChanged();
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const expiration = vip && !vipIndefinite
        ? new Date(vipExpiresAt).getTime()
        : null;
      await patchUser({
        displayName,
        email,
        ...(password ? { password } : {}),
        role,
        disabled,
        vip,
        vipExpiresAt: expiration,
      });
      toast.success("Usuário atualizado com segurança.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (file: File) => {
    if (!uid || !user) return;
    setUploading(true);
    try {
      const token = await user.getIdToken();
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/admin/users/${uid}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a foto.");
      setDetail((current) => current ? { ...current, photoURL: payload.photoURL } : current);
      await onChanged();
      toast.success("Foto atualizada.");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      await patchUser({ photoURL: null });
      toast.success("Foto removida.");
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : "Não foi possível remover a foto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!uid || !user || deleteConfirmation !== "EXCLUIR") return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível excluir o usuário.");
      toast.success("Conta e dados do usuário excluídos.");
      await onChanged();
      onClose();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir.");
    } finally {
      setDeleting(false);
    }
  };

  if (!uid) return null;

  const tabs: Array<{ id: DetailTab; label: string; icon: typeof UserRound }> = [
    { id: "account", label: "Conta e acesso", icon: ShieldCheck },
    { id: "consumption", label: "Consumo", icon: Activity },
    { id: "library", label: "Favoritos e histórico", icon: Heart },
    { id: "achievements", label: "Conquistas", icon: Trophy },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/75 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fechar gestão do usuário"
      />
      <section className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-white/10 bg-[#0b0a0e] shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
              Gestão de usuário
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-white">
              {detail?.displayName || "Carregando perfil…"}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 text-zinc-500 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm text-zinc-500">Carregando dados protegidos…</p>
          </div>
        ) : error || !detail ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-lg rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="font-medium text-red-100">Não foi possível abrir este perfil</p>
              <p className="mt-2 text-sm leading-6 text-red-200/70">{error}</p>
              <Button onClick={() => void loadDetail()} className="mt-5 bg-red-600 hover:bg-red-500">
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 px-4 sm:px-7">
              <nav className="flex gap-1 overflow-x-auto py-2">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        tab === item.id
                          ? "bg-purple-500/15 text-purple-200"
                          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              {tab === "account" && (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                      <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-purple-500/10">
                        {detail.photoURL ? (
                          <Image
                            src={detail.photoURL}
                            alt={detail.displayName}
                            fill
                            sizes="112px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <UserRound className="absolute inset-0 m-auto h-12 w-12 text-purple-300" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handlePhoto(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full border-white/10 bg-white/5"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Enviar foto
                      </Button>
                      {detail.photoURL && (
                        <button
                          type="button"
                          onClick={() => void handleRemovePhoto()}
                          className="mt-3 w-full text-xs text-red-400 hover:text-red-300"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Nome de usuário">
                        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} />
                      </Field>
                      <Field label="E-mail">
                        <Input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          disabled={detail.isPrimaryAdmin}
                        />
                      </Field>
                      <Field label="Nova senha" hint="Deixe vazio para não alterar.">
                        <Input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          minLength={8}
                          autoComplete="new-password"
                          placeholder="Mínimo de 8 caracteres"
                        />
                      </Field>
                      <Field label="Cargo">
                        <select
                          value={role}
                          onChange={(event) => setRole(event.target.value as UserRole)}
                          disabled={detail.isPrimaryAdmin}
                          className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                        >
                          <option value="user">Usuário</option>
                          <option value="moderator">Moderador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <Crown className="mt-0.5 h-5 w-5 text-amber-300" />
                          <div>
                            <p className="font-medium text-amber-100">Acesso VIP</p>
                            <p className="mt-1 text-xs leading-5 text-amber-200/60">
                              Libera o player sem encurtador após validação da claim no servidor.
                            </p>
                          </div>
                        </div>
                        <Toggle checked={vip} onChange={setVip} label="VIP" />
                      </div>
                      {vip && (
                        <div className="mt-5 space-y-3 border-t border-amber-500/15 pt-4">
                          <label className="flex items-center gap-2 text-sm text-amber-100/80">
                            <input
                              type="checkbox"
                              checked={vipIndefinite}
                              onChange={(event) => setVipIndefinite(event.target.checked)}
                              className="accent-amber-500"
                            />
                            Acesso por tempo indeterminado
                          </label>
                          {!vipIndefinite && (
                            <Input
                              type="datetime-local"
                              value={vipExpiresAt}
                              min={dateTimeLocal(Date.now())}
                              onChange={(event) => setVipExpiresAt(event.target.value)}
                              className="border-amber-500/20 bg-black/30"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <Ban className={`mt-0.5 h-5 w-5 ${disabled ? "text-red-300" : "text-zinc-500"}`} />
                          <div>
                            <p className="font-medium text-white">Conta desativada</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                              Impede novos logins e revoga as sessões quando ativado.
                            </p>
                          </div>
                        </div>
                        <Toggle checked={disabled} onChange={setDisabled} label="Desativada" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm sm:grid-cols-3">
                    <Meta label="Cargo atual" value={roleLabel(detail.role)} />
                    <Meta label="Último login" value={dateText(detail.lastSignInAt)} />
                    <Meta label="Provedores" value={detail.providers.join(", ") || "Senha/e-mail"} />
                    <Meta label="Conta criada" value={dateText(detail.createdAt)} />
                    <Meta label="E-mail verificado" value={detail.emailVerified ? "Sim" : "Não"} />
                    <Meta label="UID" value={detail.uid} mono />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving || uploading || (vip && !vipIndefinite && !vipExpiresAt)}
                      className="bg-purple-600 hover:bg-purple-500"
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar alterações
                    </Button>
                  </div>

                  {!detail.isPrimaryAdmin && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
                      <div className="flex items-start gap-3">
                        <Trash2 className="mt-0.5 h-5 w-5 text-red-300" />
                        <div className="flex-1">
                          <p className="font-medium text-red-100">Excluir conta e perfil</p>
                          <p className="mt-1 text-xs leading-5 text-red-200/60">
                            Remove a autenticação, perfil, conquistas, métricas e fotos. Comentários ficam anonimizados.
                          </p>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Input
                              value={deleteConfirmation}
                              onChange={(event) => setDeleteConfirmation(event.target.value)}
                              placeholder='Digite "EXCLUIR"'
                              className="border-red-500/20 bg-black/30"
                            />
                            <Button
                              type="button"
                              onClick={() => void handleDelete()}
                              disabled={deleteConfirmation !== "EXCLUIR" || deleting}
                              className="shrink-0 bg-red-600 hover:bg-red-500"
                            >
                              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                              Excluir definitivamente
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "consumption" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ConsumptionCard
                      icon={Film}
                      label="Filmes"
                      metric={detail.consumption.movie}
                      tone="purple"
                    />
                    <ConsumptionCard
                      icon={Tv}
                      label="Séries"
                      metric={detail.consumption.tv}
                      tone="blue"
                    />
                    <ConsumptionCard
                      icon={Radio}
                      label="TV ao vivo"
                      metric={detail.consumption.liveTv}
                      tone="red"
                    />
                  </div>
                  <section className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="border-b border-white/10 px-5 py-4">
                      <h3 className="font-medium text-white">Atividade recente no player</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Contagens deduplicadas no servidor dentro da janela de segurança.
                      </p>
                    </div>
                    {detail.recentConsumption.length === 0 ? (
                      <Empty message="Nenhum consumo registrado pelo novo rastreador." />
                    ) : (
                      <div className="divide-y divide-white/10">
                        {detail.recentConsumption.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                            <div className="rounded-lg bg-white/5 p-2 text-zinc-400">
                              {item.type === "movie" ? <Film className="h-4 w-4" /> : item.type === "tv" ? <Tv className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-200">{item.title || item.itemKey}</p>
                              <p className="mt-1 text-xs text-zinc-600">{dateText(item.lastViewedAt)}</p>
                            </div>
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                              {item.viewCount} {item.viewCount === 1 ? "acesso" : "acessos"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {tab === "library" && (
                <div className="space-y-6">
                  <ContentCollection
                    title={`Favoritos (${detail.favoritesTotal})`}
                    icon={Heart}
                    items={detail.favorites}
                    empty="Nenhum favorito salvo."
                  />
                  <ContentCollection
                    title={`Histórico (${detail.historyTotal})`}
                    icon={History}
                    items={detail.history}
                    empty="Nenhum item no histórico."
                    showTimestamp
                  />
                </div>
              )}

              {tab === "achievements" && (
                <section className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                      <h3 className="font-medium text-white">Conquistas do usuário</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        {detail.achievementsUnlocked} de {detail.achievements.length} desbloqueadas
                      </p>
                    </div>
                    <Trophy className="h-6 w-6 text-amber-300" />
                  </div>
                  {detail.achievements.length === 0 ? (
                    <Empty message="As conquistas deste usuário ainda não foram inicializadas." />
                  ) : (
                    <div className="grid gap-3 p-5 md:grid-cols-2">
                      {detail.achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`flex gap-3 rounded-xl border p-4 ${
                            achievement.unlocked
                              ? "border-amber-500/20 bg-amber-500/[0.06]"
                              : "border-white/10 bg-black/20 opacity-65"
                          }`}
                        >
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-zinc-200">{achievement.title}</p>
                              {achievement.unlocked && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            </div>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">{achievement.description}</p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: `${Math.min(100, (achievement.progress / Math.max(achievement.requirement, 1)) * 100)}%` }}
                              />
                            </div>
                            <p className="mt-1.5 text-[11px] text-zinc-600">
                              {achievement.unlocked
                                ? `Desbloqueada em ${dateText(achievement.unlockedAt, false)}`
                                : `${achievement.progress} / ${achievement.requirement}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-400">
        {label}
        {hint && <span className="font-normal text-zinc-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-purple-600" : "bg-zinc-700"
      }`}
    >
      <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`} />
    </button>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className={`mt-1 truncate text-zinc-300 ${mono ? "font-mono text-xs" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function ConsumptionCard({
  icon: Icon,
  label,
  metric,
  tone,
}: {
  icon: typeof Film;
  label: string;
  metric: Metric;
  tone: "purple" | "blue" | "red";
}) {
  const styles = {
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    red: "border-red-500/20 bg-red-500/10 text-red-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className={`inline-flex rounded-xl border p-2.5 ${styles[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-white">{metric.views}</p>
      <p className="mt-2 text-xs text-zinc-600">
        {metric.unique} distintos · {metric.lastViewedAt ? `último em ${dateText(metric.lastViewedAt)}` : "sem atividade"}
      </p>
    </div>
  );
}

function ContentCollection({
  title,
  icon: Icon,
  items,
  empty,
  showTimestamp = false,
}: {
  title: string;
  icon: typeof Heart;
  items: ContentItem[];
  empty: string;
  showTimestamp?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Icon className="h-4 w-4 text-purple-400" />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      {items.length === 0 ? (
        <Empty message={empty} />
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <Link
              key={`${item.type}:${item.id}:${index}`}
              href={contentHref(item)}
              target="_blank"
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 hover:border-purple-500/30"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
                {item.posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <Film className="absolute inset-0 m-auto h-5 w-5 text-zinc-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-300 group-hover:text-purple-200">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {item.type === "movie" ? "Filme" : "Série"}
                  {showTimestamp && item.timestamp ? ` · ${dateText(item.timestamp, false)}` : ""}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center p-6 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}
