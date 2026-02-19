# Markly — Smart Bookmark Manager

A full-stack bookmark manager built with **Next.js 15**, **Supabase**, and **TypeScript**. Users authenticate via Google OAuth, save bookmarks, and see changes sync across tabs in real time using Supabase Realtime.

**Live Demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app) <!-- Replace with actual URL after deployment -->
** **Video Demo:** ** [demo-video](https://www.loom.com/share/42e684708a2f4983bd27bbea818844c0)

## Features

- **Google OAuth** — One-click sign-in via Supabase Auth (no email/password)
- **CRUD Bookmarks** — Add, view, and delete bookmarks with optimistic UI updates
- **Real-time Sync** — Bookmarks update across browser tabs instantly via Supabase Realtime (Postgres Changes)
- **Server-Side Rendering** — Initial bookmarks are fetched on the server for fast page loads
- **Responsive UI** — Built with shadcn/ui components and Tailwind CSS

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Framework  | Next.js 15 (App Router)                    |
| Language   | TypeScript (strict mode)                   |
| Auth       | Supabase Auth (Google OAuth)               |
| Database   | Supabase (PostgreSQL + Row Level Security) |
| Realtime   | Supabase Realtime (Postgres Changes)       |
| Styling    | Tailwind CSS v3 + shadcn/ui (New York)     |
| Deployment | Vercel                                     |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials configured in Supabase Auth

### Setup

```bash
git clone https://github.com/yashas8197/markly.git
cd markly
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

User isolation is still enforced at the application layer — all queries scope data with `.eq("user_id", userId)`, and INSERT/DELETE RLS policies still require `auth.uid() = user_id`.

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```
