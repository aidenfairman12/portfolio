import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '[Your Name] — Portfolio',
  description: '[Your tagline — e.g. Software developer building data-driven web applications.]',
  openGraph: {
    title: '[Your Name] — Portfolio',
    description: '[Your tagline]',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '[Your Name] — Portfolio',
    description: '[Your tagline]',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
