"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Verification token is missing")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(data.message)
          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            router.push("/auth/signin")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Verification failed")
        }
      } catch (error) {
        setStatus("error")
        setMessage("An error occurred during verification")
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-muted text-foreground rounded-full">
                <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-success/15 text-success rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Email verified!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Redirecting you to sign in...
              </p>
              <Link
                href="/auth/signin"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Sign In Now
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-error/15 text-error rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification failed</h1>
              <p className="text-error mb-6">{message}</p>
              <Link
                href="/auth/signup"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Try Again
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
