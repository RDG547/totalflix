"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  Clock3,
  Crown,
  ExternalLink,
  Film,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  Radio,
  Search,
  ServerCog,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Trash2,
  Trophy,
  Tv,
  UserRound,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserManagementDialog } from "@/components/admin/UserManagementDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminSection = "overview" | "users" | "comments" | "system";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "moderator" | "user";
  achievementsUnlocked: number;
  emailVerified: boolean;
  disabled: boolean;
  isPrimaryAdmin: boolean;
  vip: boolean;
  vipExpiresAt: number | null;
  lastSignInAt: number;
  providers: string[];
  consumption: {
    movie: { views: number; unique: number; lastViewedAt: number };
    tv: { views: number; unique: number; lastViewedAt: number };
    liveTv: { views: number; unique: number; lastViewedAt: number };
  };
  favoritesCount: number;
  historyCount: number;
  createdAt: number;
  updatedAt: number;
}

interface AdminComment {
  id: string;
  contentId: number;
  contentType: "movie" | "tv";
  userId: string;
  userName: string;
  text: string;
  likesCount: number;
  dislikesCount: number;
  parentId: string | null;
  createdAt: number;
}

interface AdminDashboardData {
  generatedAt: number;
  overview: {
    users: number;
    comments: number;
    favorites: number;
    historyItems: number;
    activeUsers30d: number;
    achievementsUnlocked: number;
    vipUsers: number;
    consumption: {
      movie: number;
      tv: number;
      liveTv: number;
    };
  };
  users: {
    items: AdminUser[];
    truncated: boolean;
    error: string | null;
  };
  comments: {
    items: AdminComment[];
    truncated: boolean;
    error: string | null;
  };
  maintenance: {
    enabled: boolean;
    scope: "all" | "movies" | "series" | "tv";
    message: string;
    updatedAt: number;
    updatedBy: string;
  };
}

const navigation: Array<{
  id: AdminSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "users", label: "Usuários", icon: Users },
  { id: "comments", label: "Comentários", icon: MessageSquare },
  { id: "system", label: "Sistema", icon: ServerCog },
];

const integerFormatter = new Intl.NumberFormat("pt-BR");

function formatDate(timestamp: number, includeTime = false): string {
  if (!timestamp) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(timestamp));
}

function initials(name: string, email: string): string {
  const source = name && name !== "Usuário sem nome" ? name : email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}


function UserAvatar({ user, compact = false }: { user: AdminUser; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user.photoURL]);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/25 to-violet-800/25 text-xs font-semibold text-purple-200 ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
      {user.photoURL && !imageFailed ? (
        <img
          src={user.photoURL}
          alt={`Foto de ${user.displayName}`}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials(user.displayName, user.email)
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "purple",
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "purple" | "blue" | "green" | "amber";
}) {
  const toneStyles = {
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <div className={`rounded-xl border p-2.5 ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] ${className}`}>
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CollectionNotice({ message }: { message: string }) {
  return (
    <div className="m-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <p>{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#07060a]">
      <div className="h-[73px] animate-pulse border-b border-white/10 bg-white/[0.025]" />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 h-9 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="h-96 animate-pulse rounded-2xl bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("overview");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<AdminComment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);

  const adminAllowed = isAdmin;

  const loadDashboard = useCallback(async (silent = false) => {
    if (!user || !adminAllowed) return;

    silent ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível carregar o painel.");
      }

      setData(payload as AdminDashboardData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar o painel.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, adminAllowed]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/admin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && adminAllowed) {
      void loadDashboard();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, adminAllowed, authLoading, loadDashboard]);

  useEffect(() => {
    if (!user || !adminAllowed) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void loadDashboard(true);
    };
    const interval = window.setInterval(refresh, 10_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user, adminAllowed, loadDashboard]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return data?.users.items || [];
    return (data?.users.items || []).filter((item) =>
      item.displayName.toLowerCase().includes(query)
      || item.email.toLowerCase().includes(query),
    );
  }, [data, userSearch]);

  const filteredComments = useMemo(() => {
    const query = commentSearch.trim().toLowerCase();
    if (!query) return data?.comments.items || [];
    return (data?.comments.items || []).filter((item) =>
      item.userName.toLowerCase().includes(query)
      || item.text.toLowerCase().includes(query),
    );
  }, [data, commentSearch]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleDeleteComment = async () => {
    if (!user || !commentToDelete || !data) return;
    setDeletingComment(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/comments/${commentToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível excluir o comentário.");
      }

      const deletedIds = new Set([
        commentToDelete.id,
        ...data.comments.items
          .filter((comment) => comment.parentId === commentToDelete.id)
          .map((comment) => comment.id),
      ]);

      setData((current) => current ? {
        ...current,
        overview: {
          ...current.overview,
          comments: Math.max(0, current.overview.comments - Number(payload.deleted || 1)),
        },
        comments: {
          ...current.comments,
          items: current.comments.items.filter((comment) => !deletedIds.has(comment.id)),
        },
      } : current);

      toast.success("Comentário removido.");
      setCommentToDelete(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir o comentário.",
      );
    } finally {
      setDeletingComment(false);
    }
  };

  const handleMaintenanceChange = async (
    enabled: boolean,
    message: string,
    scope: "all" | "movies" | "series" | "tv",
  ) => {
    if (!user) throw new Error("Sessão administrativa indisponível.");
    const idToken = await user.getIdToken();
    const response = await fetch("/api/admin/settings/maintenance", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled, message, scope }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Não foi possível alterar o modo manutenção.");
    }
    setData((current) => current ? { ...current, maintenance: payload } : current);
  };

  if (authLoading || (loading && adminAllowed)) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  if (!adminAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060a] p-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <ShieldAlert className="h-7 w-7 text-red-300" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            A conta <span className="text-zinc-200">{user.email}</span> não possui permissão
            para acessar este painel.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline" className="border-white/10 bg-white/5">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao site
              </Link>
            </Button>
            <Button onClick={handleLogout} className="bg-purple-600 hover:bg-purple-500">
              <LogOut className="mr-2 h-4 w-4" />
              Trocar de conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07060a] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a090d]/90 backdrop-blur-xl">
        <div className="flex h-[73px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Ir para o TotalFlix">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-800 shadow-lg shadow-purple-950/60">
                <Film className="h-5 w-5 text-white" />
              </span>
              <span className="hidden text-lg font-semibold sm:inline">
                Total<span className="text-purple-400">Flix</span>
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Painel administrativo</p>
              <p className="hidden truncate text-xs text-zinc-500 sm:block">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.maintenance.enabled && (
              <div className="hidden items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 sm:flex">
                <ShieldAlert className="h-3.5 w-3.5" />
                Em manutenção
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Atualizar painel"
              title="Atualizar painel"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-zinc-400 hover:bg-red-500/10 hover:text-red-300"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1680px]">
        <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 border-r border-white/10 px-4 py-6 lg:block">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-purple-500/15 text-purple-200"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-purple-400" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <Button
            asChild
            variant="outline"
            className="absolute bottom-6 left-4 right-4 justify-start border-purple-500/20 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar para o site
            </Link>
          </Button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                    active
                      ? "border-purple-500/30 bg-purple-500/15 text-purple-200"
                      : "border-white/10 bg-white/[0.025] text-zinc-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {error && (
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                <div>
                  <p className="font-medium text-red-100">Falha ao carregar o painel</p>
                  <p className="mt-1 text-sm text-red-200/70">{error}</p>
                </div>
              </div>
              <Button
                onClick={() => void loadDashboard()}
                variant="outline"
                className="shrink-0 border-red-500/20 bg-red-500/10 hover:bg-red-500/20"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {data && section === "overview" && (
            <OverviewSection data={data} onNavigate={setSection} />
          )}
          {data && section === "users" && (
            <UsersSection
              data={data}
              users={filteredUsers}
              search={userSearch}
              onSearch={setUserSearch}
              onManage={setSelectedUserUid}
            />
          )}
          {data && section === "comments" && (
            <CommentsSection
              data={data}
              comments={filteredComments}
              search={commentSearch}
              onSearch={setCommentSearch}
              onDelete={setCommentToDelete}
            />
          )}
          {data && section === "system" && (
            <SystemSection data={data} onMaintenanceChange={handleMaintenanceChange} />
          )}
        </main>
      </div>

      <ConfirmDialog
        isOpen={Boolean(commentToDelete)}
        title="Excluir comentário?"
        message="O comentário e suas respostas diretas serão removidos permanentemente."
        confirmText={deletingComment ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (!deletingComment) void handleDeleteComment();
        }}
        onCancel={() => {
          if (!deletingComment) setCommentToDelete(null);
        }}
      />
      <UserManagementDialog
        uid={selectedUserUid}
        onClose={() => setSelectedUserUid(null)}
        onChanged={() => loadDashboard(true)}
      />
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
        {eyebrow}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function OverviewSection({
  data,
  onNavigate,
}: {
  data: AdminDashboardData;
  onNavigate: (section: AdminSection) => void;
}) {
  const interactions = data.overview.favorites + data.overview.historyItems;
  const recentUsers = data.users.items.slice(0, 5);
  const engagementRows = [
    { label: "Favoritos salvos", value: data.overview.favorites, tone: "bg-purple-500" },
    { label: "Itens no histórico", value: data.overview.historyItems, tone: "bg-blue-500" },
    { label: "Perfis ativos em 30 dias", value: data.overview.activeUsers30d, tone: "bg-emerald-500" },
  ];
  const maxEngagement = Math.max(...engagementRows.map((row) => row.value), 1);
  const consumptionRows = [
    { label: "Filmes", value: data.overview.consumption.movie, icon: Film, tone: "bg-purple-500" },
    { label: "Séries", value: data.overview.consumption.tv, icon: Tv, tone: "bg-blue-500" },
    { label: "TV ao vivo", value: data.overview.consumption.liveTv, icon: Radio, tone: "bg-red-500" },
  ];
  const maxConsumption = Math.max(...consumptionRows.map((row) => row.value), 1);

  return (
    <>
      <PageHeading
        eyebrow="Central de controle"
        title="Visão geral"
        description="Acompanhe a comunidade e a atividade do TotalFlix em um só lugar."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          title="Usuários cadastrados"
          value={integerFormatter.format(data.overview.users)}
          detail={`${integerFormatter.format(data.overview.activeUsers30d)} perfis atualizados nos últimos 30 dias`}
          icon={Users}
        />
        <MetricCard
          title="Comentários"
          value={integerFormatter.format(data.overview.comments)}
          detail="Comentários e respostas na comunidade"
          icon={MessageSquare}
          tone="blue"
        />
        <MetricCard
          title="Interações salvas"
          value={integerFormatter.format(interactions)}
          detail={`${integerFormatter.format(data.overview.favorites)} favoritos e ${integerFormatter.format(data.overview.historyItems)} itens no histórico`}
          icon={Activity}
          tone="green"
        />
        <MetricCard
          title="Perfis ativos"
          value={integerFormatter.format(data.overview.activeUsers30d)}
          detail="Perfis atualizados nos últimos 30 dias"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          title="Usuários VIP"
          value={integerFormatter.format(data.overview.vipUsers)}
          detail="Acessos VIP ativos neste momento"
          icon={Crown}
          tone="amber"
        />
        <MetricCard
          title="Conquistas"
          value={integerFormatter.format(data.overview.achievementsUnlocked)}
          detail="Conquistas desbloqueadas pela comunidade"
          icon={Trophy}
          tone="green"
        />
      </div>

      <Panel
        title="Consumo por tipo de conteúdo"
        description="Reproduções registradas pelos players do TotalFlix"
        className="mt-6"
      >
        <div className="grid gap-5 p-5 md:grid-cols-3">
          {consumptionRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-zinc-400">
                    <Icon className="h-4 w-4 text-purple-400" />
                    {row.label}
                  </span>
                  <span className="font-semibold text-white">{integerFormatter.format(row.value)}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${Math.max(row.value ? 3 : 0, (row.value / maxConsumption) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel
          title="Engajamento da comunidade"
          description="Atividade acumulada nos perfis cadastrados"
        >
          <div className="space-y-6 p-5">
            {engagementRows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-400">{row.label}</span>
                  <span className="font-medium text-zinc-200">
                    {integerFormatter.format(row.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${Math.max(2, (row.value / maxEngagement) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-xl border border-purple-500/15 bg-purple-500/[0.06] p-4">
              <Activity className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
              <div>
                <p className="text-sm font-medium text-purple-100">
                  {integerFormatter.format(interactions)} interações salvas
                </p>
                <p className="mt-1 text-xs leading-5 text-purple-200/60">
                  Soma de favoritos e itens do histórico disponíveis nos perfis.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Novos usuários"
          description="Cadastros mais recentes"
          action={
            <button
              type="button"
              onClick={() => onNavigate("users")}
              className="text-xs font-medium text-purple-300 hover:text-purple-200"
            >
              Ver todos
            </button>
          }
        >
          {data.users.error ? (
            <CollectionNotice message={data.users.error} />
          ) : recentUsers.length === 0 ? (
            <EmptyState icon={Users} message="Nenhum usuário encontrado." />
          ) : (
            <div className="divide-y divide-white/10">
              {recentUsers.map((item) => (
                <div key={item.uid} className="flex items-center gap-3 px-5 py-4">
                  <UserAvatar user={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-200">{item.displayName}</p>
                      {item.role === "admin" && (
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-600">{item.email}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-600">{formatDate(item.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function UsersSection({
  data,
  users,
  search,
  onSearch,
  onManage,
}: {
  data: AdminDashboardData;
  users: AdminUser[];
  search: string;
  onSearch: (value: string) => void;
  onManage: (uid: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Comunidade"
        title="Usuários"
        description="Gerencie cargos, VIP, credenciais, perfis, consumo, favoritos, histórico e conquistas."
      />

      <Panel
        title={`${integerFormatter.format(data.overview.users)} usuários`}
        description={data.users.truncated ? "Exibindo os primeiros 1.000 perfis" : "Todos os perfis disponíveis"}
        action={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Buscar nome ou e-mail"
              className="h-9 border-white/10 bg-black/30 pl-9 text-sm"
            />
          </div>
        }
      >
        {data.users.error ? (
          <CollectionNotice message={data.users.error} />
        ) : users.length === 0 ? (
          <EmptyState icon={UserRound} message="Nenhum perfil corresponde à busca." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Acesso</th>
                  <th className="px-5 py-3 font-medium">VIP</th>
                  <th className="px-5 py-3 font-medium">Consumo</th>
                  <th className="px-5 py-3 font-medium">Biblioteca</th>
                  <th className="px-5 py-3 font-medium">Conquistas</th>
                  <th className="px-5 py-3 font-medium">Cadastro</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((item) => (
                  <tr key={item.uid} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={item} compact />
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-medium text-zinc-200">{item.displayName}</p>
                          <p className="max-w-[240px] truncate text-xs text-zinc-600">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                        item.role === "admin"
                          ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                          : item.role === "moderator"
                            ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                          : "border-white/10 bg-white/[0.03] text-zinc-500"
                      }`}>
                        {item.role === "admin"
                          ? <ShieldCheck className="h-3 w-3" />
                          : item.role === "moderator"
                            ? <Shield className="h-3 w-3" />
                            : <UserRound className="h-3 w-3" />}
                        {item.role === "admin" ? "Admin" : item.role === "moderator" ? "Moderador" : "Usuário"}
                      </span>
                      {item.disabled && (
                        <span className="ml-2 text-xs text-red-400">Desativada</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {item.vip ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                          <Crown className="h-3 w-3" />
                          {item.vipExpiresAt ? `até ${formatDate(item.vipExpiresAt)}` : "Indeterminado"}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Padrão</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 text-xs text-zinc-500">
                        <span title="Filmes">🎬 {item.consumption.movie.views}</span>
                        <span title="Séries">📺 {item.consumption.tv.views}</span>
                        <span title="TV ao vivo">🔴 {item.consumption.liveTv.views}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                      {integerFormatter.format(item.favoritesCount)} favoritos · {integerFormatter.format(item.historyCount)} histórico
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{integerFormatter.format(item.achievementsUnlocked)}</td>
                    <td className="px-5 py-4 text-zinc-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onManage(item.uid)}
                        className="border-white/10 bg-white/5 text-zinc-300 hover:bg-purple-500/15 hover:text-purple-200"
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Gerenciar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function CommentsSection({
  data,
  comments,
  search,
  onSearch,
  onDelete,
}: {
  data: AdminDashboardData;
  comments: AdminComment[];
  search: string;
  onSearch: (value: string) => void;
  onDelete: (comment: AdminComment) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Moderação"
        title="Comentários"
        description="Revise conversas da comunidade e remova conteúdos inadequados junto com suas respostas diretas."
      />

      <Panel
        title={`${integerFormatter.format(data.overview.comments)} comentários`}
        description={data.comments.truncated ? "Exibindo os primeiros 1.000 registros" : "Comentários e respostas"}
        action={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <Input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Buscar comentário"
              className="h-9 border-white/10 bg-black/30 pl-9 text-sm"
            />
          </div>
        }
      >
        {data.comments.error ? (
          <CollectionNotice message={data.comments.error} />
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            message={search ? "Nenhum comentário corresponde à busca." : "Ainda não há comentários para moderar."}
          />
        ) : (
          <div className="divide-y divide-white/10">
            {comments.map((comment) => (
              <article key={comment.id} className="p-5 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-semibold text-blue-300">
                    {initials(comment.userName, "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-zinc-200">{comment.userName}</p>
                      {comment.parentId && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                          Resposta
                        </span>
                      )}
                      <span className="text-xs text-zinc-600">{formatDate(comment.createdAt, true)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                      {comment.text}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {comment.likesCount} curtidas
                      </span>
                      <Link
                        href={`/details/${comment.contentType}/${comment.contentId}`}
                        target="_blank"
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                      >
                        Ver conteúdo
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(comment)}
                    className="shrink-0 text-zinc-600 hover:bg-red-500/10 hover:text-red-300"
                    aria-label="Excluir comentário"
                    title="Excluir comentário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function SystemSection({
  data,
  onMaintenanceChange,
}: {
  data: AdminDashboardData;
  onMaintenanceChange: (
    enabled: boolean,
    message: string,
    scope: "all" | "movies" | "series" | "tv",
  ) => Promise<void>;
}) {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(data.maintenance.enabled);
  const [maintenanceMessage, setMaintenanceMessage] = useState(data.maintenance.message);
  const [maintenanceScope, setMaintenanceScope] = useState(data.maintenance.scope || "all");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);

  useEffect(() => {
    setMaintenanceEnabled(data.maintenance.enabled);
    setMaintenanceMessage(data.maintenance.message);
    setMaintenanceScope(data.maintenance.scope || "all");
  }, [data.maintenance.enabled, data.maintenance.message, data.maintenance.scope]);

  const saveMaintenance = async () => {
    setMaintenanceSaving(true);
    try {
      await onMaintenanceChange(maintenanceEnabled, maintenanceMessage, maintenanceScope);
      toast.success(
        maintenanceEnabled
          ? `Modo manutenção ativado para ${maintenanceScope === "all" ? "todo o site" : maintenanceScope === "movies" ? "Filmes" : maintenanceScope === "series" ? "Séries" : "TV ao Vivo"}.`
          : "Modo manutenção desativado.",
      );
    } catch (maintenanceError) {
      setMaintenanceEnabled(data.maintenance.enabled);
      toast.error(
        maintenanceError instanceof Error
          ? maintenanceError.message
          : "Não foi possível atualizar a manutenção.",
      );
    } finally {
      setMaintenanceSaving(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="Infraestrutura"
        title="Sistema"
        description="Controle a disponibilidade do site inteiro ou de uma categoria específica."
      />

      <Panel
        title="Modo manutenção"
        description="Bloqueie todo o site ou apenas Filmes, Séries ou TV ao Vivo. Administradores mantêm acesso."
        action={
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            data.maintenance.enabled
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              data.maintenance.enabled ? "bg-amber-400" : "bg-emerald-400"
            }`} />
            {data.maintenance.enabled ? "Ativo" : "Site online"}
          </span>
        }
      >
        <div className="space-y-5 p-5">
          <label className="flex items-start justify-between gap-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Restringir acesso ao site</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                A decisão é feita no servidor. Alterações no navegador não contornam o bloqueio.
              </p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceEnabled}
              onChange={(event) => setMaintenanceEnabled(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-amber-500"
            />
          </label>
          <fieldset disabled={!maintenanceEnabled}>
            <legend className="mb-3 text-xs font-medium text-zinc-400">Escopo da manutenção</legend>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {([
                { id: "all", label: "Todo o site", icon: ServerCog, color: "purple" },
                { id: "movies", label: "Filmes", icon: Film, color: "blue" },
                { id: "series", label: "Séries", icon: Tv, color: "violet" },
                { id: "tv", label: "TV ao Vivo", icon: Radio, color: "red" },
              ] as const).map((option) => {
                const Icon = option.icon;
                const selected = maintenanceScope === option.id;
                const selectedStyle = option.color === "blue"
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                  : option.color === "red"
                    ? "border-red-500/50 bg-red-500/15 text-red-200"
                    : option.color === "violet"
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                      : "border-purple-500/50 bg-purple-500/15 text-purple-200";
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMaintenanceScope(option.id)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition disabled:opacity-50 ${
                      selected ? selectedStyle : "border-white/10 bg-black/20 text-zinc-500 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-zinc-400">
              Mensagem exibida ao público
            </span>
            <textarea
              value={maintenanceMessage}
              onChange={(event) => setMaintenanceMessage(event.target.value.slice(0, 240))}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              placeholder="Estamos realizando melhorias. Voltaremos em breve."
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-600">
              {maintenanceMessage.length}/240
            </span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-600">
              Última alteração: {formatDate(data.maintenance.updatedAt, true)}
            </p>
            <Button
              type="button"
              onClick={() => void saveMaintenance()}
              disabled={maintenanceSaving || (maintenanceEnabled && !maintenanceMessage.trim())}
              className={maintenanceEnabled ? "bg-amber-600 hover:bg-amber-500" : "bg-purple-600 hover:bg-purple-500"}
            >
              {maintenanceSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar configuração
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
        <Icon className="h-5 w-5 text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
