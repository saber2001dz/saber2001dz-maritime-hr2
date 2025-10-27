"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CongeByType {
  type_conge: string
  nombre_employees: number
  nombre_conges: number
}

export interface UseCongesByTypeReturn {
  congesByType: CongeByType[]
  isLoading: boolean
  error: string | null
  totalEmployees: number
}

export function useCongesByType(): UseCongesByTypeReturn {
  const [congesByType, setCongesByType] = useState<CongeByType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCongesByType = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Récupérer les congés en cours groupés par type
      const { data, error: queryError } = await supabase
        .from('employee_conges')
        .select('type_conge, employee_id')
        .eq('statut', 'قيد التنفيذ')
        .lte('date_debut', new Date().toISOString().split('T')[0])
        .gte('date_fin', new Date().toISOString().split('T')[0])
      
      if (queryError) {
        throw queryError
      }
      
      // Grouper par type_conge et compter les employés uniques
      const groupedData = data?.reduce((acc: { [key: string]: Set<string> }, item) => {
        if (item.type_conge) {
          if (!acc[item.type_conge]) {
            acc[item.type_conge] = new Set()
          }
          acc[item.type_conge].add(item.employee_id)
        }
        return acc
      }, {}) || {}
      
      // Convertir en format attendu
      const result = Object.entries(groupedData).map(([type_conge, employeeIds]) => ({
        type_conge,
        nombre_employees: (employeeIds as Set<string>).size,
        nombre_conges: (employeeIds as Set<string>).size // Pour l'instant, 1 congé par employé
      }))
      
      // Ajouter les types sans congés avec 0
      const allTypes = ['سنوية', 'مرض', 'طارئة', 'زواج', 'أمومة', 'بدون راتب']
      const completeResult = allTypes.map(type => {
        const found = result.find(item => item.type_conge === type)
        return found || {
          type_conge: type,
          nombre_employees: 0,
          nombre_conges: 0
        }
      })
      
      setCongesByType(completeResult)
      
    } catch (err) {
      console.error('Erreur lors du chargement des congés par type:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCongesByType()
  }, [])

  const totalEmployees = congesByType.reduce((sum, item) => sum + item.nombre_employees, 0)

  return {
    congesByType,
    isLoading,
    error,
    totalEmployees
  }
}