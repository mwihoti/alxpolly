'use client'

import { useState } from 'react'
import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { Label } from '@/app/components/ui/label'
import { Vote, CheckCircle } from 'lucide-react'
import { usePolls } from '@/app/hooks/usePolls'
import type { PollWithOptions } from '@/types'

interface PollVotingProps {
  poll: PollWithOptions
  hasVoted?: boolean
}

export function PollVoting({ poll, hasVoted = false }: PollVotingProps) {
  const { user } = useAuth()
  const { castVote } = usePolls()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to vote</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">You need to be signed in to vote on this poll.</p>
        </CardContent>
      </Card>
    )
  }

  if (hasVoted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            You&apos;ve already voted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Thanks for participating in this poll!</p>
        </CardContent>
      </Card>
    )
  }

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      setError('Please select at least one option')
      return
    }

    setIsVoting(true)
    setError(null)

    // Assuming single option voting for now
    const result = await castVote(poll.id, selectedOptions[0])
    
    if (result.success) {
      setSuccess(true)
      setSelectedOptions([])
    } else {
      setError(result.error || 'Failed to submit vote')
    }
    
    setIsVoting(false)
  }

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll.allow_multiple_votes) {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, optionId]
          : prev.filter(id => id !== optionId)
      )
    } else {
      setSelectedOptions(checked ? [optionId] : [])
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            Vote submitted successfully!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Your vote has been recorded. Thank you for participating!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast your vote</CardTitle>
        <p className="text-sm text-gray-600">
          {poll.allow_multiple_votes 
            ? 'You can select multiple options' 
            : 'Select one option'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.allow_multiple_votes ? (
          <div className="space-y-3">
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleOptionChange(option.id, checked as boolean)
                  }
                />
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup
            value={selectedOptions[0] || ''}
            onValueChange={(value) => setSelectedOptions([value])}
          >
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="text-sm font-medium">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={handleVote}
          disabled={isVoting || selectedOptions.length === 0}
          className="w-full"
        >
          {isVoting ? (
            'Submitting...'
          ) : (
            <>
              <Vote className="w-4 h-4 mr-2" />
              Submit Vote
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 