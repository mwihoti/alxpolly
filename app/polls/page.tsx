import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function PollsPage() {
  // Mock data - replace with actual data later
  const polls = [
    {
      id: "1",
      title: "What's for lunch today?",
      description: "Help decide what we should order for the team lunch",
      votes: 24,
      options: 4,
      status: "active",
      expiresAt: "2024-01-20",
      createdBy: "John Doe"
    },
    {
      id: "2",
      title: "Team building activity preference",
      description: "Vote for your preferred team building activity this quarter",
      votes: 18,
      options: 5,
      status: "active",
      expiresAt: "2024-01-25",
      createdBy: "Jane Smith"
    },
    {
      id: "3",
      title: "Office decoration theme",
      description: "Choose the theme for our office decoration this month",
      votes: 32,
      options: 3,
      status: "closed",
      expiresAt: "2024-01-15",
      createdBy: "Mike Johnson"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
              <p className="text-gray-600 mt-2">Discover and participate in polls from your community</p>
            </div>
            <Link href="/polls/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Poll
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search polls..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Polls Grid */}
        <div className="grid gap-6">
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{poll.title}</CardTitle>
                    <CardDescription className="text-base">{poll.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      poll.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {poll.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {poll.votes} votes
                    </span>
                    <span>{poll.options} options</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Expires: {poll.expiresAt}
                    </span>
                  </div>
                  <span className="text-gray-500">by {poll.createdBy}</span>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/polls/${poll.id}`} className="flex-1">
                    <Button className="w-full">View & Vote</Button>
                  </Link>
                  {poll.status === 'active' && (
                    <Button variant="outline">Share</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {polls.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or create the first poll!</p>
              <Link href="/polls/create">
                <Button>Create Your First Poll</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 