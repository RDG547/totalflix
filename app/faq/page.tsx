"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Geral",
    question: "O TotalFlix é realmente gratuito?",
    answer: "Sim! O TotalFlix é 100% gratuito. Você não precisa pagar nada para assistir filmes e séries. Não há taxas ocultas, assinaturas ou períodos de teste."
  },
  {
    category: "Geral",
    question: "Preciso criar uma conta para assistir?",
    answer: "Você pode navegar e pesquisar conteúdos sem criar uma conta. No entanto, para adicionar favoritos, comentar e acessar recursos personalizados, recomendamos criar uma conta gratuita."
  },
  {
    category: "Geral",
    question: "Quais dispositivos são compatíveis?",
    answer: "O TotalFlix funciona em qualquer dispositivo com navegador web moderno: computadores, notebooks, tablets e smartphones (iOS e Android)."
  },
  {
    category: "Conteúdo",
    question: "Com que frequência novos conteúdos são adicionados?",
    answer: "Atualizamos nossa biblioteca diariamente com os últimos lançamentos de filmes e séries. Você sempre terá acesso ao conteúdo mais recente e popular."
  },
  {
    category: "Conteúdo",
    question: "Posso assistir em qualidade HD?",
    answer: "Sim! A maioria dos nossos conteúdos está disponível em qualidade HD. A qualidade pode variar dependendo da sua conexão de internet."
  },
  {
    category: "Conteúdo",
    question: "Tem conteúdo dublado em português?",
    answer: "Sim, oferecemos muitos títulos dublados em português. Você também encontrará legendas em português para praticamente todos os conteúdos."
  },
  {
    category: "Conta",
    question: "Como faço para criar uma conta?",
    answer: "Clique no botão 'Entrar' no canto superior direito e depois em 'Criar Conta'. Preencha seus dados e pronto! Você também pode fazer login usando sua conta do Google."
  },
  {
    category: "Conta",
    question: "Esqueci minha senha. O que faço?",
    answer: "Na tela de login, clique em 'Esqueci minha senha'. Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha."
  },
  {
    category: "Conta",
    question: "Posso usar minha conta em vários dispositivos?",
    answer: "Sim! Você pode acessar sua conta do TotalFlix em quantos dispositivos quiser, simultaneamente, sem restrições."
  },
  {
    category: "Recursos",
    question: "Como adiciono filmes aos favoritos?",
    answer: "Clique no ícone de coração em qualquer filme ou série para adicioná-lo aos seus favoritos. Você pode acessar todos os seus favoritos na página do seu perfil."
  },
  {
    category: "Recursos",
    question: "O que é o sistema de conquistas?",
    answer: "As conquistas são recompensas que você ganha ao usar o TotalFlix. Assista filmes, comente, favorite conteúdos e desbloqueie conquistas especiais!"
  },
  {
    category: "Recursos",
    question: "Posso comentar e avaliar filmes?",
    answer: "Sim! Depois de fazer login, você pode comentar, curtir e responder a outros comentários em qualquer filme ou série."
  },
  {
    category: "Técnico",
    question: "O vídeo não está carregando. O que fazer?",
    answer: "Primeiro, verifique sua conexão de internet. Se o problema persistir, tente limpar o cache do navegador ou usar outro navegador. Caso continue com problemas, entre em contato conosco."
  },
  {
    category: "Técnico",
    question: "Por que o vídeo está lento ou travando?",
    answer: "Isso geralmente acontece devido à velocidade da internet. Recomendamos uma conexão de pelo menos 5 Mbps para streaming em HD. Tente diminuir a qualidade do vídeo se necessário."
  },
  {
    category: "Técnico",
    question: "O site não está funcionando no meu celular. O que fazer?",
    answer: "Certifique-se de que está usando um navegador atualizado. Recomendamos Chrome, Safari ou Firefox em suas versões mais recentes."
  },
  {
    category: "Segurança",
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Levamos a segurança muito a sério. Seus dados são criptografados e nunca compartilhados com terceiros. Leia nossa Política de Privacidade para mais detalhes."
  },
  {
    category: "Segurança",
    question: "O TotalFlix é legal?",
    answer: "O TotalFlix não hospeda nenhum arquivo. Agregamos conteúdos de serviços terceiros e usamos a API oficial do TMDB para informações sobre filmes e séries."
  },
  {
    category: "Suporte",
    question: "Como entro em contato com o suporte?",
    answer: "Você pode nos enviar um e-mail para contato@totalflix.com. Respondemos todas as mensagens em até 24 horas."
  },
  {
    category: "Suporte",
    question: "Posso sugerir novos recursos?",
    answer: "Claro! Adoramos ouvir feedback dos nossos usuários. Entre em contato conosco por e-mail com suas sugestões e faremos o possível para implementá-las."
  }
];

const categories = ["Todos", "Geral", "Conteúdo", "Conta", "Recursos", "Técnico", "Segurança", "Suporte"];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 rounded-2xl glow-effect">
              <HelpCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient">Perguntas Frequentes</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre o TotalFlix
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-black/50 border-purple-500/30 focus:border-purple-500 text-white placeholder-gray-500 h-14 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category
                  ? "bg-purple-600 text-white glow-effect"
                  : "bg-purple-500/10 text-gray-400 hover:bg-purple-500/20 border border-purple-500/30"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Nenhuma pergunta encontrada.</p>
              <p className="text-gray-500 text-sm mt-2">Tente usar outros termos de pesquisa.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="glass-effect border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-purple-500/5 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-purple-400 font-semibold">{faq.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-purple-400 transition-transform flex-shrink-0 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Section */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="glass-effect border border-purple-500/30 rounded-2xl p-8 text-center">
            <Mail className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ainda tem dúvidas?</h2>
            <p className="text-gray-400 mb-6">
              Nossa equipe está pronta para ajudar! Entre em contato conosco.
            </p>
            <a
              href="mailto:contato@totalflix.com"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors glow-effect"
            >
              <Mail className="w-5 h-5" />
              contato@totalflix.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
