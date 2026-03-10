const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const hasFirebaseConfig = Boolean(API_KEY && PROJECT_ID);

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const TOKEN_BASE = 'https://securetoken.googleapis.com/v1';
const FIRESTORE_BASE = PROJECT_ID ? `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents` : '';

const ensureConfig = (operation = 'Firebase operation') => {
  if (!API_KEY || !PROJECT_ID) {
    throw new Error(`${operation} unavailable: missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID.`);
  }
};

const post = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Request failed');
  return json;
};

export const signInWithPassword = async ({ email, password }) => {
  ensureConfig('Email/password sign-in');
  return post(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, { email, password, returnSecureToken: true });
};

export const signInWithGoogleIdToken = async ({ idToken }) => {
  ensureConfig('Google sign-in');
  return post(`${AUTH_BASE}/accounts:signInWithIdp?key=${API_KEY}`, {
    postBody: `id_token=${idToken}&providerId=google.com`,
    requestUri: window.location.origin,
    returnSecureToken: true,
    returnIdpCredential: true,
  });
};

export const refreshIdToken = async (refreshToken) => {
  ensureConfig('Session refresh');
  return post(`${TOKEN_BASE}/token?key=${API_KEY}`, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
};

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestoreValue(v)]));
    return { mapValue: { fields } };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  return { stringValue: String(value) };
};

const fromFirestoreValue = (wrapped) => {
  if (!wrapped) return null;
  if ('stringValue' in wrapped) return wrapped.stringValue;
  if ('integerValue' in wrapped) return Number(wrapped.integerValue);
  if ('doubleValue' in wrapped) return wrapped.doubleValue;
  if ('booleanValue' in wrapped) return wrapped.booleanValue;
  if ('nullValue' in wrapped) return null;
  if ('arrayValue' in wrapped) return (wrapped.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in wrapped) {
    const fields = wrapped.mapValue.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFirestoreValue(v)]));
  }
  return null;
};

export const getUserDataDoc = async ({ idToken, uid }) => {
  ensureConfig('Cloud data load');
  const res = await fetch(`${FIRESTORE_BASE}/users/${uid}/private/appData`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Failed to load user data');
  return fromFirestoreValue(json.fields?.payload);
};

export const upsertUserDataDoc = async ({ idToken, uid, payload }) => {
  ensureConfig('Cloud data save');
  const res = await fetch(`${FIRESTORE_BASE}/users/${uid}/private/appData`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        payload: toFirestoreValue(payload),
        updatedAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Failed to save user data');
  return json;
};

export const enqueueAutomationJob = async ({ idToken, uid, type, payload = {} }) => {
  ensureConfig('Automation job queue');
  const id = `${type}_${Date.now()}`;
  const res = await fetch(`${FIRESTORE_BASE}/users/${uid}/automationJobs/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        type: { stringValue: type },
        payload: toFirestoreValue(payload),
        status: { stringValue: 'queued' },
        createdAt: { stringValue: new Date().toISOString() },
      },
    }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message || 'Failed to enqueue automation job');
  }
  return id;
};
