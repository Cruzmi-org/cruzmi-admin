import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import { darkerGrotesque } from '@/lib/fonts'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Cruzmi Admin',
  description: 'Back-office interne Cruzmi, réservé aux administrateurs',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${darkerGrotesque.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
