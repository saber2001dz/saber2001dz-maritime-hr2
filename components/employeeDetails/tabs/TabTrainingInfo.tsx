// TabTrainingInfo.tsx
"use client"
import { useState, useMemo, useEffect, JSX, useRef } from "react"
import {
  Edit,
  Calendar,
  MapPin,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  School,
  Trophy,
  Filter,
  RotateCcw,
  Shield,
  Users,
  University,
  Plus,
} from "lucide-react"
import { EmployeeCompleteData, EmployeeFormation } from "@/types/details_employees"
import EditDialogs, { useEditDialogs } from "../tabsEdit/TabTrainingInfoEdit"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTitleFont,
  getCardTitleFont,
  getCardSubtitleFont,
  getJazzeraFontDetailsEmployee,
  getNotoFontSelect,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"

// Interfaces TypeScript
interface Formation extends EmployeeFormation {
  statut: string // Ajout du champ statut
}

interface ParcoursScolarite {
  id: string
  niveau: string
  diplome: string
  lieu: string
  anneeDebut: string
  anneeFin: string
}

interface Filters {
  lieu: string
  statut: string
  triAnnee: string
}

interface CardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  edit?: boolean
  animationDelay?: string
  onEdit?: () => void
  isRTL?: boolean
  titleFontClass?: string
  buttonFontClass?: string
}

interface FilterControlsProps {
  filters: Filters
  onFilterChange: (filterType: string, value: string) => void
  onClearFilters: () => void
  onEdit?: () => void
  stats: {
    total: number
    terminees: number
    enCours: number
    interrompues: number
  }
  isRTL?: boolean
  cardSubtitleFontClass?: string
  notoSelectFontClass?: string
}

interface FormationCardProps {
  formation: Formation
  animationDelay?: string
  isVisible: boolean
  onEdit?: (formation: Formation) => void
  isRTL?: boolean
  titleFontClass?: string
  cardSubtitleFontClass?: string
  jazeeraFontClass?: string
}

// Fonctions utilitaires
const formatDate = (dateStr: string | null, isRTL = false): string => {
  if (!dateStr) return isRTL ? "جاري" : "En cours"
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, "0")
  const month = isRTL
    ? date.toLocaleDateString("ar", { month: "long" })
    : date.toLocaleDateString("fr-FR", { month: "long" })
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

const calculateDuration = (debut: string, fin: string | null, isRTL = false): string => {
  const startDate = new Date(debut)
  const endDate = fin ? new Date(fin) : new Date()

  // Calculer la différence en jours
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Calculer mois et jours restants
  const months = Math.floor(diffDays / 30)
  const remainingDays = diffDays % 30

  if (months === 0) {
    return isRTL ? `${String(remainingDays).padStart(2, "0")} يوم` : `${String(remainingDays).padStart(2, "0")} Jours`
  }

  if (months >= 1) {
    return isRTL
      ? `${String(months).padStart(2, "0")} شهر ${String(remainingDays).padStart(2, "0")} يوم`
      : `${String(months).padStart(2, "0")} Mois ${String(remainingDays).padStart(2, "0")} Jours`
  }

  return isRTL ? `${String(diffDays).padStart(2, "0")} يوم` : `${String(diffDays).padStart(2, "0")} Jours`
}

// Fonctions de traduction
const translateStatus = (status: string, isRTL: boolean): string => {
  const translations: { [key: string]: string } = {
    "En cours": isRTL ? "جاري" : "En cours",
    Terminé: isRTL ? "منتهي" : "Terminé",
    Interrompu: isRTL ? "متقطع" : "Interrompu",
    Absent: isRTL ? "غائب" : "Absent",
    "Non défini": isRTL ? "غير محدد" : "Non défini",
  }
  return translations[status] || status
}

const translateFormationType = (type: string, isRTL: boolean): string => {
  const translations: { [key: string]: string } = {
    "Formation Continue": isRTL ? "تكوين مستمر" : "Formation Continue",
    Spécialisation: isRTL ? "تخصص" : "Spécialisation",
    Certification: isRTL ? "شهادة" : "Certification",
  }
  return translations[type] || type
}

const translateEstablishmentType = (type: string, isRTL: boolean): string => {
  const translations: { [key: string]: string } = {
    Militaire: isRTL ? "عسكري" : "Militaire",
    Civil: isRTL ? "مدني" : "Civil",
    Sécuritaire: isRTL ? "أمني" : "Sécuritaire",
  }
  return translations[type] || type
}

// Fonction pour obtenir les couleurs de statut
const getStatusColor = (statut: string): string => {
  const normalizedStatus = statut.toLowerCase()
  switch (normalizedStatus) {
    case "en cours":
    case "جاري":
      return "bg-blue-100 border-blue-500 text-blue-700"
    case "terminé":
    case "منتهي":
      return "bg-green-100 border-green-500 text-green-700"
    case "interrompu":
    case "متقطع":
      return "bg-red-100 border-red-500 text-red-700"
    case "absent":
    case "غائب":
      return "bg-orange-100 border-orange-500 text-orange-700"
    default:
      return "bg-gray-100 border-gray-500 text-gray-700 dark:text-gray-300"
  }
}

// Fonction pour obtenir les couleurs du type de formation
const getTypeFormationColor = (type: string): string => {
  switch (type) {
    case "Formation Continue":
      return "bg-purple-100 text-purple-800"
    case "Spécialisation":
      return "bg-cyan-100 text-cyan-800"
    case "Certification":
      return "bg-amber-100 text-amber-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

// Fonction pour obtenir l'icône du statut
const getStatusIcon = (statut: string): JSX.Element => {
  const normalizedStatus = statut.toLowerCase()
  switch (normalizedStatus) {
    case "en cours":
    case "جاري":
      return <Clock className="w-4 h-4" />
    case "terminé":
    case "منتهي":
      return <CheckCircle className="w-4 h-4" />
    case "interrompu":
    case "متقطع":
      return <XCircle className="w-4 h-4" />
    case "absent":
    case "غائب":
      return <AlertCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

// Fonction pour obtenir l'icône du genre d'établissement
const getGenreIcon = (genre: string): JSX.Element => {
  switch (genre) {
    case "Militaire":
      return <Shield className="w-4 h-4" />
    case "Civil":
      return <Users className="w-4 h-4" />
    case "Sécuritaire":
      return <Shield className="w-4 h-4" />
    default:
      return <University className="w-4 h-4" />
  }
}

// Générer les années pour le filtre
const generateYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let year = currentYear; year >= 2010; year--) {
    years.push(year.toString())
  }
  return years
}

// Composant Card réutilisable
function Card({
  title,
  icon: Icon,
  children,
  edit = false,
  animationDelay,
  onEdit,
  isRTL = false,
  titleFontClass = "",
  buttonFontClass = "",
}: CardProps) {
  return (
    <div
      className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm overflow-hidden transform transition-all duration-300 ease-out"
      style={{
        animationDelay: animationDelay,
        animation: "fadeInUp 0.6s ease-out both",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2`}>
            <Icon className="h-5 w-5 text-[#076784]" />
            <h2 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>{title}</h2>
          </div>
          {edit && (
            <button
              onClick={onEdit}
              className={`flex items-center text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer gap-2`}
            >
              <Edit className="h-4 w-4" />
              <span className={`text-sm font-medium ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                {isRTL ? "تعــديــل" : "Modifier"}
              </span>
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

// Composant pour les filtres avec statistiques
function FilterControls({
  filters,
  onFilterChange,
  onClearFilters,
  onEdit,
  stats,
  isRTL = false,
  cardSubtitleFontClass = "",
  notoSelectFontClass = "",
}: FilterControlsProps) {
  const yearOptions = generateYearOptions()

  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#076784]" />
          <span className={`text-lg font-semibold text-[#076784] ${cardSubtitleFontClass}`}>
            {isRTL ? "محــرك البـحــث" : "Filtres"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center space-x-1 text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer gap-1"
            title={isRTL ? "إضافــة تكـويــن" : "Ajouter une formation"}
          >
            <Plus className="h-4 w-4" />
            <span className={`text-sm ${cardSubtitleFontClass}`}>{isRTL ? "إضـافــة" : "Ajouter"}</span>
          </button>
          <button
            onClick={onClearFilters}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            title={isRTL ? "مسح جميع الفلاتر" : "Effacer tous les filtres"}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Filtre par lieu */}
        <div>
          <label className={`block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ${cardSubtitleFontClass}`}>
            {isRTL ? "المكــان" : "Lieu"}
          </label>
          <Select
            dir={isRTL ? "rtl" : "ltr"}
            value={filters.lieu}
            onValueChange={(value) => onFilterChange("lieu", value)}
          >
            <SelectTrigger className={`w-full rounded text-[15px] ${notoSelectFontClass}`}>
              <SelectValue placeholder={isRTL ? "جميــع الأمـاكــن" : "Tous les lieux"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميــع الأمـاكــن" : "Tous les lieux"}</SelectItem>
              <SelectItem value="Tunisie">{isRTL ? "تونس" : "Tunisie"}</SelectItem>
              <SelectItem value="Étranger">{isRTL ? "الخارج" : "Étranger"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par statut */}
        <div>
          <label className={`block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ${cardSubtitleFontClass}`}>
            {isRTL ? "الحـالــــة" : "Statut"}
          </label>
          <Select
            dir={isRTL ? "rtl" : "ltr"}
            value={filters.statut}
            onValueChange={(value) => onFilterChange("statut", value)}
          >
            <SelectTrigger className={`w-full rounded text-[15px] ${notoSelectFontClass}`}>
              <SelectValue placeholder={isRTL ? "جميع الحــالات" : "Tous les statuts"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع الحــالات" : "Tous les statuts"}</SelectItem>
              <SelectItem value="En cours">{translateStatus("En cours", isRTL)}</SelectItem>
              <SelectItem value="Terminé">{translateStatus("Terminé", isRTL)}</SelectItem>
              <SelectItem value="Interrompu">{translateStatus("Interrompu", isRTL)}</SelectItem>
              <SelectItem value="Absent">{translateStatus("Absent", isRTL)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par année */}
        <div>
          <label className={`block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ${cardSubtitleFontClass}`}>
            {isRTL ? "السنــــة" : "Année"}
          </label>
          <Select
            dir={isRTL ? "rtl" : "ltr"}
            value={filters.triAnnee}
            onValueChange={(value) => onFilterChange("triAnnee", value)}
          >
            <SelectTrigger className={`w-full rounded text-sm ${notoSelectFontClass}`}>
              <SelectValue placeholder={isRTL ? "جميع السنوات" : "Toutes les années"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع السنوات" : "Toutes les années"}</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className={`flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 ${cardSubtitleFontClass}`}>
          <span>
            {isRTL ? "المجمــوع" : "Total"}: {stats.total}
          </span>
          <span>|</span>
          <span>
            {isRTL ? "منتهيــة" : "Terminées"}: {stats.terminees}
          </span>
          <span>|</span>
          <span>
            {isRTL ? "جـاريـــة" : "En cours"}: {stats.enCours}
          </span>
          <span>|</span>
          <span>
            {isRTL ? "منقطعـــة" : "Interrompues"}: {stats.interrompues}
          </span>
        </div>
      </div>
    </div>
  )
}

// Composant pour une formation
function FormationCard({
  formation,
  animationDelay,
  isVisible,
  onEdit,
  isRTL = false,
  titleFontClass = "",
  cardSubtitleFontClass = "",
  jazeeraFontClass = "",
}: FormationCardProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldAnimate(false)
      const timer = setTimeout(() => setShouldAnimate(true), 50)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <div
      className={`bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm overflow-hidden transform transition-all duration-500 ease-out ${
        shouldAnimate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{
        transitionDelay: animationDelay || "0s",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center ${isRTL ? "space-x-reverse space-x-3" : "space-x-3"}`}>
            <BookOpen className="h-5 w-5 text-[#076784]" />
            <h2 className={`text-lg pl-4 font-semibold text-[#076784] ${titleFontClass}`}>
              {formation.description_diplome}
            </h2>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeFormationColor(
                formation.type_formation
              )} ${cardSubtitleFontClass}`}
            >
              {translateFormationType(formation.type_formation, isRTL)}
            </span>
          </div>
          <button
            onClick={() => onEdit?.(formation)}
            className={`flex items-center text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer gap-2`}
          >
            <Edit className="h-4 w-4" />
            <span className={`text-sm font-medium ${isRTL ? "font-noto-naskh-arabic" : ""}`}>{isRTL ? "تعــديــل" : "Modifier"}</span>
          </button>
        </div>
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pb-1.5">
              <div
                className={`flex items-center gap-2 text-[14px] text-gray-900 dark:text-white mb-2 ${jazeeraFontClass}`}
              >
                <Building className="w-4 h-4" />
                <span>{formation.etablissement}</span>
              </div>
            </div>
            <div className={`flex flex-col ${isRTL ? "items-start" : "items-end"} gap-2`}>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  formation.statut
                )} ${cardSubtitleFontClass}`}
              >
                <div className={`flex items-center gap-1`}>
                  {getStatusIcon(formation.statut)}
                  {translateStatus(formation.statut, isRTL)}
                </div>
              </span>
            </div>
          </div>
          <div
            className={`grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 ${cardSubtitleFontClass}`}
          >
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(formation.date_debut, isRTL)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(formation.date_fin, isRTL)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{calculateDuration(formation.date_debut, formation.date_fin, isRTL)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>
                {isRTL && formation.lieu === "Tunisie"
                  ? "تونس"
                  : isRTL && formation.lieu === "Étranger"
                  ? "الخارج"
                  : formation.lieu}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getGenreIcon(formation.type_etablissement)}
              <span>{translateEstablishmentType(formation.type_etablissement, isRTL)}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#076784]" />
              <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                {isRTL ? "النتيجة:" : "Résultat:"}
              </span>
              <span className={`text-sm text-gray-600 dark:text-gray-400 ${jazeeraFontClass}`}>
                {formation.resultat}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TabTrainingInfoProps {
  data: EmployeeCompleteData
}

export default function TabTrainingInfo({ data }: TabTrainingInfoProps) {
  const params = useParams()
  const locale = params?.locale as Locale
  const isRTL = locale === "ar"

  // Classes de police
  const titleFontClass = getTitleFont(locale)
  const cardTitleFontClass = getCardTitleFont(locale)
  const cardSubtitleFontClass = getCardSubtitleFont(locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(locale)
  const notoSelectFontClass = getNotoFontSelect(locale)

  const [filters, setFilters] = useState<Filters>({
    lieu: "all",
    statut: "all",
    triAnnee: "all",
  })

  const [filterKey, setFilterKey] = useState(0)
  const toasterRef = useRef<ToasterRef>(null)

  // Hook pour la gestion des dialogs d'édition
  const {
    activeDialog,
    openAddFormationDialog,
    openNiveauxScolairesDialog,
    openIndividualFormationDialog,
    closeDialog,
  } = useEditDialogs()

  // État pour les données mises à jour
  const [employeeData, setEmployeeData] = useState(data)

  // Synchroniser l'état local avec les props quand les données changent
  useEffect(() => {
    setEmployeeData(data)
  }, [data])

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
    setFilterKey((prev) => prev + 1)
  }

  const handleClearFilters = () => {
    setFilters({
      lieu: "all",
      statut: "all",
      triAnnee: "all",
    })
    setFilterKey((prev) => prev + 1)
  }

  // Fonction pour gérer la sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    setEmployeeData((prev) => ({
      ...prev,
      [field]: updatedData,
    }))
  }

  // Fonction pour afficher les toasts
  const showToast = (variant: "success" | "error", title: string, message: string) => {
    toasterRef.current?.show({
      title,
      message,
      variant,
    })
  }

  // Fonction pour ouvrir l'édition individuelle d'une formation
  const handleEditFormation = (formation: any) => {
    // Store the selected formation for editing
    setEmployeeData((prev) => ({
      ...prev,
      selectedFormation: formation,
    }))
    openIndividualFormationDialog()
  }

  // Mapper les formations de la base de données
  const formationsFromDb = useMemo(() => {
    return (
      employeeData.formations?.map((formation) => ({
        ...formation,
        statut: formation.progression || "Non défini",
      })) || []
    )
  }, [employeeData.formations])

  // Mapper le parcours scolaire - CORRIGÉ
  const parcoursScolarieData = useMemo(() => {
    return (
      employeeData.parcours_scolaire?.map((parcours) => ({
        id: parcours.id,
        niveau: parcours.niveau_scolaire,
        diplome: parcours.diplome,
        lieu: parcours.lieu,
        anneeDebut: parcours.annee_debut,
        anneeFin: parcours.annee_fin,
      })) || []
    )
  }, [employeeData.parcours_scolaire])

  const filteredAndSortedFormations = useMemo(() => {
    let filtered: Formation[] = [...formationsFromDb]

    // Appliquer les filtres
    if (filters.lieu && filters.lieu !== "all") {
      filtered = filtered.filter((formation) => formation.lieu === filters.lieu)
    }
    if (filters.statut && filters.statut !== "all") {
      filtered = filtered.filter((formation) => formation.statut === filters.statut)
    }
    if (filters.triAnnee && filters.triAnnee !== "all") {
      filtered = filtered.filter((formation) => {
        const formationYear = new Date(formation.date_debut).getFullYear().toString()
        return formationYear === filters.triAnnee
      })
    }

    // Trier par date de début (plus récent d'abord)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_debut)
      const dateB = new Date(b.date_debut)
      return dateB.getTime() - dateA.getTime()
    })

    return filtered
  }, [filters, formationsFromDb])

  const stats = useMemo(() => {
    const total = formationsFromDb.length
    const terminees = formationsFromDb.filter((f) => f.statut === "Terminé").length
    const enCours = formationsFromDb.filter((f) => f.statut === "En cours").length
    const interrompues = formationsFromDb.filter((f) => f.statut === "Interrompu").length

    return { total, terminees, enCours, interrompues }
  }, [formationsFromDb])

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 ${jazeeraFontClass}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* LEFT COLUMN - 2/3 largeur */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters avec statistiques */}
          <FilterControls
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onEdit={openAddFormationDialog}
            stats={stats}
            isRTL={isRTL}
            cardSubtitleFontClass={cardSubtitleFontClass}
            notoSelectFontClass={notoSelectFontClass}
          />

          {/* Formations */}
          <div key={filterKey} className="space-y-6">
            {filteredAndSortedFormations.map((formation, index) => (
              <div key={formation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-sm">
                <FormationCard
                  key={formation.id}
                  formation={formation}
                  animationDelay={`${index * 0.2}s`}
                  isVisible={true}
                  onEdit={handleEditFormation}
                  isRTL={isRTL}
                  titleFontClass={cardTitleFontClass}
                  cardSubtitleFontClass={cardSubtitleFontClass}
                  jazeeraFontClass={jazeeraFontClass}
                />
              </div>
            ))}
          </div>

          {/* Message si aucune formation trouvée */}
          {filteredAndSortedFormations.length === 0 && (
            <div className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 text-center">
              <p className={`text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                {isRTL
                  ? "لم يتم العثور على تكــويــن."
                  : "Aucune formation trouvée avec les filtres appliqués."}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - 1/3 largeur */}
        <div className="space-y-6">
          <Card
            title={isRTL ? "المســار الـــدراسي" : "Parcours Scolaire"}
            icon={GraduationCap}
            edit
            animationDelay="0.2s"
            onEdit={openNiveauxScolairesDialog}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
            buttonFontClass={cardSubtitleFontClass}
          >
            <div className="relative">
              <div
                className={`absolute ${isRTL ? "right-4" : "left-4"} w-0.5 bg-[#076784]`}
                style={{ top: "20px", bottom: "18px" }}
              ></div>
              {parcoursScolarieData.map((parcours, index) => (
                <div key={parcours.id}>
                  <div className={`relative py-4 ${isRTL ? "pr-12" : "pl-12"}`}>
                    <div
                      className={`absolute ${
                        isRTL ? "right-2" : "left-2"
                      } top-5 w-4 h-4 rounded-full bg-[#076784] border-4 border-white shadow-md z-10`}
                    ></div>
                    <div className="space-y-2">
                      <div>
                        <h3
                          className={`text-base font-semibold text-gray-800 dark:text-white ${cardSubtitleFontClass}`}
                        >
                          {parcours.niveau}
                        </h3>
                        <p className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${jazeeraFontClass}`}>
                          {parcours.diplome}
                        </p>
                        <p className={`text-sm text-gray-600 dark:text-gray-400 ${jazeeraFontClass}`}>
                          {isRTL && parcours.lieu === "Tunisie"
                            ? "تونس"
                            : isRTL && parcours.lieu === "Étranger"
                            ? "الخارج"
                            : parcours.lieu}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>
                          {parcours.anneeDebut} - {parcours.anneeFin}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < parcoursScolarieData.length - 1 && (
                    <div className={`${isRTL ? "mr-12" : "ml-12"} border-b border-gray-200 dark:border-gray-600`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <School className="w-4 h-4" />
                <span className={cardSubtitleFontClass}>
                  {isRTL
                    ? `مسار كامل: ${parcoursScolarieData.length} مراحل`
                    : `Parcours complet: ${parcoursScolarieData.length} étapes`}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs d'édition */}
      <EditDialogs
        data={employeeData}
        onSave={handleSave}
        activeDialog={activeDialog}
        onClose={closeDialog}
        showToast={showToast}
      />

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </>
  )
}
