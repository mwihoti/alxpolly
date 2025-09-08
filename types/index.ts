export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface Poll {
  id: string
  title: string
  description?: string
  created_by: string
  created_at: string
  is_active: boolean
  allow_multiple_votes: boolean
  ends_at?: string
}

export interface PollOption {
  id: string
  poll_id: string
  text: string
  order: number
  created_at: string
}

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
}

export interface PollWithOptions extends Poll {
  options: PollOption[]
  total_votes: number
}

export interface PollResult {
  option_id: string
  option_text: string
  votes: number
  percentage: number
}

export interface CreatePollData {
  title: string
  description?: string
  options: string[]
  allow_multiple_votes: boolean
  ends_at?: string
} 