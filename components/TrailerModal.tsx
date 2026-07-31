"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useScrollLock } from "@/hooks/useScrollLock";

interface TrailerModalProps {
  isOpen: boolean;
  trailerKey: string | null;
  title?: string;
  onClose: () => void;
}

export function TrailerModal({
  isOpen,
  trailerKey,
  title = "Trailer",
  onClose,
}: TrailerModalProps) {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const { openPlayer, closePlayer } = usePlayer();

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    openPlayer();
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      closePlayer();
      previouslyFocused?.focus?.();
    };
  }, [isOpen, openPlayer, closePlayer]);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;

    const modalRoot = rootRef.current;
    const siblings = Array.from(document.body.children).filter(
      (element) => element !== modalRoot,
    );
    const previousState = siblings.map((element) => ({
      inert: (element as HTMLElement).inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    siblings.forEach((element) => {
      (element as HTMLElement).inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    return () => {
      siblings.forEach((element, index) => {
        (element as HTMLElement).inert = previousState[index].inert;
        const ariaHidden = previousState[index].ariaHidden;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !trailerKey) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/95 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
      role="presentation"
    >
      <div
        className="relative aspect-video w-full max-w-5xl overflow-visible rounded-lg"
        role="dialog"
        aria-modal="true"
        aria-label={`Trailer de ${title}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCloseRef.current();
          }}
          className="absolute right-0 top-0 z-20 -translate-y-[calc(100%+0.5rem)] rounded-full bg-black/80 p-2 text-white shadow-lg transition-colors hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Fechar trailer"
        >
          <X className="h-6 w-6" />
        </button>

        <iframe
          key={trailerKey}
          className="h-full w-full rounded-lg bg-black shadow-2xl"
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
          title={`Trailer de ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>,
    document.body,
  );
}
