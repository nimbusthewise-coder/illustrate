import { auth } from "./auth"
import { randomBytes } from "crypto"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session.user
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex")
}
