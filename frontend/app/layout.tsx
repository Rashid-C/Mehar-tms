import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mehar Pardha — Tailor Management',
  description: 'Tailor shop billing and delivery management system — Deira, Dubai',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geist.className} min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
