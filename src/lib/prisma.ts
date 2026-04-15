import { PrismaClient } from '@prisma/client'

// Instantiate a single instance PrismaClient and save it on the global object.
// This prevents multiple instances from being created in development due to hot reloading.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
