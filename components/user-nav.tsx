"use client"
import * as React from "react"
import { BadgeCheck, CreditCard, LogOut } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

// Hook pour récupérer les données utilisateur depuis la base de données
function useUserData() {
  const [userData, setUserData] = React.useState<{
    name: string
    email: string
    avatar: string
  }>({
    name: "",
    email: "",
    avatar: "",
  })
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    if (isLoaded) return

    async function fetchUserData() {
      const supabase = createClient()

      try {
        // Récupérer l'utilisateur authentifié
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          setIsLoaded(true)
          return
        }

        // Récupérer les données de l'utilisateur depuis la table users
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("email, full_name, avatar_url, role")
          .eq("id", authUser.id)
          .single()

        const newUserData = {
          name:
            userError || !userData
              ? authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Utilisateur"
              : userData.full_name || authUser.email?.split("@")[0] || "Utilisateur",
          email: userError || !userData ? authUser.email || "" : userData.email || authUser.email || "",
          avatar:
            userError || !userData
              ? "https://ui-avatars.com/api/?name=User&background=075a84&color=fff"
              : userData.avatar_url ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(userData.full_name || "User") +
                  "&background=075a84&color=fff",
        }

        setUserData(newUserData)
        setIsLoaded(true)
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)
        setIsLoaded(true)
      }
    }

    fetchUserData()
  }, [isLoaded])

  return { userData, isLoaded }
}

export function UserNav() {
  const { userData, isLoaded } = useUserData()
  const router = useRouter()
  const pathname = usePathname()

  // Détecter la locale à partir du chemin
  const isRTL = pathname.startsWith("/ar")

  // Traductions hardcodées
  const translations = {
    profile: isRTL ? "الملف الشخصي" : "Profile",
    settings: isRTL ? "الإعــــــــــدادات" : "Settings",
    signOut: isRTL ? "تسجيل الخروج" : "Sign Out",
  }

  const handleSignOut = () => {
    // Simply navigate to the logout route - let the server handle everything
    window.location.href = "/fr/auth/logout"
  }

  if (!isLoaded || !userData.email) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 rounded-full cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback>{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-56 ${isRTL ? "text-start" : ""}`} align="end" sideOffset={10} forceMount>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className={`flex items-center gap-2 px-1 py-1.5 text-sm`}>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="rounded-lg">{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
              className={`grid flex-1 text-sm leading-tight ${
                isRTL ? "text-start font-noto-naskh-arabic" : "text-left"
              }`}
            >
              <span className="truncate font-medium">{userData.name}</span>
              <span className="truncate text-xs">{userData.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className={`cursor-pointer p-0 `} onClick={() => router.push("/dashboard/profile")}>
            <div className={`flex items-center w-full px-2 py-2.5 ${isRTL ? "justify-between" : ""}`}>
              <BadgeCheck className="h-4 w-4" />
              <span className={`flex-1 ${isRTL ? "text-start pr-2 font-noto-naskh-arabic" : "pl-2"}`}>
                {translations.profile}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className={`cursor-pointer p-0`} onClick={() => router.push("/dashboard/settings")}>
            <div className={`flex items-center w-full px-2 py-2.5 ${isRTL ? "justify-between" : ""}`}>
              <CreditCard className="h-4 w-4" />
              <span className={`flex-1 ${isRTL ? "text-start pr-2 font-noto-naskh-arabic" : "pl-2"}`}>
                {translations.settings}
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={`cursor-pointer p-0`} onClick={handleSignOut}>
          <div className={`flex items-center w-full px-2 py-1.5 ${isRTL ? "justify-between" : ""}`}>
            <LogOut className="h-4 w-4" />
            <span className={`flex-1 ${isRTL ? "text-start pr-2 font-noto-naskh-arabic" : "pl-2"}`}>
              {translations.signOut}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
