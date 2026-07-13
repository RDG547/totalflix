import 'server-only';

export const CLICKADILLA_BASE_URL = 'https://publishers.clickadilla.com/backend/api/public';

export function getClickadillaToken(): string {
  const token = process.env.CLICKADILLA_TOKEN;
  if (!token) throw new Error('CLICKADILLA_TOKEN is not configured');
  return token;
}

export interface ClickadillaSpot {
  id: string | number;
  name: string;
  adFormat: string;
  status: string;
  code: string | null;
  url: string | null;
}

export async function fetchClickadillaSpots(): Promise<ClickadillaSpot[]> {
  const response = await fetch(
    `${CLICKADILLA_BASE_URL}/user-spots?token=${encodeURIComponent(getClickadillaToken())}`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' },
  );

  if (!response.ok) throw new Error(`Clickadilla API responded with status ${response.status}`);

  const payload = await response.json() as { data?: unknown[] } | unknown[];
  const spots = Array.isArray(payload) ? payload : payload.data || [];

  return spots.map((raw) => {
    const spot = raw as Record<string, unknown>;
    const script = typeof spot.script === 'string' ? spot.script : null;
    return {
      id: (spot.spot_id ?? spot.id ?? '') as string | number,
      name: String(spot.spot_name ?? spot.name ?? ''),
      adFormat: String(spot.adformat ?? spot.ad_format ?? '').toLowerCase(),
      status: String(spot.status ?? 'active'),
      code: String(spot.code ?? script ?? '') || null,
      url: String(spot.url ?? (script?.startsWith('http') ? script : '') ?? '') || null,
    };
  });
}
