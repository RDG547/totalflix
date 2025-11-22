# 🎬 TotalFlix

Um site moderno de streaming de filmes e séries construído com Next.js 14, integração com API TMDB e Mega Embed para reprodução de conteúdo.

![TotalFlix](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Características

- 🎨 **Design Moderno**: Interface elegante com paleta de cores roxo e preto
- 🌊 **Efeitos Visuais**: Blur, glass morphism, animações suaves e gradientes
- 📱 **Responsivo**: Funciona perfeitamente em dispositivos móveis, tablets e desktops
- 🔍 **Busca Avançada**: Pesquise por filmes e séries facilmente
- 🎭 **Categorias por Gênero**: Explore conteúdo por categoria
- ⭐ **Avaliações TMDB**: Veja classificações e informações detalhadas
- 🎬 **Player Integrado**: Assista diretamente no site com Mega Embed
- 📺 **Suporte para Séries**: Seletor de temporadas e episódios
- 🚀 **Performance**: Otimizado com Next.js 14 e Server Components

## 🛠️ Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **API**: TMDB (The Movie Database)
- **Player**: Mega Embed

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [TMDB](https://www.themoviedb.org/) para obter API Key

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/totalflix.git
cd totalflix
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Edite o arquivo `.env.local` e adicione sua chave API do TMDB:

```env
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_api_aqui
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
NEXT_PUBLIC_MEGA_EMBED_URL=https://megaembed.net
```

Para obter sua API Key:
1. Acesse [TMDB](https://www.themoviedb.org/)
2. Crie uma conta ou faça login
3. Vá em Configurações > API
4. Solicite uma API Key (é gratuito)

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse o site**

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
totalflix/
├── app/
│   ├── details/[type]/[id]/    # Página de detalhes
│   ├── watch/[type]/[id]/      # Player de vídeo
│   ├── movies/                 # Página de filmes
│   ├── series/                 # Página de séries
│   ├── genres/                 # Página de gêneros
│   ├── genre/[id]/             # Filmes por gênero
│   ├── search/                 # Página de busca
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página inicial
│   └── globals.css             # Estilos globais
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   ├── Hero.tsx                # Seção hero
│   ├── Navbar.tsx              # Barra de navegação
│   ├── Footer.tsx              # Rodapé
│   ├── MovieCard.tsx           # Card de filme/série
│   ├── TrendingSection.tsx     # Seção em alta
│   └── CategorySection.tsx     # Seção por categoria
├── lib/
│   ├── tmdb.ts                 # API TMDB
│   └── utils.ts                # Utilitários
└── public/                     # Arquivos estáticos
```

## 🎨 Paleta de Cores

- **Roxo Primário**: `#8b5cf6` (purple-500)
- **Roxo Secundário**: `#6d28d9` (purple-700)
- **Preto**: `#000000`
- **Cinza Escuro**: `#1a1a1a`

## 🌟 Funcionalidades Principais

### Página Inicial
- Hero com filme em destaque
- Seção de conteúdo em alta
- Categorias de filmes e séries populares
- Navegação suave com scroll horizontal

### Detalhes
- Informações completas do filme/série
- Trailer e imagens
- Avaliações e classificações
- Conteúdo similar
- Botão para assistir

### Player
- Player integrado com Mega Embed
- Seletor de temporadas e episódios (séries)
- Interface limpa e responsiva
- Controles de reprodução

### Busca
- Busca em tempo real
- Resultados de filmes e séries
- Filtros e ordenação

### Gêneros
- Lista visual de gêneros
- Filmes e séries por categoria
- Navegação intuitiva

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm run start

# Lint
npm run lint
```

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## ⚠️ Aviso Legal

Este site não hospeda nenhum arquivo. Todos os conteúdos são fornecidos por serviços de terceiros não afiliados. Este projeto é apenas para fins educacionais.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

Desenvolvido com ❤️ usando Next.js e shadcn/ui
