import { useEffect } from 'react'
import { useRealtimeStore } from '@/stores/realtime-store'

export function useRealtime() {
  const {
    isConnected,
    isConnecting,
    connectionError,
    lastPing,
    connect,
    disconnect
  } = useRealtimeStore()

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    isConnecting,
    connectionError,
    lastPing,
    reconnect: connect
  }
}

export function useRealtimeEmployees() {
  const {
    employees,
    isLoading,
    error,
    loadEmployees,
    updateEmployee,
    addEmployee,
    removeEmployee
  } = useRealtimeStore()

  return {
    employees,
    isLoading,
    error,
    refetch: loadEmployees,
    updateEmployee,
    addEmployee,
    removeEmployee
  }
}

export function useRealtimeConnection() {
  const {
    isConnected,
    isConnecting,
    connectionError,
    lastPing
  } = useRealtimeStore()

  const status = isConnecting 
    ? 'connecting'
    : isConnected
    ? 'connected'
    : connectionError
    ? 'error'
    : 'disconnected'

  return {
    status,
    isConnected,
    isConnecting,
    connectionError,
    lastPing,
    isHealthy: isConnected && lastPing && (Date.now() - lastPing < 30000) // 30s timeout
  }
}