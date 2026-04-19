"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  id: string;
  className?: string;
  wrapperClassName?: string;
}

export function AdSlot({ id, className = "", wrapperClassName = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      const hasAd = el.querySelector("iframe, img, ins, canvas") !== null;
      setHasContent(hasAd);
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${wrapperClassName} ${hasContent ? "" : "hidden"}`}>
      <div ref={containerRef} id={id} className={className} />
    </div>
  );
}
