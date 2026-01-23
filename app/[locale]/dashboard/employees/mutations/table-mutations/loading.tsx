export default function MutationsTableLoading() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              {/* Title skeleton */}
              <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="flex items-center gap-4 mt-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41]">
          {/* Filter controls skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full sm:max-w-4xl flex gap-3">
              <div className="h-9 w-70 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-9 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Table skeleton */}
          <div className="overflow-hidden">
            {/* Header */}
            <div className="bg-[#D7E7EC] dark:bg-[#17272D] h-14 rounded-t animate-pulse" />

            {/* Rows */}
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="flex items-center h-14 border-b border-gray-200 dark:border-[#393A41] gap-4 px-4"
              >
                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex items-center justify-end gap-4 px-2 py-4 mt-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
