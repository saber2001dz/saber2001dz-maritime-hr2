import React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PageLoadingProps {
  text?: string
}

const PageLoading: React.FC<PageLoadingProps> = ({ 
  text = "Chargement..." 
}) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#26272A] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export { PageLoading }