'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Progress } from '@/app/components/ui/progress'
import { Download, BarChart3, Users } from 'lucide-react'
import type { PollResult } from '@/types'

interface ViewResultsProps {
  pollId: string
  pollTitle: string
  totalVotes: number
  getResults: (pollId: string) => Promise<PollResult[]>
}

export function ViewResults({ pollId, pollTitle, totalVotes, getResults }: ViewResultsProps) {
  const [results, setResults] = useState<PollResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const data = await getResults(pollId)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [pollId, getResults])

  const exportToCSV = () => {
    if (results.length === 0) return

    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...results.map(result => [
        result.option_text,
        result.votes.toString(),
        `${result.percentage.toFixed(1)}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pollTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading results...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error loading results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No results yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This poll hasn&apos;t received any votes yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Poll Results
          </CardTitle>
          <Button onClick={exportToCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {totalVotes} total votes
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result) => (
          <div key={result.option_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.option_text}</span>
              <span className="text-sm text-gray-600">
                {result.votes} votes ({result.percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={result.percentage} 
              className="h-2"
            />
          </div>
        ))}
        
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total votes:</span>
              <span className="ml-2 font-medium">{totalVotes}</span>
            </div>
            <div>
              <span className="text-gray-600">Options:</span>
              <span className="ml-2 font-medium">{results.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 