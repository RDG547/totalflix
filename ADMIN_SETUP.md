# Ativação do painel administrativo

O código nunca armazena senhas de usuários, chaves privadas do Firebase ou segredos do LinkGate no GitHub.

## Variáveis obrigatórias no servidor

Configure estas variáveis no projeto `totalflix` da Vercel, para os ambientes Production, Preview e Development:

```env
FIREBASE_SERVICE_ACCOUNT_JSON=<JSON completo da conta de serviço ou JSON em Base64>
LINK_GATE_SIGNING_SECRET=<segredo aleatório com pelo menos 32 caracteres>
SOFTURL_API_TOKEN=<token privado da Softurl>
```

O JSON da conta de serviço deve pertencer ao projeto Firebase `total-flix`. Ele pode ser gerado no Console do Firebase em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**.

Para gerar um segredo independente para o LinkGate:

```bash
openssl rand -base64 48
```

Depois de salvar as variáveis, faça um novo deploy. A seção **Sistema** do painel indica se o Firebase Admin e a Softurl foram detectados.

## Conta administrativa principal

- E-mail: `suporte@totalflix.com`
- O acesso principal é protegido no servidor e essa conta não pode ser rebaixada nem excluída pelo painel.
- A senha deve permanecer apenas no Firebase Authentication e no gerenciador de senhas do responsável.

## Modelo de segurança

- Cargos e VIP são claims do Firebase Authentication definidas somente pelo servidor.
- O perfil do Firestore é apenas uma cópia de exibição e não concede acesso.
- Alterações sensíveis revogam sessões quando necessário e geram registros em `adminAuditLogs`.
- O modo manutenção valida uma sessão HttpOnly antes de liberar acesso administrativo.
- O bypass VIP e o retorno do encurtador são verificados no servidor; grants são assinados, expiram e ficam vinculados à sessão.
