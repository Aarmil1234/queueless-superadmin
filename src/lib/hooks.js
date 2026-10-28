import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// POSTs `path` with `body` whenever the body changes (compared by value).
// Ignores responses that arrive after a newer request was sent, so fast
// filter changes can never show stale rows.
export function useApi(path, body, { enabled = true } = {}) {
  const key = JSON.stringify(body ?? {});
  const [state, setState] = useState({ data: null, pagination: null, loading: enabled, error: null });
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api(path, JSON.parse(key));
      if (id === seq.current) setState({ data: res.data, pagination: res.pagination || null, loading: false, error: null });
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, [path, key, enabled]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}

// Resolved values of theme CSS variables, re-read whenever the theme flips.
// Charts need real colors: SVG presentation attributes don't take var().
export function useCssVars(names) {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(`--sa-${n}`).trim()]));
  };
  const [vars, setVars] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setVars(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join()]);
  return vars;
}

// Paginated list state: filters + page, where changing any filter jumps
// back to page 1. Returns the useApi result plus setters.
export function useList(path, initialFilters = {}, { limit = 15 } = {}) {
  const [filters, setFiltersState] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const setFilter = useCallback((key, value) => {
    setFiltersState((f) => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const body = { page, limit };
  for (const [k, v] of Object.entries(filters)) {
    if (v !== '' && v !== undefined && v !== null && v !== 'all') body[k] = v;
  }
  const result = useApi(path, body);
  return { ...result, filters, setFilter, page, setPage };
}

// Hospital options for filter dropdowns — fetched once per session.
let hospitalOptionsCache = null;
export function useHospitalOptions() {
  const [options, setOptions] = useState(hospitalOptionsCache || []);
  useEffect(() => {
    if (hospitalOptionsCache) return;
    api('superadmin/hospitals/list', { page: 1, limit: 100 })
      .then((res) => {
        hospitalOptionsCache = (res.data?.hospitals || [])
          .map((h) => ({ value: h._id, label: h.name || h.ownerName, city: h.city }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setOptions(hospitalOptionsCache);
      })
      .catch(() => {});
  }, []);
  return options;
}
export const invalidateHospitalOptions = () => { hospitalOptionsCache = null; };

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#08151e' : '#ffffff');
    try { localStorage.setItem('sa-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}
