import 'server-only';

const SOFTURL_API_URL = 'https://softurl.in/api';

function getSofturlToken(): string {
  const token = process.env.SOFTURL_API_TOKEN;
  if (!token) throw new Error('SOFTURL_API_TOKEN is not configured');
  return token;
}

// Encurta uma URL usando a API do Softurl. O token nunca deve ser exposto ao
// cliente — esta função só pode ser chamada a partir de código server-side
// (rotas de API, Server Components, etc.), garantido pelo import 'server-only'.
export async function shortenUrl(longUrl: string): Promise<string> {
  const token = getSofturlToken();
  const apiUrl = `${SOFTURL_API_URL}?api=${encodeURIComponent(token)}&url=${encodeURIComponent(longUrl)}&format=text`;

  const response = await fetch(apiUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Softurl API respondeu com status ${response.status}`);
  }

  const shortUrl = (await response.text()).trim();
  if (!shortUrl || !/^https?:\/\//i.test(shortUrl)) {
    throw new Error('Softurl API não retornou uma URL válida');
  }

  return shortUrl;
}
