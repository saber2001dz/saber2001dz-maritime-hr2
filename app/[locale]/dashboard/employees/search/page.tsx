import { SearchEmployeeClient } from "./SearchEmployeeClient"

export default async function EmployeeSearchPage() {
  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        <SearchEmployeeClient />
      </div>
    </div>
  )
}
