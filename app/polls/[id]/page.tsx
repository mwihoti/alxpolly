'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/app/auth/auth-context'
import { usePolls } from '@/app/hooks/usePolls'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { ArrowLeft, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { PollVoting } from '@/app/components/poll-voting'
import { SharePoll } from '@/app/components/share-poll'
import { ViewResults } from '@/app/components/view-results'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { PollWithOptions } from '@/types'

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  const { user } = useAuth()
  const { vote, getPollResults } = usePolls()
  
  const [poll, setPoll] = useState<PollWithOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true)
        
        // Fetch poll with options
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select(`
            *,
            options:poll_options(*)
          `)
          .eq('id', pollId)
          .single()

        if (pollError) throw pollError

        // Fetch total votes
        const { count: totalVotes } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', pollId)

        const pollWithOptions: PollWithOptions = {
          ...pollData,
          options: pollData.options || [],
          total_votes: totalVotes || 0,
        }

        setPoll(pollWithOptions)

        // Check if user has voted
        if (user) {
          const { data: userVotes } = await supabase
            .from('votes')
            .select('option_id')
            .eq('poll_id', pollId)
            .eq('user_id', user.id)

          setHasVoted(Boolean(userVotes && userVotes.length > 0))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch poll')
      } finally {
        setLoading(false)
      }
    }

    if (pollId) {
      fetchPoll()
    }
  }, [pollId, user])

  const handleVote = async (pollId: string, optionIds: string[]) => {
    const result = await vote(pollId, optionIds)
    if (result.success) {
      setHasVoted(true)
      // Refresh poll data to show updated vote count
      window.location.reload()
    }
    return result
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? 'Error loading poll' : 'Poll not found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'The poll you are looking for does not exist.'}
          </p>
          <Link href="/polls">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to polls
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/polls" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to polls
        </Link>
      </div>

      {/* Poll Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          {poll.description && (
            <p className="text-gray-600">{poll.description}</p>
          )}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {poll.total_votes} votes
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created {formatDate(poll.created_at)}
            </div>
            {poll.ends_at && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Ends {formatDateTime(poll.ends_at)}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voting Section */}
          {!hasVoted && poll.is_active && (
            <PollVoting
              poll={poll}
              onVote={handleVote}
              hasVoted={hasVoted}
            />
          )}

          {/* Results Section */}
          {poll.total_votes > 0 && (
            <ViewResults
              pollId={poll.id}
              pollTitle={poll.title}
              totalVotes={poll.total_votes}
              getResults={getPollResults}
            />
          )}

          {/* Poll Options List */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div key={option.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{option.text}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Option {option.order + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share Poll */}
          <SharePoll pollId={poll.id} pollTitle={poll.title} />

          {/* Poll Info */}
          <Card>
            <CardHeader>
              <CardTitle>Poll Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  poll.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {poll.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Multiple votes:</span>
                <span>{poll.allow_multiple_votes ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total options:</span>
                <span>{poll.options.length}</span>
              </div>
              {poll.ends_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ends:</span>
                  <span>{formatDateTime(poll.ends_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 