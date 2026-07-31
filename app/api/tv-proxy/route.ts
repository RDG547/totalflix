import { NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_MANIFEST_SIZE = 2 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

function validateTarget(rawUrl: string) {
  let target: URL;

  try {
    target = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida");
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error("Protocolo não permitido");
  }

  const hostname = target.hostname.toLowerCase();
  const blockedHostnames = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
  const isPrivateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);

  if (blockedHostnames.has(hostname) || isPrivateIpv4 || hostname.endsWith(".local")) {
    throw new Error("Destino não permitido");
  }

  return target;
}

function isManifestResponse(target: URL, response: Response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const pathname = target.pathname.toLowerCase();

  return pathname.endsWith(".m3u8")
    || pathname.endsWith(".m3u")
    || contentType.includes("application/vnd.apple.mpegurl")
    || contentType.includes("application/x-mpegurl")
    || contentType.includes("audio/mpegurl");
}

function buildProxyUrl(value: string, baseUrl: string) {
  const absoluteUrl = new URL(value, baseUrl).toString();
  return `/api/tv-proxy?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteManifest(manifest: string, baseUrl: string) {
  return manifest
    .split(/\r?\n/)
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return rawLine;

      if (line.startsWith("#")) {
        return rawLine.replace(/URI=("|')([^"']+)(\1)/gi, (_match, quote: string, uri: string) => (
          `URI=${quote}${buildProxyUrl(uri, baseUrl)}${quote}`
        ));
      }

      return buildProxyUrl(line, baseUrl);
    })
    .join("\n");
}

async function fetchUpstream(target: URL, request: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const range = request.headers.get("range");
  const origin = `${target.protocol}//${target.host}`;

  try {
    return await fetch(target, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "*/*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
        "User-Agent": USER_AGENT,
        Referer: `${origin}/`,
        Origin: origin,
        ...(range ? { Range: range } : {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { error: "URL is required" },
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const target = validateTarget(rawUrl);
    const response = await fetchUpstream(target, request);

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        {
          error: "O servidor do canal recusou a solicitação",
          details: `HTTP ${response.status}`,
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502, headers: corsHeaders },
      );
    }

    const finalUrl = response.url || target.toString();

    if (isManifestResponse(target, response)) {
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > MAX_MANIFEST_SIZE) {
        throw new Error("Manifesto HLS maior que o limite permitido");
      }

      const manifest = await response.text();
      if (!manifest.trimStart().startsWith("#EXTM3U")) {
        throw new Error("O endereço não retornou uma playlist HLS válida");
      }

      return new NextResponse(rewriteManifest(manifest, finalUrl), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    const headers = new Headers(corsHeaders);
    const passthroughHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "last-modified",
      "etag",
    ];

    passthroughHeaders.forEach((name) => {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    });
    headers.set("Cache-Control", "public, max-age=30, s-maxage=30");

    return new NextResponse(request.method === "HEAD" ? null : response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.name === "AbortError"
        ? "Tempo limite ao acessar o servidor do canal"
        : error.message
      : "Erro desconhecido";

    console.error("TV proxy failed:", message);
    return NextResponse.json(
      { error: "Não foi possível carregar o stream", details: message },
      { status: 502, headers: corsHeaders },
    );
  }
}

export async function HEAD(request: Request) {
  return GET(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
