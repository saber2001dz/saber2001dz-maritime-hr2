"use client"
import * as React from "react"
import localFont from "next/font/local"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Locale } from "@/lib/types"
import { Toaster } from "sonner"
import { useLeaveStatusMonitor } from "@/hooks/use-leave-status-monitor"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { Notifications } from "@/components/notifications"
import { LanguageSelector } from "@/components/language-selector"
import { ChevronLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const notoNaskhArabic = localFont({
  src: "../../fonts/NotoNaskhArabic.woff2",
  variable: "--font-noto-naskh-arabic",
  display: "swap",
})

// Hardcoded translations for breadcrumbs
const BREADCRUMB_LABELS = {
  maritimeHR: "الموارد البشرية البحرية",
  dashboard: "لوحــة المعلـومــات",
  personnel: "المـوظـفــون",
  personnelList: "قائمة الموظفين",
  newAgent: "مـوظـف جـديـد",
  agentProfile: "مـلـف المـوظــف",
  searchEmployee: "بـحـث عـن مـوظــف",
  retirement: "بـاب التـقاعـد",
  mutations: "النـقـــل",
  mutationRequest: "طـلـب نـقـلــة",
  mutationsList: "مطـالــب النـقـــل",
  mutationDetails: "تفـاصيــل مطلــب النقلــة",
  marineUnits: "الوحـدات البحـريـة",
  unitsList: "قائمـة الـوحــدات",
  newUnit: "وحـدة جـديـدة",
  unitProfile: "مـلـف الـوحــدة",
  organizationalChart: "الهيكل التنظيمي",
}

// Function to generate page configuration with hardcoded translations
const getPageConfig = () => ({
  "/dashboard": {
    title: BREADCRUMB_LABELS.dashboard,
    breadcrumbs: [{ label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" }, { label: BREADCRUMB_LABELS.dashboard }],
  },
  // Pages Employés
  "/dashboard/employees": {
    title: BREADCRUMB_LABELS.personnel,
    breadcrumbs: [{ label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" }, { label: BREADCRUMB_LABELS.personnel }],
  },
  "/dashboard/employees/table": {
    title: BREADCRUMB_LABELS.personnelList,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.personnelList },
    ],
  },
  "/dashboard/employees/nouveau": {
    title: BREADCRUMB_LABELS.newAgent,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.newAgent },
    ],
  },
  "/dashboard/employees/search": {
    title: BREADCRUMB_LABELS.searchEmployee,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.searchEmployee },
    ],
  },
  "/dashboard/employees/retraite": {
    title: BREADCRUMB_LABELS.retirement,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.retirement },
    ],
  },
  "/dashboard/employees/mutations/demande/nouvelle-demande": {
    title: BREADCRUMB_LABELS.mutationRequest,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.mutations, href: "/dashboard/employees/mutations/" },
      { label: BREADCRUMB_LABELS.mutationRequest },
    ],
  },
  "/dashboard/employees/mutations/table-mutations": {
    title: BREADCRUMB_LABELS.mutationsList,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.mutations, href: "/dashboard/employees/mutations" },
      { label: BREADCRUMB_LABELS.mutationsList },
    ],
  },
  "/dashboard/employees/mutations/details-mutation": {
    title: BREADCRUMB_LABELS.mutationDetails,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
      { label: BREADCRUMB_LABELS.mutations, href: "/dashboard/employees/mutations" },
      { label: BREADCRUMB_LABELS.mutationsList, href: "/dashboard/employees/mutations/table-mutations" },
      { label: BREADCRUMB_LABELS.mutationDetails },
    ],
  },
  // Pages Unités Maritimes
  "/dashboard/unite": {
    title: BREADCRUMB_LABELS.marineUnits,
    breadcrumbs: [{ label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" }, { label: BREADCRUMB_LABELS.marineUnits }],
  },
  "/dashboard/unite/table": {
    title: BREADCRUMB_LABELS.unitsList,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.marineUnits, href: "/dashboard/unite" },
      { label: BREADCRUMB_LABELS.unitsList },
    ],
  },
  "/dashboard/unite/nouveau": {
    title: BREADCRUMB_LABELS.newUnit,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.marineUnits, href: "/dashboard/unite" },
      { label: BREADCRUMB_LABELS.newUnit },
    ],
  },
  "/dashboard/unite/organigramme": {
    title: BREADCRUMB_LABELS.organizationalChart,
    breadcrumbs: [
      { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
      { label: BREADCRUMB_LABELS.marineUnits, href: "/dashboard/unite" },
      { label: BREADCRUMB_LABELS.organizationalChart },
    ],
  },
})

// Fonction pour générer la configuration des pages dynamiques
const getDynamicPageConfig = (pathWithoutLocale: string) => {
  // Gestion de la route /dashboard/employees/details/{id}
  const employeeDetailMatch = pathWithoutLocale.match(/^\/dashboard\/employees\/details\/([^\/]+)$/)
  if (employeeDetailMatch) {
    return {
      title: BREADCRUMB_LABELS.agentProfile,
      breadcrumbs: [
        { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
        { label: BREADCRUMB_LABELS.personnel, href: "/dashboard/employees" },
        { label: BREADCRUMB_LABELS.personnelList, href: "/dashboard/employees/table" },
        { label: BREADCRUMB_LABELS.agentProfile },
      ],
    }
  }

  // Gestion de la route /dashboard/unite/details/{id}
  const uniteDetailMatch = pathWithoutLocale.match(/^\/dashboard\/unite\/details\/([^\/]+)$/)
  if (uniteDetailMatch) {
    return {
      title: BREADCRUMB_LABELS.unitProfile,
      breadcrumbs: [
        { label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" },
        { label: BREADCRUMB_LABELS.marineUnits, href: "/dashboard/unite" },
        { label: BREADCRUMB_LABELS.unitsList, href: "/dashboard/unite/table" },
        { label: BREADCRUMB_LABELS.unitProfile },
      ],
    }
  }

  // Configuration par défaut pour les autres pages
  return {
    title: "Page",
    breadcrumbs: [{ label: BREADCRUMB_LABELS.maritimeHR, href: "/dashboard" }, { label: "Page" }],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] as Locale
  const router = useRouter()

  useLeaveStatusMonitor()

  const handleSearchClick = () => {
    router.push(`/${locale}/dashboard/employees/search`)
  }

  // Extraire le chemin sans locale pour la configuration
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/dashboard'
  const PAGE_CONFIG = getPageConfig()
  const pageConfig = PAGE_CONFIG[pathWithoutLocale as keyof typeof PAGE_CONFIG] || getDynamicPageConfig(pathWithoutLocale)
  
  // Fonction pour ajouter la locale aux hrefs avec validation
  const addLocaleToHref = (href: string | undefined): string => {
    if (!href || href.trim() === '' || (!href.startsWith('/') && !href.startsWith('http'))) {
      return '#'
    }
    return `/${locale}${href}`
  }

  // RTL support
  const isRTL = locale === 'ar'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-13 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-sidebar border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className={`-ml-1 cursor-pointer ${isRTL ? "scale-x-[-1]" : ""}`} />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className={isRTL ? notoNaskhArabic.className : ""}>
              <BreadcrumbList dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "text-[15px]!" : ""}>
                {pageConfig.breadcrumbs.map((breadcrumb: { label: string; href?: string }, index: number) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <BreadcrumbSeparator className="hidden md:block">
                        {isRTL ? <ChevronLeft className="h-4 w-4" /> : undefined}
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {index === 0 && breadcrumb.href ? (
                        <BreadcrumbLink asChild>
                          <Link 
                            href={addLocaleToHref(breadcrumb.href)} 
                            className="text-[#076784] dark:text-[#7FD4D3] font-semibold"
                          >
                            {breadcrumb.label}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className={index === 0 ? "text-[#076784] dark:text-[#7FD4D3] font-semibold" : ""}>
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center justify-center px-4 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearchClick}
                  className="h-9 w-9 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={isRTL ? notoNaskhArabic.className : ""}>
                <p>{isRTL ? "بـحـث عـن مـوظـف" : "Rechercher un employé"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Notifications />
                </div>
              </TooltipTrigger>
              <TooltipContent className={isRTL ? notoNaskhArabic.className : ""}>
                <p>{isRTL ? "الإشـعـارات" : "Notifications"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <LanguageSelector />
                </div>
              </TooltipTrigger>
              <TooltipContent className={isRTL ? notoNaskhArabic.className : ""}>
                <p>{isRTL ? "تـغـيـيـر الـلـغـة" : "Changer la langue"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ModeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent className={isRTL ? notoNaskhArabic.className : ""}>
                <p>{isRTL ? "تـغـيـيـر الـمـظـهـر" : "Changer le thème"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <UserNav />
                </div>
              </TooltipTrigger >
              <TooltipContent className={isRTL ? notoNaskhArabic.className : ""}>
                <p>{isRTL ? "حـسـابـي" : "Mon compte"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden bg-background">{children}</div>
        <Toaster position="top-center" />
      </SidebarInset>
    </SidebarProvider>
  )
}
