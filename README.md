# Crypto Accounting (Web, Local)

Browser-only React + TypeScript app using **sql.js (SQLite WASM)**, **Material UI**, **Zustand**.
Implements Sprint 1 base: **Fiat Deposit**, **Ledger**, **Balances**, with double-entry and **USD valuation at transaction time**.

## Quickstart

```bash
pnpm install   # or npm install / yarn
pnpm dev       # or npm run dev
```

Open http://localhost:5173

### Important: sql-wasm.wasm
A postinstall script copies `node_modules/sql.js/dist/sql-wasm.wasm` into `public/sql-wasm.wasm`.  
If it fails, manually copy it so the app can load SQLite in the browser.

## What works
- Local database persisted in IndexedDB.
- Seeded Chart of Accounts (Bank USD/EUR, Owner Contributions, etc.).
- Add **Fiat Deposit** (USD or EUR with EUR→USD rate). Stores both **qty** (original currency amount) and **amount_usd**.
- Ledger and Balances views.

## Next Sprints
- Withdrawal & Transfer forms and posting.
- Cost-basis lots and crypto assets.
- CSV export, validations and undo, more transaction types (Swap, Bridge, Supply, Borrow, Rewards).
