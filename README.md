# 🖥️ DevBoard — Full-Stack Server Test Dashboard

> **Next.js 14 · Supabase · Tailwind CSS · TypeScript**
>
> A complete demo app to verify all layers of your Ubuntu server + Cloudflare setup.

---

## ✅ Features tested

| Feature | Route | Description |
|---|---|---|
| Health Check | `GET /api/health` | Server info, Node.js, memory, uptime |
| DB Ping | `GET /api/health` | Supabase connectivity + latency |
| Auth — Signup | `POST /api/auth` | Email/password registration |
| Auth — Login | `POST /api/auth` | Session via Supabase Auth |
| Auth — Logout | `POST /api/auth` | Clear session |
| Tasks — List | `GET /api/tasks` | With status/priority filters |
| Tasks — Create | `POST /api/tasks` | Full validation |
| Tasks — Update | `PATCH /api/tasks/:id` | Edit title, priority, status |
| Tasks — Delete | `DELETE /api/tasks/:id` | Remove task |
| Realtime | WebSocket | Supabase Postgres Changes live |
| API Log | Frontend | Live trace of all HTTP calls |

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/devboard.git
cd devboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com) and create a free project
2. Open **SQL Editor** and run `supabase-schema.sql` (copy/paste the whole file)
3. Go to **Settings → API** and copy your URL and anon key

### 4. Set environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy on Ubuntu Server

### Option A — Node.js directly

```bash
# Build
npm run build

# Start on port 3000
npm start

# Or with PM2 (auto-restart)
npm install -g pm2
pm2 start "npm start" --name devboard
pm2 save && pm2 startup
```

### Option B — With Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option C — Cloudflare Tunnel (already set up ✓)

If you have Cloudflare Tunnel configured, just point it to `localhost:3000`. The app works out of the box — WebSocket (Realtime) also works through Cloudflare Tunnels.

---

## 🗂️ Project Structure

```
devboard/
├── app/
│   ├── api/
│   │   ├── health/route.ts        # Server + DB health check
│   │   ├── tasks/route.ts         # GET list + POST create
│   │   ├── tasks/[id]/route.ts    # PATCH + DELETE
│   │   └── auth/route.ts          # Login, signup, logout, me
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main dashboard (all UI)
├── lib/
│   ├── supabase.ts                # Browser Supabase client
│   └── supabase-server.ts         # Server-side client (SSR)
├── supabase-schema.sql            # Run this in Supabase SQL Editor
├── .env.example
└── README.md
```

---

## 🧪 Testing the API manually

```bash
# Health check
curl http://localhost:3000/api/health | jq

# List tasks
curl http://localhost:3000/api/tasks | jq

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","priority":"high","status":"todo"}' | jq

# Update task
curl -X PATCH http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' | jq

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/TASK_ID | jq
```

---

Built to test: **Ubuntu server · Cloudflare Tunnel · Next.js · Supabase**
