'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Database, Server, Zap, Plus, Trash2, CheckCircle2,
  Clock, AlertCircle, RefreshCw, ChevronDown, Tag, Edit3, X, Save,
  LogIn, LogOut, User, Eye, EyeOff, Wifi, WifiOff, Terminal, Shield
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ───────────────────────────────────────────────────────────────────
type Status = 'todo' | 'in_progress' | 'done'
type Priority = 'low' | 'medium' | 'high'

interface Task {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  tag?: string
  created_at: string
  updated_at?: string
}

interface HealthData {
  status: string
  timestamp: string
  uptime: number
  server: {
    node: string
    platform: string
    arch: string
    memory: { used: number; total: number; unit: string }
  }
  database: { status: string; latency: number; error?: string }
  responseTime: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const STATUS_ICONS: Record<Status, JSX.Element> = {
  todo: <Clock size={13} />,
  in_progress: <RefreshCw size={13} className="animate-spin" />,
  done: <CheckCircle2 size={13} />,
}

const STATUS_COLORS: Record<Status, string> = {
  todo: 'text-muted border-border',
  in_progress: 'text-yellow-400 border-yellow-400/30',
  done: 'text-acid border-acid/30',
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs border font-mono flex items-center gap-1', className)}>
      {children}
    </span>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub }: { icon: JSX.Element; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-acid/10 border border-acid/20 flex items-center justify-center text-acid">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-white text-sm tracking-wide uppercase">{title}</h2>
        {sub && <p className="text-muted text-xs font-mono">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Health Panel ─────────────────────────────────────────────────────────────
function HealthPanel() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await globalThis.fetch('/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setHealth(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const uptime = health ? Math.floor(health.uptime) : 0
  const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-slide-up">
      <SectionHeader icon={<Activity size={15} />} title="Server Health" sub="GET /api/health" />

      <div className="flex justify-end mb-3">
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-surface border border-border rounded-lg text-muted hover:text-white hover:border-acid/30 transition-all"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs font-mono mb-3">
          ✗ {error}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'API Status', value: health.status, accent: health.status === 'ok' },
            { label: 'Response Time', value: `${health.responseTime}ms`, accent: false },
            { label: 'DB Status', value: health.database.status, accent: health.database.status === 'ok' },
            { label: 'DB Latency', value: `${health.database.latency}ms`, accent: false },
            { label: 'Node.js', value: health.server.node, accent: false },
            { label: 'Platform', value: `${health.server.platform}/${health.server.arch}`, accent: false },
            { label: 'Memory', value: `${health.server.memory.used}/${health.server.memory.total}MB`, accent: false },
            { label: 'Uptime', value: uptimeStr, accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-surface rounded-lg p-3 border border-border">
              <p className="text-muted text-xs mb-1">{label}</p>
              <p className={clsx('font-mono text-sm font-semibold', accent ? 'text-acid' : 'text-white')}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!health && !error && !loading && (
        <p className="text-muted text-sm font-mono text-center py-4">No data yet</p>
      )}
    </div>
  )
}

// ─── Auth Panel ───────────────────────────────────────────────────────────────
function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    globalThis.fetch('/api/auth').then(r => r.json()).then(d => setUser(d.user))
  }, [])

  const submit = async () => {
    if (!email || !password) return
    setLoading(true)
    setResult(null)
    try {
      const res = await globalThis.fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', msg: data.error })
      } else {
        setUser(data.user)
        setResult({ type: 'success', msg: mode === 'signup' ? (data.message || 'Signed up!') : 'Logged in!' })
        setEmail(''); setPassword('')
      }
    } catch (e: any) {
      setResult({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    await globalThis.fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    setUser(null)
    setResult({ type: 'success', msg: 'Logged out' })
    setLoading(false)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <SectionHeader icon={<Shield size={15} />} title="Auth — Supabase" sub="POST /api/auth" />

      {user ? (
        <div className="space-y-3">
          <div className="bg-acid/5 border border-acid/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-acid" />
              <span className="text-acid text-xs font-mono font-semibold">Authenticated</span>
            </div>
            <p className="text-white text-sm">{user.email}</p>
            <p className="text-muted text-xs font-mono mt-1">{user.id}</p>
          </div>
          <button
            onClick={logout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-all"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex bg-surface rounded-lg p-1 border border-border">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={clsx(
                  'flex-1 py-1.5 text-xs font-mono rounded transition-all capitalize',
                  mode === m ? 'bg-acid text-ink font-bold' : 'text-muted hover:text-white'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted font-mono focus:outline-none focus:border-acid/40 transition-colors"
          />

          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder-muted font-mono focus:outline-none focus:border-acid/40 transition-colors"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-acid text-ink text-sm font-bold hover:bg-acid/90 disabled:opacity-40 transition-all"
          >
            <LogIn size={13} />
            {loading ? 'Loading…' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </div>
      )}

      {result && (
        <div className={clsx(
          'mt-3 p-3 rounded-lg text-xs font-mono border',
          result.type === 'success'
            ? 'bg-acid/5 border-acid/20 text-acid'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        )}>
          {result.type === 'success' ? '✓' : '✗'} {result.msg}
        </div>
      )}
    </div>
  )
}

// ─── Tasks Panel ──────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo' as Status, priority: 'medium' as Priority, tag: '' })
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [apiLog, setApiLog] = useState<string[]>([])

  const log = (msg: string) => setApiLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10))

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterPriority !== 'all') params.set('priority', filterPriority)
    log(`GET /api/tasks?${params}`)
    try {
      const res = await globalThis.fetch(`/api/tasks?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks(data.data || [])
      log(`← 200 OK — ${data.count} tasks`)
    } catch (e: any) {
      setError(e.message)
      log(`← ERROR: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority])

  useEffect(() => { loadTasks() }, [loadTasks])

  const createTask = async () => {
    if (!newTask.title.trim()) return
    setCreating(true)
    log(`POST /api/tasks — "${newTask.title}"`)
    try {
      const res = await globalThis.fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      log(`← 201 Created — id:${data.data.id.slice(0, 8)}…`)
      setTasks(prev => [data.data, ...prev])
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', tag: '' })
      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
      log(`← ERROR: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const updateTask = async (id: string, patch: Partial<Task>) => {
    log(`PATCH /api/tasks/${id.slice(0, 8)}…`)
    try {
      const res = await globalThis.fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      log(`← 200 OK — updated`)
      setTasks(prev => prev.map(t => t.id === id ? data.data : t))
      setEditingId(null)
    } catch (e: any) {
      setError(e.message)
      log(`← ERROR: ${e.message}`)
    }
  }

  const deleteTask = async (id: string) => {
    log(`DELETE /api/tasks/${id.slice(0, 8)}…`)
    try {
      const res = await globalThis.fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      log(`← 200 OK — deleted`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      setError(e.message)
      log(`← ERROR: ${e.message}`)
    }
  }

  const cycleStatus = (task: Task) => {
    const next: Record<Status, Status> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
    updateTask(task.id, { status: next[task.status] })
  }

  return (
    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      {/* Tasks CRUD */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={<Database size={15} />} title="Tasks — CRUD" sub="Full REST via Supabase" />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-acid/40"
          >
            <option value="all">All statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-acid/40"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            onClick={loadTasks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-surface border border-border rounded-lg text-muted hover:text-white hover:border-acid/30 transition-all"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Reload
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-acid text-ink font-bold rounded-lg hover:bg-acid/90 transition-all"
          >
            <Plus size={11} /> New Task
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-surface border border-acid/20 rounded-lg p-4 mb-4 space-y-2">
            <input
              autoFocus
              placeholder="Task title *"
              value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted font-mono focus:outline-none focus:border-acid/40"
            />
            <input
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted font-mono focus:outline-none focus:border-acid/40"
            />
            <div className="flex gap-2">
              <select
                value={newTask.status}
                onChange={e => setNewTask(p => ({ ...p, status: e.target.value as Status }))}
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={newTask.priority}
                onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                placeholder="tag"
                value={newTask.tag}
                onChange={e => setNewTask(p => ({ ...p, tag: e.target.value }))}
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-muted focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createTask}
                disabled={creating || !newTask.title.trim()}
                className="flex-1 py-2 rounded-lg bg-acid text-ink text-sm font-bold hover:bg-acid/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <Save size={12} /> {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs font-mono mb-3">
            ✗ {error}
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          {loading && tasks.length === 0 && (
            <div className="text-center py-8 text-muted font-mono text-sm animate-pulse">Loading…</div>
          )}
          {!loading && tasks.length === 0 && (
            <div className="text-center py-8 text-muted font-mono text-sm">
              No tasks. Create one above ↑
            </div>
          )}
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              onEdit={() => setEditingId(task.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => updateTask(task.id, patch)}
              onDelete={() => deleteTask(task.id)}
              onCycleStatus={() => cycleStatus(task)}
            />
          ))}
        </div>

        <div className="mt-3 text-right text-xs font-mono text-muted">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* API Log */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={<Terminal size={15} />} title="API Log" sub="Live request trace" />
        <div className="bg-ink rounded-lg p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
          {apiLog.length === 0 && <span className="text-muted">No requests yet…</span>}
          {apiLog.map((line, i) => (
            <div key={i} className={clsx(
              i === 0 ? 'text-acid' : 'text-muted',
              'transition-colors'
            )}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, isEditing, onEdit, onCancelEdit, onSave, onDelete, onCycleStatus }: {
  task: Task
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (patch: Partial<Task>) => void
  onDelete: () => void
  onCycleStatus: () => void
}) {
  const [draft, setDraft] = useState({ title: task.title, description: task.description || '', priority: task.priority, tag: task.tag || '' })

  if (isEditing) {
    return (
      <div className="bg-surface border border-acid/20 rounded-lg p-3 space-y-2">
        <input
          autoFocus
          value={draft.title}
          onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
          className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-acid/40"
        />
        <input
          value={draft.description}
          onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
          placeholder="description…"
          className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-muted focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={draft.priority}
            onChange={e => setDraft(p => ({ ...p, priority: e.target.value as Priority }))}
            className="bg-card border border-border rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            value={draft.tag}
            onChange={e => setDraft(p => ({ ...p, tag: e.target.value }))}
            placeholder="tag"
            className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs font-mono text-white placeholder-muted focus:outline-none"
          />
          <button onClick={() => onSave(draft)} className="px-3 py-1 bg-acid text-ink text-xs font-bold rounded hover:bg-acid/90 transition-all flex items-center gap-1">
            <Save size={10} /> Save
          </button>
          <button onClick={onCancelEdit} className="px-2 py-1 bg-surface border border-border rounded text-muted hover:text-white transition-all">
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-3 bg-surface border border-border hover:border-border/80 rounded-lg p-3 transition-all">
      <button onClick={onCycleStatus} className={clsx('mt-0.5 flex-shrink-0 transition-colors', STATUS_COLORS[task.status])}>
        {STATUS_ICONS[task.status]}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', task.status === 'done' ? 'line-through text-muted' : 'text-white')}>
          {task.title}
        </p>
        {task.description && <p className="text-xs text-muted mt-0.5 truncate">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
          <Badge className={STATUS_COLORS[task.status]}>{STATUS_ICONS[task.status]}{task.status.replace('_', ' ')}</Badge>
          {task.tag && <Badge className="text-purple-400 border-purple-400/30 bg-purple-400/10"><Tag size={9} />{task.tag}</Badge>}
          <span className="text-muted text-xs font-mono">{new Date(task.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded text-muted hover:text-white hover:bg-border transition-all">
          <Edit3 size={12} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Realtime Panel ───────────────────────────────────────────────────────────
function RealtimePanel() {
  const [events, setEvents] = useState<string[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const { supabase } = require('@/lib/supabase')
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        const msg = `[${new Date().toLocaleTimeString()}] ${payload.eventType.toUpperCase()} — ${payload.new?.title || payload.old?.title || '?'}`
        setEvents(prev => [msg, ...prev].slice(0, 15))
      })
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-5">
        <SectionHeader icon={<Zap size={15} />} title="Realtime" sub="Supabase Postgres Changes" />
        <div className={clsx('flex items-center gap-1.5 text-xs font-mono', connected ? 'text-acid' : 'text-muted')}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'LIVE' : 'connecting…'}
        </div>
      </div>
      <div className="bg-ink rounded-lg p-3 font-mono text-xs space-y-1 min-h-[100px] max-h-48 overflow-y-auto">
        {events.length === 0 ? (
          <span className="text-muted">{connected ? 'Waiting for DB changes…' : 'Connecting to Supabase…'}</span>
        ) : (
          events.map((e, i) => (
            <div key={i} className={i === 0 ? 'text-acid' : 'text-muted'}>{e}</div>
          ))
        )}
      </div>
      <p className="text-muted text-xs font-mono mt-2">
        Create, edit, or delete tasks — they appear here instantly via WebSocket.
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-acid flex items-center justify-center">
              <Server size={14} className="text-ink" />
            </div>
            <div>
              <span className="font-mono font-bold text-white text-sm">DevBoard</span>
              <span className="text-muted text-xs font-mono ml-2">v1.24</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-muted">
            <span className="hidden sm:inline">Next.js · Supabase · Tailwind</span>
            <div className="w-2 h-2 rounded-full bg-acid animate-pulse-slow" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white mb-2">
            Server <span className="text-gradient">Test Dashboard</span>
          </h1>
          <p className="text-muted font-mono text-sm">
            Full-stack demo: REST API · Auth · CRUD · Realtime · Health check
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="space-y-5">
            <HealthPanel />
            <AuthPanel />
            <RealtimePanel />
          </div>
          {/* Right — Tasks */}
          <div className="lg:col-span-2">
            <TasksPanel />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-border pt-5 text-center text-xs font-mono text-muted">
          API routes: <span className="text-acid">GET /api/health</span> ·{' '}
          <span className="text-acid">GET|POST /api/tasks</span> ·{' '}
          <span className="text-acid">PATCH|DELETE /api/tasks/:id</span> ·{' '}
          <span className="text-acid">GET|POST /api/auth</span>
        </footer>
      </main>
    </div>
  )
}
