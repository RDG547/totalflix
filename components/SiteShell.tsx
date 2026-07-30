'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { ClientLayout } from '@/components/ClientLayout';
import { GateRecovery } from '@/components/GateRecovery';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#07060a]">
        <main>{children}</main>
        <ScrollToTop />
      </div>
    );
  }

  return (
    <>
      <GateRecovery />
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex flex-col">
        <Navbar />
        <main className="relative flex-1">
          <ClientLayout>{children}</ClientLayout>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
}
