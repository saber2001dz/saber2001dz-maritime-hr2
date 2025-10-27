import { Database } from '@/types/database.types'

export type UniteRow = Database['public']['Tables']['unite']['Row']
export type EmployeeRow = Database['public']['Tables']['employees']['Row']
export type EmployeeAffectationRow = Database['public']['Tables']['employee_affectations']['Row']

export interface OrgChartEmployee {
  id: string
  nom: string
  prenom: string
  grade_actuel: string | null
  unite: string | null
  responsibility: string | null
  hierarchy_level: number | null
  photo_url?: string
}

export interface OrgChartNode {
  id: string
  person: {
    id: string
    avatar: string
    name: string
    title: string
    totalReports: number
  }
  hasChild: boolean
  hasParent: boolean
  children: OrgChartNode[]
  unitInfo?: {
    responsible?: {
      name: string
      title: string
      avatar?: string
    }
    category: string | null
    niveau1: string | null
    niveau2: string | null
    niveau3: string | null
    navigante: boolean | null
    rang: number | null
  }
}

export interface OrgChartData {
  unite: UniteRow
  employees: OrgChartEmployee[]
  children?: OrgChartData[]
}

/**
 * Transforme les données de la base de données en format compatible avec react-org-chart
 */
export function transformToOrgChart(data: OrgChartData[]): OrgChartNode {
  // Trouver le nœud racine (sans parent)
  const rootData = data.find(item => item.unite.parent_id === null)
  if (!rootData) {
    throw new Error('Aucun nœud racine trouvé dans les données')
  }

  return buildNodeRecursive(rootData, data)
}

function buildNodeRecursive(nodeData: OrgChartData, allData: OrgChartData[]): OrgChartNode {
  // Trouver le responsable principal (hierarchy_level le plus bas = le plus haut dans la hiérarchie)
  const mainResponsible = nodeData.employees
    .filter(emp => emp.responsibility && emp.hierarchy_level)
    .sort((a, b) => (a.hierarchy_level || 100) - (b.hierarchy_level || 100))[0]

  // Construire les enfants récursivement
  const children = nodeData.children?.map(childData => 
    buildNodeRecursive(childData, allData)
  ) || []

  // Calculer le nombre total de rapports (employés dans cette unité + enfants)
  const totalReports = nodeData.employees.length + 
    (nodeData.children?.reduce((sum, child) => sum + child.employees.length, 0) || 0)

  const node: OrgChartNode = {
    id: nodeData.unite.id,
    person: {
      id: mainResponsible?.id || nodeData.unite.id,
      avatar: mainResponsible?.photo_url || getDefaultAvatar(nodeData.unite.unite_categorie),
      // Utiliser le nom de l'unité comme nom principal
      name: nodeData.unite.unite || 'غير محدد',
      // Utiliser la catégorie comme titre
      title: nodeData.unite.unite_categorie || 'وحدة',
      totalReports
    },
    hasChild: children.length > 0,
    hasParent: nodeData.unite.parent_id !== null,
    children,
    // Ajouter des informations spécifiques à l'unité
    unitInfo: {
      responsible: mainResponsible ? {
        name: `${mainResponsible.prenom} ${mainResponsible.nom}`,
        title: mainResponsible.responsibility || 'مسؤول',
        avatar: mainResponsible.photo_url
      } : undefined,
      category: nodeData.unite.unite_categorie,
      niveau1: nodeData.unite.niveau_1,
      niveau2: nodeData.unite.niveau_2,
      niveau3: nodeData.unite.niveau_3,
      navigante: nodeData.unite.navigante,
      rang: nodeData.unite.unite_rang
    }
  }

  return node
}

/**
 * Groupe les données par hiérarchie parent-enfant
 */
export function groupByHierarchy(
  unites: UniteRow[],
  employees: OrgChartEmployee[]
): OrgChartData[] {
  // Créer une map des unités par ID pour un accès rapide
  const uniteMap = new Map<string, UniteRow>()
  unites.forEach(unite => uniteMap.set(unite.id, unite))

  // Grouper les employés par unité
  const employeesByUnite = new Map<string, OrgChartEmployee[]>()
  employees.forEach(emp => {
    if (emp.unite) {
      // Trouver l'ID de l'unité par son nom
      const unite = unites.find(u => u.unite === emp.unite)
      if (unite) {
        const existing = employeesByUnite.get(unite.id) || []
        employeesByUnite.set(unite.id, [...existing, emp])
      }
    }
  })

  // Construire la structure hiérarchique
  const result: OrgChartData[] = []
  const processedIds = new Set<string>()

  function buildHierarchy(unite: UniteRow): OrgChartData {
    if (processedIds.has(unite.id)) {
      return {
        unite,
        employees: employeesByUnite.get(unite.id) || []
      }
    }

    processedIds.add(unite.id)

    // Trouver les enfants directs
    const children = unites
      .filter(u => u.parent_id === unite.id)
      .sort((a, b) => (a.unite_rang || 999) - (b.unite_rang || 999))
      .map(childUnite => buildHierarchy(childUnite))

    return {
      unite,
      employees: employeesByUnite.get(unite.id) || [],
      children: children.length > 0 ? children : undefined
    }
  }

  // Commencer par les nœuds racines
  const rootUnites = unites
    .filter(u => u.parent_id === null)
    .sort((a, b) => (a.unite_rang || 999) - (b.unite_rang || 999))

  rootUnites.forEach(rootUnite => {
    result.push(buildHierarchy(rootUnite))
  })

  return result
}

/**
 * Obtient un avatar par défaut basé sur le type d'unité
 */
function getDefaultAvatar(uniteCategorie: string | null): string {
  const defaultAvatars: Record<string, string> = {
    'إدارة حرس السواحل': '/avatars/direction.png',
    'إقليم بحري': '/avatars/region.png',
    'منطقة بحرية': '/avatars/zone.png',
    'إدارة فرعية': '/avatars/department.png',
    'طوافة سريعة 35 متر': '/avatars/patrol-boat.png',
    'فرقة بحرية': '/avatars/brigade.png',
    'خافرة 23 متر': '/avatars/coast-guard.png',
    'خافرة 20 متر': '/avatars/coast-guard.png',
    'خافرة 17 متر': '/avatars/coast-guard.png',
    'مركز بحري': '/avatars/center.png',
    'برج مراقبة': '/avatars/tower.png',
    'محطة رصد': '/avatars/station.png'
  }

  return defaultAvatars[uniteCategorie || ''] || '/avatars/default.png'
}

/**
 * Filtre les données par région ou type d'unité
 */
export function filterOrgChartData(
  data: OrgChartData[],
  filter: {
    niveau1?: string
    uniteCategorie?: string
    searchTerm?: string
  }
): OrgChartData[] {
  return data.filter(item => {
    let matches = true

    if (filter.niveau1 && item.unite.niveau_1 !== filter.niveau1) {
      matches = false
    }

    if (filter.uniteCategorie && item.unite.unite_categorie !== filter.uniteCategorie) {
      matches = false
    }

    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase()
      const uniteName = item.unite.unite?.toLowerCase() || ''
      const employeeNames = item.employees.map(emp => 
        `${emp.prenom} ${emp.nom}`.toLowerCase()
      ).join(' ')
      
      if (!uniteName.includes(searchLower) && !employeeNames.includes(searchLower)) {
        matches = false
      }
    }

    return matches
  })
}