// TabPersonalInfo.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { User, MapPin, Phone, Edit, Briefcase, Tag, ChevronRight, NotebookPen } from "lucide-react"
import { EmployeeCompleteData } from "@/types/details_employees"
import { formatMaritalStatusWithDate, convertMaritalStatusToGender, normalizeGender } from "@/lib/selectOptions"
import EditDialogs from "../tabsEdit/TabPersonalInfoEdit"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useParams } from "next/navigation"
import {
  getTitleFont,
  getMainTitleFont,
  getCardTitleFont,
  getSelectFont,
  getCardFooterFont,
  getCardSubtitleFont,
  getTableCellFont,
  getTableCellNotoFont,
  getJazzeraFontDetailsEmployee,
  getGeistFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface TabPersonalInfoProps {
  data: EmployeeCompleteData
}

export default function TabPersonalInfo({ data }: TabPersonalInfoProps) {
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const geistFont = getGeistFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const [employeeData, setEmployeeData] = useState(data)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean
    type: "principale" | "actuelle" | null
  }>({
    isOpen: false,
    type: null,
  })
  const toasterRef = useRef<ToasterRef>(null)

  // Synchroniser l'état local avec les props quand les données changent
  useEffect(() => {
    setEmployeeData(data)
  }, [data])

  // Extraction des données de l'employé
  const employee = employeeData.employee
  const contacts = employeeData.contacts
  const etatCivil = employeeData.etat_civil[0] || {}

  // Utilisation des adresses du contact principal
  const mainContact = contacts[0] || {}

  // Formatage intelligent des adresses
  const formatAddress = (adresse: string, gouvernorat: string) => {
    const hasAddress = adresse && adresse.trim() !== ""
    const hasGovernorat = gouvernorat && gouvernorat.trim() !== ""

    if (hasAddress && hasGovernorat) {
      return `${adresse}, ${gouvernorat}`
    } else if (hasGovernorat && !hasAddress) {
      return `Non précis, l'agent réside à ${gouvernorat}`
    } else if (!hasAddress && !hasGovernorat) {
      return "Non fourni"
    } else if (hasAddress && !hasGovernorat) {
      return adresse
    }
    return "Non fourni"
  }

  const mainAddress = formatAddress(mainContact.adresse || "", mainContact.gouvernorat || "")

  // Pour l'adresse actuelle, si elle n'est pas définie, utiliser l'adresse principale
  const getCurrentAddress = () => {
    const currentAddr = mainContact.adresse_actuelle
    const currentGov = mainContact.gouvernorat_actuel

    // Si l'adresse actuelle est explicitement null (utilisateur a décoché la case), afficher "Non Fournie"
    if (currentAddr === null && currentGov === null) {
      return "Non Fournie"
    }

    // Si aucune adresse actuelle n'est définie (undefined ou chaîne vide), utiliser l'adresse principale
    if (!currentAddr && !currentGov) {
      return mainAddress
    }

    return formatAddress(currentAddr || "", currentGov || "")
  }

  const currentAddress = getCurrentAddress()

  // Formatage de la date de naissance
  const formatDate = (dateString: string) => {
    if (!dateString) return isRTL ? "غير محدد" : "Non défini"
    const date = new Date(dateString)
    return date.toLocaleDateString(isRTL ? "ar-TN" : "fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  // Formatage du statut marital selon le genre avec la date
  const formatMaritalStatus = () => {
    try {
      if (!etatCivil || !etatCivil.etat_civil) return isRTL ? "غير محدد" : "Non défini"

      const status = etatCivil.etat_civil
      const date = etatCivil.date_etat_civil

      if (!date) return status

      const year = new Date(date).getFullYear()

      // Gérer les valeurs arabes avec styling pour la partie date
      switch (status) {
        case "متزوج":
        case "متزوجة":
        case "مطلق":
        case "مطلقة":
        case "أرمل":
        case "أرملة":
          return (
            <>
              {status}{" "}
              <span className="font-noto-naskh-arabic text-gray-600 dark:text-gray-400 text-xs mr-1">
                {" "}
                (منذ {year})
              </span>
            </>
          )
        case "أعزب":
        case "عزباء":
          return status // Pas de date pour célibataire
        default:
          // Fallback vers la fonction originale pour les anciennes valeurs
          const employeeGender = normalizeGender(employee.sexe)
          return formatMaritalStatusWithDate(status, employeeGender, date)
      }
    } catch (error) {
      console.error("Erreur de formatage du statut marital:", error)
      return "Non défini"
    }
  }

  // Formater le numero de telephone
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return isRTL ? "غير محدد" : "Non défini"
    const phoneStr = phone.toString()

    if (phoneStr.length === 8) {
      // En mode RTL, on force la direction LTR pour les numéros avec un wrapper
      const formattedNumber = `+(216) ${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5)}`
      return isRTL ? `‎${formattedNumber}` : formattedNumber
    }
    return phoneStr
  }

  // Gestionnaire de sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    if (field === "identity") {
      setEmployeeData((prev) => {
        const newEmployeeData = {
          ...prev,
          employee: {
            ...prev.employee,
            ...updatedData,
          },
        }

        // Si le genre a changé, adapter le statut marital
        if (updatedData.sexe && updatedData.sexe !== prev.employee.sexe && prev.etat_civil[0]?.etat_civil) {
          const currentStatus = prev.etat_civil[0].etat_civil
          const adaptedStatus = convertMaritalStatusToGender(currentStatus, updatedData.sexe)

          newEmployeeData.etat_civil = [
            {
              ...prev.etat_civil[0],
              etat_civil: adaptedStatus,
            },
          ]
        }

        return newEmployeeData
      })
    } else if (field === "residence") {
      setEmployeeData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact, index) => (index === 0 ? { ...contact, ...updatedData } : contact)),
      }))
    } else if (field === "contact") {
      setEmployeeData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact, index) => (index === 0 ? { ...contact, ...updatedData } : contact)),
      }))
    } else if (field === "otherInfo") {
      setEmployeeData((prev) => ({
        ...prev,
        employee: {
          ...prev.employee,
          cin: updatedData.cin,
          groupe_sanguin: updatedData.groupe_sanguin,
        },
      }))
    } else if (field === "tags") {
      console.log("Tags sauvegardés:", updatedData)
    } else if (field === "notes") {
      setEmployeeData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact, index) => (index === 0 ? { ...contact, ...updatedData } : contact)),
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

  // Fonction pour afficher les toasts
  const showToast = (variant: "success" | "error", title: string, message: string) => {
    toasterRef.current?.show({
      title,
      message,
      variant,
    })
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 ${isRTL ? "text-right" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Identité */}
        <div
          className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <SectionHeader
            icon={User}
            title={isRTL ? "معلومــات الهــويـــة" : "Information Identité"}
            onEdit={() => openDialog("identity")}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field
              label={isRTL ? "الإســم" : "Prénom"}
              value={employee.prenom || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "اللقــب" : "Nom"}
              value={employee.nom || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "اسم الأب" : "Prénom Père"}
              value={employee.prenom_pere || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "اسم الجد" : "Prénom G. Père"}
              value={employee.prenom_grand_pere || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "هويـة الأم" : "Identité Mère"}
              value={employee.mere || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "الجنس" : "Genre"}
              value={employee.sexe || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "تاريخ الميلاد" : "Date de Naissance"}
              value={formatDate(employee.date_naissance)}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "مكان الولادة" : "Lieu de Naissance"}
              value={employee.lieu_naissance || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
          </div>
        </div>

        {/* Adresse */}
        <div
          className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <SectionHeader
            icon={MapPin}
            title={isRTL ? "معلومات السكن" : "Information Résidence"}
            onEdit={() => openDialog("residence")}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          />
          <div className="space-y-4">
            <AddressBlock
              label={isRTL ? "العنوان الرئيسي" : "Adresse Principale"}
              value={mainAddress}
              isRTL={isRTL}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <NoteField
              label={isRTL ? "ملاحظات" : "Notes"}
              note={mainContact.adresse_note || ""}
              onEdit={() => setNotesDialog({ isOpen: true, type: "principale" })}
              isRTL={isRTL}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <hr className="py-1 border-gray-200" />
            <AddressBlock
              label={isRTL ? "العنوان الحالي" : "Adresse Actuelle"}
              value={currentAddress}
              isRTL={isRTL}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <NoteField
              label={isRTL ? "ملاحظات" : "Notes"}
              note={mainContact.adresse_actuelle_note || ""}
              onEdit={() => setNotesDialog({ isOpen: true, type: "actuelle" })}
              isRTL={isRTL}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Contact */}
        <div
          className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <SectionHeader
            icon={Phone}
            title={isRTL ? "معلومات الاتصال" : "Information de Contact"}
            onEdit={() => openDialog("contact")}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          />
          <div className="space-y-4">
            <p className={`text-gray-900 dark:text-white text-start font-medium mb-2.5 ${cardSubtitleFontClass}`}>
              {isRTL ? "الاتصال الشخصي" : "Contact Personnel"}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <BadgeField
                label={isRTL ? "رقم الهاتف المحمول" : "Numéro Portable"}
                value={formatPhoneNumber(mainContact.phone_1) || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
              />
              <BadgeField
                label={isRTL ? "البريد الإلكتروني" : "Email"}
                value={mainContact.email || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
              />
            </div>
            <div className="border-t border-gray-200 my-4" />

            <p className={`text-gray-900 dark:text-white text-start font-medium mb-2 ${cardSubtitleFontClass}`}>
              {isRTL ? "اتصال آخر" : "Autre Contact"}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <Field
                label={isRTL ? "رقم الهاتف المحمول 2" : "Numéro Portable 2"}
                value={formatPhoneNumber(mainContact.phone_2) || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={geistFont}
                valueWheightClass={"font-medium"}
                valueSizeClass={"text-[15px]"}
                valueLetterSpacing={"tracking-wide"}
              />
              <Field
                label={isRTL ? "واتساب" : "WhatsApp"}
                value={formatPhoneNumber(mainContact.whatsapp) || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={geistFont}
                valueWheightClass={"font-medium"}
                valueSizeClass={"text-[15px]"}
                valueLetterSpacing={"tracking-wide"}
              />
            </div>
          </div>
        </div>

        {/* Autres infos */}
        <div
          className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          <SectionHeader
            icon={Briefcase}
            title={isRTL ? "معلومات أخــرى" : "Autre Information"}
            onEdit={() => openDialog("otherInfo")}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          />
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 pb-5">
              <div>
                <label
                  className={`text-start text-sm text-gray-500 dark:text-gray-400 mb-1.5 block ${
                    cardSubtitleFontClass || ""
                  }`}
                >
                  {isRTL ? "الحالة المدنية" : "Statut Marital"}
                </label>
                <p className={`text-gray-900 dark:text-gray-300 text-start ${cardSubtitleFontClass || ""}`}>
                  {formatMaritalStatus()}
                </p>
              </div>
              <Field
                label={isRTL ? "عدد الأطفال" : "Nombre d'enfants"}
                value={employeeData.enfants?.length?.toString() || "0"}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={jazeeraFontClass}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 pt-5 pb-0">
              <Field
                label={isRTL ? "ب . ت . و" : "Carte d'identité"}
                value={employee.cin || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={geistFont}
                valueWheightClass={"font-medium"}
                valueSizeClass={"text-[15px]"}
                valueLetterSpacing={"tracking-wide"}
              />
              <Field
                label={isRTL ? "فصيلة الدم" : "Groupe Sanguin"}
                value={employee.groupe_sanguin || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={geistFont}
                valueWheightClass={"font-normal"}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div
          className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm p-6 animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <SectionHeader
            icon={Tag}
            title={isRTL ? "العــلامــــات" : "Tags"}
            onEdit={() => openDialog("tags")}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          />
          <Field
            label={isRTL ? "العلامات" : "Tags"}
            value={isRTL ? "لا توجد علامات متاحة" : "Aucun tag disponible"}
            labelFontClass={cardSubtitleFontClass}
            valueFontClass={jazeeraFontClass}
          />
        </div>
      </div>

      {/* Composant EditDialogs */}
      <EditDialogs
        data={employeeData}
        onSave={handleSave}
        activeDialog={activeDialog}
        onClose={closeDialog}
        notesDialog={notesDialog}
        setNotesDialog={setNotesDialog}
        showToast={showToast}
      />

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}

// Sous-composants
function SectionHeader({
  icon: Icon,
  title,
  onEdit,
  isRTL,
  titleFontClass,
}: {
  icon: any
  title: string
  onEdit?: () => void
  isRTL?: boolean
  titleFontClass?: string
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className={`flex items-center gap-2`}>
        <Icon className="h-5 w-5 text-[#076784]" />
        <h2 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>{title}</h2>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className={`flex items-center text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer ${
            isRTL ? "space-x-reverse space-x-2" : "space-x-1"
          }`}
        >
          <Edit className="h-4 w-4" />
          <span className={`text-sm ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}>
            {isRTL ? "تعــديــل" : "Modifier"}
          </span>
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  labelFontClass,
  valueFontClass,
  valueWheightClass,
  valueSizeClass,
  valueLetterSpacing,
}: {
  label: string
  value: string
  labelFontClass?: string
  valueFontClass?: string
  valueWheightClass?: string
  valueSizeClass?: string
  valueLetterSpacing?: string
}) {
  return (
    <div>
      <label className={`text-start text-sm text-gray-500 dark:text-gray-400 mb-1.5 block ${labelFontClass || ""}`}>
        {label}
      </label>
      <p
        className={`text-gray-700 dark:text-gray-300 text-start ${valueSizeClass || "text-base"} ${
          valueWheightClass || "font-medium"
        } ${valueFontClass || ""} ${valueLetterSpacing || ""}`}
      >
        {value}
      </p>
    </div>
  )
}

function Divider() {
  return <div className="col-span-full border-t border-gray-200 dark:border-gray-600 my-2" />
}

function BadgeField({ label, value, labelFontClass }: { label: string; value: string; labelFontClass?: string }) {
  return (
    <div className="text-start">
      <label className={`text-sm text-gray-500 dark:text-gray-400 mb-2.5 block ${labelFontClass || ""}`}>{label}</label>
      <span className="bg-[#edf3fa] border border-[#1e80c1] text-sm text-[#1e80c1] px-2 py-1 rounded-full font-medium inline-block">
        {value}
      </span>
    </div>
  )
}

function AddressBlock({
  label,
  value,
  isRTL,
  labelFontClass,
  valueFontClass,
}: {
  label: string
  value: string
  isRTL?: boolean
  labelFontClass?: string
  valueFontClass?: string
}) {
  return (
    <div>
      <label className={`text-start text-sm text-gray-500 dark:text-gray-400 mb-1 block ${labelFontClass || ""}`}>
        {label}
      </label>
      <div className="flex justify-between items-start">
        <p className={`text-gray-900 dark:text-gray-300 text-start max-w-[80%] ${valueFontClass || ""}`}>{value}</p>
        <button
          className={`text-[#076784] hover:text-[#065a72] text-start text-sm flex items-center cursor-pointer whitespace-nowrap ${
            isRTL ? "space-x-reverse space-x-1" : "space-x-1"
          }`}
        >
          <span className={isRTL ? "font-noto-naskh-arabic font-medium" : ""}>
            {isRTL ? "عرض على الخريطة" : "Voir sur la carte"}
          </span>
          <ChevronRight className="h-4 w-4" style={isRTL ? { transform: "scaleX(-1)" } : {}} />
        </button>
      </div>
    </div>
  )
}

function NoteField({
  label,
  note,
  onEdit,
  isRTL,
  labelFontClass,
  valueFontClass,
}: {
  label: string
  note?: string
  onEdit: () => void
  isRTL?: boolean
  labelFontClass?: string
  valueFontClass?: string
}) {
  const hasNote = Boolean(note && note.trim())

  return (
    <div>
      <label className={`text-start text-sm text-gray-500 dark:text-gray-400 mb-1.5 block ${labelFontClass || ""}`}>
        {label}
      </label>
      {hasNote && <p className={`text-gray-900 dark:text-gray-300 text-start mb-2 ${valueFontClass || ""}`}>{note}</p>}
      <button
        onClick={onEdit}
        className={`text-[#076784] -mr-3 text-start hover:text-[#065a72] text-sm cursor-pointer flex items-center ${
          isRTL ? "space-x-reverse space-x-2" : "space-x-1"
        }`}
      >
        <NotebookPen className="h-4 w-4" />
        <span className={isRTL ? "font-noto-naskh-arabic font-medium" : ""}>
          {hasNote ? (isRTL ? "تعديل الملاحظة" : "Modifier la note") : isRTL ? "إضافة ملاحظة" : "Ajouter une note"}
        </span>
      </button>
    </div>
  )
}
