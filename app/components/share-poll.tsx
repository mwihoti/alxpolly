'use client'

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Share2, Copy, Check, Twitter, Facebook, LinkedIn } from "lucide-react"
import { useState } from "react"

interface SharePollProps {
  pollId: string
  pollTitle: string
}

export default function SharePoll({ pollId, pollTitle }: SharePollProps) {
  const [copied, setCopied] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  
  const pollUrl = `${window.location.origin}/polls/${pollId}`
  const shareText = `Check out this poll: ${pollTitle}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareOnSocial = (platform: string) => {
    let shareUrl = ''
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pollUrl)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pollUrl)}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share Poll</CardTitle>
        <CardDescription>
          Share this poll with others to get more votes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy Link Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pollUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Media Sharing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Share on social media</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShareOptions}
              className="text-blue-600 hover:text-blue-700"
            >
              {showShareOptions ? 'Hide' : 'Show'} options
            </Button>
          </div>
          
          {showShareOptions && (
            <div className="flex gap-2">
              <Button
                onClick={() => shareOnSocial('twitter')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button
                onClick={() => shareOnSocial('facebook')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                onClick={() => shareOnSocial('linkedin')}
                variant="outline"
                size="sm"
                className="flex-1 flex items-center gap-2"
              >
                <LinkedIn className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
            </div>
          )}
        </div>

        {/* QR Code Section (placeholder for future enhancement) */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: You can also share the direct link with your team via email or messaging apps
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 