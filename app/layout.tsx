import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { PWARegister } from "@/components/PWARegister";
import { SiteShell } from "@/components/SiteShell";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

// O estado de manutenção é consultado no servidor a cada navegação.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TotalFlix - Filmes e Séries Online",
  description: "Assista aos melhores filmes e séries online gratuitamente",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TotalFlix",
  },
  applicationName: "TotalFlix",
  authors: [{ name: "TotalFlix" }],
  creator: "TotalFlix",
  publisher: "TotalFlix",
  keywords: ["filmes", "séries", "tv", "online", "grátis", "streaming"],
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TotalFlix" />
        <meta name="application-name" content="TotalFlix" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <PWARegister />
        <AuthProvider>
          <MaintenanceGate>
            <PlayerProvider>
              <SiteShell>{children}</SiteShell>
            </PlayerProvider>
          </MaintenanceGate>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              },
              success: {
                iconTheme: {
                  primary: '#8b5cf6',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
