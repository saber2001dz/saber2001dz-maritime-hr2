"use client"
import * as React from "react"
import { Users, Anchor, Building2, ArrowLeftRight, FileText, LayoutDashboardIcon } from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { usePathname, useParams } from "next/navigation"
import { getDirection, getMainTitleFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"

// Navigation data will be created with translations
function useNavigationData() {
  const t = useTranslations("navigation")
  const pathname = usePathname()
  const locale = pathname.split("/")[1] as Locale

  return {
    navMain1: [
      {
        title: "لــوحــة المعلومــات",
        url: `/${locale}/dashboard`,
        icon: LayoutDashboardIcon,
        isClickable: true,
      },
    ],
    navMain2: [
      {
        title: t("personnel"),
        url: "#",
        icon: Users,
        items: [
          {
            title: "بــحــث عـن مـوظــف ",
            url: `/${locale}/dashboard/employees/search`,
          },
          {
            title: "مــوظـــف جــــديــــد",
            url: `/${locale}/dashboard/employees/nouveau`,
          },
          {
            title: "قـــائمــــة الأفـــــــراد",
            url: `/${locale}/dashboard/employees/table`,
          },
          {
            title: "بـــــاب التـقـــاعـــــــد",
            url: `/${locale}/dashboard/employees/retraite`,
          },
          {
            title: "متابعــة الـوضعيـــات",
            url: "#",
          },
        ],
      },
      {
        title: t("marineUnits"),
        url: "#",
        icon: Anchor,
        items: [
          {
            title: t("newUnit"),
            url: `/${locale}/dashboard/unite/nouveau`,
          },
          {
            title: t("unitsList"),
            url: `/${locale}/dashboard/unite/table`,
          },
          {
            title: "الهيكل التنظيمي",
            url: `/${locale}/dashboard/unite/organigramme`,
          },
        ],
      },
      {
        title: "بــــــــــاب الإدارات",
        url: "#",
        icon: Building2,
        items: [
          {
            title: "إدارة حــــــرس الســـواحــــــل",
            url: "#",
          },
          {
            title: "إقليم الحرس البحري بالشمــال",
            url: "#",
          },
          {
            title: "إقليم الحرس البحري بالسـاحل",
            url: "#",
          },
          {
            title: "إقليم الحرس البحري بالوسـط",
            url: "#",
          },
          {
            title: "إقليم الحرس البحري بالجنوب",
            url: "#",
          },
        ],
      },
      {
        title: "حــركــــة النـقـــــل",
        url: "#",
        icon: ArrowLeftRight,
        items: [
          {
            title: "طلبـــات النـقــل",
            url: `/${locale}/dashboard/employees/mutations/demande`,
          },
          {
            title: "قـائمــــة النـقــل",
            url: "#",
          },
        ],
      },
      {
        title: "بـــــــــاب التوثيـق",
        url: "#",
        icon: FileText,
        items: [
          {
            title: t("periodicHrReports"),
            url: "#",
          },
          {
            title: t("certificatesAndAttestations"),
            url: "#",
          },
          {
            title: t("hrStatistics"),
            url: "#",
          },
        ],
      },
    ],
  }
}

// Composant pour afficher le logo
function LogoHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const t = useTranslations("common")
  const params = useParams()
  const isRTL = params.locale === "ar"
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)

  return (
    <div
      className={`flex items-center transition-all duration-200 ease-in-out ${
        isCollapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
      }`}
    >
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
        <Image
          src="/images/logo.png"
          alt="Maritime HR Logo"
          width={32}
          height={32}
          className={`object-contain transition-all duration-200 ease-in-out rtl:scale-x-[-1] ${
            isCollapsed ? "w-7 h-7" : "size-8"
          }`}
          priority
        />
      </div>
      <div
        className={`grid flex-1 ltr:text-left rtl:text-right text-sm leading-tight transition-all duration-200 ease-in-out ${
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        }`}
      >
        <span
          className={`truncate -mb-1 ${
            isRTL ? "text-base" : "text-lg"
          } font-semibold text-sidebar-primary ${mainTitleFontClass}`}
        >
          {t("appTitle")}
        </span>
        <span
          className={`truncate  ${isRTL ? "text-sm" : "text-xs"} text-muted-foreground mt-1 ${
            isRTL ? "font-noto-naskh-arabic" : ""
          }`}
        >
          {t("appSubtitle")}
        </span>
      </div>
    </div>
  )
}

export const AppSidebar = React.memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigationData = useNavigationData()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] as Locale
  const direction = getDirection(locale)

  return (
    <Sidebar
      side={direction === "rtl" ? "right" : "left"}
      collapsible="icon"
      className="bg-sidebar border-sidebar-border ltr:left-0 rtl:right-0"
      {...props}
    >
      <SidebarHeader className="bg-sidebar">
        <LogoHeader />
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <div className="mt-4">
          <NavMain items={navigationData.navMain1} />
        </div>
        <NavMain items={navigationData.navMain2} />
      </SidebarContent>
      <SidebarFooter className="bg-sidebar"></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
})
