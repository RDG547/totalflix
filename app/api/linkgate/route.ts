import { NextResponse } from 'next/server';
import { shortenUrl } from '@/lib/softurl-server';

export const dynamic = 'force-dynamic';

// Só permite redirecionar de volta para um caminho relativo do próprio site,
// evitando open-redirect via "returnTo" (ex.: "//evil.com" ou "/\\evil.com").
function isSafeReturnPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const key = searchParams.get('key');
  const returnTo = searchParams.get('returnTo') || '/';

  if (!key || !isSafeReturnPath(returnTo)) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
  }

  let destination: URL;
  try {
    destination = new URL(returnTo, origin);
  } catch {
    return NextResponse.json({ error: 'returnTo inválido' }, { status: 400 });
  }
  destination.searchParams.set('gate_unlock', key);

  try {
    const shortUrl = await shortenUrl(destination.toString());
    return NextResponse.redirect(shortUrl, { status: 307 });
  } catch (error) {
    console.error('Erro ao encurtar link via Softurl:', error);
    // Falha aberta: libera o acesso direto para não travar o usuário caso o
    // encurtador esteja fora do ar.
    return NextResponse.redirect(destination.toString(), { status: 307 });
  }
}
