'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/auth/auth-context'
import { usePolls } from '@/app/hooks/usePolls'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Plus, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { CreatePollData } from '@/types'

export default function CreatePollPage() {
  const { user } = useAuth()
  const { createPoll } = usePolls()
  const router = useRouter()
  
  const [formData, setFormData] = useState<CreatePollData>({
    title: '',
    description: '',
    options: ['', ''],
    allow_multiple_votes: false,
    ends_at: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need to be signed in to create a poll.
            </p>
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.title.trim() === '') {
      setError('Poll title is required')
      return
    }
    
    if (formData.options.filter(opt => opt.trim() !== '').length < 2) {
      setError('At least 2 options are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPoll({
        ...formData,
        options: formData.options.filter(opt => opt.trim() !== ''),
      })
      
      if (result.success) {
        router.push(`/polls/${result.pollId}`)
      } else {
        setError(result.error || 'Failed to create poll')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }))
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return
    
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt),
    }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/polls" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to polls
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a new poll</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What would you like to ask?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide more context about your poll..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Poll options *</Label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add option
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiple-votes"
                  checked={formData.allow_multiple_votes}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, allow_multiple_votes: checked as boolean }))
                  }
                />
                <Label htmlFor="multiple-votes">
                  Allow multiple votes per user
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends-at">End date (optional)</Label>
                <Input
                  id="ends-at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Link href="/polls" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 