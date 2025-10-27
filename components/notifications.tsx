"use client"
import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import type { Locale } from "@/lib/types"

// Types pour les notifications
interface Notification {
  id: string
  title: string
  message: string
  time: string
  isRead: boolean
  type: "info" | "warning" | "success" | "error"
}

// Function to get mock notifications with translations
const getMockNotifications = (t: any): Notification[] => [
  {
    id: "1",
    title: t("notifications.newLeaveRequest"),
    message: t("notifications.leaveRequestMessage"),
    time: t("notifications.timeAgo.minutes"),
    isRead: false,
    type: "info",
  },
  {
    id: "2",
    title: t("notifications.mandatoryTraining"),
    message: t("notifications.trainingMessage"),
    time: t("notifications.timeAgo.hours"),
    isRead: false,
    type: "warning",
  },
  {
    id: "3",
    title: t("notifications.monthlyReport"),
    message: t("notifications.reportMessage"),
    time: t("notifications.timeAgo.day"),
    isRead: true,
    type: "success",
  },
  {
    id: "4",
    title: t("notifications.systemUpdate"),
    message: t("notifications.updateMessage"),
    time: t("notifications.timeAgo.days"),
    isRead: true,
    type: "info",
  },
  {
    id: "5",
    title: t("notifications.documentExpiry"),
    message: t("notifications.expiryMessage"),
    time: t("notifications.timeAgo.week"),
    isRead: false,
    type: "error",
  },
]

export function Notifications() {
  const t = useTranslations()
  const pathname = usePathname()
  const currentLocale = pathname.split("/")[1] as Locale
  const isRTL = currentLocale === "ar"
  
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  // Initialize notifications with translations
  React.useEffect(() => {
    setNotifications(getMockNotifications(t))
  }, [t])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer relative h-8 w-8 p-0 rounded-full">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center cursor-pointer"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align={isRTL ? "end" : "end"} sideOffset={10} forceMount dir={isRTL ? "rtl" : "ltr"}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto p-1 cursor-pointer" onClick={markAllAsRead}>
              {t("notifications.markAllAsRead")}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{t("notifications.noNotifications")}</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`flex-1 space-y-1 ${isRTL ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                      <p className={`text-sm font-medium ${!notification.isRead ? "text-primary" : "text-foreground"}`}>
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-center justify-center cursor-pointer">
                {t("notifications.viewAll")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
