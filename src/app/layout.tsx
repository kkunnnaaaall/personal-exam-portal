// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DOOBAAA-DOOBIII Exam Portal',
  description: 'Secure personal online examination system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pink-50/50 text-pink-950 min-h-screen antialiased selection:bg-[#FFB6C1]/50`}>
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#831843', // deep pink-900 text for readability
              border: '2px solid #FFB6C1', // Light Pink border
              boxShadow: '0 10px 15px -3px rgba(255, 182, 193, 0.3)',
              fontWeight: '600',
              borderRadius: '1rem',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#FFB6C1',
                secondary: '#831843',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e', // red-500 for errors/warnings
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}