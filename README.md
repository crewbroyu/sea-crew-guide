# CrewPathGuide

CrewPathGuide is a React + Vite web app for cruise-career planning, job preparation, and Bar Server scenario training.

## Environment

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
DASHSCOPE_API_KEY=your_dashscope_api_key
```

## Scripts

- `npm run dev` start dev server
- `npm run build` build production assets
- `npm run lint` run ESLint
- `npm run preview` preview build output

## Architecture

- Supabase provides authentication and persistent user data.
- Vercel server endpoints provide protected AI calls.
- `src/services/*` contains client-side domain access helpers.
