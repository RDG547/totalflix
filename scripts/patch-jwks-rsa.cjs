const fs = require("node:fs");
const path = require("node:path");

const jwksSourceDirectory = path.dirname(require.resolve("jwks-rsa"));
const joseRequire = "const jose = require('jose');\n";

function patchFile(filePath, patch) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo do jwks-rsa não encontrado: ${filePath}`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const patchedSource = patch(source);

  if (patchedSource === source) {
    console.log(`${path.relative(jwksSourceDirectory, filePath)} já está compatível com ESM.`);
    return;
  }

  fs.writeFileSync(filePath, patchedSource);
  console.log(`Compatibilidade ESM aplicada a ${path.relative(jwksSourceDirectory, filePath)}.`);
}

patchFile(path.join(jwksSourceDirectory, "utils.js"), (source) => {
  const functionHeader = "async function retrieveSigningKeys(jwks) {\n";
  const dynamicImport = "async function retrieveSigningKeys(jwks) {\n  const jose = await import('jose');\n";

  if (source.includes("const jose = await import('jose');")) return source;
  if (!source.includes(joseRequire) || !source.includes(functionHeader)) {
    throw new Error("A estrutura de utils.js mudou; o patch não pôde ser aplicado com segurança.");
  }

  return source
    .replace(joseRequire, "")
    .replace(functionHeader, dynamicImport);
});

patchFile(path.join(jwksSourceDirectory, "integrations", "passport.js"), (source) => {
  const providerHeader = "  return function secretProvider(req, rawJwtToken, cb) {\n";
  const asyncProviderHeader = "  return async function secretProvider(req, rawJwtToken, cb) {\n    const jose = await import('jose');\n";

  if (source.includes("const jose = await import('jose');")) return source;
  if (!source.includes(joseRequire) || !source.includes(providerHeader)) {
    throw new Error("A estrutura de integrations/passport.js mudou; o patch não pôde ser aplicado com segurança.");
  }

  return source
    .replace(joseRequire, "")
    .replace(providerHeader, asyncProviderHeader);
});
