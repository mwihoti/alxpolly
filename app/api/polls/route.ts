import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ActionResult } from '@/types'
import { revalidatePath } from 'next/cache'

const optionSchema = z.object({ text: z.string().min(1).max(200) })

const createPollSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  options: z.array(optionSchema).min(2).max(10),
  allowMultipleVotes: z.boolean().optional().default(false),
  showResults: z.boolean().optional().default(true),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
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

async function insertPoll(input: z.infer<typeof createPollSchema>, userId: string) {
  const supabase = getSupabaseServerClient()
  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      title: input.title,
      description: input.description ?? null,
      allow_multiple_votes: input.allowMultipleVotes ?? false,
      show_results: input.showResults ?? true,
      expires_at: input.expiresAt ?? null,
      created_by: userId,
    })
    .select('*')
    .single()

  if (error || !poll) return err('DB_INSERT_POLL', 'Failed to create poll', error)

  const { error: optErr } = await supabase
    .from('poll_options')
    .insert(input.options.map((o, idx) => ({ poll_id: poll.id, text: o.text, position: idx })))

  if (optErr) return err('DB_INSERT_OPTIONS', 'Failed to add options', optErr)

  return { poll }
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = createPollSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(err('VALIDATION_ERROR', 'Invalid poll data', parsed.error.flatten()), { status: 400 })
  }

  const { user } = await requireUser()
  if (!user) {
    return NextResponse.json(err('UNAUTHORIZED', 'You must be signed in to create a poll'), { status: 401 })
  }

  const result = await insertPoll(parsed.data, user.id)
  if ('ok' in result && result.ok === false) {
    return NextResponse.json(result, { status: 500 })
  }

  revalidatePath('/polls')
  revalidatePath(`/polls/${result.poll.id}`)
  return NextResponse.json({ ok: true, data: { id: result.poll.id } })
}
