const fs = require("node:fs");
const path = require("node:path");

const jwksEntry = require.resolve("jwks-rsa");
const utilsPath = path.join(path.dirname(jwksEntry), "utils.js");
const originalRequire = "const jose = require('jose');\n";
const functionHeader = "async function retrieveSigningKeys(jwks) {\n";
const dynamicImport = "async function retrieveSigningKeys(jwks) {\n  const jose = await import('jose');\n";

if (!fs.existsSync(utilsPath)) {
  throw new Error(`Arquivo do jwks-rsa não encontrado: ${utilsPath}`);
}

let source = fs.readFileSync(utilsPath, "utf8");

if (source.includes("const jose = await import('jose');")) {
  console.log("jwks-rsa já está compatível com ESM.");
  process.exit(0);
}

if (!source.includes(originalRequire) || !source.includes(functionHeader)) {
  throw new Error("A estrutura do jwks-rsa mudou; o patch de compatibilidade não pôde ser aplicado com segurança.");
}

source = source
  .replace(originalRequire, "")
  .replace(functionHeader, dynamicImport);

fs.writeFileSync(utilsPath, source);
console.log("Compatibilidade ESM aplicada ao jwks-rsa.");
