import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

declare global {
  var prisma: PrismaClient | undefined
}

// Prisma v7 client with Neon adapter
function createPrismaClient(): PrismaClient {
  // Always provide a valid connection string, even during build
  // Use a dummy URL if DATABASE_URL is not set (build will work, runtime will fail if DB operations are attempted)
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy'
  
  // Use neon serverless driver for all PostgreSQL connections
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaNeon(pool as any)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter,
  })
}

// Singleton pattern for Prisma client
export const prisma = global.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
