'use client'

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Download, Share2, Users, TrendingUp, Clock } from "lucide-react"
import { useState } from "react"

interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

interface ViewResultsProps {
  poll: {
    id: string
    title: string
    options: PollOption[]
    totalVotes: number
    status: string
    createdAt: string
    expiresAt?: string
  }
}

export default function ViewResults({ poll }: ViewResultsProps) {
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes)
  const winningOption = sortedOptions[0]
  const totalVotes = poll.totalVotes

  const exportResults = () => {
    const csvContent = [
      'Option,Votes,Percentage',
      ...poll.options.map(option => `${option.text},${option.votes},${option.percentage}%`)
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poll-results-${poll.id}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleDetailedResults = () => {
    setShowDetailedResults(!showDetailedResults)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Poll Results</CardTitle>
        <CardDescription>
          Detailed analysis and statistics for this poll
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
            <div className="text-sm text-blue-600">Total Votes</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
            <div className="text-sm text-green-600">Options</div>
          </div>
        </div>

        {/* Winner Highlight */}
        {winningOption && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Current Winner</span>
            </div>
            <div className="text-lg font-medium text-yellow-800">{winningOption.text}</div>
            <div className="text-sm text-yellow-600">
              {winningOption.votes} votes ({winningOption.percentage}%)
            </div>
          </div>
        )}

        {/* Results Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Vote Distribution</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDetailedResults}
              className="text-blue-600 hover:text-blue-700"
            >
              {showDetailedResults ? 'Show less' : 'Show more'}
            </Button>
          </div>
          
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-gray-600">
                    {option.votes} votes ({option.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
                
                {showDetailedResults && (
                  <div className="text-xs text-gray-500 pl-2">
                    Rank #{index + 1} • {option.votes === 1 ? '1 vote' : `${option.votes} votes`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Button
            onClick={exportResults}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </div>

        {/* Poll Status Info */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Created: {poll.createdAt}</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${
              poll.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {poll.status}
            </div>
          </div>
          {poll.expiresAt && (
            <div className="text-xs text-gray-500 mt-1">
              Expires: {poll.expiresAt}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 