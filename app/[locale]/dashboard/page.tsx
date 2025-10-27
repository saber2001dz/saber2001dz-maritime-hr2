// app/dashboard/page.tsx
"use client"

import { useDashboardData } from "@/hooks/dashboard/useDashboardData"
import { PageLoading } from "@/components/ui/page-loading"
import { DashboardContent } from "@/components/dashboard/DashboardContent"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"


const DashboardPage = () => {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  
  const { dashboardData, isLoading, error } = useDashboardData({ isRTL, t })

  if (isLoading) {
    return <PageLoading text="جــاري تـحـمـيــل البـيـــانــات" />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement du dashboard:</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <PageLoading text="جــاري تـحـمـيــل البـيـــانــات" />
  }

  return <DashboardContent data={dashboardData} />
}

export default DashboardPage
