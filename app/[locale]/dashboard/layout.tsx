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
import { useTranslations } from "next-intl"
import { ChevronLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const notoNaskhArabic = localFont({
  src: "../../fonts/NotoNaskhArabic.woff2",
  variable: "--font-noto-naskh-arabic",
  display: "swap",
})

// Function to generate page configuration with translations
const getPageConfig = (t: (key: string) => string) => ({
  "/dashboard": {
    title: t('breadcrumbs.dashboard'),
    breadcrumbs: [{ label: t('breadcrumbs.maritimeHR'), href: "/dashboard" }, { label: t('breadcrumbs.dashboard') }],
  },
  // Pages Employés
  "/dashboard/employees": {
    title: t('breadcrumbs.personnel'),
    breadcrumbs: [{ label: t('breadcrumbs.maritimeHR'), href: "/dashboard" }, { label: t('breadcrumbs.personnel') }],
  },
  "/dashboard/employees/table": {
    title: t('breadcrumbs.personnelList'),
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.personnel'), href: "/dashboard/employees" },
      { label: t('breadcrumbs.personnelList') },
    ],
  },
  "/dashboard/employees/nouveau": {
    title: t('breadcrumbs.newAgent'),
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.personnel'), href: "/dashboard/employees" },
      { label: t('breadcrumbs.newAgent') },
    ],
  },
  "/dashboard/employees/search": {
    title: "بــحــث عـن مـوظــف",
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.personnel'), href: "/dashboard/employees" },
      { label: "بــحــث عـن مـوظــف" },
    ],
  },
  // Pages Unités Maritimes
  "/dashboard/unite": {
    title: t('breadcrumbs.marineUnits'),
    breadcrumbs: [{ label: t('breadcrumbs.maritimeHR'), href: "/dashboard" }, { label: t('breadcrumbs.marineUnits') }],
  },
  "/dashboard/unite/table": {
    title: t('breadcrumbs.unitsList'),
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.marineUnits'), href: "/dashboard/unite" },
      { label: t('breadcrumbs.unitsList') },
    ],
  },
  "/dashboard/unite/nouveau": {
    title: t('breadcrumbs.newUnit'),
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.marineUnits'), href: "/dashboard/unite" },
      { label: t('breadcrumbs.newUnit') },
    ],
  },
  "/dashboard/unite/organigramme": {
    title: t('breadcrumbs.organizationalChart'),
    breadcrumbs: [
      { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
      { label: t('breadcrumbs.marineUnits'), href: "/dashboard/unite" },
      { label: t('breadcrumbs.organizationalChart') },
    ],
  },
})

// Fonction pour générer la configuration des pages dynamiques  
const getDynamicPageConfig = (pathWithoutLocale: string, t: (key: string) => string) => {
  // Gestion de la route /dashboard/employees/details/{id}
  const employeeDetailMatch = pathWithoutLocale.match(/^\/dashboard\/employees\/details\/([^\/]+)$/)
  if (employeeDetailMatch) {
    return {
      title: t('breadcrumbs.agentProfile'),
      breadcrumbs: [
        { label: t('breadcrumbs.maritimeHR'), href: "/dashboard" },
        { label: t('breadcrumbs.personnel'), href: "/dashboard/employees" },
        { label: t('breadcrumbs.personnelList'), href: "/dashboard/employees/table" },
        { label: t('breadcrumbs.agentProfile') },
      ],
    }
  }

  // Configuration par défaut pour les autres pages
  return {
    title: "Page",
    breadcrumbs: [{ label: t('breadcrumbs.maritimeHR'), href: "/dashboard" }, { label: "Page" }],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const locale = pathname.split('/')[1] as Locale
  const t = useTranslations()
  const router = useRouter()

  useLeaveStatusMonitor()

  const handleSearchClick = () => {
    router.push(`/${locale}/dashboard/employees/search`)
  }

  // Extraire le chemin sans locale pour la configuration
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/dashboard'
  const PAGE_CONFIG = getPageConfig(t)
  const pageConfig = PAGE_CONFIG[pathWithoutLocale as keyof typeof PAGE_CONFIG] || getDynamicPageConfig(pathWithoutLocale, t)
  
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
              </TooltipTrigger>
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
