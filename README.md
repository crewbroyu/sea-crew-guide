# Sea Crew Guide

Front-end project for sea-crew career preparation, built with React + Vite.

## Environment

Create `.env.local` with:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Scripts

- `npm run dev` start dev server
- `npm run build` build production assets
- `npm run lint` run ESLint
- `npm run preview` preview build output

## Migration Note

Supabase direct client usage has been removed from the front end.
The app now uses:

- `src/lib/authClient.js` for authentication
- `src/lib/apiClient.js` for HTTP API requests
- `src/services/*` for domain-level data access
