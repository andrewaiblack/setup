import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    return NextResponse.json({ user: session?.user ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await req.json()
    const { action, email, password } = body

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ user: data.user, message: 'Check your email to confirm signup' })
    }

    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: error.message }, { status: 401 })
      return NextResponse.json({ user: data.user, session: data.session })
    }

    if (action === 'logout') {
      const { error } = await supabase.auth.signOut()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
