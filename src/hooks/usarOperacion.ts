import { useCallback } from 'react'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import type { ResultadoAplicacion } from '@/contexto/ContextoApp'
import type { Operacion } from '@/servicios/operaciones/tipos'

export function usarOperacion() {
  const { aplicar } = usarApp()
  const { usuario } = usarAutenticacion()
  return useCallback(
    <T,>(operacion: Operacion<T>): ResultadoAplicacion<T> => {
      if (!usuario) return { ok: false, error: 'No hay una sesión activa.' }
      return aplicar(operacion, usuario.codigo)
    },
    [aplicar, usuario],
  )
}
