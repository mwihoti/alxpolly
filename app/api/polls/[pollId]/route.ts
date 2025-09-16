import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ActionResult, Poll } from '@/types'

function err(code: string, message: string, details?: unknown): ActionResult<never> {
  return { ok: false, error: { code, message, details } }
}

export async function GET(request: Request, { params }: { params: { pollId: string } }) {
  const supabase = getSupabaseServerClient()
  const { data: p, error } = await supabase
    .from('polls')
    .select('id, title, description, created_by, created_at, expires_at, is_active, allow_multiple_votes, show_results, poll_options(id, text)')
    .eq('id', params.pollId)
    .single()

  if (error || !p) {
    return NextResponse.json(err('NOT_FOUND', 'Poll not found', error), { status: 404 })
  }

  const poll: Poll = {
    id: p.id,
    title: p.title,
    description: p.description ?? undefined,
    options: (p as any).poll_options?.map((o: any) => ({ id: o.id, text: o.text })) ?? [],
    createdBy: p.created_by,
    createdAt: new Date(p.created_at),
    expiresAt: p.expires_at ? new Date(p.expires_at) : undefined,
    isActive: p.is_active,
    allowMultipleVotes: p.allow_multiple_votes,
    showResults: p.show_results,
  }

  return NextResponse.json({ ok: true, data: poll })
}
