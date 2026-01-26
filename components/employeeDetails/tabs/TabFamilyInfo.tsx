"use client"
import React, { useMemo, useState, useRef, useEffect } from "react"
import { Edit, Heart, Users, Phone, User, Baby, UserCheck, Shield } from "lucide-react"
import { EmployeeCompleteData } from "@/types/details_employees"
import EditDialogs from "../tabsEdit/TabFamilyInfoEdit"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { getTitleFont, getCardTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee, getTableCellNotoFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface TabFamilyInfoProps {
  data: EmployeeCompleteData
}

// Fonction pour formater la date
const formatDate = (dateStr: string | null | undefined, isRTL = false) => {
  if (!dateStr) return isRTL ? "غير محدد" : "Non défini"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return isRTL ? "غير محدد" : "Non défini"
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return isRTL ? "غير محدد" : "Non défini"
  }
}

// Fonction pour calculer l'âge
const calculateAge = (dateNaissance: string | null | undefined, isRTL = false) => {
  if (!dateNaissance) return isRTL ? "غير محدد" : "Non défini"
  try {
    const today = new Date()
    const birthDate = new Date(dateNaissance)
    if (isNaN(birthDate.getTime())) return isRTL ? "غير محدد" : "Non défini"
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return isRTL ? `${age} سنة` : `${age} ans`
  } catch {
    return isRTL ? "غير محدد" : "Non défini"
  }
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
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  edit?: boolean
  animationDelay?: string
  onEdit?: () => void
  isRTL?: boolean
  titleFontClass?: string
}) {
  return (
    <div
      className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm overflow-hidden animate-slide-up"
      style={{ animationDelay }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2`}>
            <Icon className="h-5 w-5 text-[#076784]" />
            <h2 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>{title}</h2>
          </div>
          {edit && onEdit && (
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

// Composant Field
function Field({
  label,
  value,
  labelFontClass = "",
  valueFontClass = "",
}: {
  label: string
  value: string | React.ReactNode | undefined
  labelFontClass?: string
  valueFontClass?: string
}) {
  return (
    <div>
      <p className={`text-sm text-gray-500 dark:text-gray-400 mb-1 ${labelFontClass}`}>{label}</p>
      <p className={`text-gray-900 dark:text-gray-300 text-sm font-medium ${valueFontClass}`}>{value || "Non défini"}</p>
    </div>
  )
}

// Composant Divider
function Divider() {
  return <div className="col-span-full border-t border-gray-200 dark:border-gray-600 my-2" />
}

export default function TabFamilyInfo({ data }: TabFamilyInfoProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const tableNotoFontClass = getTableCellNotoFont(params.locale as Locale)

  // État pour gérer les données et les dialogues
  const [employeeData, setEmployeeData] = useState(data)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const toasterRef = useRef<ToasterRef>(null)

  // Synchroniser l'état local avec les props quand les données changent
  useEffect(() => {
    setEmployeeData(data)
  }, [data])

  // Extraction des données familiales avec les noms de variables corrects
  const employee = employeeData.employee || {}
  const etatCivil = employeeData.etat_civil?.[0] || {}
  const enfants = employeeData.enfants || []
  const urgentContacts = employeeData.urgent_contacts?.[0] || {}

  // Formatage du statut marital
  const statutMarital = useMemo(() => {
    if (!etatCivil.etat_civil) return "Non défini"
    const status = etatCivil.etat_civil.toLowerCase()

    if (status === "marie" && etatCivil.date_etat_civil) {
      try {
        const marriageYear = new Date(etatCivil.date_etat_civil).getFullYear()
        return `Marié(e) - (depuis ${marriageYear})`
      } catch {
        return "Marié(e)"
      }
    }

    // Capitaliser la première lettre
    return status.charAt(0).toUpperCase() + status.slice(1)
  }, [etatCivil])

  const conjointInfo = useMemo(() => {
    const defaultConjoint = {
      prenom: "",
      nom: "",
      travail: "Non défini",
      fullName: "Non défini",
    }

    if (!etatCivil.identite_conjoint) return defaultConjoint

    // Séparation du prénom et nom si stockés ensemble
    const parts = etatCivil.identite_conjoint.split(" ")
    if (parts.length >= 2) {
      return {
        prenom: parts[0],
        nom: parts.slice(1).join(" "),
        travail: etatCivil.travail_conjoint || "Non défini",
        fullName: etatCivil.identite_conjoint,
      }
    }

    return {
      prenom: etatCivil.identite_conjoint,
      nom: "",
      travail: etatCivil.travail_conjoint || "Non défini",
      fullName: etatCivil.identite_conjoint,
    }
  }, [etatCivil])

  // Fonction pour afficher les toasts
  const showToast = (variant: "success" | "error", title: string, message: string) => {
    toasterRef.current?.show({
      title,
      message,
      variant,
      duration: variant === "success" ? 4000 : 5000,
      position: "top-right",
    })
  }

  // Gestionnaire de sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    if (field === "family") {
      setEmployeeData((prev) => ({
        ...prev,
        employee: {
          ...prev.employee,
          matricule_mutuel: updatedData.matricule_mutuel,
        },
        etat_civil:
          prev.etat_civil && prev.etat_civil.length > 0
            ? prev.etat_civil.map((item, index) => (index === 0 ? { ...item, ...updatedData } : item))
            : [{ ...updatedData, employee_id: prev.employee.id }],
      }))
    } else if (field === "contact") {
      setEmployeeData((prev) => ({
        ...prev,
        urgent_contacts:
          prev.urgent_contacts && prev.urgent_contacts.length > 0
            ? prev.urgent_contacts.map((item, index) => (index === 0 ? { ...item, ...updatedData } : item))
            : [{ ...updatedData, employee_id: prev.employee.id }],
      }))
    } else if (field === "enfants") {
      setEmployeeData((prev) => ({
        ...prev,
        enfants: updatedData,
      }))
    }
    console.log(`Données sauvegardées pour ${field}:`, updatedData)
  }

  // Gestionnaire d'ouverture des dialogues
  const openDialog = (dialogType: string) => {
    setActiveDialog(dialogType)
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 ${isRTL ? "text-start" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* Informations Familiales */}
        <Card
          title={isRTL ? "المعلومات العائلية" : "Informations Familiales"}
          icon={Heart}
          edit
          animationDelay="0.2s"
          onEdit={() => openDialog("family")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label={isRTL ? "الحالة الزوجية" : "Statut Marital"}
              value={statutMarital}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "عدد الأطفال" : "Nombre d'Enfants"}
              value={enfants.length.toString()}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "اسم الزوج/الزوجة" : "Prénom Nom Conjoint"}
              value={conjointInfo.fullName}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "عمل الزوج/الزوجة" : "Travail Conjoint"}
              value={conjointInfo.travail}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "رقم التأمين" : "Numéro Mutuel"}
              value={employee.matricule_mutuel || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
          </div>
        </Card>

        {/* Table des Enfants */}
        <Card
          title={isRTL ? "الأطفال" : "Enfants"}
          icon={Users}
          edit
          animationDelay="0.4s"
          onEdit={() => openDialog("enfants")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="overflow-x-auto">
            {enfants.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                {isRTL ? "لم يتم تسجيل أي طفل" : "Aucun enfant enregistré"}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-[25%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "اسم الطفل" : "Prénom de l'enfant"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-[20%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "الجنس" : "Genre"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-[20%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ الميلاد" : "Date Naissance"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-[15%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "العمر" : "Age"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-[20%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "المستوى الدراسي" : "Niveau Scolaire"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...enfants]
                    .sort(
                      (a, b) => new Date(b.date_naissance || 0).getTime() - new Date(a.date_naissance || 0).getTime()
                    )
                    .map((enfant) => (
                      <tr key={enfant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium w-[20%] ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <Baby className="w-4 h-4 text-[#076784]" />
                            <span className="truncate">{enfant.prenom || (isRTL ? "غير محدد" : "Non défini")}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 w-[15%]">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${cardSubtitleFontClass} ${
                              enfant.sexe === "masculin" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                            }`}
                          >
                            {enfant.sexe === "masculin"
                              ? isRTL
                                ? "ذكر"
                                : "masculin"
                              : enfant.sexe === "feminin"
                              ? isRTL
                                ? "أنثى"
                                : "feminin"
                              : isRTL
                              ? "غير محدد"
                              : "Non défini"}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 w-[20%] ${tableNotoFontClass}`}
                        >
                          {formatDate(enfant.date_naissance, isRTL)}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium w-[15%] ${tableNotoFontClass}`}
                        >
                          {calculateAge(enfant.date_naissance, isRTL)}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 w-[30%] ${tableNotoFontClass}`}
                        >
                          {enfant.niveau_scolaire || (isRTL ? "غير محدد" : "Non défini")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        {/* Contact d'Urgence */}
        <Card
          title={isRTL ? "جهة الاتصال عند الطوارئ" : "Contact d'Urgence"}
          icon={Phone}
          edit
          animationDelay="0.3s"
          onEdit={() => openDialog("contact")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium text-red-900 dark:text-red-100 mb-1 ${jazeeraFontClass}`}>
                  {urgentContacts.prenom_nom || (isRTL ? "غير محدد" : "Non défini")}
                </h3>
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  <span className={`text-sm text-red-700 dark:text-red-200 ${jazeeraFontClass}`}>
                    {urgentContacts.phone || (isRTL ? "غير محدد" : "Non défini")}
                  </span>

                  {urgentContacts.relationship && (
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-red-600 dark:text-red-400">-</span>
                      <User className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 ml-1" />
                      <span className={`text-sm text-red-700 dark:text-red-200 ${jazeeraFontClass}`}>
                        {urgentContacts.relationship}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={`text-xs text-gray-500 dark:text-gray-400 text-left ${cardSubtitleFontClass}`}>
              {isRTL ? "يـتــم الاتصال بهـذا الشخـص في حالـة الطـوارئ" : "Ce contact sera appelé en cas d'urgence"}
            </div>
          </div>
        </Card>

        {/* Statistiques Familiales */}
        <Card
          title={isRTL ? "الإحصائيات العائلية" : "Statistiques Familiales"}
          icon={Shield}
          animationDelay="0.5s"
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className={`text-sm text-blue-900 dark:text-blue-100 ${cardSubtitleFontClass}`}>
                  {isRTL ? "الوضعية" : "Situation"}
                </span>
              </div>
              <span className={`text-[13px] font-medium text-blue-800 dark:text-blue-200 ${jazeeraFontClass}`}>
                {statutMarital}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className={`text-sm text-green-900 dark:text-green-100 ${cardSubtitleFontClass}`}>
                  {isRTL ? "عدد الأطفال" : "Nombre d'enfants"}
                </span>
              </div>
              <span className={`text-sm font-medium text-green-800 dark:text-green-200 ${jazeeraFontClass}`}>
                {enfants.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className={`text-sm text-purple-900 dark:text-purple-100 ${cardSubtitleFontClass}`}>
                  {isRTL ? "عمل الزوج/الزوجة" : "Travail Conjoint"}
                </span>
              </div>
              <span className={`text-[13px] font-medium text-purple-800 dark:text-purple-200 ${jazeeraFontClass}`}>
                {conjointInfo.travail || (isRTL ? "غير محدد" : "Non défini")}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Composant EditDialogs */}
      <EditDialogs
        data={employeeData}
        onSave={handleSave}
        activeDialog={activeDialog}
        onClose={closeDialog}
        showToast={showToast}
      />

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
