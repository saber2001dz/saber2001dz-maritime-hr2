import { OrgChartNode } from './orgchart.utils'

export interface UnitTreeNode {
  id: string
  name: string
  category: string
  level: number
  children: UnitTreeNode[]
  isExpanded?: boolean
  parentId?: string
  hasChildren: boolean
  employeeCount: number
}

/**
 * Convertit les données OrgChartNode en structure d'arbre simple pour les unités
 */
export function convertToUnitTree(data: OrgChartNode): UnitTreeNode {
  function buildTree(node: OrgChartNode, level: number = 0, parentId?: string): UnitTreeNode {
    const hasChildren = node.children && node.children.length > 0
    
    return {
      id: node.id,
      name: node.person.name,
      category: node.unitInfo?.category || node.person.title,
      level,
      parentId,
      hasChildren,
      employeeCount: node.person.totalReports,
      isExpanded: level <= 1 ? true : false, // Root et premier niveau ouverts par défaut
      children: hasChildren ? node.children.map(child => buildTree(child, level + 1, node.id)) : []
    }
  }

  return buildTree(data)
}

/**
 * Met à jour l'état d'expansion d'un nœud dans l'arbre
 */
export function toggleNodeExpansion(tree: UnitTreeNode, nodeId: string): UnitTreeNode {
  if (tree.id === nodeId) {
    return {
      ...tree,
      isExpanded: !tree.isExpanded
    }
  }

  return {
    ...tree,
    children: tree.children.map(child => toggleNodeExpansion(child, nodeId))
  }
}

/**
 * Obtient la couleur selon le niveau hiérarchique
 */
export function getUnitLevelColor(level: number, category: string) {
  // Couleurs spéciales pour certains types d'unités
  if (category.includes('طوافة') || category.includes('خافرة') || category.includes('زورق')) {
    return {
      bg: 'bg-gradient-to-r from-green-600 to-green-500',
      border: 'border-green-400',
      text: 'text-white'
    }
  }

  if (category.includes('فرقة')) {
    return {
      bg: 'bg-gradient-to-r from-orange-500 to-orange-400', 
      border: 'border-orange-400',
      text: 'text-white'
    }
  }

  // Couleurs par niveau hiérarchique
  switch (level) {
    case 0:
      return {
        bg: 'bg-gradient-to-r from-blue-900 to-blue-800',
        border: 'border-blue-700',
        text: 'text-white'
      }
    case 1:
      return {
        bg: 'bg-gradient-to-r from-blue-700 to-blue-600',
        border: 'border-blue-500',
        text: 'text-white'
      }
    case 2:
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-400',
        border: 'border-blue-400',
        text: 'text-white'
      }
    case 3:
      return {
        bg: 'bg-gradient-to-r from-blue-400 to-blue-300',
        border: 'border-blue-300',
        text: 'text-blue-900'
      }
    default:
      return {
        bg: 'bg-gradient-to-r from-slate-500 to-slate-400',
        border: 'border-slate-400',
        text: 'text-white'
      }
  }
}

/**
 * Calcule la largeur totale nécessaire pour afficher l'arbre
 */
export function calculateTreeDimensions(tree: UnitTreeNode): { width: number; height: number } {
  const nodeWidth = 280
  const nodeHeight = 80
  const horizontalSpacing = 40
  const verticalSpacing = 30

  function getMaxDepth(node: UnitTreeNode): number {
    if (!node.children.length || !node.isExpanded) return 1
    return 1 + Math.max(...node.children.map(child => getMaxDepth(child)))
  }

  function getVisibleNodeCount(node: UnitTreeNode): number {
    let count = 1
    if (node.isExpanded && node.children.length > 0) {
      count += node.children.reduce((sum, child) => sum + getVisibleNodeCount(child), 0)
    }
    return count
  }

  const maxDepth = getMaxDepth(tree)
  const visibleNodes = getVisibleNodeCount(tree)

  return {
    width: maxDepth * (nodeWidth + horizontalSpacing),
    height: Math.max(visibleNodes * (nodeHeight + verticalSpacing), 400)
  }
}