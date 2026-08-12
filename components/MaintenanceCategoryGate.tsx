"use client";

import { usePathname } from "next/navigation";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

type MaintenanceScope = "all" | "movies" | "series" | "tv";

function isScopePath(pathname: string, scope: MaintenanceScope): boolean {
  if (scope === "all") return true;
  if (scope === "movies") {
    return pathname === "/movies"
      || pathname.startsWith("/details/movie/")
      || pathname.startsWith("/watch/movie/");
  }
  if (scope === "series") {
    return pathname === "/series"
      || pathname.startsWith("/details/tv/")
      || pathname.startsWith("/watch/tv/");
  }
  return pathname === "/tv";
}

export function MaintenanceCategoryGate({
  children,
  scope,
  message,
}: {
  children: React.ReactNode;
  scope: MaintenanceScope;
  message: string;
}) {
  const pathname = usePathname();
  if (isScopePath(pathname, scope)) return <MaintenanceScreen message={message} />;
  return <>{children}</>;
}
