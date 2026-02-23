"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Don't refetch session on window focus in development
      refetchOnWindowFocus={false}
      // Allow session to fail gracefully
      session={null}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
