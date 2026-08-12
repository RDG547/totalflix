import Link from "next/link";
import { Film, Twitter, Share2, Shield, HelpCircle, Info, Home, Clapperboard, Tv, Radio, Users, CircleHelp, FileText } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-8 border-t border-purple-500/20 bg-gradient-to-b from-transparent to-black/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-2 rounded-lg glow-effect">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-white">Total</span>
                <span className="text-gradient">Flix</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              A melhor plataforma de streaming gratuita para assistir filmes e séries online com qualidade!
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              Navegação
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Home className="w-4 h-4 text-purple-400" />
                  Início
                </Link>
              </li>
              <li>
                <Link href="/movies" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Clapperboard className="w-4 h-4 text-purple-400" />
                  Filmes
                </Link>
              </li>
              <li>
                <Link href="/series" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Tv className="w-4 h-4 text-purple-400" />
                  Séries
                </Link>
              </li>
              <li>
                <Link href="/tv" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Radio className="w-4 h-4 text-purple-400" />
                  TV ao Vivo
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              Informações
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Users className="w-4 h-4 text-purple-400" />
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <CircleHelp className="w-4 h-4 text-purple-400" />
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors text-sm flex items-center gap-2 group">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Redes sociais
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Fique conectado com a gente nas redes sociais!
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 p-3 rounded-lg transition-all hover:scale-110 group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-purple-500/20">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm text-center">
              © {currentYear} TotalFlix. Todos os direitos reservados. Desenvolvido com ❤️
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Precisa de ajuda?
              </span>
              <Link href="/faq" className="hover:text-purple-400 transition-colors">
                Ver FAQ
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4 text-center">
            Este site não hospeda nenhum arquivo. Todos os conteúdos são fornecidos por serviços de terceiros não afiliados.
            As informações exibidas são obtidas através da API do The Movie Database (TMDB).
          </p>
        </div>
      </div>
    </footer>
  );
}
