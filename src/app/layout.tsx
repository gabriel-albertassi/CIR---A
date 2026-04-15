import type { Metadata, Viewport } from 'next'
import './globals.css'
import LayoutClientWrapper from '@/components/LayoutClientWrapper'

export const metadata: Metadata = {
  title: 'CIR-A | Sistema de Regulação Assistida',
  description: 'Central Inteligente de Regulação Automatizada - SMSVR',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body style={{ margin: 0, overflowX: 'hidden' }}>
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  )
}