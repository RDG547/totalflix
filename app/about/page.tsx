import { Film, Heart, Users, Zap, Shield, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 rounded-2xl glow-effect">
              <Film className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient">Sobre Nós</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transformando a maneira como você assiste filmes e séries online
          </p>
        </div>

        {/* Nossa História */}
        <div className="glass-effect border border-purple-500/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Heart className="w-8 h-8 text-purple-400" />
            Nossa História
          </h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              O <span className="text-purple-400 font-semibold">TotalFlix</span> nasceu da paixão por cinema e tecnologia.
              Percebemos que muitas pessoas queriam ter acesso a um catálogo completo de filmes e séries, mas encontravam
              dificuldades com plataformas complicadas, caras ou com conteúdo limitado.
            </p>
            <p>
              Em 2024, decidimos criar uma plataforma que combinasse a melhor tecnologia disponível com uma interface
              intuitiva e moderna. Nosso objetivo era simples: tornar o entretenimento acessível para todos, sem
              complicações e totalmente gratuito.
            </p>
            <p>
              Hoje, o TotalFlix é uma das plataformas de streaming gratuitas mais completas, oferecendo milhares de
              títulos em qualidade HD, com legendas em português e uma experiência de usuário incomparável.
            </p>
          </div>
        </div>

        {/* Nossos Valores */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Nossos Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-effect border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all">
              <div className="bg-purple-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Comunidade</h3>
              <p className="text-gray-400 text-sm">
                Acreditamos no poder da comunidade. Nossos usuários são o coração do TotalFlix, e suas opiniões
                moldam constantemente nossa plataforma.
              </p>
            </div>

            <div className="glass-effect border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all">
              <div className="bg-purple-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Inovação</h3>
              <p className="text-gray-400 text-sm">
                Estamos sempre buscando as melhores tecnologias e recursos para oferecer uma experiência única
                e inovadora de streaming.
              </p>
            </div>

            <div className="glass-effect border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all">
              <div className="bg-purple-600/20 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Segurança</h3>
              <p className="text-gray-400 text-sm">
                A privacidade e segurança dos nossos usuários são prioridades absolutas. Garantimos uma navegação
                100% segura e protegida.
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="glass-effect border border-purple-500/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">TotalFlix em Números</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">50K+</div>
              <div className="text-gray-400 text-sm">Filmes e Séries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">1M+</div>
              <div className="text-gray-400 text-sm">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">100%</div>
              <div className="text-gray-400 text-sm">Gratuito</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-gray-400 text-sm">Disponível</div>
            </div>
          </div>
        </div>

        {/* Missão */}
        <div className="glass-effect border border-purple-500/30 rounded-2xl p-8 md:p-12 bg-gradient-to-br from-purple-900/20 to-transparent">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-600 p-3 rounded-lg glow-effect">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Nossa Missão</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                Democratizar o acesso ao entretenimento de qualidade, oferecendo uma plataforma gratuita,
                moderna e completa que conecta pessoas ao redor do mundo através da magia do cinema e das séries.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-500/20">
            <p className="text-gray-400 text-center">
              <span className="text-purple-400 font-semibold">Junte-se a nós</span> nessa jornada incrível e
              descubra um novo mundo de entretenimento!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
