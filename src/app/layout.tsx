import type { Metadata } from 'next'
import { PostHogProvider } from '@/providers/PostHogProvider'
import './globals.css'

// Use system fonts in development for maximum speed
// Google Fonts will be loaded in production via CSS import in globals.css

export const metadata: Metadata = {
  title: 'Synapse - Personalized Professional Feed',
  description: 'AI-powered professional content curation for researchers and professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-system">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}