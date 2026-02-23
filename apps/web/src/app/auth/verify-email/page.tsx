"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const successParam = searchParams.get("success")
    if (successParam === "true") {
      setSuccess(true)
    }
  }, [searchParams])

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-success/15 text-success rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Email verified!</h1>
            <p className="text-muted-foreground mb-6">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-muted text-foreground rounded-full">
            <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verifying...</h1>
          <p className="text-muted-foreground">Please wait while we process your verification.</p>
        </div>
      </div>
    </div>
  )
}


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
