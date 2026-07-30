import 'server-only';

import { randomBytes } from 'node:crypto';
import {
  getRequestSessionUser,
  readCookie,
} from './session-server';

export const GATE_ANONYMOUS_COOKIE = 'totalflix_gate_anon';

export interface GateSubject {
  subject: string;
  anonymousId: string | null;
  isNewAnonymousId: boolean;
}

export async function getGateSubject(request: Request): Promise<GateSubject> {
  const session = await getRequestSessionUser(request);
  if (session) {
    return {
      subject: `user:${session.uid}`,
      anonymousId: null,
      isNewAnonymousId: false,
    };
  }

  const existing = readCookie(request, GATE_ANONYMOUS_COOKIE);
  const anonymousId = existing && /^[A-Za-z0-9_-]{20,100}$/.test(existing)
    ? existing
    : randomBytes(24).toString('base64url');

  return {
    subject: `anon:${anonymousId}`,
    anonymousId,
    isNewAnonymousId: !existing,
  };
}
