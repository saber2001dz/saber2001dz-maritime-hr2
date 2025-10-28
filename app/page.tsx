import { redirect } from 'next/navigation'

// Page racine qui redirige toujours vers la locale arabe par défaut
export default function RootPage() {
  redirect('/ar')
}
