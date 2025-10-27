// app/dashboard/unite/details/[id]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RawUniteData } from "@/types/unite.types"
import SimpleUniteDetails from "./SimpleUniteDetails"
import { Metadata } from "next"

interface UnitePhoto {
  id: string
  unite_id: string
  photo_url: string
  description: string | null
  created_at: string
  updated_at: string | null
}

interface AgentData {
  id: string
  prenom: string
  nom: string
  matricule: string
  responsibility: string | null
  date_responsabilite: string | null
  photo_url: string | null
  employee_grade: string | null
  phone_1: string | null
  sexe: string | null
  telex_debut: string | null
}

interface UniteCompleteData {
  unite: RawUniteData
  photos: UnitePhoto[]
  agents: AgentData[]
}

// Métadonnées
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: unite } = await supabase
    .from("unite")
    .select("unite, unite_categorie")
    .eq("id", id)
    .single()

  const uniteName = unite ? `${unite.unite}` : 'Unité'
  
  return {
    title: `${uniteName} | Maritime HR`,
    description: `Détails de l'unité ${uniteName} - ${unite?.unite_categorie || 'Unité maritime'}`,
  }
}

export const dynamic = 'force-dynamic'

const fetchUniteData = async (uniteId: string): Promise<UniteCompleteData | null> => {
  const supabase = await createClient()
  
  try {
    // Récupération de l'unité
    const { data: unite, error: uniteError } = await supabase
      .from("unite")
      .select("*")
      .eq("id", uniteId)
      .single()
    
    if (uniteError) throw uniteError

    // Récupération des données associées en parallèle
    const [
      { data: photos },
      { data: agents }
    ] = await Promise.all([
      supabase
        .from("unite_photos")
        .select("*")
        .eq("unite_id", uniteId)
        .order("created_at", { ascending: false }),
      
      supabase.rpc('get_unite_agents', {
        unite_name: unite.unite
      })
    ])

    return {
      unite,
      photos: photos || [],
      agents: agents || [],
    }
  } catch (error) {
    console.error("Erreur fetching unite details:", error)
    return null
  }
}

export default async function UniteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: uniteId } = await params
  
  const uniteData = await fetchUniteData(uniteId)

  if (!uniteData) {
    redirect("/dashboard/unite/table")
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <SimpleUniteDetails initialData={uniteData} uniteId={uniteId} />
    </div>
  )
}