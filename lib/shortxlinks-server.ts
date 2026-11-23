import 'server-only';

import { randomBytes } from 'node:crypto';
import { shortenUrl as shortenWithSofturl } from '@/lib/softurl-server';

const SHORTXLINKS_API_URL = 'https://shortxlinks.com/api';

/**
 * Usa o Shortxlinks quando sua chave está configurada no servidor.
 * Enquanto a migração de ambiente não for concluída, mantém o SoftURL
 * como contingência para não bloquear o player dos usuários.
 */
export async function shortenUrl(longUrl: string): Promise<string> {
  const token = process.env.SHORTXLINKS_API_TOKEN?.trim();
  if (!token) {
    return shortenWithSofturl(longUrl);
  }

  // A API exige alias; gerar um valor diferente por liberação evita colisões.
  const alias = `tf${randomBytes(8).toString('hex')}`;
  const query = new URLSearchParams({
    api: token,
    url: longUrl,
    alias,
  });

  const response = await fetch(`${SHORTXLINKS_API_URL}?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Shortxlinks API respondeu com status ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Shortxlinks API retornou uma resposta inválida');
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Shortxlinks API retornou uma resposta inválida');
  }

  const data = payload as { status?: unknown; shortenedUrl?: unknown };
  if (data.status !== 'success' || typeof data.shortenedUrl !== 'string') {
    throw new Error('Shortxlinks API não conseguiu criar o link');
  }

  let shortenedUrl: URL;
  try {
    shortenedUrl = new URL(data.shortenedUrl);
  } catch {
    throw new Error('Shortxlinks API não retornou uma URL válida');
  }

  // O parceiro pode usar domínios/subdomínios próprios para monetização.
  // A resposta vem da API autenticada, portanto não a limite ao domínio da API.
  // Exija HTTPS e rejeite URLs com credenciais ou o próprio destino original.
  const originalUrl = new URL(longUrl);
  if (
    shortenedUrl.protocol !== 'https:'
    || shortenedUrl.username
    || shortenedUrl.password
    || shortenedUrl.hostname === originalUrl.hostname
  ) {
    throw new Error('Shortxlinks API retornou um link inseguro ou inválido');
  }

  return shortenedUrl.toString();
}
