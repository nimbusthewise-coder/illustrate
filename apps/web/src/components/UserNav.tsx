"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export function UserNav() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/signin"
          className="px-3 py-1.5 text-sm text-foreground hover:text-primary"
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted"
      >
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
          {session.user.name?.[0] || session.user.email?.[0] || "U"}
        </div>
        <span className="text-sm text-foreground">{session.user.name || session.user.email}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-20">
            <div className="p-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut({ callbackUrl: "/" })
                }}
                className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
