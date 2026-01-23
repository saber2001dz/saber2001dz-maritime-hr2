"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  isClickable?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const params = useParams()
  const isRTL = params.locale === "ar"

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // Si l'item est directement cliquable (comme Dashboard)
          if (item.isClickable) {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  className={`
                    transition-all duration-200 ease-in-out
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground"}
                    [&>svg]:transition-colors [&>svg]:duration-200
                    hover:[&>svg]:text-sidebar-accent-foreground
                    ${isActive ? "[&>svg]:text-sidebar-accent-foreground" : "[&>svg]:text-sidebar-foreground"}
                  `}
                >
                  <Link href={item.url} prefetch={false}>
                    {item.icon && <item.icon />}
                    <span className={isRTL ? 'font-noto-naskh-arabic text-base' : ''}>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Si l'item a des sous-éléments (comportement collapsible)
          const hasActiveSubItem = item.items?.some((subItem) => pathname === subItem.url)
          const isItemActive = false // La catégorie ne doit plus être en surbrillance si un sous-élément est actif

          return (
            <Collapsible key={item.title} asChild defaultOpen={hasActiveSubItem} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`
                      cursor-pointer
                      transition-all duration-200 ease-in-out
                      hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                      ${isItemActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground"}
                      [&>svg]:transition-colors [&>svg]:duration-200
                      hover:[&>svg]:text-sidebar-accent-foreground
                      ${isItemActive ? "[&>svg]:text-sidebar-accent-foreground" : "[&>svg]:text-sidebar-foreground"}
                    `}
                  >
                    {item.icon && <item.icon />}
                    <span className={isRTL ? 'font-noto-naskh-arabic text-base' : ''}>{item.title}</span>
                    <ChevronRight className="ltr:ml-auto rtl:mr-auto rtl:rotate-180 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubActive}
                            className={`
                              transition-all duration-200 ease-in-out
                              hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                              ${
                                isSubActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground opacity-80"
                              }
                            `}
                          >
                            <Link href={subItem.url} prefetch={false}>
                              <span className={isRTL ? 'font-noto-naskh-arabic' : ''}>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
