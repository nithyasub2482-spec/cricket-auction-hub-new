# Cricket League Auction Platform

A production-grade real-time cricket league auction and bidding platform (IPL-style) with live WebSocket bidding, role-based access, and multi-screen support.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/cricket-auction run dev` — run the frontend (port 18246)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Socket.IO (WebSocket real-time bidding)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (users, teams, players, auctions, auction_slots, bids)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — Generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/api-server/src/lib/socket.ts` — Socket.IO WebSocket engine
- `artifacts/api-server/src/lib/auth.ts` — Password hashing + JWT token generation
- `artifacts/cricket-auction/src/pages/` — React frontend pages
- `artifacts/cricket-auction/src/hooks/useAuctionSocket.ts` — WebSocket client hook

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks. Never write raw fetch calls.
- Socket.IO runs on the same HTTP server as Express. Frontend connects at `/api` path. Proxy forwards `/api` including WS upgrades.
- Auth: SHA-256 password hashing with salt (`cricket_salt_2024`) + HMAC-signed base64 token stored in localStorage.
- `requireAuth` middleware parses bearer token, attaches `req.authUser` for downstream handlers.
- `numeric` DB columns — always parse with `Number()` before returning in JSON.
- Framer Motion for bid animation on live auction page.

## Product

- **Login** — role-based: admin, auctioneer, team_owner, viewer
- **Lobby** — list all auctions, enter live room, view display screen or control console
- **Live Auction** — real-time bid view with WebSocket updates, team owners can place bids
- **Auction Control** — auctioneer console: start/pause/resume, select player, mark sold/unsold
- **Auction Display** — full-screen broadcast screen showing current player and live bid
- **Players** — filterable player database with stats grid
- **Teams** — franchise overview with purse bars and squad links
- **Team Detail** — squad roster and spending breakdown
- **Analytics** — league summary, team leaderboard, player pool breakdown, bid activity feed
- **Admin** — create auctions/players/teams, manage users

## Demo Credentials

- Admin: `admin@cricket.com` / `admin123`
- Auctioneer: `auctioneer@cricket.com` / `auction123`
- Team Owner (Mumbai): `mumbai@cricket.com` / `team123`
- Viewer: `viewer@cricket.com` / `view123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Mutations in generated hooks use `{ id, data }` pattern for path param + body, just `{ id }` for body-less actions.
- `TeamSquad` is `{ team, players, stats }` — not an array. Access `squad.players` to get the list.
- `PlayerPool` is `{ total, available, sold, unsold, byCategory: CategoryCount[] }` — not an array.
- `TeamStats` uses `{ team: Team, spent, playerCount }` — not flat `teamId/teamName/totalSpent`.
- Do not run `pnpm run dev` at workspace root; use workflows.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
