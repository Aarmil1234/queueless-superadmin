import axios from 'axios';

// Dev: '/medicare/' on this origin, forwarded to the backend by the Vite proxy.
// Production: set VITE_API_URL to the backend's full /medicare/ URL.
const BASE_URL = import.meta.env.VITE_API_URL || '/medicare/';

const TOKEN_KEY = 'sa-token';
const USER_KEY = 'sa-user';

// sessionStorage, same as the hospital panel: the session ends with the tab.
export const session = {
  get token() { return safeGet(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(safeGet(USER_KEY) || 'null'); } catch { return null; }
  },
  save(token, user) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* storage blocked — session lives only in memory */ }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
  },
};

function safeGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

// Reads `exp` from the JWT payload (the server verifies the signature on
// every call — this only stops the UI from pretending an expired token works).
export const isTokenValid = () => {
  const token = session.token;
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() && payload.role === 'admin';
  } catch {
    return false;
  }
};

const client = axios.create({ baseURL: BASE_URL, timeout: 60000 });

let expiredHandled = false;

// Every backend route here is POST. Returns the response body
// ({ status, message, data, pagination? }); throws an Error with the
// server's message on failure.
export async function api(path, body = {}, { formData = false } = {}) {
  const headers = {};
  if (session.token) headers.Authorization = `Bearer ${session.token}`;
  try {
    const res = await client.post(path, formData ? toFormData(body) : body, { headers });
    return res.data;
  } catch (error) {
    if (error.response?.status === 401 && !expiredHandled && session.token) {
      expiredHandled = true;
      session.clear();
      try { sessionStorage.setItem('sa-expired', '1'); } catch { /* ignore */ }
      window.location.assign('/login');
    }
    if (error.code === 'ECONNABORTED') throw new Error('The server took too long to respond. Please try again.');
    if (!error.response) throw new Error('Could not reach the server. Check your connection or that the API is running.');
    throw new Error(error.response.data?.message || 'Something went wrong');
  }
}

// Arrays go out as `key[]` entries, which multer parses back into an array
// even when there is only one item.
function toFormData(data) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => fd.append(`${key}[]`, v));
    else fd.append(key, value);
  }
  return fd;
}
