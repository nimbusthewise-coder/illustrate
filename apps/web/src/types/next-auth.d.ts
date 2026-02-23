import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    username?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username?: string | null
  }
}
