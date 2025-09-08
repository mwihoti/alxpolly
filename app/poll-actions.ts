"use server"

import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { ActionResult, Poll } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Poll actions (server-only)
 *
 * Business rules overview
 * - Lifecycle: A poll is created with >=2 and <=10 options, can be marked active, and may have an optional expiration date.
 *   When expired (time-based) or deactivated (business decision), voting is disallowed (RLS enforces) and UI must reflect this.
 * - Validation: Title length (3..200), option text length (1..200), unique options per poll, and valid ISO expiration.
 * - Ownership: Only the creator can modify or delete a poll or its options. RLS in DB enforces; actions double-check and return typed errors.
 * - Transactions: Supabase SQL from the client does not provide multi-statement transactions in a single call. For create + options we perform
 *   two steps; if the second step fails, callers should consider compensating actions (e.g., delete the created poll) or surface errors.
 *   In production, you can replace this with a Postgres RPC that wraps operations in a server-side transaction.
 * - Deletion: Prefer soft-delete via `is_active=false` for audits; hard-delete (row removal) cascades to options and votes by schema design.
 * - Concurrency: Updates are last-write-wins here. For stricter control, add a row version column and check it on update.
 */

// Validation schemas
/**
 * Option payload validator.
 * Ensures human-sized text and prevents empty/oversized inputs.
 */
const optionSchema = z.object({ text: z.string().min(1).max(200) })

/**
 * Create poll payload validator.
 * - Limits options to [2,10]
 * - Coerces/validates optional expiration as ISO string
 * - Defaults: allowMultipleVotes=false, showResults=true
 */
const createPollSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  options: z.array(optionSchema).min(2).max(10),
  allowMultipleVotes: z.boolean().optional().default(false),
  showResults: z.boolean().optional().default(true),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
})

/**
 * Vote payload validator.
 * Guards that both identifiers are valid UUIDs.
 */
const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
})

// Error helper
/**
 * Standardizes error result shape for all poll actions.
 * Use typed error codes for deterministic UI handling and logging.
 * @param code - machine-friendly error code (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR')
 * @param message - human-readable summary
 * @param details - optional structured diagnostic data (e.g., zod flatten, PostgREST error)
 */
function err(code: string, message: string, details?: unknown): ActionResult<never> {
  return { ok: false, error: { code, message, details } }
}

// Auth helper
/**
 * Returns the authenticated user (server-side) or null.
 * Why: Centralizes auth lookup for actions and makes mocking easier in tests.
 * Security: Uses server Supabase client bound to App Router cookies; tokens are not exposed to client code here.
 */
async function requireUser() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { user: null as const }
  return { user: data.user }
}

// Modular operations
/**
 * Inserts a poll and its options.
 *
 * Note on transactions: This consists of two separate SQL calls (poll then options). If the second insert fails,
 * the orphaned poll remains; a compensating delete could be added here, or you can migrate this logic into a
 * Postgres RPC to ensure atomicity. We choose visibility of failure over silent rollback for easier diagnostics.
 */
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

  // Insert options preserving caller-provided order via `position`.
  const { error: optErr } = await supabase
    .from('poll_options')
    .insert(input.options.map((o, idx) => ({ poll_id: poll.id, text: o.text, position: idx })))

  if (optErr) return err('DB_INSERT_OPTIONS', 'Failed to add options', optErr)

  return { poll }
}

/**
 * Inserts a single vote.
 *
 * Validation & Integrity
 * - DB RLS requires: authenticated user, active poll, and unexpired `expires_at` (see SQL policies).
 * - DB CHECK constraint ensures the selected option belongs to the given poll.
 * - DB trigger `trg_votes_single_vote` enforces single-vote when `allow_multiple_votes=false`.
 *
 * Race conditions & concurrency
 * - Two clients may attempt to vote concurrently. Only one will succeed when single-vote is enforced; the other gets a DB error.
 *   We surface the DB error message as a typed error so the UI can show a friendly notice and refresh.
 * - For multi-vote polls, multiple inserts for different options are allowed by design; de-duplication per option can be added with a UNIQUE
 *   partial index if the business rule requires "at most one per option".
 *
 * Persistence & rollback
 * - This is a single insert; failures return an error and do not mutate state. No partial write occurs.
 */
async function insertVote(input: z.infer<typeof voteSchema>, userId: string) {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase
    .from('votes')
    .insert({ poll_id: input.pollId, option_id: input.optionId, voter_id: userId })

  if (error) return err('DB_INSERT_VOTE', error.message, error)
  return { ok: true as const }
}

/**
 * createPoll
 *
 * Creates a new poll with validated inputs, inserts options, and revalidates relevant paths.
 *
 * Validation:
 * - Title length 3..200, options 2..10 (each 1..200 chars), optional description (<=2000 chars)
 * - Optional expiration must be a valid ISO timestamp string (UTC recommended)
 * Permissions:
 * - Requires an authenticated user (creator). DB RLS also enforces ownership on insert.
 * Error handling:
 * - Returns standardized error with zod diagnostics for invalid payloads
 * - Surfaces DB insert failures, including unique option conflicts
 *
 * @param formData - FormData including: title, description?, options(JSON string), allowMultipleVotes, showResults, expiresAt?
 * @returns {ActionResult<{ id: string }>} Created poll id or typed error
 * @example
 * // Client form submit
 * const fd = new FormData()
 * fd.set('title', 'Favorite framework?')
 * fd.set('options', JSON.stringify([{ text: 'Next.js' }, { text: 'SvelteKit' }]))
 * const res = await createPoll(fd)
 * if (!res.ok) showToast(res.error.message)
 */
export async function createPoll(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = createPollSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') ?? undefined,
    // Expect options as JSON array from client to avoid arbitrary field counts in multipart
    options: (JSON.parse(String(formData.get('options') ?? '[]')) as { text: string }[]),
    allowMultipleVotes: formData.get('allowMultipleVotes') === 'on',
    showResults: formData.get('showResults') !== 'off',
    expiresAt: ((): string | null | undefined => {
      const v = formData.get('expiresAt')
      if (!v) return undefined
      const s = String(v)
      // Empty string means no expiration; otherwise coerce to ISO for DB
      return s.length ? new Date(s).toISOString() : null
    })(),
  })

  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid poll data', parsed.error.flatten())

  // Auth/ownership check
  const { user } = await requireUser()
  if (!user) return err('UNAUTHORIZED', 'You must be signed in to create a poll')

  const result = await insertPoll(parsed.data, user.id)
  if ('ok' in result && result.ok === false) return result

  // Invalidate caches: list and detail routes
  revalidatePath('/polls')
  revalidatePath(`/polls/${result.poll.id}`)
  return { ok: true, data: { id: result.poll.id } }
}

/**
 * vote
 *
 * Submits a vote for a specific option with integrity guarantees.
 *
 * Validation rules (business + DB):
 * - Single vote per user for single-vote polls (trigger enforced)
 * - Poll must be active and not expired (RLS policy checks `is_active` and `expires_at`)
 * - Option must belong to the poll (CHECK constraint)
 * - Authenticated users only (RLS ensures `auth.role() = 'authenticated'` and `auth.uid()` matches voter_id)
 *
 * Security considerations:
 * - No client-side trust: identifiers are validated and the database enforces referential integrity.
 * - Prevents manipulation by requiring authenticated identity and RLS-backed inserts.
 * - To support anonymous voting, create a separate flow/table with strong anti-abuse (rate limits, device fingerprints) and
 *   keep it clearly separated from authenticated votes.
 *
 * Concurrency:
 * - Concurrent submissions may race; DB trigger/policies decide the winner. The loser receives a deterministic error which the UI should surface.
 * - Revalidation is issued after a successful insert to refresh counts.
 *
 * Persistence & rollback:
 * - A single insert; on error, no partial state is persisted. Caller can retry based on error code.
 *
 * Real-time updates:
 * - For live counts without reload, subscribe to Supabase Realtime on `public.votes` filtered by `poll_id` on the client.
 *   On events, refetch the aggregate or optimistically adjust counts.
 *
 * @param formData - FormData including: pollId (uuid), optionId (uuid)
 * @returns {ActionResult<{ success: true }>} success or typed error
 * @example
 * const fd = new FormData()
 * fd.set('pollId', pollId)
 * fd.set('optionId', optionId)
 * const res = await vote(fd)
 * if (!res.ok) showToast(res.error.message)
 */
export async function vote(formData: FormData): Promise<ActionResult<{ success: true }>> {
  const parsed = voteSchema.safeParse({
    pollId: formData.get('pollId'),
    optionId: formData.get('optionId'),
  })
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid vote payload', parsed.error.flatten())

  const { user } = await requireUser()
  if (!user) return err('UNAUTHORIZED', 'You must be signed in to vote')

  const result = await insertVote(parsed.data, user.id)
  if ('ok' in result && result.ok === false) return result

  revalidatePath(`/polls/${parsed.data.pollId}`)
  return { ok: true, data: { success: true } }
}

/**
 * getPollById
 *
 * Reads a poll and its options for rendering. This is a simple "query" action kept
 * in the same module for cohesion. Consider moving reads to RSC where possible.
 *
 * Error cases handled:
 * - Not found (returns NOT_FOUND)
 * - PostgREST errors bubbled in `details` for observability
 *
 * @param pollId - Poll UUID
 * @returns {ActionResult<Poll>} typed poll or NOT_FOUND error
 */
export async function getPollById(pollId: string): Promise<ActionResult<Poll>> {
  const supabase = getSupabaseServerClient()
  const { data: p, error } = await supabase
    .from('polls')
    .select('id, title, description, created_by, created_at, expires_at, is_active, allow_multiple_votes, show_results, poll_options(id, text)')
    .eq('id', pollId)
    .single()

  if (error || !p) return err('NOT_FOUND', 'Poll not found', error)

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

  return { ok: true, data: poll }
}

/**
 * Results aggregation & audit trail (documentation-only)
 *
 * Aggregation
 * - The view `public.poll_results` groups votes per option. For detail pages, you can fetch joined rows
 *   or compute totals in the client.
 * - For large polls, prefer server aggregation with pagination.
 *
 * Real-time updates
 * - Use Supabase Realtime to listen to `INSERT` on `public.votes` filtered by `poll_id`.
 *   On event, either refetch from `poll_results` or increment local counts.
 *
 * Audit trail
 * - The `votes` table stores (poll_id, option_id, voter_id, created_at) providing a minimal trail.
 * - For stronger auditing, add an immutable `votes_log` table via trigger capturing request metadata (ip hash, user agent).
 * - Avoid storing PII unless required; consider hashing.
 *
 * Security & integrity
 * - RLS ensures only authenticated users can vote and only on active, unexpired polls.
 * - CHECK constraint prevents mismatched option/poll.
 * - Trigger enforces single-vote in single-vote mode; consider unique composite indexes for stricter guarantees if rules evolve.
 */