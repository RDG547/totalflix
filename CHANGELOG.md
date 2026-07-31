# Changelog

## 2026-07-31

### Corrigido
- Reprodução de canais ao vivo por embeds e streams HLS.
- Normalização dos identificadores do EmbedCanais para evitar `hls:networkError_manifestLoadError` causado por barras extras no parâmetro `canal`.
- Encerramento automático do indicador “Carregando canal...” em players externos que não disparam o evento `load` do iframe.
- Integração atualizada do Rei dos Embeds.
- Integração do Rei dos Canais com múltiplas fontes por canal.
- Proxy de playlists e segmentos HLS, incluindo suporte a `Range`.
- Menus responsivos de temporada, episódio e VidSrc.
- Carregamento das temporadas e dos episódios reais através do TMDB.
- Compatibilidade das rotas e páginas dinâmicas com Next.js 15.

### Segurança
- Atualização do Next.js e das dependências diretas e transitivas.
- Remoção das bibliotecas de player sem uso e da cadeia vulnerável do WebTorrent.
- Auditoria automatizada no GitHub Actions.
- `npm audit`: 0 vulnerabilidades.
