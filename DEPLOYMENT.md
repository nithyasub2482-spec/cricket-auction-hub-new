# Cricket Auction Hub - Deployment Guide

## Current Architecture Problem

Your app has **two separate services** that need to communicate:
1. **Frontend** (React) - Deployed on Vercel
2. **Backend** (Express with WebSocket) - NOT deployed yet

The frontend tries to connect to the backend at `/api` (relative path), but since the backend isn't deployed anywhere, the socket connection fails. This is why the timer doesn't show up.

## Solution: Deploy Both Services

### Step 1: Deploy Backend on Render.com (Recommended)

Render.com has a free tier and supports Node.js with WebSockets.

1. Go to https://render.com
2. Sign up / Log in
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo: `nithyasub2482-spec/cricket-auction-hub-new`
5. Configure the service:
   - **Name:** `cricket-auction-api`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install --no-frozen-lockfile && pnpm build`
   - **Start Command:** `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`
   - **Plan:** Free
6. Add environment variables:
   - `PORT`: `3000`
   - `DATABASE_URL`: `postgresql://neondb_owner:YOUR_PASSWORD@ep-wild-paper-aotrswl6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
     (Use the same URL from your local .env)
7. Click **"Create Web Service"**
8. Wait for deployment to complete. You'll get a URL like: `https://cricket-auction-api.onrender.com`

### Step 2: Configure Frontend to Find Backend

Once your backend is deployed (Step 1), you'll have a URL like `https://cricket-auction-api.onrender.com`.

1. Go to your Vercel project dashboard for cricket-auction
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://cricket-auction-api.onrender.com`
   - **Environments:** Check all (Production, Preview, Development)
4. Click **"Save"**
5. Redeploy: Go to **Deployments**, find the latest one, click **"..." → "Redeploy"**

### Step 3: Verify the Connection

Once redeployed:
1. Go to https://cricket-auction-hub-nt1c1odca-nithya-s-s-projects.vercel.app/
2. Log in
3. Create an auction and select a player
4. The timer should now appear and count down

## Troubleshooting

If the timer still doesn't show:

### Check Backend is Running
- Visit `https://cricket-auction-api.onrender.com/api/auctions` (replace with your backend URL)
- You should see a JSON response (might be an error if not authenticated, but that's OK - it means backend is working)

### Check Browser Console
- Open browser Dev Tools (F12)
- Go to Console tab
- Look for connection errors from socket.io
- Look for any WebSocket connection failures

### Check Environment Variable
- In Vercel, verify `VITE_API_URL` is set correctly
- Redeploy if you changed it

## Architecture Summary After Setup

```
┌─────────────────────────────────────────────────────────┐
│         Your Browser                                    │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────────────┐
        │  Frontend (React)                           │
        │  Vercel                                     │
        │  https://cricket-auction-hub-...            │
        │  (HTML, CSS, JS)                           │
        └────────────────────────────────────────────┘
                         ↓ (VITE_API_URL)
        ┌────────────────────────────────────────────┐
        │  Backend (Express + WebSocket)              │
        │  Render.com                                 │
        │  https://cricket-auction-api.onrender.com   │
        │  (REST APIs, WebSocket)                     │
        └────────────────────────────────────────────┘
                         ↓ (DATABASE_URL)
        ┌────────────────────────────────────────────┐
        │  Database                                   │
        │  Neon (PostgreSQL)                          │
        │  (Data storage)                             │
        └────────────────────────────────────────────┘
```

## Alternative: Deploy Everything to Vercel

If you prefer to keep everything on Vercel, you can use Vercel's monorepo support, but this requires more complex configuration. The Render.com approach above is simpler for your current setup.

## Environment Variables Reference

### Frontend (Vercel)
- `VITE_API_URL` - Backend API base URL (no trailing slash)
  - Example: `https://cricket-auction-api.onrender.com`

### Backend (Render.com / Your Deployment)
- `PORT` - Server port (required, usually 3000)
- `DATABASE_URL` - PostgreSQL connection string (required)

## After First Deployment

Once you have everything working:
1. Code changes push to GitHub
2. GitHub automatically triggers Vercel deployment (frontend)
3. GitHub automatically triggers Render.com deployment (backend)
4. Both update within minutes
