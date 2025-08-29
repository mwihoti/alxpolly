import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CreatePollPage() {
  // This would be client-side state in a real app
  const [options, setOptions] = useState(['', ''])

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/polls">
              <Button variant="outline" size="sm">← Back to Polls</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
              <p className="text-gray-600 mt-2">Create a poll to gather opinions from your community</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Fill in the information below to create your poll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input 
                id="title" 
                placeholder="Enter a clear, descriptive title for your poll"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide additional context or instructions for voters"
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Poll Options *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addOption}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500">
                Minimum 2 options required. Add up to 10 options.
              </p>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="expiresAt" 
                  type="date"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">
                Leave empty if you don't want the poll to expire
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Poll Settings</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowMultipleVotes"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="allowMultipleVotes">
                    Allow voters to select multiple options
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showResults"
                    className="rounded border-gray-300"
                    defaultChecked
                  />
                  <Label htmlFor="showResults">
                    Show results to voters after they vote
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymousVoting"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="anonymousVoting">
                    Allow anonymous voting
                  </Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Create Poll
              </Button>
              <Link href="/polls" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 