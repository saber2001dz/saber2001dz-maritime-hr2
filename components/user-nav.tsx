"use client"
import * as React from "react"
import { BadgeCheck, CreditCard, LogOut, Sparkles } from "lucide-react"
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
import { useTranslations } from "next-intl"

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
  const t = useTranslations("userNav")
  
  // Détecter la locale à partir du chemin
  const isRTL = pathname.startsWith("/ar")

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
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
      <DropdownMenuContent 
        className="w-56" 
        align={isRTL ? "start" : "end"} 
        sideOffset={10} 
        forceMount
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className={`flex items-center gap-2 px-1 py-1.5 text-left text-sm ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <Avatar className="h-8 w-8 rounded-lg ">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="rounded-lg">{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={`grid flex-1 text-left text-sm leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="truncate font-medium">{userData.name}</span>
              <span className="truncate text-xs">{userData.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer p-0">
            <div className={`flex items-center w-full px-2 py-1.5 justify-start`}>
              {isRTL ? (
                <>
                  <span className="flex-1 text-right">{t("upgradeToPro")}</span>
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t("upgradeToPro")}</span>
                </>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer p-0" 
            onClick={() => router.push("/dashboard/profile")}
          >
            <div className={`flex items-center w-full px-2 py-1.5 justify-start`}>
              {isRTL ? (
                <>
                  <span className="flex-1 text-right">{t("profile")}</span>
                  <BadgeCheck className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t("profile")}</span>
                </>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer p-0" 
            onClick={() => router.push("/dashboard/settings")}
          >
            <div className={`flex items-center w-full px-2 py-1.5 justify-start`}>
              {isRTL ? (
                <>
                  <span className="flex-1 text-right">{t("settings")}</span>
                  <CreditCard className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t("settings")}</span>
                </>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer p-0" 
          onClick={handleSignOut}
        >
          <div className={`flex items-center w-full px-2 py-1.5 justify-start`}>
            {isRTL ? (
              <>
                <span className="flex-1 text-right">{t("signOut")}</span>
                <LogOut className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="flex-1">{t("signOut")}</span>
              </>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
