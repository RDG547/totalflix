import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { ClientLayout } from "@/components/ClientLayout";
import { AdsterraAds } from "@/components/AdsterraAds";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TotalFlix - Filmes e Séries Online",
  description: "Assista aos melhores filmes e séries online gratuitamente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AdsterraAds />
        <AuthProvider>
          <PlayerProvider>
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex flex-col">
              <Navbar />
              <main className="relative flex-1">
                <ClientLayout>
                  {children}
                </ClientLayout>
              </main>
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
