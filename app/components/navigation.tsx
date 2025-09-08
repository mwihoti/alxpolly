'use client'

import { Button } from "./ui/button"
import { BarChart3, LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/app/auth/auth-context"

export default function Navigation() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-foreground">PollMaster</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/polls" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse Polls
            </Link>
            <Link href="/polls/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Create Poll
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.user_metadata?.name || user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t bg-white/80 backdrop-blur">
          <div className="px-4 py-3 space-y-2">
            <Link href="/polls" className="block text-sm text-foreground">Browse Polls</Link>
            <Link href="/polls/create" className="block text-sm text-foreground">Create Poll</Link>
            <Link href="/dashboard" className="block text-sm text-foreground">Dashboard</Link>
            <div className="pt-2 border-t">
              {user ? (
                <Button className="w-full" variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login" className="flex-1">
                    <Button className="w-full" variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button className="w-full" size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 