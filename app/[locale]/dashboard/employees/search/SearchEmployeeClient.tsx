"use client"

import { useState, useEffect } from "react"
import { X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useDebounce } from "@/hooks/useDebounce"
import { processEmployeeData, EMPLOYEE_SELECT_QUERY } from "@/utils/employee.utils"
import { DisplayEmployee, RawEmployeeData } from "@/types/employeeTable.types"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"

export function SearchEmployeeClient() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]

  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<DisplayEmployee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const searchEmployees = async () => {
      if (!debouncedSearchQuery.trim()) {
        setResults([])
        setHasSearched(false)
        return
      }

      setIsSearching(true)
      setHasSearched(true)

      try {
        const supabase = createClient()
        const searchTerm = `%${debouncedSearchQuery}%`

        const { data, error } = await supabase
          .from("employees")
          .select(EMPLOYEE_SELECT_QUERY)
          .or(
            `prenom.ilike.${searchTerm},nom.ilike.${searchTerm},matricule.ilike.${searchTerm},unite_actuelle.ilike.${searchTerm},affectation_actuel.ilike.${searchTerm}`
          )
          .limit(50)

        if (error) {
          console.error("Search error:", error)
          setResults([])
        } else if (data) {
          const processedData = (data as RawEmployeeData[]).map(processEmployeeData)
          setResults(processedData)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    searchEmployees()
  }, [debouncedSearchQuery])

  const handleEmployeeClick = (employeeId: string) => {
    router.push(`/${locale}/dashboard/employees/details/${employeeId}`)
  }

  const handleReset = () => {
    setSearchQuery("")
    setResults([])
    setHasSearched(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-extrabold text-center text-[#076784] my-12 font-jazeera-bold">
        بــحــث عـن مـوظــف
      </h1>

      {/* Search Bar - Sans icône loupe, avec bouton X à droite */}
      <div className="mb-8">
        <div className="relative">
          <Input
            type="text"
            placeholder="ابـحـث عــن مــوظــف بالاســم، الــرقــم، أو الــوحــدة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pr-4 pl-12 text-start font-noto-naskh-arabic text-base rounded-lg border bg-white dark:bg-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#076784] transition-shadow placeholder:text-muted-foreground/70 dark:placeholder:text-muted-foreground/40"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="absolute left-2 top-1/2 -translate-y-1/2 hover:bg-muted"
              title="إعادة تعيين البحث"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="text-center py-12 text-sm text-muted-foreground font-noto-naskh-arabic">
          جــاري الـبـحــث...
        </div>
      )}


      {/* Results Count */}
      {hasSearched && !isSearching && results.length > 0 && (
        <div className="mb-3 text-xs text-muted-foreground font-noto-naskh-arabic text-start">
          {results.length === 1
            ? `تـم الـعـثـور عـلـى ${results.length} مــوظــف`
            : `تـم الـعـثـور عـلـى ${results.length} مــوظفيــن`}
        </div>
      )}

      {/* No Results */}
      {hasSearched && !isSearching && results.length === 0 && debouncedSearchQuery.trim() && (
        <div className="text-center py-20">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-noto-naskh-arabic">
            لـم يـتم الـعـثـور عـلـى نـتـائـج
          </p>
        </div>
      )}

      {/* Results Grid - Aligné à droite */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-2" dir="rtl">
          {results.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-md transition-all cursor-pointer border hover:border-primary/30 group"
              onClick={() => handleEmployeeClick(employee.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Employee Photo - À droite en RTL */}
                  <div className="flex-shrink-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted ring-2 ring-background group-hover:ring-primary/20 transition-all">
                      <Image
                        src={employee.displayImage}
                        alt={`${employee.prenom} ${employee.nom}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Employee Info - À droite en RTL */}
                  <div className="flex-1 min-w-0 text-start">
                    <h3 className="text-base font-semibold text-foreground truncate font-jazeera-bold group-hover:text-primary transition-colors">
                      {employee.prenom} {employee.nom}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-noto-naskh-arabic">{employee.latestGrade}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="font-noto-naskh-arabic truncate">
                        {employee.latestUnite || "غير محدد"}
                      </span>
                      {employee.matricule && (
                        <>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="font-geist-sans">{employee.matricule}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
