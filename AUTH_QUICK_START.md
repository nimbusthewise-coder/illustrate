# Authentication Quick Start Guide

## For Developers

This guide shows you how to use the authentication system in your components and pages.

## Getting the Current User

### In Server Components (App Router)

```tsx
import { auth } from '@/lib/auth'

export default async function MyPage() {
  const session = await auth()
  
  if (!session?.user) {
    // User is not authenticated
    return <div>Please sign in</div>
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      {session.user.username && <p>Username: @{session.user.username}</p>}
    </div>
  )
}
```

### In Client Components

```tsx
'use client'

import { useSession } from 'next-auth/react'

export default function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Not signed in</div>
  }
  
  return <div>Signed in as {session.user.email}</div>
}
```

## Protecting Routes

### Using Middleware (Recommended)

Add routes to `src/middleware.ts`:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/your-protected-route/:path*",
  ],
}
```

### Using Server Components

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  return <div>Protected content</div>
}
```

### Using Utility Function

```tsx
import { requireAuth } from '@/lib/auth-utils'

export default async function AdminPage() {
  const user = await requireAuth() // Throws if not authenticated
  
  return <div>Admin content for {user.email}</div>
}
```

## Protecting API Routes

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Protected API logic
  return NextResponse.json({ data: '...' })
}
```

## Sign Out

### Server Action

```tsx
import { signOut } from '@/lib/auth'

export default function MyPage() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/auth/signin' })
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  )
}
```

### Client Component

```tsx
'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
      Sign Out
    </button>
  )
}
```

## Sign In Programmatically

### Client Component

```tsx
'use client'

import { signIn } from 'next-auth/react'

export default function SignInButton() {
  return (
    <div>
      <button onClick={() => signIn('github')}>
        Sign in with GitHub
      </button>
      <button onClick={() => signIn('google')}>
        Sign in with Google
      </button>
    </div>
  )
}
```

## Database Queries with User

```typescript
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function getUserDocuments() {
  const user = await requireAuth()
  
  return await prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
}
```

## Checking User Permissions

```typescript
import { getCurrentUser } from '@/lib/auth-utils'

export async function canEditDocument(documentId: string) {
  const user = await getCurrentUser()
  
  if (!user) return false
  
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  })
  
  return document?.userId === user.id
}
```

## Environment Variables

Required for local development:

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and set:
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3021"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Optional: OAuth providers
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Optional: Email verification
RESEND_API_KEY="..."
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# Run migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Testing Locally

1. Start the database (PostgreSQL)
2. Run migrations: `npx prisma migrate dev`
3. Start dev server: `pnpm dev`
4. Visit `http://localhost:3021/auth/signup`
5. Create an account
6. Check console for verification email (if RESEND_API_KEY not set)
7. Sign in at `http://localhost:3021/auth/signin`

## Common Patterns

### Conditional Rendering Based on Auth

```tsx
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()
  
  return (
    <div>
      {session ? (
        <div>Welcome back, {session.user.name}!</div>
      ) : (
        <div>
          <a href="/auth/signin">Sign In</a>
          <a href="/auth/signup">Sign Up</a>
        </div>
      )}
    </div>
  )
}
```

### User Avatar/Profile

```tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'

export default async function UserProfile() {
  const session = await auth()
  
  if (!session?.user) return null
  
  return (
    <div>
      {session.user.image && (
        <Image 
          src={session.user.image} 
          alt={session.user.name || 'User'}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}
      <span>{session.user.name || session.user.email}</span>
    </div>
  )
}
```

### Loading States

```tsx
'use client'

import { useSession } from 'next-auth/react'

export default function UserGreeting() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>
  }
  
  if (status === 'unauthenticated') {
    return <a href="/auth/signin">Sign In</a>
  }
  
  return <div>Hello, {session.user.name}!</div>
}
```

## Troubleshooting

### "Unauthorized" Error
- Check if middleware is protecting the route
- Verify session token is valid
- Check DATABASE_URL connection

### Email Not Sending
- Verify RESEND_API_KEY is set
- Check EMAIL_FROM address is verified in Resend
- Check console for error messages

### OAuth Not Working
- Verify OAuth app created in GitHub/Google
- Check callback URLs match: `http://localhost:3021/api/auth/callback/github`
- Confirm CLIENT_ID and CLIENT_SECRET are correct

### Session Not Persisting
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your app URL
- Clear browser cookies and try again

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Implementation Summary](./F046_AUTH_IMPLEMENTATION_COMPLETE.md)
