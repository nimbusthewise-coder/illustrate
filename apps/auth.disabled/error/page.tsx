"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "You do not have permission to sign in."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        return "Error in authentication process. Please try again."
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account. Please sign in with your original method."
      case "EmailSignin":
        return "Unable to send verification email. Please try again."
      case "CredentialsSignin":
        return "Invalid email or password."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-error/15 text-error rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-error mb-6">{getErrorMessage(error)}</p>
          <div className="space-x-4">
            <Link
              href="/auth/signin"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
