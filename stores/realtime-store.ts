import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { RawEmployeeData } from '@/types/employeeTable.types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

interface RealtimeState {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  lastPing: number | null
  
  // Data state
  employees: RawEmployeeData[]
  isLoading: boolean
  error: string | null
  
  // Dashboard refresh callbacks
  dashboardRefreshCallbacks: (() => void)[]
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  loadEmployees: () => Promise<void>
  setEmployees: (employees: RawEmployeeData[]) => void
  updateEmployee: (employee: RawEmployeeData) => void
  addEmployee: (employee: RawEmployeeData) => void
  removeEmployee: (id: string) => void
  
  // Dashboard refresh management
  addDashboardRefreshCallback: (callback: () => void) => void
  removeDashboardRefreshCallback: (callback: () => void) => void
  triggerDashboardRefresh: () => void
  
  // Internal
  channel: RealtimeChannel | null
  setChannel: (channel: RealtimeChannel | null) => void
  setConnectionState: (connected: boolean, connecting?: boolean, error?: string | null) => void
}

export const useRealtimeStore = create<RealtimeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    lastPing: null,
    employees: [],
    isLoading: false,
    error: null,
    channel: null,
    dashboardRefreshCallbacks: [],

    // Connection management
    connect: async () => {
      const { isConnected, isConnecting, channel } = get()
      
      if (isConnected || isConnecting) return
      
      set({ isConnecting: true, connectionError: null })
      
      try {
        const supabase = createClient()
        
        // Ensure auth is set
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await supabase.realtime.setAuth(session.access_token)
        }
        
        // Clean up existing channel
        if (channel) {
          await supabase.removeChannel(channel)
        }
        
        // Create new channel
        const newChannel = supabase
          .channel('employees_realtime')
          .on('presence', { event: 'sync' }, () => {
            set({ lastPing: Date.now() })
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'employees'
            },
            (payload: RealtimePostgresChangesPayload<RawEmployeeData>) => {
              handleEmployeeChange(payload)
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'employee_grades'
            },
            () => {
              // Reload employees when grades change to update latest grade
              get().loadEmployees()
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'employee_affectations'
            },
            () => {
              // Reload employees when affectations change
              get().loadEmployees()
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'employee_statistics'
            },
            () => {
              // Trigger dashboard refresh when employee statistics are updated
              console.log('Employee statistics updated, triggering dashboard refresh')
              get().triggerDashboardRefresh()
            }
          )
        
        // Subscribe to channel
        newChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            set({ 
              isConnected: true, 
              isConnecting: false, 
              connectionError: null,
              lastPing: Date.now()
            })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            set({ 
              isConnected: false, 
              isConnecting: false, 
              connectionError: `Connection failed: ${status}`
            })
          } else if (status === 'CLOSED') {
            set({ 
              isConnected: false, 
              isConnecting: false
            })
          }
        })
        
        set({ channel: newChannel })
        
        // Load initial data
        await get().loadEmployees()
        
      } catch (error) {
        console.error('Realtime connection error:', error)
        set({ 
          isConnected: false, 
          isConnecting: false, 
          connectionError: error instanceof Error ? error.message : 'Connection failed'
        })
      }
    },

    disconnect: () => {
      const { channel } = get()
      
      if (channel) {
        const supabase = createClient()
        supabase.removeChannel(channel)
      }
      
      set({ 
        isConnected: false, 
        isConnecting: false, 
        channel: null,
        connectionError: null
      })
    },

    // Data management
    loadEmployees: async () => {
      set({ isLoading: true, error: null })
      
      try {
        const supabase = createClient()
        console.log('Starting employee query...')
        
        // Check auth session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('Auth session check:', {
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id,
          userEmail: sessionData?.session?.user?.email,
          accessToken: sessionData?.session?.access_token ? 'present' : 'missing',
          sessionError: sessionError
        })
        
        if (!sessionData?.session) {
          throw new Error('No active session - user not authenticated')
        }
        
        if (!sessionData.session.access_token) {
          throw new Error('No access token in session')
        }
        
        // Try simple query first
        const { data: simpleData, error: simpleError } = await supabase
          .from('employees')
          .select('id, nom, prenom')
          .limit(1)
        
        console.log('Simple query result:', { data: simpleData, error: simpleError })
        
        if (simpleError) {
          throw simpleError
        }
        
        // If simple query works, try full query
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            employee_grades (
              grade,
              date_grade,
              id
            ),
            employee_affectations (
              unite,
              responsibility,
              date_responsabilite,
              id
            )
          `)
          .order('created_at', { ascending: false })
        
        console.log('Query completed, data:', data?.length, 'error:', error)
        
        if (error) {
          console.error('Supabase query error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            error
          })
          throw error
        }
        
        // Process employees with latest grade and affectation
        const processedEmployees = data?.map((employee: any) => ({
          ...employee,
          latest_grade: employee.employee_grades?.[0] || null,
          latest_affectation: employee.employee_affectations?.[0] || null
        })) || []
        
        set({ employees: processedEmployees, isLoading: false })
        
      } catch (error) {
        console.error('Error loading employees:', error)
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
          ? error 
          : 'Failed to load employees'
        set({ 
          error: errorMessage,
          isLoading: false
        })
      }
    },

    // Employee management
    setEmployees: (employees) => set({ employees }),
    
    updateEmployee: (updatedEmployee) => {
      set((state) => ({
        employees: state.employees.map(emp => 
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        )
      }))
    },
    
    addEmployee: (newEmployee) => {
      set((state) => ({
        employees: [newEmployee, ...state.employees]
      }))
    },
    
    removeEmployee: (id) => {
      set((state) => ({
        employees: state.employees.filter(emp => emp.id !== id)
      }))
    },

    // Dashboard refresh management
    addDashboardRefreshCallback: (callback) => {
      set((state) => ({
        dashboardRefreshCallbacks: [...state.dashboardRefreshCallbacks, callback]
      }))
    },
    
    removeDashboardRefreshCallback: (callback) => {
      set((state) => ({
        dashboardRefreshCallbacks: state.dashboardRefreshCallbacks.filter(cb => cb !== callback)
      }))
    },
    
    triggerDashboardRefresh: () => {
      const { dashboardRefreshCallbacks } = get()
      dashboardRefreshCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Error in dashboard refresh callback:', error)
        }
      })
    },

    // Internal setters
    setChannel: (channel) => set({ channel }),
    
    setConnectionState: (connected, connecting = false, error = null) => {
      set({ 
        isConnected: connected, 
        isConnecting: connecting, 
        connectionError: error
      })
    }
  }))
)

// Handle realtime employee changes
function handleEmployeeChange(payload: RealtimePostgresChangesPayload<RawEmployeeData>) {
  const { eventType, new: newRecord, old: oldRecord } = payload
  const store = useRealtimeStore.getState()
  
  switch (eventType) {
    case 'INSERT':
      if (newRecord) {
        // Load fresh data to get relations
        store.loadEmployees()
      }
      break
      
    case 'UPDATE':
      if (newRecord) {
        // Load fresh data to get updated relations
        store.loadEmployees()
      }
      break
      
    case 'DELETE':
      if (oldRecord?.id) {
        store.removeEmployee(oldRecord.id)
      }
      break
  }
}

// Auto-reconnect on auth changes
if (typeof window !== 'undefined') {
  const supabase = createClient()
  
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    const store = useRealtimeStore.getState()
    
    if (event === 'SIGNED_IN' && session) {
      store.connect()
    } else if (event === 'SIGNED_OUT') {
      store.disconnect()
    }
  })
}