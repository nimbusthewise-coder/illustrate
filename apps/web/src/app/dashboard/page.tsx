import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { DiagramLibrary } from "@/components/DiagramLibrary"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Diagrams
            </h1>
            <p className="text-muted-foreground">
              Signed in as {session.user.email}
              {session.user.username && ` (@${session.user.username})`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <a
              href="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              New Diagram
            </a>
            
            <a
              href="/settings/profile"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
            >
              Settings
            </a>
            
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/auth/signin" })
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:opacity-90"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Diagram Library */}
        <DiagramLibrary userId={session.user.id!} />
      </div>
    </div>
  )
}
