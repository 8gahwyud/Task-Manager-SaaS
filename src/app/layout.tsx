import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'TaskFlow — Управление задачами',
  description: 'Современный task-менеджер для эффективной работы команды',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1c1c1f',
                color: '#e4e4e7',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#1c1c1f',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1c1c1f',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}

