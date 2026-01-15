"use client"

import React, { useState, useEffect, useMemo } from "react"
import { User, Briefcase, GraduationCap, AlertTriangle, Plane, ArrowLeft } from "lucide-react"
import Image from "next/image"
import TabPersonalInfo from "@/components/employeeDetails/tabs/TabPersonalInfo"
import TabProfessionalInfo from "@/components/employeeDetails/tabs/TabProfessionalInfo"
import TabFamilyInfo from "@/components/employeeDetails/tabs/TabFamilyInfo"
import TabTrainingInfo from "@/components/employeeDetails/tabs/TabTrainingInfo"
import TabDisciplineInfo from "@/components/employeeDetails/tabs/TabDisciplineInfo"
import TabLeavesInfo from "@/components/employeeDetails/tabs/TabLeavesInfo"
import { EmployeeCompleteData } from "@/types/details_employees"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useEmployeeStatusMonitor } from "@/hooks/use-leave-status-monitor"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useTranslations, useLocale } from "next-intl"
import { useParams } from "next/navigation"
import { getDirection, getFont, getTitleFont, getMainTitleFont, getCardSubtitleFont } from "@/lib/direction"
import { getGradeLabel } from "@/lib/selectOptions"
import type { Locale } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SimpleEmployeeProfileProps {
  initialData: EmployeeCompleteData
  employeeId: string
}

// Fonction utilitaire pour formater la date en DD-MM-YYYY
const formatDateDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "-"

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "-"

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")

  return `${day}-${month}-${year}`
}

const SimpleEmployeeProfile: React.FC<SimpleEmployeeProfileProps> = ({ initialData, employeeId }) => {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("personalInfo")
  const [employeeData, setEmployeeData] = useState(initialData)
  const [imageLoading, setImageLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Traductions et locale - approche simple comme SimpleUniteTable
  const t = useTranslations()
  const locale = useLocale() as "fr" | "ar"
  const params = useParams()
  const isRTL = params.locale === "ar"
  const direction = getDirection(locale)
  const fontClass = getFont(locale)
  const titleFontClass = getTitleFont(locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)

  // Hook pour surveiller le statut de cet employé spécifique
  const { checkStatus } = useEmployeeStatusMonitor(employeeId)

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fonction pour mettre à jour uniquement les données de l'employé
  const handleEmployeeUpdate = (updatedEmployee: any) => {
    setEmployeeData((prevData) => ({
      ...prevData,
      employee: updatedEmployee,
    }))
  }

  // Simple realtime setup
  useEffect(() => {
    console.log("Initialisation realtime employé...")

    const channel = supabase
      .channel(`employee_details_${employeeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Changement employé détecté:", payload)
          if (payload.new && (payload.new as any).id === employeeId) {
            refreshData()
          }
        }
      )
      // Monitor all employee-related tables
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_grades" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_contacts" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_formations" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_conges" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_sanctions" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_recompenses" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_banque" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshBankData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_absence" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_rendement" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_note_annuelle" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (
            (payload.new && (payload.new as any).employee_id === employeeId) ||
            (payload.old && (payload.old as any).employee_id === employeeId)
          ) {
            refreshData()
          }
        }
      )
      .subscribe((status: string) => {
        console.log("Statut realtime employé:", status)
      })

    const refreshData = async () => {
      try {
        // Récupération de l'employé
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .single()

        if (employeeError) throw employeeError

        // Récupération des données associées en parallèle
        const [
          { data: absences },
          { data: conges },
          { data: contacts },
          { data: enfants },
          { data: etat_civil },
          { data: fonctions },
          { data: formations },
          { data: grades },
          { data: parcours_scolaire },
          { data: photos },
          { data: recompenses },
          { data: rendements },
          { data: notes_annuelles },
          { data: sanctions },
          { data: urgent_contacts },
        ] = await Promise.all([
          supabase
            .from("employee_absence")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_debut", { ascending: false }),
          supabase
            .from("employee_conges")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_debut", { ascending: false }),
          supabase.from("employee_contacts").select("*").eq("employee_id", employeeId),
          supabase
            .from("employee_enfants")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_naissance", { ascending: false }),
          supabase.from("employee_etat_civil").select("*").eq("employee_id", employeeId),
          supabase
            .from("employee_fonctions")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_obtention_fonction", { ascending: false }),
          supabase
            .from("employee_formations")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_debut", { ascending: false }),
          supabase
            .from("employee_grades")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_grade", { ascending: false }),
          supabase
            .from("employee_parcours_scolaire")
            .select("*")
            .eq("employee_id", employeeId)
            .order("annee_debut", { ascending: false }),
          supabase.from("employee_photos").select("*").eq("employee_id", employeeId),
          supabase
            .from("employee_recompenses")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_recompense", { ascending: false }),
          supabase
            .from("employee_rendement")
            .select("*")
            .eq("employee_id", employeeId)
            .order("annee", { ascending: false }),
          supabase
            .from("employee_note_annuelle")
            .select("*")
            .eq("employee_id", employeeId)
            .order("annee", { ascending: false }),
          supabase
            .from("employee_sanctions")
            .select("*")
            .eq("employee_id", employeeId)
            .order("date_sanction", { ascending: false }),
          supabase.from("employee_urgent_contacts").select("*").eq("employee_id", employeeId),
        ])

        setEmployeeData({
          employee,
          absences: absences || [],
          affectations: [], // Pas utilisé, maintenu temporairement pour le type
          banque: employeeData.banque || [],
          conges: conges || [],
          contacts: contacts || [],
          enfants: enfants || [],
          etat_civil: etat_civil || [],
          fonctions: fonctions || [],
          formations: formations || [],
          grades: grades || [],
          notes_annuelles: notes_annuelles || [],
          parcours_scolaire: parcours_scolaire || [],
          photos: photos || [],
          recompenses: recompenses || [],
          rendements: rendements || [],
          sanctions: sanctions || [],
          urgent_contacts: urgent_contacts || [],
          selectedFormation: false,
        })
      } catch (error) {
        console.error("Erreur refresh employé:", error)
      }
    }

    const refreshBankData = async () => {
      try {
        const { data: banque } = await supabase.from("employee_banque").select("*").eq("employee_id", employeeId)

        setEmployeeData((prev) => ({
          ...prev,
          banque: banque || [],
        }))
      } catch (error) {
        console.error("Erreur refresh données bancaires:", error)
      }
    }

    return () => {
      channel.unsubscribe()
    }
  }, [employeeId])

  // Récupération directe du grade actuel avec label formaté
  const getCurrentGrade = useMemo(() => {
    const gradeValue = employeeData?.employee?.grade_actuel
    if (!gradeValue) {
      return t("common.notAvailable")
    }
    
    // Utiliser getGradeLabel pour obtenir le label formaté depuis gradeOptions
    const gradeLabel = getGradeLabel(gradeValue)
    return gradeLabel || gradeValue // Fallback sur la valeur brute si pas de correspondance
  }, [employeeData?.employee?.grade_actuel, t])

  const getCurrentAffectation = useMemo(() => {
    return { 
      unite: employeeData?.employee?.unite_actuelle || (isRTL ? t("common.notAvailable") : "Non défini"), 
      responsibility: employeeData?.employee?.affectation_actuel || (isRTL ? t("common.notAvailable") : "Non défini") 
    }
  }, [employeeData?.employee?.unite_actuelle, employeeData?.employee?.affectation_actuel])


  const getPhotoUrl = useMemo(() => {
    if (!employeeData?.photos || employeeData.photos.length === 0) {
      // Utiliser une image basée sur le sexe de l'employé
      return employeeData?.employee?.sexe === "Féminin" ? "/images/femme.png" : "/images/homme.png"
    }
    return employeeData.photos[0].photo_url
  }, [employeeData?.photos, employeeData?.employee?.sexe])

  const hasCustomPhoto = useMemo(() => {
    return employeeData?.photos && employeeData.photos.length > 0
  }, [employeeData?.photos])

  // Traductions des onglets avec pattern RTL/LTR cohérent
  const tabTranslations = useMemo(
    () => ({
      personalInfo: isRTL ? t("newAgent.employeeDetails.tabs.personalInfo") : "Informations personnelles",
      professionalInfo: isRTL ? t("newAgent.employeeDetails.tabs.professionalInfo") : "Informations professionnelles",
      familyInfo: isRTL ? t("newAgent.employeeDetails.tabs.familyInfo") : "Informations familiales",
      trainingInfo: isRTL ? t("newAgent.employeeDetails.tabs.trainingInfo") : "Formations",
      disciplineInfo: isRTL ? t("newAgent.employeeDetails.tabs.disciplineInfo") : "Sanctions",
      leavesInfo: isRTL ? t("newAgent.employeeDetails.tabs.leavesInfo") : "Congés",
    }),
    [isRTL, t]
  )

  // Memoization des tabs avec compteurs
  const tabs = useMemo(
    () => [
      { key: "personalInfo", icon: User, label: tabTranslations.personalInfo },
      { key: "professionalInfo", icon: Briefcase, label: tabTranslations.professionalInfo },
      { key: "familyInfo", icon: User, label: tabTranslations.familyInfo },
      {
        key: "trainingInfo",
        icon: GraduationCap,
        count: employeeData?.formations?.length || 0,
        label: tabTranslations.trainingInfo,
      },
      {
        key: "disciplineInfo",
        icon: AlertTriangle,
        label: tabTranslations.disciplineInfo,
      },
      {
        key: "leavesInfo",
        icon: Plane,
        label: tabTranslations.leavesInfo,
      },
    ],
    [employeeData?.formations?.length, tabTranslations]
  )

  const formatMatricule = (matricule: string) => {
    if (!matricule) return isRTL ? t("common.notAvailable") : "N/A"
    const matriculeStr = matricule.toString()
    if (matriculeStr.length === 5) {
      return `${matriculeStr.slice(0, 2)} ${matriculeStr.slice(2)}`
    } else if (matriculeStr.length === 4) {
      return `${matriculeStr.slice(0, 1)} ${matriculeStr.slice(1)}`
    }
    return matriculeStr
  }

  const formatFullName = (prenom?: string, prenom_pere?: string, nom?: string) => {
    const prenomStr = prenom || ""
    const prenomPereStr = prenom_pere || ""
    const nomStr = nom || ""

    if (!prenomStr && !prenomPereStr && !nomStr) {
      return isRTL ? t("common.notAvailable") : "N/A"
    }

    if (prenomStr && prenomPereStr && nomStr) {
      return `${prenomStr} بن ${prenomPereStr} ${nomStr}`
    } else if (prenomStr && nomStr) {
      return `${prenomStr} ${nomStr}`
    } else if (prenomStr) {
      return prenomStr
    } else if (nomStr) {
      return nomStr
    }

    return isRTL ? t("common.notAvailable") : "N/A"
  }

  // Fonction pour vérifier si une sanction "إيقاف عن العمل" est en cours
  const getActiveSuspension = useMemo(() => {
    if (!employeeData?.sanctions || employeeData.sanctions.length === 0) {
      return null
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Trouver une sanction "إيقاف عن العمل" dont la période est en cours
    const activeSuspension = employeeData.sanctions.find((sanction) => {
      if (sanction.type_sanction !== "إيقاف عن العمل") return false
      if (!sanction.date_debut || !sanction.date_fin) return false

      const dateDebut = new Date(sanction.date_debut)
      const dateFin = new Date(sanction.date_fin)
      dateDebut.setHours(0, 0, 0, 0)
      dateFin.setHours(0, 0, 0, 0)

      return dateDebut <= today && dateFin >= today
    })

    if (activeSuspension) {
      return {
        dateDebut: activeSuspension.date_debut,
        dateFin: activeSuspension.date_fin,
        nombreJour: activeSuspension.nombre_jour,
      }
    }

    return null
  }, [employeeData?.sanctions])

  // Fonction pour obtenir les dates du congé ou maladie actif
  const getActiveLeaveDates = useMemo(() => {
    const currentStatus = employeeData?.employee?.actif
    const statusKey = String(currentStatus)

    // Vérifier si le statut est "إجازة" (Congés) ou "مرض" (Maladie)
    const isLeaveStatus = ["إجازة", "مرض"].includes(statusKey)

    if (!isLeaveStatus || !employeeData?.conges || employeeData.conges.length === 0) {
      return null
    }

    // Trouver le congé actif (dont la date de fin est dans le futur ou aujourd'hui)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeLeave = employeeData.conges.find((conge) => {
      const dateFin = new Date(conge.date_fin)
      dateFin.setHours(0, 0, 0, 0)
      return dateFin >= today && conge.statut !== "Refusé"
    })

    if (activeLeave) {
      return {
        dateDebut: activeLeave.date_debut,
        dateFin: activeLeave.date_fin,
        type: activeLeave.type_conge,
      }
    }

    return null
  }, [employeeData?.employee?.actif, employeeData?.conges])

  // Fonction pour obtenir le statut et la couleur appropriée
  const getEmployeeStatus = () => {
    // Mapping des statuts arabes uniquement avec labels formatés
    const statusMap: {
      [key: string]: { label: string; color: string; textColor: string; dotColor: string; borderColor: string }
    } = {
      مباشر: {
        label: "مبـاشــر",
        color: "bg-green-100",
        textColor: "text-green-800",
        dotColor: "bg-green-500",
        borderColor: "border-green-800",
      },
      "غير مباشر": {
        label: "غير مباشر",
        color: "bg-gray-100",
        textColor: "text-gray-800",
        dotColor: "bg-gray-500",
        borderColor: "border-gray-800",
      },
      إجازة: {
        label: "في إجازة",
        color: "bg-blue-100",
        textColor: "text-blue-800",
        dotColor: "bg-blue-500",
        borderColor: "border-blue-800",
      },
      مرض: {
        label: "مــــرض",
        color: "bg-orange-100",
        textColor: "text-orange-800",
        dotColor: "bg-orange-500",
        borderColor: "border-orange-800",
      },
      تدريب: {
        label: "تكــويــن",
        color: "bg-purple-100",
        textColor: "text-purple-800",
        dotColor: "bg-purple-500",
        borderColor: "border-purple-800",
      },
      مهمة: {
        label: "في مهمــة",
        color: "bg-indigo-100",
        textColor: "text-indigo-800",
        dotColor: "bg-indigo-500",
        borderColor: "border-indigo-800",
      },
      متغيب: {
        label: "غائــب",
        color: "bg-yellow-100",
        textColor: "text-yellow-800",
        dotColor: "bg-yellow-500",
        borderColor: "border-yellow-800",
      },
      موقوف: {
        label: "موقــوف",
        color: "bg-red-100",
        textColor: "text-red-800",
        dotColor: "bg-red-500",
        borderColor: "border-red-800",
      },
    }

    // Si une sanction "إيقاف عن العمل" est en cours, retourner le statut "موقوف"
    if (getActiveSuspension) {
      return statusMap["موقوف"]
    }

    const currentStatus = employeeData?.employee?.actif
    // Convertir le statut en string pour la comparaison
    const statusKey = String(currentStatus)

    // Retourner le statut correspondant ou un statut par défaut
    return (
      statusMap[statusKey] || {
        label: statusKey || "غير محدد",
        color: "bg-gray-100",
        textColor: "text-gray-800",
        dotColor: "bg-gray-500",
        borderColor: "border-gray-800",
      }
    )
  }

  // Ne pas rendre le composant tant qu'il n'est pas monté côté client
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F5F9] dark:bg-[#26272A] px-6 py-6 flex items-center justify-center">
        <LoadingSpinner size="md" text={t("dashboard.charts.loadingData")} />
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-[#F4F5F9] dark:bg-[#26272A] px-6 py-6 ${fontClass}`}
      dir={direction}
      style={{ direction: direction }}
    >
      <div className="w-full mx-auto" style={{ direction: direction }}>
        {/* Header */}
        <div className="p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                onClick={() => {
                  sessionStorage.setItem("highlightEmployeeId", employeeId)
                  router.push(isRTL ? "/ar/dashboard/employees/table" : "/fr/dashboard/employees/table")
                  router.refresh()
                }}
              >
                <ArrowLeft className={`h-7 w-7 text-gray-500 ${isRTL ? "rotate-180" : ""}`} />
              </button>
              <div className="flex items-center gap-6">
                <div className="relative w-30 h-30 rounded-full flex items-center justify-center">
                  {imageLoading && (
                    <div className="absolute inset-0 rounded-full bg-gray-100 animate-pulse flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  <Image
                    src={getPhotoUrl}
                    alt={formatFullName(
                      employeeData?.employee?.prenom,
                      employeeData?.employee?.prenom_pere,
                      employeeData?.employee?.nom
                    )}
                    width={120}
                    height={120}
                    className={`rounded-full object-cover w-30 h-30 transition-opacity duration-300 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    priority={hasCustomPhoto}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGxwf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyuDN8EAZP/2Q=="
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </div>
                <div className={isRTL ? "pr-3" : "pl-3"}>
                  <div className="flex items-center gap-8">
                    <h1
                      className={`font-bold text-gray-900 dark:text-white pb-1 ${mainTitleFontClass} text-start ${
                        isRTL ? "text-2xl" : "text-3xl"
                      }`}
                    >
                      {formatFullName(
                        employeeData?.employee?.prenom,
                        employeeData?.employee?.prenom_pere,
                        employeeData?.employee?.nom
                      )}
                    </h1>
                    {getActiveSuspension ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`${getEmployeeStatus().color} ${getEmployeeStatus().textColor} ${
                              getEmployeeStatus().borderColor
                            } font-medium ${
                              isRTL ? "text-[11px]" : "text-xs"
                            } px-3 py-1.5 border rounded-full inline-flex items-center justify-center leading-none gap-1.5 ${
                              isRTL ? "font-jazeera-bold" : ""
                            } cursor-help`}
                          >
                            <span className={`w-1.5 h-1.5 ${getEmployeeStatus().dotColor} rounded-full`}></span>
                            {getEmployeeStatus().label}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="font-noto-naskh-arabic bg-gray-900 text-white border-none"
                        >
                          <div className="flex flex-col gap-2" dir="rtl">
                            <div className="text-xs">
                              <span className="font-semibold">من:</span>{" "}
                              {formatDateDDMMYYYY(getActiveSuspension.dateDebut || "")}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold">إلى:</span>{" "}
                              {formatDateDDMMYYYY(getActiveSuspension.dateFin || "")}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : getActiveLeaveDates ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`${getEmployeeStatus().color} ${getEmployeeStatus().textColor} ${
                              getEmployeeStatus().borderColor
                            } font-medium ${
                              isRTL ? "text-[11px]" : "text-xs"
                            } px-3 py-1.5 border rounded-full inline-flex items-center justify-center leading-none gap-1.5 ${
                              isRTL ? "font-jazeera-bold" : ""
                            } cursor-help`}
                          >
                            <span className={`w-1.5 h-1.5 ${getEmployeeStatus().dotColor} rounded-full`}></span>
                            {getEmployeeStatus().label}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="font-noto-naskh-arabic bg-gray-900 text-white border-none"
                        >
                          <div className="flex flex-col gap-2" dir="rtl">
                            <div className="text-xs">
                              <span className="font-semibold">من:</span>{" "}
                              {formatDateDDMMYYYY(getActiveLeaveDates.dateDebut)}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold">إلى:</span>{" "}
                              {formatDateDDMMYYYY(getActiveLeaveDates.dateFin)}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div
                        className={`${getEmployeeStatus().color} ${getEmployeeStatus().textColor} ${
                          getEmployeeStatus().borderColor
                        } font-medium ${
                          isRTL ? "text-[11px]" : "text-xs"
                        } px-3 py-1.5 border rounded-full inline-flex items-center justify-center leading-none gap-1.5 ${
                          isRTL ? "font-jazeera-bold" : ""
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 ${getEmployeeStatus().dotColor} rounded-full`}></span>
                        {getEmployeeStatus().label}
                      </div>
                    )}
                  </div>

                  <div className={`text-gray-900 dark:text-gray-300 font-medium ${cardSubtitleFontClass} ${isRTL ? "-mt-1 text-md" : ""}`}>{getCurrentGrade}</div>
                </div>
                <hr className="border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 border-none w-0.75 h-12.5 mt-2" />
                <div className={`flex mt-2 ${isRTL ? "gap-16 mr-2" : "gap-10 ml-2"}`}>
                  <div>
                    <div className={`text-gray-500 dark:text-gray-400 text-sm mb-2.5 ${cardSubtitleFontClass}`}>
                      {t("employeesList.table.headers.matricule")}
                    </div>
                    <div className={`text-gray-900 dark:text-gray-300 font-medium text-base ${cardSubtitleFontClass}`} dir="ltr">
                      {formatMatricule(employeeData?.employee?.matricule)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-gray-500 dark:text-gray-400 text-sm mb-2 ${cardSubtitleFontClass}`}>
                    {t("uniteDetails.responsibility")}
                    </div>
                    <div className={`text-gray-900 dark:text-gray-300 font-medium text-base ${cardSubtitleFontClass}`}>
                      {getCurrentAffectation.responsibility || t("common.notDefined")}
                    </div>
                  </div>
                  <div>
                    <div className={`text-gray-500 dark:text-gray-400 text-sm mb-2 ${cardSubtitleFontClass}`}>
                      {t("dashboard.tables.unitColumns.unitName")}
                    </div>
                    <div className={`text-gray-900 dark:text-gray-300 font-medium text-base ${cardSubtitleFontClass}`}>
                      {getCurrentAffectation.unite || t("common.notDefined")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 pr-4"></div>
            </div>
          </div>
        </div>
        {/* Tabs Navigation */}
        <div className="flex justify-between mb-8 mx-6 border-b border-gray-200 dark:border-gray-600">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center px-4 py-3 relative cursor-pointer h-12 min-w-0 ${
                activeTab === tab.key
                  ? "text-[#076784] font-medium border-b-2 border-[#076784]"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              } transition-all duration-200`}
            >
              <div className={`flex items-center truncate ${isRTL ? "space-x-reverse space-x-2" : "space-x-2"}`}>
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className={`text-sm truncate ${cardSubtitleFontClass}`}>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs flex-shrink-0 ${cardSubtitleFontClass}`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        {/* Content */}
        <div>
          {activeTab === "personalInfo" && <TabPersonalInfo data={employeeData} />}

          {activeTab === "professionalInfo" && <TabProfessionalInfo data={employeeData} />}

          {activeTab === "familyInfo" && <TabFamilyInfo data={employeeData} />}

          {activeTab === "trainingInfo" && <TabTrainingInfo data={employeeData} />}

          {activeTab === "disciplineInfo" && <TabDisciplineInfo data={employeeData} />}

          {activeTab === "leavesInfo" && <TabLeavesInfo data={employeeData} onEmployeeUpdate={handleEmployeeUpdate} />}
        </div>
      </div>
    </div>
  )
}

export default SimpleEmployeeProfile
