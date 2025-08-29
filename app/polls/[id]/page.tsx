import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Calendar, Users } from "lucide-react"
import Link from "next/link"
import PollVoting from "../../components/poll-voting"
import SharePoll from "../../components/share-poll"
import ViewResults from "../../components/view-results"

interface PollPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params
  
  // Mock data - replace with actual data fetching later
  const poll = {
    id: id,
    title: "What's for lunch today?",
    description: "Help decide what we should order for the team lunch. We'll order the most popular choice.",
    options: [
      { id: "1", text: "Pizza", votes: 8, percentage: 33 },
      { id: "2", text: "Sushi", votes: 6, percentage: 25 },
      { id: "3", text: "Burger & Fries", votes: 5, percentage: 21 },
      { id: "4", text: "Salad Bowl", votes: 5, percentage: 21 }
    ],
    totalVotes: 24,
    status: "active",
    expiresAt: "2024-01-20",
    createdBy: "John Doe",
    createdAt: "2024-01-18",
    allowMultipleVotes: false,
    showResults: true
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/polls">
              <Button variant="outline" size="sm">← Back to Polls</Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
              <p className="text-gray-600 mt-2">{poll.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Poll Content */}
          <div className="lg:col-span-2">
            <PollVoting poll={poll} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Poll Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Poll Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>Created by {poll.createdBy}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Created {poll.createdAt}</span>
                </div>
                {poll.expiresAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Expires {poll.expiresAt}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Settings:</span>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>• Multiple votes: {poll.allowMultipleVotes ? 'Yes' : 'No'}</li>
                    <li>• Show results: {poll.showResults ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Share Poll Component */}
            <SharePoll pollId={poll.id} pollTitle={poll.title} />

            {/* View Results Component */}
            <ViewResults poll={poll} />
          </div>
        </div>
      </div>
    </div>
  )
} 