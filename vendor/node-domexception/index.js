// Compatibilidade com fetch-blob: Node 22 possui DOMException nativa.
// Exportar o construtor evita instalar o pacote npm descontinuado.
export default globalThis.DOMException;
