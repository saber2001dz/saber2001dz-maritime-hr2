import { redirect } from 'next/navigation'

type Props = {
  params: { locale: string }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  // Redirection automatique vers le dashboard avec locale
  redirect(`/${locale}/dashboard`)
}