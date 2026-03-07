# Adaptive_Task_Manager

## Problems

### What happened

- The app’s auth file src/contexts/AuthContext.tsx got broken (it had invalid JSON text instead of React code).
- Because of that, TypeScript/build failed and auth flow in App.tsx could not work.
- My old Supabase project is expired, so live auth could not be trusted anyway.

### How I fixed it

- Rebuilt AuthContext.tsx from scratch.
- Added two working auth modes:

1. Supabase mode (normal, real backend)
2. Local fallback mode (works without Supabase)

- - Local fallback stores user/profile in browser localStorage so login + onboarding still work.
- - Cleaned App.tsx auth routing logic (loading, login, onboarding, dashboard).
- - Fixed TypeScript/lint errors in related components.
- - Updated .env.example with VITE_BYPASS_AUTH option.

### Result

- Type check passes.
- Lint has no errors (only minor warnings).
- App can run even if Supabase is unavailable, using local mode.

### Next steps

1. Create a `.env` file.
2. For immediate run (no Supabase): set `VITE_BYPASS_AUTH=true`.
3. For real auth later:

- - create new Supabase project
- - run SQL migrations
- - set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- - set `VITE_BYPASS_AUTH=false`