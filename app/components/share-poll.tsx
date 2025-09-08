'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Share2, Copy, Check, ExternalLink } from 'lucide-react'

interface SharePollProps {
  pollId: string
  pollTitle: string
}

export function SharePoll({ pollId, pollTitle }: SharePollProps) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const pollUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/polls/${pollId}`
    : `/polls/${pollId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          text: `Check out this poll: ${pollTitle}`,
          url: pollUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err)
        }
      }
    } else {
      setShowShare(true)
    }
  }

  const openPoll = () => {
    window.open(pollUrl, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="w-5 h-5 mr-2" />
          Share Poll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poll-url">Poll URL</Label>
          <div className="flex space-x-2">
            <Input
              id="poll-url"
              value={pollUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="min-w-[80px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={openPoll}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open
          </Button>
        </div>

        {showShare && !navigator.share && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Copy the URL above and share it with others, or use the native share button on your device.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 