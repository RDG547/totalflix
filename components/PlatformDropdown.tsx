"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export interface PlatformDropdownOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface PlatformDropdownProps {
  value: string;
  options: PlatformDropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

export function PlatformDropdown({
  value,
  options,
  onChange,
  label,
  ariaLabel,
  size = "md",
  className = "",
}: PlatformDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) || options[0];
  const SelectedIcon = selected?.icon;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const buttonSize = size === "sm" ? "min-h-9 px-3 py-2 text-xs" : "min-h-11 px-3.5 py-2.5 text-sm";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={options.length === 0}
        onClick={() => setOpen((current) => !current)}
        className={`${buttonSize} flex w-full min-w-44 items-center gap-2 rounded-xl border border-purple-500/30 bg-[#0b0710] text-left text-zinc-200 shadow-lg shadow-black/20 transition hover:border-purple-400/60 hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50`}
      >
        {SelectedIcon ? <SelectedIcon className="h-4 w-4 shrink-0 text-purple-300" /> : null}
        <span className="min-w-0 flex-1 truncate">{selected?.label || "Selecionar"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-purple-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] max-h-72 min-w-full overflow-y-auto overscroll-contain rounded-xl border border-purple-500/40 bg-[#0b0710] p-1.5 shadow-2xl shadow-black"
          style={{ width: "max-content", maxWidth: "min(22rem, calc(100vw - 2rem))" }}
        >
          {options.map((option) => {
            const Icon = option.icon;
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-zinc-300 hover:bg-purple-500/15 hover:text-white"
                }`}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {active ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
