import 'server-only';

type FirestoreValue = Record<string, unknown>;

interface FirestoreDocumentPayload {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreListPayload {
  documents?: FirestoreDocumentPayload[];
  nextPageToken?: string;
  error?: {
    message?: string;
  };
}

export interface FirestoreDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface FirestoreCollectionResult {
  documents: FirestoreDocument[];
  truncated: boolean;
}

export class FirestoreRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'FirestoreRequestError';
  }
}

function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new FirestoreRequestError('O projeto Firebase não está configurado.', 500);
  }
  return projectId;
}

function documentsBaseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(getProjectId())}/databases/(default)/documents`;
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  if ('bytesValue' in value) return value.bytesValue;

  if ('arrayValue' in value) {
    const arrayValue = value.arrayValue as { values?: FirestoreValue[] };
    return (arrayValue.values || []).map(decodeFirestoreValue);
  }

  if ('mapValue' in value) {
    const mapValue = value.mapValue as { fields?: Record<string, FirestoreValue> };
    return decodeFirestoreFields(mapValue.fields || {});
  }

  return undefined;
}

function decodeFirestoreFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
}

function decodeDocument(document: FirestoreDocumentPayload): FirestoreDocument {
  return {
    id: document.name?.split('/').pop() || '',
    data: decodeFirestoreFields(document.fields || {}),
  };
}

async function parseFirestoreResponse(response: Response): Promise<FirestoreListPayload> {
  const payload = await response.json().catch(() => ({})) as FirestoreListPayload;
  if (!response.ok) {
    throw new FirestoreRequestError(
      payload.error?.message || 'O Firestore recusou a operação.',
      response.status,
    );
  }
  return payload;
}

export async function listFirestoreCollection(
  collectionId: string,
  idToken: string,
  maxDocuments = 1000,
): Promise<FirestoreCollectionResult> {
  const documents: FirestoreDocument[] = [];
  let nextPageToken = '';

  do {
    const remaining = maxDocuments - documents.length;
    const params = new URLSearchParams({
      pageSize: String(Math.min(300, remaining)),
    });
    if (nextPageToken) params.set('pageToken', nextPageToken);

    const response = await fetch(
      `${documentsBaseUrl()}/${encodeURIComponent(collectionId)}?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store',
      },
    );

    const payload = await parseFirestoreResponse(response);
    documents.push(...(payload.documents || []).map(decodeDocument));
    nextPageToken = payload.nextPageToken || '';
  } while (nextPageToken && documents.length < maxDocuments);

  return {
    documents,
    truncated: Boolean(nextPageToken),
  };
}

export async function queryFirestoreDocuments(
  collectionId: string,
  fieldPath: string,
  value: string,
  idToken: string,
): Promise<FirestoreDocument[]> {
  const response = await fetch(`${documentsBaseUrl()}:runQuery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: 'EQUAL',
            value: { stringValue: value },
          },
        },
      },
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => []) as Array<{
    document?: FirestoreDocumentPayload;
  }>;

  if (!response.ok) {
    throw new FirestoreRequestError('O Firestore recusou a consulta.', response.status);
  }

  return payload.flatMap((item) => item.document ? [decodeDocument(item.document)] : []);
}

export async function deleteFirestoreDocument(
  collectionId: string,
  documentId: string,
  idToken: string,
): Promise<void> {
  const response = await fetch(
    `${documentsBaseUrl()}/${encodeURIComponent(collectionId)}/${encodeURIComponent(documentId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as {
      error?: { message?: string };
    };
    throw new FirestoreRequestError(
      payload.error?.message || 'O Firestore recusou a exclusão.',
      response.status,
    );
  }
}
