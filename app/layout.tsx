import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { ClientLayout } from "@/components/ClientLayout";
import { AdsterraAds } from "@/components/AdsterraAds";
import { HilltopAds } from "@/components/HilltopAds";
import { AntiAdBlock } from "@/components/AntiAdBlock";
import { PWARegister } from "@/components/PWARegister";
import { GlobalPopunder } from "@/components/GlobalPopunder";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

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
        {/* HilltopAds Verification */}
        <meta name="f11f46ca4b5fd4700ed4643bcc9080e4d18639d7" content="f11f46ca4b5fd4700ed4643bcc9080e4d18639d7" />
        {/* HilltopAds Referrer Tag para +20% receita */}
        <meta name="referrer" content="no-referrer-when-downgrade" />
        {/* JuicyAds Verification */}
        <meta name="juicyads-site-verification" content="37acd2f7cebf47784cc6890c393e3281" />
      </head>
      <body className={inter.className}>
        <AdsterraAds />
        <HilltopAds />
        <GlobalPopunder />
        <AntiAdBlock />
        <PWARegister />
        <AuthProvider>
          <PlayerProvider>
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex flex-col">
              <Navbar />
              {/* Adsterra Native Banner */}
              <div className="w-full flex justify-center py-2 bg-black/50">
                <div id="container-28fe29024925ba318c588b98f9674bb9" className="w-full max-w-[728px] min-h-[250px] flex items-center justify-center" />
              </div>
              <main className="relative flex-1">
                <ClientLayout>
                  {children}
                </ClientLayout>
              </main>
              {/* Adsterra Banner 300x250 no footer */}
              <div className="w-full flex justify-center py-4 bg-black/50">
                <div id="banner-300x250-container" style={{ width: '300px', height: '250px' }} />
              </div>
              <Footer />
              <ScrollToTop />
            </div>
          </PlayerProvider>
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
