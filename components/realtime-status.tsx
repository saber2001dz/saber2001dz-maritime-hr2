'use client'

import { useRealtimeConnection } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { useRealtimeStore } from '@/stores/realtime-store'

export function RealtimeStatus() {
  const { 
    status, 
    isConnected, 
    isConnecting, 
    connectionError, 
    lastPing,
    isHealthy 
  } = useRealtimeConnection()
  
  const reconnect = useRealtimeStore((state) => state.connect)

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          variant: isHealthy ? 'default' : 'secondary',
          icon: Wifi,
          text: isHealthy ? 'En ligne' : 'Connexion lente',
          className: isHealthy ? 'bg-green-500' : 'bg-yellow-500'
        }
      case 'connecting':
        return {
          variant: 'secondary',
          icon: RefreshCw,
          text: 'Connexion...',
          className: 'bg-blue-500 animate-pulse'
        }
      case 'error':
        return {
          variant: 'destructive',
          icon: AlertTriangle,
          text: 'Erreur',
          className: 'bg-red-500'
        }
      default:
        return {
          variant: 'outline',
          icon: WifiOff,
          text: 'Hors ligne',
          className: 'bg-gray-500'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">Statut Realtime</div>
      <div className="text-sm">
        État: {config.text}
      </div>
      {lastPing && (
        <div className="text-sm">
          Dernière activité: {new Date(lastPing).toLocaleTimeString()}
        </div>
      )}
      {connectionError && (
        <div className="text-sm text-red-400">
          Erreur: {connectionError}
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge 
              variant={config.variant as any}
              className={`${config.className} text-white flex items-center gap-1`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{config.text}</span>
            </Badge>
            {(status === 'error' || status === 'disconnected') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reconnect()}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}