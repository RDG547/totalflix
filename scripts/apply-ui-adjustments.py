from pathlib import Path
from textwrap import dedent


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: esperado 1 trecho, encontrado {count}")
    return text.replace(old, new, 1)


modal_path = Path("components/VideoPlayerModal.tsx")
modal = modal_path.read_text(encoding="utf-8")
modal = replace_once(
    modal,
    '<div ref={rootRef} className={`relative min-w-0 ${className}`}>',
    '<div ref={rootRef} className={`relative inline-block max-w-full align-bottom ${className}`}>',
    "raiz do SelectMenu",
)
modal = replace_once(
    modal,
    'className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-purple-500/30 bg-black px-3 py-2.5 text-left text-sm text-white outline-none transition-colors hover:border-purple-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"',
    'className="flex w-max max-w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-purple-500/30 bg-[#07050a] px-3 py-2.5 text-left text-sm text-white outline-none transition-colors hover:border-purple-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"',
    "botão do SelectMenu",
)
modal = replace_once(
    modal,
    '<span className="flex min-w-0 items-center gap-2 truncate">',
    '<span className="flex min-w-0 items-center gap-2">',
    "conteúdo do botão do SelectMenu",
)
modal = replace_once(
    modal,
    '<span className="truncate">{loading ? "Carregando..." : selected?.label || "Selecionar"}</span>',
    '<span className="max-w-[min(28rem,calc(100vw-5rem))] whitespace-normal break-words leading-snug">{loading ? "Carregando..." : selected?.label || "Selecionar"}</span>',
    "texto selecionado do SelectMenu",
)
modal = replace_once(
    modal,
    'className={`absolute top-[calc(100%+0.4rem)] z-[500] max-h-[min(320px,42dvh)] min-w-full overflow-y-auto overscroll-contain rounded-lg border border-purple-500/40 bg-black/98 p-1 shadow-2xl shadow-black ${',
    'className={`absolute top-[calc(100%+0.4rem)] z-[500] isolate max-h-[min(320px,42dvh)] min-w-full overflow-y-auto overscroll-contain rounded-lg border border-purple-500/50 bg-[#07050a] p-1 shadow-2xl shadow-black ${',
    "fundo do menu do SelectMenu",
)
modal = replace_once(
    modal,
    'style={{ width: "max-content", maxWidth: "min(22rem, calc(100vw - 2rem))" }}',
    'style={{ width: "max-content", minWidth: "100%", maxWidth: "min(32rem, calc(100vw - 2rem))" }}',
    "largura do menu do SelectMenu",
)
modal = replace_once(
    modal,
    '<span className="truncate">{option.label}</span>',
    '<span className="whitespace-normal break-words leading-snug">{option.label}</span>',
    "texto das opções do SelectMenu",
)
modal = replace_once(
    modal,
    'className="w-full sm:w-52 [&>span]:hidden"',
    'className="w-fit max-w-full [&>span]:hidden"',
    "largura do seletor VidSrc",
)
modal = replace_once(
    modal,
    '<div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[25rem]">',
    '<div className="flex w-full shrink-0 flex-wrap items-end gap-3 xl:w-auto">',
    "layout dos seletores de temporada e episódio",
)
modal = replace_once(
    modal,
    '                  loading={isSeriesMetadataLoading}\n                />',
    '                  loading={isSeriesMetadataLoading}\n                  className="w-fit max-w-full"\n                />',
    "largura do seletor de temporada",
)
modal = replace_once(
    modal,
    '                  loading={isEpisodeLoading}\n                  align="right"\n                />',
    '                  loading={isEpisodeLoading}\n                  align="right"\n                  className="w-fit max-w-full"\n                />',
    "largura do seletor de episódio",
)
modal_path.write_text(modal, encoding="utf-8")

card_path = Path("components/MovieCard.tsx")
card = card_path.read_text(encoding="utf-8")
card = replace_once(
    card,
    '        onClick={(event) => {\n          if (window.innerWidth < 768) {',
    '        onClick={(event) => {\n          const target = event.target as HTMLElement;\n          if (target.closest("[data-direct-details=\\\"true\\\"]")) return;\n\n          if (window.innerWidth < 768) {',
    "tratamento de clique direto nos detalhes",
)
card = replace_once(
    card,
    '                  <span className={`flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 ${',
    '                  <span data-direct-details="true" className={`flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 ${',
    "marcação do botão Ver detalhes",
)
card_path.write_text(card, encoding="utf-8")

admin_path = Path("app/admin/page.tsx")
admin = admin_path.read_text(encoding="utf-8")
avatar_component = dedent('''
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

''')
admin = replace_once(
    admin,
    '}\n\nfunction MetricCard({',
    '}\n\n' + avatar_component + 'function MetricCard({',
    "componente de avatar administrativo",
)
admin = replace_once(
    admin,
    '''                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/25 to-violet-800/25 text-xs font-semibold text-purple-200">
                    {initials(item.displayName, item.email)}
                  </div>''',
    '                  <UserAvatar user={item} />',
    "avatar de usuários recentes",
)
admin = replace_once(
    admin,
    '''                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-xs font-semibold text-purple-300">
                          {initials(item.displayName, item.email)}
                        </div>''',
    '                        <UserAvatar user={item} compact />',
    "avatar da tabela de usuários",
)
admin_path.write_text(admin, encoding="utf-8")

selector = dedent(r'''"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/VideoPlayerModal";
import { tmdb, type TVSeasonEpisode } from "@/lib/tmdb";

interface SeasonEpisodeSelectorProps {
  type: "movie" | "tv";
  tmdbId: number;
  title: string;
  numberOfSeasons?: number;
  posterPath?: string;
}

interface SelectorOption {
  value: number;
  label: string;
}

interface EmbeddedDropdownProps {
  label: string;
  value: number;
  options: SelectorOption[];
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: number) => void;
}

function EmbeddedDropdown({
  label,
  value,
  options,
  open,
  loading = false,
  onOpenChange,
  onChange,
}: EmbeddedDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [onOpenChange, open]);

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-purple-300/80">
        {label}
      </span>
      <button
        type="button"
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex w-max max-w-full items-center justify-between gap-3 rounded-xl border border-purple-500/35 bg-[#09070d] px-4 py-3 text-left text-sm text-white shadow-lg shadow-black/30 transition hover:border-purple-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-purple-300" />}
          <span className="max-w-[min(30rem,calc(100vw-6rem))] whitespace-normal break-words leading-snug">
            {loading ? "Carregando episódios..." : selected?.label || "Selecionar"}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-purple-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !loading && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] max-h-80 min-w-full overflow-y-auto overscroll-contain rounded-xl border border-purple-500/45 bg-[#09070d] p-1.5 shadow-2xl shadow-black"
          style={{ width: "max-content", maxWidth: "min(34rem, calc(100vw - 2rem))" }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm leading-snug transition-colors ${
                option.value === value
                  ? "bg-purple-600 text-white"
                  : "text-zinc-200 hover:bg-purple-500/20 hover:text-white"
              }`}
            >
              <span className="whitespace-normal break-words">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const fallbackEpisodes = (): TVSeasonEpisode[] => Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  episode_number: index + 1,
  name: `Episódio ${index + 1}`,
}));

const episodeLabel = (episode: TVSeasonEpisode) => {
  const name = episode.name?.trim();
  return name && !/^epis[oó]dio\s+\d+$/i.test(name)
    ? `Episódio ${episode.episode_number} · ${name}`
    : `Episódio ${episode.episode_number}`;
};

export function SeasonEpisodeSelector({
  type,
  tmdbId,
  title,
  numberOfSeasons = 1,
  posterPath,
}: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<TVSeasonEpisode[]>(fallbackEpisodes());
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [openMenu, setOpenMenu] = useState<"season" | "episode" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (type !== "tv") return;

    let active = true;
    setLoadingEpisodes(true);

    void tmdb.getSeasonDetails(tmdbId, selectedSeason)
      .then((season) => {
        if (!active) return;
        const loadedEpisodes = season.episodes?.length ? season.episodes : fallbackEpisodes();
        setEpisodes(loadedEpisodes);
        setSelectedEpisode((current) => (
          loadedEpisodes.some((episode) => episode.episode_number === current)
            ? current
            : loadedEpisodes[0]?.episode_number || 1
        ));
      })
      .catch((error) => {
        if (!active) return;
        console.error("Não foi possível carregar os episódios:", error);
        const fallback = fallbackEpisodes();
        setEpisodes(fallback);
        setSelectedEpisode(1);
      })
      .finally(() => {
        if (active) setLoadingEpisodes(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSeason, tmdbId, type]);

  const seasonOptions = useMemo<SelectorOption[]>(() => Array.from(
    { length: Math.max(numberOfSeasons, 1) },
    (_, index) => ({ value: index + 1, label: `Temporada ${index + 1}` }),
  ), [numberOfSeasons]);

  const episodeOptions = useMemo<SelectorOption[]>(() => episodes.map((episode) => ({
    value: episode.episode_number,
    label: episodeLabel(episode),
  })), [episodes]);

  if (type !== "tv") return null;

  return (
    <div className="relative mt-8 mb-8 overflow-visible rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/35 via-[#08060b] to-black p-4 shadow-2xl shadow-black/30 sm:p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-purple-300">Selecione onde continuar</p>
        <p className="mt-1 text-sm text-zinc-400">
          Escolha a temporada e o episódio pelo nome completo antes de iniciar o player.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <EmbeddedDropdown
          label="Temporada"
          value={selectedSeason}
          options={seasonOptions}
          open={openMenu === "season"}
          onOpenChange={(open) => setOpenMenu(open ? "season" : null)}
          onChange={(season) => {
            setSelectedSeason(season);
            setSelectedEpisode(1);
          }}
        />

        <EmbeddedDropdown
          label="Episódio"
          value={selectedEpisode}
          options={episodeOptions}
          open={openMenu === "episode"}
          loading={loadingEpisodes}
          onOpenChange={(open) => setOpenMenu(open ? "episode" : null)}
          onChange={setSelectedEpisode}
        />

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={loadingEpisodes || episodeOptions.length === 0}
          className="h-auto rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 active:scale-95"
        >
          <Play className="mr-2 h-4 w-4 fill-current" />
          Assistir episódio {selectedEpisode}
        </Button>
      </div>

      <VideoPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        tmdbId={tmdbId}
        title={title}
        numberOfSeasons={numberOfSeasons}
        initialSeason={selectedSeason}
        initialEpisode={selectedEpisode}
        posterPath={posterPath}
      />
    </div>
  );
}
''')
Path("components/SeasonEpisodeSelector.tsx").write_text(selector, encoding="utf-8")

changelog_path = Path("CHANGELOG.md")
changelog = changelog_path.read_text(encoding="utf-8")
additions = (
    "- Menus de VidSrc, temporada e episódio com fundo sólido e largura ajustada ao conteúdo.\n"
    "- Navegação do botão Ver detalhes nos cards da página inicial, inclusive no mobile.\n"
    "- Exibição da foto real dos usuários no painel administrativo, com iniciais como fallback.\n"
    "- Seletor integrado de temporadas e episódios na página de detalhes, com nomes completos do TMDB.\n"
)
changelog = replace_once(
    changelog,
    "### Corrigido\n",
    "### Corrigido\n" + additions,
    "seção Corrigido do changelog",
)
changelog_path.write_text(changelog, encoding="utf-8")

Path(".github/workflows/apply-ui-adjustments.yml").unlink(missing_ok=True)
Path("scripts/apply-ui-adjustments.py").unlink(missing_ok=True)
