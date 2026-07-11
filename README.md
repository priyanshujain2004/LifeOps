# ⚡ LifeLog — Personal Routine, Mobility & Expense Tracker

**LifeLog** is a progressive web app designed to track your daily activities with a single tap, record origin-to-destination mobility trips with automatic reimbursable travel allowances, and manage reimbursable vs personal expenses—all with full offline sync via IndexedDB and zero-cost cloud deployment via Vercel + Supabase.

---

## ✨ Features Built

1. **⚡ 1-Tap Instant Activity Logging (`/`)**
   - 20 default activities categorized into `COMMUTE`, `WORK`, `BREAK`, `MEAL`, `SLEEP`, `SITE_VISIT`, `PERSONAL`.
   - **Paired Start/End Logic**: Tapping `Work Started` flips the button to `End Work Ended` with an active pulsing indicator and live elapsed timer (`⏱ 14m in progress`).
   - **Inline Note / Expense Sheet**: Add notes or attach inline expenses directly before logging when `is_expense_trigger = true`.

2. **🚗 Trip Mode & Mobility Patterns (`/trips`)**
   - Supports all 7 mobility patterns (`OFFICE_TO_SITE`, `SITE_TO_SITE`, `HOME_TO_SITE`, etc.).
   - Autocompletes origin and destination from the saved `locations` table or allows quick manual entry.
   - **Automatic Reimbursability Check**: Hardcoded business rules (`reimbursability.ts`) determine instant reimbursable status (`OFFICE_TO_SITE` = Reimbursable, `HOME_TO_OFFICE` = Personal Commute).

3. **💵 Reimbursable vs Personal Expense Ledger (`/expenses`)**
   - Log expenses across `FOOD`, `TRAVEL`, `HOTEL`, and `MISC` with formatted INR currency (`₹`).
   - Link expenses directly to mobility trips (`Trip #...`).
   - Upload receipt photos directly to Supabase Storage (`receipts` bucket) with instant image preview.
   - Real-time monthly summary showing total spend and Reimbursable vs Personal split percentages.

4. **🕒 Chronological Timeline View (`/timeline`)**
   - Inspect server-stamped immutable `logged_at` timestamps strictly in **IST (`Asia/Kolkata`)**.
   - **Paired Duration Bars**: Connects start and end events (`⚡ Completed Session: Work Started: 4h 15m`).
   - Edit notes or delete entries directly from the timeline feed.

5. **📊 Rich Analytics & Intelligence (`/analytics`)**
   - **Daily Time Allocation Stacked Bar Chart** (`Recharts`): Visualizes productive work, site operations, commute, breaks, sleep, and calculated unlogged free time gaps (`24 - logged_hours`).
   - **Mobility Donut Chart**: Breakdown of time across Home, Office, and Client Site.
   - **Expense Trend Bar Chart**: Daily comparison of company reimbursable claims vs personal spend.
   - **CSV Export**: One-click download (`papaparse`) of activities and expenses for accounting.

6. **⚙️ Configuration Studio (`/settings`)**
   - Full CRUD for `activity_types` and `locations`.
   - Reorder activity buttons up/down, customize emojis, pick badge colors, and configure expense trigger rules (`CONDITIONAL`, `ALWAYS`, `NEVER`).
   - **Backup & Restore**: Export all settings to a `.json` file and restore anytime.

7. **🔐 Authentication & Demo Mode (`/login`)**
   - Supabase Auth integration (Email/Password & Magic Link OTP).
   - **Instant Demo Mode**: Access all 7 features immediately without signing up.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Lucide Icons + micro-animations
- **Database & Auth**: Supabase Postgres + RLS + Storage
- **Charts**: Recharts (`ResponsiveContainer`, `BarChart`, `PieChart`)
- **Offline Engine**: IndexedDB (`idb`) queueing + optimistic UI (`Zustand`) + `sonner` toasts + automatic sync on window `online` event.
- **Timezone**: Strict `Asia/Kolkata` (IST) date utilities.

---

## 🚀 Quick Start & Deployment

See **[DEPLOY.md](./DEPLOY.md)** for detailed instructions on deploying to Vercel and setting up Supabase RLS and TypeScript definitions.

```bash
# Run locally
npm run dev
```
