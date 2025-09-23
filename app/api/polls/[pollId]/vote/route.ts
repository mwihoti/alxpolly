import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ActionResult } from '@/types'
import { revalidatePath } from 'next/cache'

const voteSchema = z.object({
  optionId: z.string().uuid(),
  // For ranked/approval/multiple, allow array
  optionIds: z.array(z.string().uuid()).optional(),
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

  // Fetch poll to check type, scheduling, anonymity
  const supabase = getSupabaseServerClient()
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', params.pollId)
    .single()
  if (pollError || !poll) {
    return NextResponse.json(err('NOT_FOUND', 'Poll not found', pollError), { status: 404 })
  }

  // Check scheduling
  const now = new Date()
  if (poll.start_at && new Date(poll.start_at) > now) {
    return NextResponse.json(err('NOT_STARTED', 'Voting has not started yet'), { status: 403 })
  }
  if (poll.ends_at && new Date(poll.ends_at) < now) {
    return NextResponse.json(err('ENDED', 'Voting has ended'), { status: 403 })
  }

  // Handle anonymous voting
  let userId = null
  if (!poll.anonymous) {
    const { user } = await requireUser()
    if (!user) {
      return NextResponse.json(err('UNAUTHORIZED', 'You must be signed in to vote'), { status: 401 })
    }
    userId = user.id
  } else {
    // For anonymous, generate a session-based or random ID (for demo, use null)
    userId = null
  }

  // Handle vote type
  let insertResult
  if (poll.vote_type === 'single') {
    insertResult = await insertVote(params.pollId, parsed.data.optionId, userId)
  } else if (poll.vote_type === 'multiple' || poll.vote_type === 'approval') {
    if (!parsed.data.optionIds || !Array.isArray(parsed.data.optionIds)) {
      return NextResponse.json(err('VALIDATION_ERROR', 'Must provide optionIds array'), { status: 400 })
    }
    for (const oid of parsed.data.optionIds) {
      insertResult = await insertVote(params.pollId, oid, userId)
      if ('ok' in insertResult && insertResult.ok === false) break
    }
  } else if (poll.vote_type === 'ranked') {
    // Ranked: store rank order (not implemented, placeholder)
    // You would store the order in a separate table or as metadata
    return NextResponse.json(err('NOT_IMPLEMENTED', 'Ranked voting not yet implemented'), { status: 501 })
  }

  if ('ok' in insertResult && insertResult.ok === false) {
    return NextResponse.json(insertResult, { status: 500 })
  }

  revalidatePath(`/polls/${params.pollId}`)
  return NextResponse.json({ ok: true, data: { success: true } })
}
