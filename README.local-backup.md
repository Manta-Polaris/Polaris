<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# POLARIS

The trusted constant for informal African cross-border traders — an escrow payment rail, guild group-buying pools, and a ZK trade-reputation credit marketplace.

This is a React + TypeScript + Vite app, originally scaffolded in Google AI Studio.

View the app in AI Studio: https://ai.studio/apps/69f774c3-e0eb-4d9c-8e7c-989e1a5bf8ea

## Features

- **Mobile Trader App** — escrow-backed trade flow for traders
- **Supplier Portal** — supplier-side view of incoming trades and payouts
- **Credit Marketplace** — ZK-based trade reputation used to unlock credit lines
- **Network Ledger** — shared record of trade/escrow events across the network

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Google Gemini API (`@google/genai`), called server-side
- Express (server) + Motion (animation) + Lucide (icons)

## Prerequisites

- Node.js (v18+ recommended)
- A [Gemini API key](https://aistudio.google.com/app/apikey)

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
   - `GEMINI_API_KEY` — your Gemini API key
   - `APP_URL` — the URL this app is hosted at (used for self-referential links/callbacks; can be left as `http://localhost:3000` for local dev)
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check with `tsc` |
| `npm run clean` | Remove build output (`dist/`, `server.js`) |

## Project Structure

```
src/
├── App.tsx                     # App shell & global state
├── main.tsx                    # Entry point
├── types.ts                    # Shared TypeScript types
├── data/suppliers.ts           # Seed supplier data
└── components/
    ├── MobileTraderApp.tsx      # Trader-facing escrow flow
    ├── SupplierPortal.tsx       # Supplier-facing dashboard
    ├── CreditMarketplace.tsx    # ZK reputation & credit lines
    └── NetworkLedger.tsx        # Shared trade/escrow ledger
```

## Deployment

This app can be deployed via AI Studio (Cloud Run) or built manually with `npm run build` and served from `dist/`.
```


