
import { ReactNode } from 'react'
import localFont from "next/font/local"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getDirection, getFont } from '@/lib/direction'
import type { Locale } from '@/lib/types'

const geistSans = localFont({
  src: "../fonts/geist-sans.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
  preload: true,
})

const geistMono = localFont({
  src: "../fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap',
  preload: true,
})

const poppins = localFont({
  src: "../fonts/Poppins-Regular.woff2",
  variable: "--font-poppins",
  weight: "400",
  display: 'swap',
  preload: true,
})

const jazeeraBold = localFont({
  src: "../fonts/jazeeraBold.woff2",
  variable: "--font-jazeera-bold",
  weight: "700",
  display: 'swap',
  preload: true,
})

const notoNaskhArabic = localFont({
  src: "../fonts/NotoNaskhArabic.woff2",
  variable: "--font-noto-naskh-arabic",
  weight: "400",
  display: 'swap',
  preload: true,
})



type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const direction = getDirection(locale as Locale)
  const fontClass = getFont(locale as Locale)
  
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${jazeeraBold.variable} ${notoNaskhArabic.variable} ${fontClass} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}