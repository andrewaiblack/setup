-- Run this in your Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query

-- 1. Create tasks table
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'todo'
                check (status in ('todo', 'in_progress', 'done')),
  priority    text not null default 'medium'
                check (priority in ('low', 'medium', 'high')),
  tag         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- 2. Enable Row Level Security
alter table public.tasks enable row level security;

-- 3. Allow everyone to read/write (for demo purposes)
--    In production: restrict to authenticated users
create policy "Allow all" on public.tasks
  for all using (true) with check (true);

-- 4. Enable Realtime for the tasks table
alter publication supabase_realtime add table public.tasks;

-- 5. Seed some demo data
insert into public.tasks (title, description, status, priority, tag) values
  ('Set up Ubuntu server',   'Install and configure Ubuntu 24.04', 'done',        'high',   'infra'),
  ('Configure Cloudflare',   'Tunnel + DNS for the server',        'done',        'high',   'infra'),
  ('Deploy DevBoard',        'Clone repo and run npm install',     'in_progress', 'high',   'deploy'),
  ('Test Supabase Realtime', 'Verify WebSocket connection works',  'todo',        'medium', 'test'),
  ('Add more API routes',    'Extend the REST API as needed',      'todo',        'low',    'dev');
