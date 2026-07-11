# LifeLog — Deployment & Zero-Cost Cloud Setup Guide

LifeLog is architected to run **100% free forever** on the internet using **Vercel** (hosting/frontend) and **Supabase** (Postgres DB, Authentication, Storage, & RLS).

Follow this exact step-by-step procedure to deploy your personal or multi-user instance.

---

## Phase 1: Supabase Database & Storage Setup (100% Free Tier)

1. Go to [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**, pick your organization, enter a project name (`lifelog`), generate a strong database password, and select a region closest to you (e.g., `Mumbai / Asia South 1`).
3. Once the project finishes provisioning, navigate to the **SQL Editor** tab in the left sidebar.
4. Click **New Query**, and copy-paste the entire contents of:
   ```
   supabase/migrations/20260711000000_init_lifelog_schema.sql
   ```
5. Click **Run**. This will create:
   - All 5 core tables: `activity_types`, `activity_logs`, `trips`, `expenses`, `locations`
   - Row Level Security (RLS) policies enforcing user isolation (`auth.uid() = user_id`)
   - The `receipts` storage bucket with public read access
   - The `seed_user_defaults` trigger that automatically populates the exact 20 activity buttons and 4 mobility locations for every new signup!

---

## Phase 2: Generate TypeScript Types from Database

After applying the SQL migration, generate exact TypeScript definitions to keep your codebase perfectly type-safe:

```bash
# First, login to Supabase CLI if you haven't already
npx supabase login

# Generate TypeScript types directly into your local codebase
npx supabase gen types typescript --project-id YOUR_SUPABASE_PROJECT_ID > src/lib/supabase/types.ts
```
*(Replace `YOUR_SUPABASE_PROJECT_ID` with your actual 20-character project ID found under Project Settings ➔ General).*

---

## Phase 3: Vercel Cloud Deployment (100% Free Tier)

1. Push your LifeLog git repository to **GitHub** (`git init && git add . && git commit -m "Initial LifeLog PWA" && git push ...`).
2. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New ➔ Project** and select your `lifelog` repository.
4. Under **Environment Variables**, add the following keys from your Supabase Dashboard (**Project Settings ➔ API**):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxxxxxxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsIn...`
5. Click **Deploy**. Vercel will automatically build (`npm run build`), optimize, and deploy your Progressive Web App to a public HTTPS domain in ~60 seconds!

---

## Phase 4: Progressive Web App (PWA) Mobile Installation

Once deployed to Vercel (`https://your-lifelog-domain.vercel.app`):
- **On Android (Chrome)**: Open the URL, tap the 3-dot menu, and tap **"Install app"** or **"Add to Home screen"**. LifeLog will run fullscreen as a native app with offline sync capability.
- **On iOS (Safari)**: Open the URL, tap the **Share** button at the bottom navigation bar, and tap **"Add to Home Screen"**.
- **Offline Sync**: When disconnected from cellular or WiFi, tap any activity button or log expenses. LifeLog queues your transactions locally inside **IndexedDB (`lifelog-offline-db`)** and automatically flushes the queue to Supabase the moment your device reconnects to the internet.
