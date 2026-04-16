import type { Metadata, Viewport } from 'next'
import './globals.css'
import LayoutClientWrapper from '../components/LayoutClientWrapper'
import { createClient } from '../lib/supabase/sb-server'
import { prisma } from '../lib/db'

export const metadata: Metadata = {
  title: 'CIR-A | Sistema de Regulação Assistida',
  description: 'Central Inteligente de Regulação Automatizada - SMSVR',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let dbUser = null
  if (user) {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
  }

  return (
    <html lang="pt-br">
      <body style={{ margin: 0, overflowX: 'hidden' }}>
        <LayoutClientWrapper user={dbUser}>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  )
}