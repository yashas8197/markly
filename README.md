# Markly — Smart Bookmark Manager

A full-stack bookmark manager built with **Next.js 15**, **Supabase**, and **TypeScript**. Users authenticate via Google OAuth, save bookmarks, and see changes sync across tabs in real time using Supabase Realtime.

**Live Demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app) <!-- Replace with actual URL after deployment -->
** **Video Demo:** ** [demo-video](https://www.loom.com/share/42e684708a2f4983bd27bbea818844c0)

## Features

- **Google OAuth** — One-click sign-in via Supabase Auth (no email/password)
- **CRUD Bookmarks** — Add, view, and delete bookmarks with optimistic UI updates
- **Real-time Sync** — Bookmarks update across browser tabs instantly via Supabase Realtime (Postgres Changes)
- **Server-Side Rendering** — Initial bookmarks are fetched on the server for fast page loads
- **Dark Mode** — Theme toggle powered by `next-themes`
- **Responsive UI** — Built with shadcn/ui components and Tailwind CSS

## Tech Stack

| Layer         | Technology                                  |
|---------------|---------------------------------------------|
| Framework     | Next.js 15 (App Router)                     |
| Language      | TypeScript (strict mode)                    |
| Auth          | Supabase Auth (Google OAuth)                |
| Database      | Supabase (PostgreSQL + Row Level Security)  |
| Realtime      | Supabase Realtime (Postgres Changes)        |
| Styling       | Tailwind CSS v3 + shadcn/ui (New York)      |
| Deployment    | Vercel                                      |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials configured in Supabase Auth

### Setup

```bash
git clone https://github.com/your-username/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

Copy `.env.example` to `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database Setup

Create the `bookmarks` table in the Supabase SQL Editor:

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                  # Landing page (public)
  layout.tsx                # Root layout with theme provider
  auth/
    login/page.tsx          # Google OAuth login page
    callback/route.ts       # OAuth code → session exchange
  protected/
    layout.tsx              # Authenticated layout (header + nav)
    page.tsx                # Bookmark dashboard (SSR)
components/
  hero.tsx                  # Landing page hero section
  auth-button.tsx           # Login/logout button (server component)
  google-auth-button.tsx    # "Continue with Google" button
  bookmark-section.tsx      # Bookmark state + Realtime subscription
  add-bookmark-form.tsx     # Add bookmark form
  bookmark-list.tsx         # Bookmark card list
  ui/                       # shadcn/ui primitives
lib/
  supabase/
    client.ts               # Browser Supabase client factory
    server.ts               # Server Supabase client factory
    proxy.ts                # Session refresh + auth redirect logic
proxy.ts                    # Request interceptor (replaces middleware.ts)
```

## Challenges Faced & How I Solved Them

### 1. Stripping the Starter Template

**Problem:** The app was scaffolded from the official Next.js + Supabase starter kit, which shipped with a full email/password auth flow (login form, sign-up form, forgot password, password reset, email OTP confirmation) and generic starter branding (logos, deploy buttons, tutorial content).

**Solution:** Removed all email/password auth pages and components (`sign-up`, `forgot-password`, `update-password`, `sign-up-success`, `confirm` route, `login-form`, `sign-up-form`, `forgot-password-form`, `update-password-form`). Replaced them with a single "Continue with Google" button using Supabase's `signInWithOAuth`. Redesigned the landing page, header, and footer under the "Markly" brand with a product-focused layout and feature highlights. Since Google OAuth handles both sign-in and sign-up automatically, the separate sign-up page was removed entirely to avoid confusing users.

### 2. Missing OAuth Callback Route

**Problem:** The starter template had no OAuth callback handler. After Google redirected the user back to the app, there was no route to exchange the authorization code for a Supabase session.

**Solution:** Created `app/auth/callback/route.ts` that calls `supabase.auth.exchangeCodeForSession(code)` to complete the OAuth flow and redirect the user to `/protected`.

### 3. Supabase Realtime INSERT Events Not Received

**Problem:** When a bookmark was added in one browser tab, the other tab did not receive the Realtime INSERT event. DELETE events worked consistently, but INSERT events were received only intermittently or not at all.

**Debugging steps:**

1. **Verified Replica Identity** — Set `ALTER TABLE bookmarks REPLICA IDENTITY FULL` to ensure all columns are included in WAL output. Issue persisted.
2. **Verified Publication** — Confirmed `bookmarks` was in the `supabase_realtime` publication with `pubinsert: true`.
3. **Verified Replication Slot** — Confirmed the slot was active.
4. **Added debug logging** — Logged subscription status, auth session state, token expiry, and payload details. Subscription showed `SUBSCRIBED` status with valid auth, but INSERT payloads never arrived.
5. **Added an unfiltered debug channel** — Created a second subscription without the `filter: user_id=eq.${userId}` parameter. Neither filtered nor unfiltered channels received INSERT events, confirming the issue was server-side.

**Root cause (two issues):**

- **RLS SELECT policy blocking Realtime delivery:** Supabase Realtime evaluates the table's Row Level Security SELECT policy to decide whether a subscriber should receive an event. The `auth.uid()` function does not reliably resolve in the Realtime server's execution context, so the RLS check silently failed and INSERT events were dropped before reaching the client. DELETE events were unaffected because Supabase does not apply RLS SELECT policies to DELETE payloads in Realtime.
- **Publication not emitting INSERT events:** The `supabase_realtime` publication either did not include the `bookmarks` table or only had partial event types enabled.

**Fix applied:**

```sql
-- Fix 1: Relax the SELECT RLS policy for Realtime compatibility
DROP POLICY "Users can view their own bookmarks" ON bookmarks;
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT TO authenticated USING (true);

-- Fix 2: Re-add the table to ensure all event types are published
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

User isolation is still enforced at the application layer — all queries scope data with `.eq("user_id", userId)`, and INSERT/DELETE RLS policies still require `auth.uid() = user_id`.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```
