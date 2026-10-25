# Queueless Control Center (super admin panel)

A standalone panel for the platform's super admins. It's built with React, Vite and Tailwind CSS v4, and talks to the `MedicareNew` backend's `/medicare/superadmin/*` API.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3002
```

The dev server sends `/medicare/*` through to the backend at `http://localhost:3000`. To point it somewhere else, set `VITE_PROXY_TARGET` in a `.env` file (see `.env.example`). Because requests go through this proxy, local development needs no CORS change on the backend.

Sign in with a super admin account. If you don't have one yet, run `node app/scripts/seedSuperAdmin.js` in `MedicareNew/` to create it. Hospital accounts are turned away at sign-in.

## Build and deploy

```bash
VITE_API_URL=https://your-backend.example.com/medicare/ npm run build   # outputs dist/
```

`dist/` is a single-page app, so the host must send unknown paths to `index.html`. On Netlify or Render, that's a `_redirects` file containing `/* /index.html 200`. You also need to add the panel's deployed origin to `ALLOWED_ORIGINS` in the backend's `.env`.

## Structure

| Path | What's there |
|---|---|
| `src/index.css` | Tailwind entry point. Defines the dark and light theme tokens (`bg-glass`, `text-ink-2`, `text-accent` …) and the `glass` / `glass-solid` panel utilities |
| `src/components/ui.jsx` | Shared UI pieces: buttons, badges, inputs, table class names, pager, modal, drawer, stat card |
| `src/components/charts.jsx` | The trend chart (Recharts) and the bar lists |
| `src/components/HospitalForms.jsx` | The register/edit hospital form and the reset-password dialog |
| `src/components/Appointments.jsx` | The appointments table and the appointment detail drawer |
| `src/pages/*` | Overview, Hospitals, Hospital profile, Appointments, Doctors, Patients, Login |
| `src/lib/api.js` | API client. Every call is a POST; the token is kept in sessionStorage, and an expired token sends you back to sign-in |

Theme colors are CSS variables, switched by `data-theme` on `<html>`. The theme toggle is in the top bar, and the choice is saved per browser.
