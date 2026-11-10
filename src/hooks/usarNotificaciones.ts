import { useContext } from 'react'
import { ContextoNotificaciones, type ValorContextoNotificaciones } from '@/contexto/ContextoNotificaciones'

export function usarNotificaciones(): ValorContextoNotificaciones {
  const contexto = useContext(ContextoNotificaciones)
  if (!contexto) throw new Error('usarNotificaciones debe usarse dentro de ProveedorNotificaciones.')
  return contexto
}
