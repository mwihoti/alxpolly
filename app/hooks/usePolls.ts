'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { PollWithOptions, CreatePollData, PollResult } from '@/types'

export function usePolls() {
  const [polls, setPolls] = useState<PollWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          options:poll_options(*),
          total_votes:votes(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const pollsWithOptions = data?.map(poll => ({
        ...poll,
        options: poll.options || [],
        total_votes: poll.total_votes?.[0]?.count || 0
      })) || []

      setPolls(pollsWithOptions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls')
    } finally {
      setLoading(false)
    }
  }

  const createPoll = async (pollData: CreatePollData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: pollData.title,
          description: pollData.description,
          created_by: user.id,
          allow_multiple_votes: pollData.allow_multiple_votes,
          ends_at: pollData.ends_at,
        })
        .select()
        .single()

      if (pollError) throw pollError

      // Create poll options
      const options = pollData.options.map((text, index) => ({
        poll_id: poll.id,
        text,
        order: index,
      }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(options)

      if (optionsError) throw optionsError

      await fetchPolls()
      return { success: true, pollId: poll.id }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create poll' }
    }
  }

  const vote = async (pollId: string, optionIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if user already voted
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)

      if (existingVotes && existingVotes.length > 0) {
        throw new Error('You have already voted on this poll')
      }

      // Create votes
      const votes = optionIds.map(optionId => ({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      }))

      const { error } = await supabase
        .from('votes')
        .insert(votes)

      if (error) throw error

      await fetchPolls()
      return { success: true }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote')
      return { success: false, error: err instanceof Error ? err.message : 'Failed to vote' }
    }
  }

  const getPollResults = async (pollId: string): Promise<PollResult[]> => {
    try {
      const { data, error } = await supabase
        .from('poll_results')
        .select('*')
        .eq('poll_id', pollId)
        .order('votes', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
      return []
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  return {
    polls,
    loading,
    error,
    fetchPolls,
    createPoll,
    vote,
    getPollResults,
  }
} 