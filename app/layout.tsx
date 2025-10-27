import type { Metadata } from "next"
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    template: '%s | Maritime HR',
    default: 'Maritime HR - Système de Gestion RH Maritime'
  },
  description: "Système de gestion des ressources humaines pour les organisations maritimes en Tunisie. Gestion complète du personnel, grades, formations et affectations.",
  keywords: ["Maritime", "RH", "Tunisie", "Personnel", "Gestion", "Employés"],
  authors: [{ name: "Saber Younes" }],
  creator: "Saber Younes",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_TN',
    url: '/',
    title: 'Maritime HR - Système de Gestion RH Maritime',
    description: 'Système de gestion des ressources humaines pour les organisations maritimes en Tunisie.',
    siteName: 'Maritime HR',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

type Props = {
  children: ReactNode
}

// Root layout - wrapper minimal selon la documentation next-intl
export default function RootLayout({ children }: Props) {
  return children
}