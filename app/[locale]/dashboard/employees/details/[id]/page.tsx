// page.tsx
import { EmployeeCompleteData } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import SimpleEmployeeProfile from "./SimpleEmployeeProfile"

const fetchEmployeeData = async (employeeId: string) => {
  const supabase = await createClient()
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
      { data: affectations },
      { data: banque },
      { data: conges },
      { data: contacts },
      { data: enfants },
      { data: etat_civil },
      { data: fonctions },
      { data: formations },
      { data: grades },
      { data: notes_annuelles },
      { data: parcours_scolaire },
      { data: photos },
      { data: recompenses },
      { data: rendements },
      { data: sanctions },
      { data: urgent_contacts },
    ] = await Promise.all([
      supabase
        .from("employee_absence")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date_debut", { ascending: false }),
      supabase
        .from("employee_affectations")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date_responsabilite", { ascending: false }),
      supabase.from("employee_banque").select("*").eq("employee_id", employeeId),
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
        .from("employee_note_annuelle")
        .select("*")
        .eq("employee_id", employeeId)
        .order("annee", { ascending: false }),
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
        .order("annee", { ascending: false })
        .order("trimestre", { ascending: false }),
      supabase
        .from("employee_sanctions")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date_sanction", { ascending: false }),
      supabase.from("employee_urgent_contacts").select("*").eq("employee_id", employeeId),
    ])

    return {
      employee,
      absences: absences || [],
      affectations: affectations || [],
      banque: banque || [],
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
    } as EmployeeCompleteData
  } catch (error) {
    console.error("Erreur de récupération des données:", error)
    return null
  }
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  // Attendre params avant d'accéder à ses propriétés
  const { locale, id: employeeId } = await params
  const t = await getTranslations()
  
  const employeeData = await fetchEmployeeData(employeeId)

  if (!employeeData) {
    redirect("/dashboard/employees/table")
  }

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ backgroundColor: "#F4F5F9" }}>
      <SimpleEmployeeProfile initialData={employeeData} employeeId={employeeId} />
    </div>
  )
}