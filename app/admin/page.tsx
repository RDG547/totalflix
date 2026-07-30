"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Film,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminSection = "overview" | "users" | "comments" | "system";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "user";
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
  administrator: {
    uid: string;
    email: string;
  };
  overview: {
    users: number;
    comments: number;
    favorites: number;
    historyItems: number;
    activeUsers30d: number;
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
  system: {
    projectId: string;
    integrations: Array<{
      name: string;
      configured: boolean;
    }>;
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
  const { user, loading: authLoading, logout } = useAuth();
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

  const adminAllowed = isAdminEmail(user?.email);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!user || !isAdminEmail(user.email)) return;

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
  }, [user]);

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
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Acesso validado
            </div>
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

          <div className="absolute bottom-6 left-4 right-4 rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15">
              <ShieldCheck className="h-5 w-5 text-purple-300" />
            </div>
            <p className="text-sm font-medium text-white">Sessão protegida</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              As operações são validadas novamente no servidor.
            </p>
          </div>
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
          {data && section === "system" && <SystemSection data={data} />}
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

  return (
    <>
      <PageHeading
        eyebrow="Central de controle"
        title="Visão geral"
        description={`Dados atualizados em ${formatDate(data.generatedAt, true)}. Acompanhe a comunidade e a atividade do TotalFlix em um só lugar.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </div>

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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/25 to-violet-800/25 text-xs font-semibold text-purple-200">
                    {initials(item.displayName, item.email)}
                  </div>
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
}: {
  data: AdminDashboardData;
  users: AdminUser[];
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="Comunidade"
        title="Usuários"
        description="Consulte contas, atividade salva e data de cadastro dos perfis do TotalFlix."
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
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-5 py-3 font-medium">Acesso</th>
                  <th className="px-5 py-3 font-medium">Favoritos</th>
                  <th className="px-5 py-3 font-medium">Histórico</th>
                  <th className="px-5 py-3 font-medium">Cadastro</th>
                  <th className="px-5 py-3 font-medium">Última atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((item) => (
                  <tr key={item.uid} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-xs font-semibold text-purple-300">
                          {initials(item.displayName, item.email)}
                        </div>
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
                          : "border-white/10 bg-white/[0.03] text-zinc-500"
                      }`}>
                        {item.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                        {item.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{integerFormatter.format(item.favoritesCount)}</td>
                    <td className="px-5 py-4 text-zinc-400">{integerFormatter.format(item.historyCount)}</td>
                    <td className="px-5 py-4 text-zinc-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4 text-zinc-500">{formatDate(item.updatedAt)}</td>
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

function SystemSection({ data }: { data: AdminDashboardData }) {
  return (
    <>
      <PageHeading
        eyebrow="Infraestrutura"
        title="Sistema"
        description="Verifique a disponibilidade da configuração principal usada pelo aplicativo."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Projeto Firebase" description="Projeto vinculado à autenticação e ao Firestore">
          <div className="p-5">
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                <Database className="h-5 w-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-zinc-600">Project ID</p>
                <p className="mt-1 truncate font-mono text-sm text-zinc-200">
                  {data.system.projectId || "Não configurado"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-medium text-emerald-100">Autorização no servidor</p>
                <p className="mt-1 text-xs leading-5 text-emerald-200/60">
                  O token da sessão é validado no Firebase antes de cada consulta administrativa.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Integrações" description="Presença das variáveis necessárias no servidor">
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {data.system.integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    integration.configured ? "bg-emerald-400" : "bg-red-400"
                  }`} />
                  <span className="text-sm font-medium text-zinc-300">{integration.name}</span>
                </div>
                <span className={`flex items-center gap-1 text-xs ${
                  integration.configured ? "text-emerald-400" : "text-red-400"
                }`}>
                  {integration.configured ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {integration.configured ? "Configurada" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Sessão administrativa"
        description="Identidade autorizada no painel"
        className="mt-6"
      >
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <SystemDetail icon={ShieldCheck} label="Administrador" value={data.administrator.email} />
          <SystemDetail icon={Clock3} label="Dados atualizados" value={formatDate(data.generatedAt, true)} />
          <SystemDetail icon={Database} label="Persistência" value="Cloud Firestore" />
        </div>
      </Panel>
    </>
  );
}

function SystemDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <Icon className="h-5 w-5 shrink-0 text-purple-400" />
      <div className="min-w-0">
        <p className="text-xs text-zinc-600">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-zinc-300">{value}</p>
      </div>
    </div>
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
