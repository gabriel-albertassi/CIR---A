import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Função para limpar a URL (remove aspas e espaços acidentais)
const cleanUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: cleanUrl,
      },
    },
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
