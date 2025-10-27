import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeSearchLoading() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="w-full max-w-5xl mx-auto">
          {/* Logo Skeleton */}
          <div className="flex flex-col items-center mb-12 mt-8">
            <Skeleton className="h-[120px] w-[120px] rounded-lg mb-6" />
            <Skeleton className="h-9 w-64 mb-2" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-14 w-full rounded-full" />
          </div>

          {/* Content Skeleton */}
          <div className="text-center py-16">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-7 w-80 mx-auto mb-2" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
