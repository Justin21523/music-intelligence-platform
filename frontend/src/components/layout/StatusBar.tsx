import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/api/endpoints'
import { Wifi, WifiOff } from 'lucide-react'

export function StatusBar() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: 1,
  })

  const ok = !isError && data?.status === 'ok'

  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: ok ? '#22d3ee' : '#f87171' }}>
      {ok ? <Wifi size={13} /> : <WifiOff size={13} />}
      <span>{ok ? `API ok · ${data.models_loaded.length} models` : 'API offline'}</span>
    </div>
  )
}
