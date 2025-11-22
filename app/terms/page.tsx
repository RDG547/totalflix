import { Scale, FileText, AlertTriangle, Shield, Ban, Eye, CheckCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 rounded-full glow-effect">
              <Scale className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Termos de Uso</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Termos e condições de utilização da plataforma
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Última atualização: 21 de novembro de 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Aceitação */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Aceitação dos Termos</h2>
                <p className="text-gray-300 leading-relaxed">
                  Ao acessar e usar a TotalFlix, você concorda em cumprir e estar vinculado a estes Termos de Uso.
                  Se você não concorda com estes termos, não deve usar nossa plataforma. Estes termos constituem um
                  acordo legal entre você e a TotalFlix.
                </p>
              </div>
            </div>
          </section>

          {/* Serviço */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <FileText className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Descrição do Serviço</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  A TotalFlix é uma plataforma de streaming gratuita que oferece:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Acesso a catálogo de filmes e séries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Sistema de favoritos e histórico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Comentários e interações sociais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Sistema de conquistas e gamificação</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Visualização de trailers</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-sm mt-4 italic">
                  Nota: A TotalFlix não hospeda conteúdo. Todos os vídeos são fornecidos por serviços de terceiros.
                </p>
              </div>
            </div>
          </section>

          {/* Conta */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. Conta de Usuário</h2>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h3 className="font-semibold text-white mb-2">3.1 Criação de Conta</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Você deve fornecer informações precisas e completas</li>
                      <li>É necessário ter pelo menos 13 anos de idade</li>
                      <li>Uma conta por pessoa</li>
                      <li>Você é responsável por manter a segurança da sua conta</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">3.2 Responsabilidades</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Manter a confidencialidade da senha</li>
                      <li>Notificar-nos imediatamente sobre uso não autorizado</li>
                      <li>Não compartilhar sua conta com terceiros</li>
                      <li>Você é responsável por todas as atividades em sua conta</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Conduta */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Ban className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Conduta do Usuário</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Você concorda em NÃO:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Usar a plataforma para fins ilegais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Publicar conteúdo ofensivo, difamatório ou discriminatório</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Fazer spam ou enviar mensagens não solicitadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Tentar acessar áreas restritas do sistema</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Interferir no funcionamento da plataforma</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Fazer engenharia reversa ou copiar o código</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Usar bots ou scripts automatizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Violar direitos de propriedade intelectual</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Eye className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Propriedade Intelectual</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Todo o conteúdo da plataforma TotalFlix (design, código, marca, logo) é protegido por direitos autorais.
                </p>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong className="text-white">Informações de filmes e séries:</strong> Fornecidas pela API do TMDB
                    (The Movie Database) sob sua própria licença.
                  </p>
                  <p>
                    <strong className="text-white">Conteúdo de vídeo:</strong> Todos os links de streaming são fornecidos
                    por serviços de terceiros. A TotalFlix não hospeda, armazena ou distribui conteúdo protegido por direitos autorais.
                  </p>
                  <p>
                    <strong className="text-white">Conteúdo do usuário:</strong> Ao publicar comentários, você concede
                    à TotalFlix uma licença para usar, modificar e exibir esse conteúdo na plataforma.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Isenção */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Isenção de Responsabilidade</h2>
                <div className="space-y-3 text-gray-300">
                  <p className="leading-relaxed">
                    A TotalFlix é fornecida "como está" e "conforme disponível". Não garantimos que:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">⚠</span>
                      <span>O serviço estará sempre disponível ou livre de erros</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">⚠</span>
                      <span>Os links de terceiros funcionarão adequadamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">⚠</span>
                      <span>O conteúdo estará sempre correto ou atualizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">⚠</span>
                      <span>A plataforma atenderá suas necessidades específicas</span>
                    </li>
                  </ul>
                  <p className="text-sm italic mt-4">
                    Não somos responsáveis por danos resultantes do uso ou incapacidade de usar a plataforma.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Links Terceiros */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <FileText className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Links de Terceiros</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nossa plataforma pode conter links para sites ou serviços de terceiros. Não somos responsáveis
                  pelo conteúdo, políticas de privacidade ou práticas desses sites. O uso de serviços de terceiros
                  é por sua conta e risco.
                </p>
              </div>
            </div>
          </section>

          {/* Modificações */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <FileText className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Modificações do Serviço e Termos</h2>
                <p className="text-gray-300 leading-relaxed mb-3">
                  Reservamos o direito de:
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Modificar ou descontinuar o serviço a qualquer momento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Alterar estes Termos de Uso com aviso prévio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Suspender ou encerrar contas que violem os termos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Remover conteúdo inadequado ou ilegal</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Rescisão */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Ban className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">9. Rescisão</h2>
                <p className="text-gray-300 leading-relaxed mb-3">
                  Você pode encerrar sua conta a qualquer momento através das configurações de perfil.
                  Podemos suspender ou encerrar sua conta se você violar estes termos.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Após o encerramento, seu acesso será imediatamente revogado e seus dados poderão ser excluídos
                  conforme nossa Política de Privacidade.
                </p>
              </div>
            </div>
          </section>

          {/* Lei Aplicável */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Scale className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">10. Lei Aplicável</h2>
                <p className="text-gray-300 leading-relaxed">
                  Estes Termos de Uso são regidos pelas leis do Brasil. Quaisquer disputas serão resolvidas
                  nos tribunais brasileiros competentes.
                </p>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section className="glass-effect border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">11. Contato</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <a
                  href="mailto:contato@totalflix.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Scale className="w-4 h-4" />
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
