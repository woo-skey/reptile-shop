import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const cafe24Ssukssuk = localFont({
  src: './fonts/Cafe24SsukssukRegular.ttf',
  variable: '--font-cafe24',
  weight: '400',
  style: 'normal',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
const previewImageUrl = siteUrl ? `${siteUrl}/reptile_icon.jpg` : '/reptile_icon.jpg'

export const metadata: Metadata = {
  title: '파충류가게',
  description: '파충류가게 단골들의 공간',
  openGraph: {
    title: '파충류가게',
    description: '파충류가게 단골들의 공간',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: previewImageUrl,
        width: 512,
        height: 512,
        alt: '파충류가게',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '파충류가게',
    description: '파충류가게 단골들의 공간',
    images: [previewImageUrl],
  },
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
      className={`${cafe24Ssukssuk.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


