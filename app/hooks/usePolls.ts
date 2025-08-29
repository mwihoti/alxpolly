import { useState, useEffect } from 'react'
import { Poll, PollOption } from '@/types'

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all polls
  const fetchPolls = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/polls')
      // const data = await response.json()
      
      // Mock data for now
      const mockPolls: Poll[] = [
        {
          id: "1",
          title: "What's for lunch today?",
          description: "Help decide what we should order for the team lunch",
          options: [
            { id: "1", text: "Pizza", votes: 8 },
            { id: "2", text: "Sushi", votes: 6 },
            { id: "3", text: "Burger & Fries", votes: 5 },
            { id: "4", text: "Salad Bowl", votes: 5 }
          ],
          createdBy: "John Doe",
          createdAt: new Date("2024-01-18"),
          expiresAt: new Date("2024-01-20"),
          isActive: true
        },
        {
          id: "2",
          title: "Team building activity preference",
          description: "Vote for your preferred team building activity this quarter",
          options: [
            { id: "1", text: "Escape Room", votes: 12 },
            { id: "2", text: "Cooking Class", votes: 8 },
            { id: "3", text: "Outdoor Adventure", votes: 6 },
            { id: "4", text: "Board Game Night", votes: 4 },
            { id: "5", text: "Art Workshop", votes: 3 }
          ],
          createdBy: "Jane Smith",
          createdAt: new Date("2024-01-17"),
          expiresAt: new Date("2024-01-25"),
          isActive: true
        }
      ]
      
      setPolls(mockPolls)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch polls')
    } finally {
      setLoading(false)
    }
  }

  // Create a new poll
  const createPoll = async (pollData: Omit<Poll, 'id' | 'createdAt' | 'isActive'>) => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/polls', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(pollData)
      // })
      // const newPoll = await response.json()
      
      // Mock creation
      const newPoll: Poll = {
        ...pollData,
        id: Date.now().toString(),
        createdAt: new Date(),
        isActive: true
      }
      
      setPolls(prev => [newPoll, ...prev])
      return newPoll
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Vote on a poll option
  const voteOnPoll = async (pollId: string, optionId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/polls/${pollId}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ optionId })
      // })
      
      // Mock voting
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          return {
            ...poll,
            options: poll.options.map(option => {
              if (option.id === optionId) {
                return { ...option, votes: option.votes + 1 }
              }
              return option
            })
          }
        }
        return poll
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get a single poll by ID
  const getPollById = (id: string) => {
    return polls.find(poll => poll.id === id)
  }

  // Delete a poll
  const deletePoll = async (pollId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/polls/${pollId}`, { method: 'DELETE' })
      
      // Mock deletion
      setPolls(prev => prev.filter(poll => poll.id !== pollId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete poll')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Load polls on mount
  useEffect(() => {
    fetchPolls()
  }, [])

  return {
    polls,
    loading,
    error,
    fetchPolls,
    createPoll,
    voteOnPoll,
    getPollById,
    deletePoll
  }
} 