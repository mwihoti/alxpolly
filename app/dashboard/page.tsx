'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/auth/auth-context'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Plus, BarChart3, Users, Calendar, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { PollWithOptions } from '@/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [myPolls, setMyPolls] = useState<PollWithOptions[]>([])
  const [votedPolls, setVotedPolls] = useState<PollWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch user's polls
        const { data: pollsData, error: pollsError } = await supabase
          .from('polls')
          .select(`
            *,
            options:poll_options(*)
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })

        if (pollsError) throw pollsError

        // Fetch total votes for each poll
        const pollsWithVotes = await Promise.all(
          (pollsData || []).map(async (poll) => {
            const { count: totalVotes } = await supabase
              .from('votes')
              .select('*', { count: 'exact', head: true })
              .eq('poll_id', poll.id)

            return {
              ...poll,
              options: poll.options || [],
              total_votes: totalVotes || 0,
            }
          })
        )

        setMyPolls(pollsWithVotes)

        // Fetch polls user has voted on
        const { data: votesData, error: votesError } = await supabase
          .from('votes')
          .select('poll_id')
          .eq('user_id', user.id)

        if (votesError) throw votesError

        if (votesData && votesData.length > 0) {
          const pollIds = [...new Set(votesData.map(v => v.poll_id))]
          
          const { data: votedPollsData, error: votedPollsError } = await supabase
            .from('polls')
            .select(`
              *,
              options:poll_options(*)
            `)
            .in('id', pollIds)
            .order('created_at', { ascending: false })

          if (votedPollsError) throw votedPollsError

          const votedPollsWithVotes = await Promise.all(
            (votedPollsData || []).map(async (poll) => {
              const { count: totalVotes } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id)

              return {
                ...poll,
                options: poll.options || [],
                total_votes: totalVotes || 0,
              }
            })
          )

          setVotedPolls(votedPollsWithVotes)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const deletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    try {
      // Delete votes first
      await supabase
        .from('votes')
        .delete()
        .eq('poll_id', pollId)

      // Delete poll options
      await supabase
        .from('poll_options')
        .delete()
        .eq('poll_id', pollId)

      // Delete poll
      await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)

      // Refresh data
      setMyPolls(prev => prev.filter(poll => poll.id !== pollId))
    } catch (err) {
      console.error('Failed to delete poll:', err)
      alert('Failed to delete poll. Please try again.')
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need to be signed in to view your dashboard.
            </p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading dashboard</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your polls and view your voting history</p>
        </div>
        <Link href="/polls/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900">{myPolls.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myPolls.reduce((sum, poll) => sum + poll.total_votes, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Polls Voted On</p>
                <p className="text-2xl font-bold text-gray-900">{votedPolls.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Polls */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Polls</h2>
        {myPolls.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
              <p className="text-gray-600 mb-4">Create your first poll to start gathering opinions!</p>
              <Link href="/polls/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first poll
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPolls.map((poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    <Link 
                      href={`/polls/${poll.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {poll.title}
                    </Link>
                  </CardTitle>
                  {poll.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {poll.total_votes} votes
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(poll.created_at)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {poll.options.length} options
                      {poll.allow_multiple_votes && ' • Multiple votes allowed'}
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/polls/${poll.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePoll(poll.id)}
                        className="px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Voted Polls */}
      {votedPolls.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Polls I&apos;ve Voted On</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {votedPolls.map((poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    <Link 
                      href={`/polls/${poll.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {poll.title}
                    </Link>
                  </CardTitle>
                  {poll.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {poll.total_votes} votes
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(poll.created_at)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {poll.options.length} options
                      {poll.allow_multiple_votes && ' • Multiple votes allowed'}
                    </div>

                    <Link href={`/polls/${poll.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 