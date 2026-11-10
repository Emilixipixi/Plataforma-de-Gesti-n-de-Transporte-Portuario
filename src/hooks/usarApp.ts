import { useContext } from 'react'
import { ContextoApp, type ValorContextoApp } from '@/contexto/ContextoApp'

export function usarApp(): ValorContextoApp {
  const contexto = useContext(ContextoApp)
  if (!contexto) throw new Error('usarApp debe usarse dentro de ProveedorApp.')
  return contexto
}
