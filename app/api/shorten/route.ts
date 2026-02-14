import { NextResponse } from "next/server";

const API_TOKEN = "ce662b2d783c5e9ac64ae0faad55ba1379f6e48f";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, alias } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL é obrigatória" },
                { status: 400 }
            );
        }

        // Em dev, não funciona com localhost
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
            return NextResponse.json({
                shortenedUrl: null,
                error: "Encurtador não funciona com localhost",
            });
        }

        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://encurta.net/api?api=${API_TOKEN}&url=${encodedUrl}&alias=${encodeURIComponent(alias)}&type=1`;

        // Timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("[EncurtaNet] Resposta não é JSON:", text);
            return NextResponse.json({
                shortenedUrl: null,
                error: "Resposta inválida do servidor",
            });
        }

        if (data.status === "success" && data.shortenedUrl) {
            const cleanUrl = data.shortenedUrl
                .replace(/"/g, "")
                .replace(/\\/g, "");
            return NextResponse.json({ shortenedUrl: cleanUrl });
        }

        return NextResponse.json({
            shortenedUrl: null,
            error: data.message || "Erro desconhecido",
        });
    } catch (error: unknown) {
        const errorMsg =
            error instanceof Error ? error.message : "Erro desconhecido";

        if (errorMsg.includes("abort")) {
            return NextResponse.json({
                shortenedUrl: null,
                error: "Timeout - servidor demorou para responder",
            });
        }

        console.error("[EncurtaNet] Erro:", errorMsg);
        return NextResponse.json(
            { shortenedUrl: null, error: "Erro ao encurtar URL" },
            { status: 500 }
        );
    }
}
