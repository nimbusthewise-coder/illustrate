"use client"

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-info/15 text-info rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-4">
            A sign in link has been sent to your email address.
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to complete your sign in.
          </p>
        </div>
      </div>
    </div>
  )
}
