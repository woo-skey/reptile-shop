import type { Metadata } from 'next'
import { Playfair_Display, Noto_Serif_KR, IM_Fell_English } from 'next/font/google'
import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
})

const imFell = IM_Fell_English({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-im-fell',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '파충류가게',
  description: '파충류가게 단골들의 공간',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${playfair.variable} ${notoSerifKR.variable} ${imFell.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Suspense
            fallback={
              <header
                className="sticky top-0 z-50 border-b h-14"
                style={{ backgroundColor: 'rgba(26, 26, 15, 0.85)', borderColor: 'rgba(201, 162, 39, 0.2)' }}
              />
            }
          >
            <Header />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
