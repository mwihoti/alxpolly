'use client'

import { usePolls } from '@/app/hooks/usePolls'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Plus, Users, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function PollsPage() {
  const { polls, loading, error } = usePolls()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error loading polls</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Polls</h1>
          <p className="text-gray-600 mt-2">Discover and participate in polls created by the community</p>
        </div>
        <Link href="/polls/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-600 mb-6">Be the first to create a poll and start gathering opinions!</p>
          <Link href="/polls/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create your first poll
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
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
                    <Button variant="outline" className="w-full">
                      View Poll
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 