import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type GateTokenKind = 'challenge' | 'access';

export interface GateTokenPayload {
  kind: GateTokenKind;
  key: string;
  subject: string;
  exp: number;
  nonce: string;
  returnTo?: string;
}

export class GateTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GateTokenError';
  }
}

function signingSecret(): string {
  const secret = process.env.LINK_GATE_SIGNING_SECRET || process.env.SOFTURL_API_TOKEN;
  if (!secret || secret.length < 24) {
    throw new GateTokenError(
      'Configure LINK_GATE_SIGNING_SECRET com pelo menos 24 caracteres.',
    );
  }
  return secret;
}

function signature(encodedPayload: string): string {
  return createHmac('sha256', signingSecret())
    .update(encodedPayload)
    .digest('base64url');
}

export function createGateToken(input: Omit<GateTokenPayload, 'nonce'>): string {
  const payload: GateTokenPayload = { ...input, nonce: randomUUID() };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded)}`;
}

export function verifyGateToken(
  token: string,
  expectedKind: GateTokenKind,
): GateTokenPayload {
  const [encoded, providedSignature, extra] = token.split('.');
  if (!encoded || !providedSignature || extra) {
    throw new GateTokenError('Concessão de acesso inválida.');
  }

  const expectedSignature = signature(encoded);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new GateTokenError('Assinatura da concessão inválida.');
  }

  let payload: GateTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as GateTokenPayload;
  } catch {
    throw new GateTokenError('Conteúdo da concessão inválido.');
  }

  if (
    payload.kind !== expectedKind
    || typeof payload.key !== 'string'
    || typeof payload.subject !== 'string'
    || typeof payload.exp !== 'number'
    || payload.exp <= Date.now()
  ) {
    throw new GateTokenError('A concessão expirou ou é inválida.');
  }

  return payload;
}
