import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/app/lib/supabase-server'
import type { ActionResult } from '@/app/types'
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
  try {
    const supabase = await getSupabaseServerClient()
    
    // First, try to get the session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError.message)
      return { user: null }
    }
    
    if (!sessionData.session) {
      console.error('No session found')
      return { user: null }
    }
    
    // Then get the user
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error.message)
      return { user: null }
    }
    
    if (!data.user) {
      console.error('No user found in session')
      return { user: null }
    }
    
    console.log('User authenticated successfully:', data.user.id)
    return { user: data.user }
  } catch (error) {
    console.error('requireUser error:', error)
    return { user: null }
  }
}

async function insertVote(pollId: string, optionId: string, userId: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('votes')
    .insert({ poll_id: pollId, option_id: optionId, voter_id: userId })

  if (error) return err('DB_INSERT_VOTE', error.message, error)
  return { ok: true as const }
}

export async function POST(request: Request, { params }: { params: Promise<{ pollId: string }> }) {
  try {
    const { pollId } = await params
    const body = await request.json()
    const parsed = voteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        err('VALIDATION_ERROR', 'Invalid vote payload', parsed.error.flatten()), 
        { status: 400 }
      )
    }

    // Fetch poll to check type, scheduling, anonymity
    const supabase = await getSupabaseServerClient()
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
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

    // Handle authentication - only require user if poll is not anonymous
    let userId = ''
    if (!poll.anonymous) {
      const { user } = await requireUser()
      if (!user) {
        return NextResponse.json(err('UNAUTHORIZED', 'You must be signed in to vote'), { status: 401 })
      }
      userId = user.id

      // Check if user already voted (for non-anonymous polls)
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('voter_id', userId)
        .limit(1)

      if (existingVotes && existingVotes.length > 0) {
        return NextResponse.json(err('ALREADY_VOTED', 'You have already voted on this poll'), { status: 409 })
      }
    }

    // Handle vote type
    let insertResult
    if (poll.vote_type === 'single') {
      insertResult = await insertVote(pollId, parsed.data.optionId, userId)
    } else if (poll.vote_type === 'multiple' || poll.vote_type === 'approval') {
      if (!parsed.data.optionIds || !Array.isArray(parsed.data.optionIds)) {
        return NextResponse.json(err('VALIDATION_ERROR', 'Must provide optionIds array'), { status: 400 })
      }
      
      // Insert all votes
      for (const oid of parsed.data.optionIds) {
        insertResult = await insertVote(pollId, oid, userId)
        if ('ok' in insertResult && insertResult.ok === false) break
      }
    } else if (poll.vote_type === 'ranked') {
      // Ranked: store rank order (not implemented, placeholder)
      return NextResponse.json(err('NOT_IMPLEMENTED', 'Ranked voting not yet implemented'), { status: 501 })
    }

    if ('ok' in insertResult && insertResult.ok === false) {
      return NextResponse.json(insertResult, { status: 500 })
    }

    revalidatePath(`/polls/${pollId}`)
    return NextResponse.json({ ok: true, data: { success: true } })
    
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      err('INTERNAL_ERROR', 'An unexpected error occurred'), 
      { status: 500 }
    )
  }
}