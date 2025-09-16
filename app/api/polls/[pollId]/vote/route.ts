import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ActionResult } from '@/types'
import { revalidatePath } from 'next/cache'

const voteSchema = z.object({
  optionId: z.string().uuid(),
})

function err(code: string, message: string, details?: unknown): ActionResult<never> {
  return { ok: false, error: { code, message, details } }
}

async function requireUser() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { user: null as const }
  return { user: data.user }
}

async function insertVote(pollId: string, optionId: string, userId: string) {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('votes')
    .insert({ poll_id: pollId, option_id: optionId, voter_id: userId })

  if (error) return err('DB_INSERT_VOTE', error.message, error)
  return { ok: true as const }
}

export async function POST(request: Request, { params }: { params: { pollId: string } }) {
  const body = await request.json()
  const parsed = voteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(err('VALIDATION_ERROR', 'Invalid vote payload', parsed.error.flatten()), { status: 400 })
  }

  const { user } = await requireUser()
  if (!user) {
    return NextResponse.json(err('UNAUTHORIZED', 'You must be signed in to vote'), { status: 401 })
  }

  const result = await insertVote(params.pollId, parsed.data.optionId, user.id)
  if ('ok' in result && result.ok === false) {
    return NextResponse.json(result, { status: 500 })
  }

  revalidatePath(`/polls/${params.pollId}`)
  return NextResponse.json({ ok: true, data: { success: true } })
}
