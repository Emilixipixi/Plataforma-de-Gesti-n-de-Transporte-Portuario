import { useContext } from 'react'
import { ContextoAutenticacion, type ValorContextoAutenticacion } from '@/contexto/ContextoAutenticacion'

export function usarAutenticacion(): ValorContextoAutenticacion {
  const contexto = useContext(ContextoAutenticacion)
  if (!contexto) throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion.')
  return contexto
}
