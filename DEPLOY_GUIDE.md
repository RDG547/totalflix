# 🚀 Deploy do TotalFlix

Guia completo para fazer deploy do TotalFlix no GitHub e Vercel.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Conta no [GitHub](https://github.com)
- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Git instalado no computador
- ✅ Projeto TotalFlix funcionando localmente
- ✅ Firebase configurado (Authentication e Firestore)

---

## 1️⃣ Preparar o Projeto

### 1.1 Criar arquivo `.gitignore`

Certifique-se de que seu `.gitignore` contém:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### 1.2 Verificar variáveis de ambiente

Seu arquivo `.env.local` deve conter:

```env
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_tmdb
NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

⚠️ **IMPORTANTE**: Nunca faça commit do arquivo `.env.local`!

---

## 2️⃣ Subir para o GitHub

### 2.1 Inicializar repositório Git

```bash
# Navegue até a pasta do projeto
cd "/home/rdg/Área de trabalho/Programação/totalflix"

# Inicializar repositório (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "feat: Initial commit - TotalFlix streaming platform"
```

### 2.2 Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `totalflix`
3. Descrição: `🎬 Plataforma de streaming moderna com Next.js, Firebase e TMDB API`
4. Escolha: **Privado** (recomendado) ou **Público**
5. **NÃO** marque "Initialize with README"
6. Clique em "Create repository"

### 2.3 Conectar repositório local ao GitHub

```bash
# Adicionar remote do GitHub (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/totalflix.git

# Renomear branch para main
git branch -M main

# Enviar código para o GitHub
git push -u origin main
```

### 2.4 Comandos úteis do Git

```bash
# Verificar status dos arquivos
git status

# Adicionar arquivos modificados
git add .

# Fazer commit com mensagem
git commit -m "feat: descrição da alteração"

# Enviar para o GitHub
git push

# Ver histórico de commits
git log --oneline

# Criar nova branch
git checkout -b nome-da-branch

# Voltar para main
git checkout main
```

---

## 3️⃣ Deploy no Vercel

### 3.1 Conectar projeto ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New..." → "Project"
4. Selecione o repositório `totalflix`
5. Clique em "Import"

### 3.2 Configurar projeto

Na tela de configuração:

#### Framework Preset
- **Framework**: Next.js (já detectado automaticamente)
- **Build Command**: `npm run build` (padrão)
- **Output Directory**: `.next` (padrão)
- **Install Command**: `npm install` (padrão)

#### Root Directory
- Deixe vazio (se o projeto está na raiz do repositório)

### 3.3 Adicionar variáveis de ambiente

**MUITO IMPORTANTE**: Clique em "Environment Variables" e adicione:

```
NEXT_PUBLIC_TMDB_API_KEY = sua_chave_tmdb_aqui
NEXT_PUBLIC_FIREBASE_API_KEY = sua_chave_firebase_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID = seu_app_id
```

⚠️ **Adicione todas as variáveis para os 3 ambientes**:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3.4 Fazer deploy

1. Clique em **"Deploy"**
2. Aguarde o build (leva ~2-5 minutos)
3. Após concluído, você verá: ✅ **"Congratulations!"**
4. Seu site estará disponível em: `https://totalflix-xxx.vercel.app`

---

## 4️⃣ Configurar Domínio Personalizado (Opcional)

### 4.1 Adicionar domínio no Vercel

1. No painel do projeto, vá em **Settings** → **Domains**
2. Clique em **"Add"**
3. Digite seu domínio: `totalflix.com` ou `meusite.com.br`
4. Clique em **"Add"**

### 4.2 Configurar DNS

No seu provedor de domínio (Registro.br, GoDaddy, etc):

**Para domínio raiz (totalflix.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Para subdomínio (www.totalflix.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

⏱️ Propagação DNS pode levar até 48 horas (geralmente ~1 hora)

---

## 5️⃣ Configurar Firebase para Produção

### 5.1 Adicionar domínio autorizado

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **Settings** → **Authorized domains**
4. Clique em **"Add domain"**
5. Adicione: `totalflix-xxx.vercel.app` (ou seu domínio personalizado)

### 5.2 Atualizar regras do Firestore

Certifique-se de que as regras do FIRESTORE_SETUP.md estão aplicadas:

1. Acesse **Firestore Database** → **Rules**
2. Cole as regras do arquivo `FIRESTORE_SETUP.md`
3. Clique em **"Publish"**

### 5.3 Criar índices compostos

1. Acesse **Firestore Database** → **Indexes**
2. Crie os índices listados em `FIRESTORE_SETUP.md`:
   - Índice para comentários (contentId, contentType, createdAt)
   - Índice para notificações (userId, read, createdAt)

---

## 6️⃣ Atualizações Futuras

### Fluxo de trabalho recomendado:

```bash
# 1. Fazer alterações no código localmente
# 2. Testar localmente (npm run dev)
# 3. Adicionar arquivos modificados
git add .

# 4. Fazer commit
git commit -m "feat: descrição da alteração"

# 5. Enviar para GitHub
git push

# 6. Vercel faz deploy automático! 🎉
```

### Deploy automático

O Vercel detecta automaticamente:
- ✅ Novos commits na branch `main` → Deploy em produção
- ✅ Novos commits em outras branches → Deploy de preview
- ✅ Pull Requests → Deploy de preview com URL única

---

## 7️⃣ Monitoramento e Analytics

### 7.1 Vercel Analytics

1. No painel do projeto, vá em **Analytics**
2. Clique em **"Enable Analytics"**
3. Acompanhe: visitas, performance, erros

### 7.2 Firebase Analytics (Opcional)

```typescript
// Adicionar em app/layout.tsx
import { getAnalytics } from 'firebase/analytics';

useEffect(() => {
  if (typeof window !== 'undefined') {
    const analytics = getAnalytics();
  }
}, []);
```

---

## 8️⃣ Solução de Problemas

### ❌ Build falhou

**Erro**: "Module not found" ou "Cannot find module"
```bash
# Solução: Verificar dependências
npm install
git add package.json package-lock.json
git commit -m "fix: update dependencies"
git push
```

**Erro**: "Environment variable not defined"
```bash
# Solução: Verificar variáveis no Vercel
# Settings → Environment Variables → Adicionar variável faltante
```

### ❌ Página não carrega

**Erro 404**: Verificar rotas do Next.js (app router)
**Erro 500**: Verificar logs no Vercel (Runtime Logs)
**Firebase error**: Verificar se domínio está autorizado no Firebase

### ❌ Imagens não aparecem

```bash
# Verificar next.config.js
images: {
  domains: ['image.tmdb.org'],
}
```

---

## 9️⃣ Comandos Rápidos de Referência

### Git
```bash
git status              # Ver status
git add .               # Adicionar tudo
git commit -m "msg"     # Commit
git push                # Enviar para GitHub
git pull                # Baixar do GitHub
git log --oneline       # Ver histórico
```

### npm
```bash
npm run dev             # Rodar localmente
npm run build           # Build de produção
npm run start           # Rodar build
npm install             # Instalar dependências
```

### Vercel CLI (Opcional)
```bash
npm i -g vercel         # Instalar CLI
vercel                  # Deploy manual
vercel --prod           # Deploy produção
vercel logs             # Ver logs
```

---

## 🎉 Conclusão

Agora seu TotalFlix está no ar! 🚀

**URLs úteis:**
- 🌐 Site: `https://totalflix-xxx.vercel.app`
- 📊 Dashboard Vercel: `https://vercel.com/seu-usuario/totalflix`
- 🔥 Firebase Console: `https://console.firebase.google.com`
- 💻 GitHub Repo: `https://github.com/seu-usuario/totalflix`

**Próximos passos:**
1. ✅ Testar todas as funcionalidades no site publicado
2. ✅ Verificar se login/registro funciona
3. ✅ Testar comentários, favoritos, conquistas
4. ✅ Compartilhar com amigos! 🎬

**Dicas:**
- 🔄 Cada push no GitHub = Deploy automático
- 📧 Vercel envia e-mail quando deploy termina
- 🐛 Use Vercel Logs para debug de erros
- 🚀 Primeiro deploy pode ser lento, próximos são rápidos

---

## 📞 Suporte

**Problemas com:**
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Firebase: [firebase.google.com/docs](https://firebase.google.com/docs)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)

**Deploy bem-sucedido? Parabéns! 🎉🍾**
