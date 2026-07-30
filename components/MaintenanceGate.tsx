import { AlertTriangle } from "lucide-react";
import { getServerSessionUser } from "@/lib/session-server";
import { getMaintenanceSettings } from "@/lib/site-settings-server";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

export async function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const settings = await getMaintenanceSettings();
  if (!settings.enabled) return <>{children}</>;

  const session = await getServerSessionUser();
  if (!session?.admin) {
    return <MaintenanceScreen message={settings.message} />;
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[10001] flex h-9 items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-500 px-3 text-center text-xs font-semibold text-black shadow-lg">
        <AlertTriangle className="h-4 w-4" />
        Modo manutenção ativo — acesso liberado para administradores
      </div>
      <div className="pt-9">{children}</div>
    </>
  );
}
