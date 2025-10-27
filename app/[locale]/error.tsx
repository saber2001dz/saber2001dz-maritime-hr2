"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    console.error(error)
  }, [error])

  const handleBackToHome = () => {
    const locale = params.locale || "ar"
    router.push(`/${locale}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm py-12 px-10 max-w-xl w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Erreur interne du serveur !</h1>

        <p className="text-gray-600 mb-8 leading-relaxed text-sm font-light">
          Erreur serveur 500. Nous ne savons pas exactement ce qui s'est passé, mais nos serveurs indiquent qu'il y a un
          problème.
        </p>

        <div className="mb-8">
          <Image
            src="/images/error.png"
            alt="Server Error Illustration"
            width={400}
            height={300}
            className="mx-auto"
            priority
          />
        </div>

        <button
          onClick={handleBackToHome}
          className="bg-[#076784] hover:bg-[#247C95] text-white font-medium px-8 py-3 rounded-sm transition-colors duration-200 cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
