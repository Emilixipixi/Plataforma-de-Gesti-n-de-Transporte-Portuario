import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function usarVolver(rutaRespaldo: string): () => void {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  return useCallback(() => {
    if (ubicacion.key !== 'default' && window.history.length > 1) navegar(-1)
    else navegar(rutaRespaldo)
  }, [navegar, ubicacion.key, rutaRespaldo])
}
