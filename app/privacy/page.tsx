import { Shield, Eye, Lock, Database, UserCheck, AlertCircle } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 rounded-full glow-effect">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Política de Privacidade</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Sua privacidade é importante para nós
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Última atualização: 21 de novembro de 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introdução */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Eye className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Introdução</h2>
                <p className="text-gray-300 leading-relaxed">
                  A TotalFlix está comprometida em proteger sua privacidade. Esta Política de Privacidade
                  explica como coletamos, usamos, divulgamos e protegemos suas informações quando você
                  utiliza nossa plataforma de streaming.
                </p>
              </div>
            </div>
          </section>

          {/* Informações Coletadas */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Database className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Informações que Coletamos</h2>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="font-semibold text-white mb-2">2.1 Informações de Conta</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Nome de usuário e e-mail</li>
                      <li>Foto de perfil (opcional)</li>
                      <li>Biografia (opcional)</li>
                      <li>Data de criação da conta</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">2.2 Informações de Uso</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Histórico de visualização</li>
                      <li>Filmes e séries favoritos</li>
                      <li>Comentários e avaliações</li>
                      <li>Conquistas desbloqueadas</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">2.3 Informações Técnicas</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Endereço IP</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Sistema operacional</li>
                      <li>Páginas visitadas e tempo de navegação</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Como Usamos */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <UserCheck className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. Como Usamos suas Informações</h2>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Fornecer e melhorar nossos serviços</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Personalizar sua experiência de usuário</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Recomendar conteúdo baseado em suas preferências</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Comunicar atualizações e novos recursos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Detectar e prevenir fraudes e abusos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Cumprir obrigações legais</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Compartilhamento */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Lock className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Compartilhamento de Informações</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas
                  seguintes circunstâncias:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Com seu consentimento explícito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Para cumprir obrigações legais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Com provedores de serviços que nos auxiliam (Firebase, TMDB)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Para proteger direitos, propriedade e segurança</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Segurança */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Segurança dos Dados</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Criptografia de dados em trânsito e em repouso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Autenticação segura via Firebase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Monitoramento contínuo de atividades suspeitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Backups regulares dos dados</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Seus Direitos */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <UserCheck className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Seus Direitos</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Você tem os seguintes direitos sobre suas informações pessoais:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Acesso:</strong> Solicitar cópia dos seus dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Correção:</strong> Atualizar informações incorretas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Exclusão:</strong> Deletar sua conta e dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span><strong className="text-white">Oposição:</strong> Opor-se ao processamento de dados</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Database className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Cookies e Tecnologias Similares</h2>
                <p className="text-gray-300 leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do site
                  e personalizar conteúdo. Você pode gerenciar preferências de cookies nas configurações do seu navegador.
                </p>
              </div>
            </div>
          </section>

          {/* Menores */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Privacidade de Menores</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nossa plataforma não é destinada a menores de 13 anos. Não coletamos intencionalmente informações
                  de crianças menores de 13 anos. Se você acredita que coletamos dados de uma criança, entre em contato
                  conosco imediatamente.
                </p>
              </div>
            </div>
          </section>

          {/* Alterações */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">9. Alterações nesta Política</h2>
                <p className="text-gray-300 leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações
                  significativas através do site ou por e-mail. Recomendamos revisar esta página regularmente.
                </p>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">10. Contato</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato:
                </p>
                <a
                  href="mailto:contato@totalflix.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  contato@totalflix.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
