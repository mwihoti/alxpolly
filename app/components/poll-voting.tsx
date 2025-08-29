'use client'

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useState } from "react"

interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

interface PollVotingProps {
  poll: {
    id: string
    title: string
    description: string
    options: PollOption[]
    totalVotes: number
    status: string
    allowMultipleVotes: boolean
    showResults: boolean
  }
}

export default function PollVoting({ poll }: PollVotingProps) {
  const [votedOptions, setVotedOptions] = useState<Set<string>>(new Set())
  const [localResults, setLocalResults] = useState(poll.options)

  const handleVote = (optionId: string) => {
    if (poll.status !== 'active') return
    
    if (poll.allowMultipleVotes) {
      // Toggle vote for multiple choice
      const newVotedOptions = new Set(votedOptions)
      if (newVotedOptions.has(optionId)) {
        newVotedOptions.delete(optionId)
      } else {
        newVotedOptions.add(optionId)
      }
      setVotedOptions(newVotedOptions)
    } else {
      // Single choice - replace previous vote
      setVotedOptions(new Set([optionId]))
    }

    // Update local results immediately for better UX
    setLocalResults(prev => prev.map(option => {
      if (option.id === optionId) {
        const newVotes = votedOptions.has(optionId) ? option.votes - 1 : option.votes + 1
        const newPercentage = Math.round((newVotes / poll.totalVotes) * 100)
        return { ...option, votes: newVotes, percentage: newPercentage }
      }
      return option
    }))

    // TODO: Send vote to API
    console.log(`Voted for option: ${optionId}`)
  }

  const hasVoted = votedOptions.size > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vote Now</CardTitle>
            <CardDescription>
              Select your preferred option{poll.allowMultipleVotes ? 's' : ''}
            </CardDescription>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${
            poll.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {poll.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {localResults.map((option) => {
          const isVoted = votedOptions.has(option.id)
          const isDisabled = poll.status !== 'active' || (hasVoted && !poll.allowMultipleVotes && !isVoted)
          
          return (
            <div key={option.id} className="space-y-2">
              <Button
                variant={isVoted ? "default" : "outline"}
                className="w-full justify-start h-auto p-4 text-left"
                onClick={() => handleVote(option.id)}
                disabled={isDisabled}
              >
                <div className="flex-1">
                  <div className="font-medium">{option.text}</div>
                  {poll.showResults && (
                    <div className="text-sm text-gray-500 mt-1">
                      {option.votes} votes ({option.percentage}%)
                    </div>
                  )}
                </div>
                {poll.showResults && (
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                )}
              </Button>
            </div>
          )
        })}
        
        <div className="pt-4 text-center text-sm text-gray-500">
          Total votes: {poll.totalVotes}
          {hasVoted && (
            <div className="mt-2 text-green-600">
              ✓ You have voted!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 