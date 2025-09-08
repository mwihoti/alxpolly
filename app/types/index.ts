export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export interface PollOption {
  id: string
  text: string
  votes?: number
}

export interface Poll {
  id: string
  title: string
  description?: string
  options: PollOption[]
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
  allowMultipleVotes?: boolean
  showResults?: boolean
}

export interface Vote {
  id: string
  pollId: string
  optionId: string
  userId: string
  createdAt: Date
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } } 