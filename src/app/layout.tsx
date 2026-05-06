import type { Metadata, Viewport } from 'next'
import './globals.css'
import LayoutClientWrapper from '../components/LayoutClientWrapper'
import { createClient } from '../lib/supabase/sb-server'
import { prisma } from '../lib/db'

export const metadata: Metadata = {
  title: 'CIR-A | Sistema de Regulação Automatizada',
  description: 'Central Inteligente de Regulação Automatizada - SMSVR',
  icons: {
    icon: '/logo2.png',
    shortcut: '/logo2.png',
    apple: '/logo2.png',
  }
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
  let dbUser = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      })
    }
  } catch (error) {
    console.error("Layout Initialization Error:", error)
    // Se o banco ou supabase falhar, dbUser continua null, permitindo que a UI carregue
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