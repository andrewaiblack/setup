import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const start = Date.now()

  let dbStatus = 'unknown'
  let dbLatency = 0
  let dbError = null

  try {
    const supabase = createServerSupabaseClient()
    const dbStart = Date.now()
    const { error } = await supabase.from('tasks').select('id').limit(1)
    dbLatency = Date.now() - dbStart
    dbStatus = error ? 'error' : 'ok'
    if (error) dbError = error.message
  } catch (e: any) {
    dbStatus = 'error'
    dbError = e.message
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
    database: {
      status: dbStatus,
      latency: dbLatency,
      error: dbError,
    },
    responseTime: Date.now() - start,
  })
}
