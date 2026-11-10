import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DatosApp } from '@/tipos/dominio'
import { cargarDatos, persistir, restablecerDatos } from '@/servicios/repositorio'
import { registrarActividades } from '@/servicios/actividad'
import type { Operacion, ResultadoOperacion } from '@/servicios/operaciones/tipos'
import { ahoraIso } from '@/utilidades/fechas'

export type ResultadoAplicacion<T> = { ok: true; valor: T; mensaje?: string } | { ok: false; error: string }

export interface ValorContextoApp {
  datos: DatosApp
  regeneradoAlIniciar: boolean
  aplicar: <T>(operacion: Operacion<T>, usuarioCodigo: string) => ResultadoAplicacion<T>
  restablecer: (usuarioCodigo?: string) => void
}

export const ContextoApp = createContext<ValorContextoApp | null>(null)

export function ProveedorApp({ children }: { children: ReactNode }) {
  const [inicial] = useState(cargarDatos)
  const [datos, establecerDatos] = useState<DatosApp>(inicial.datos)
  const referencia = useRef<DatosApp>(inicial.datos)

  const confirmar = useCallback((nuevos: DatosApp) => {
    referencia.current = nuevos
    persistir(nuevos)
    establecerDatos(nuevos)
  }, [])

  const aplicar = useCallback(
    <T,>(operacion: Operacion<T>, usuarioCodigo: string): ResultadoAplicacion<T> => {
      const resultado: ResultadoOperacion<T> = operacion(referencia.current, { usuarioCodigo, ahora: ahoraIso() })
      if (!resultado.ok) return { ok: false, error: resultado.error }
      const ahora = ahoraIso()
      const entradas = resultado.actividad.map((entrada) => ({ ...entrada, fechaHora: entrada.fechaHora ?? ahora }))
      confirmar(registrarActividades(resultado.datos, entradas))
      return resultado.mensaje === undefined
        ? { ok: true, valor: resultado.valor }
        : { ok: true, valor: resultado.valor, mensaje: resultado.mensaje }
    },
    [confirmar],
  )

  const restablecer = useCallback(
    (usuarioCodigo?: string) => {
      const nuevos = restablecerDatos(new Date())
      const conRegistro = usuarioCodigo
        ? registrarActividades(nuevos, [
            {
              usuarioCodigo,
              accion: 'restablecimiento',
              entidad: 'sistema',
              codigoEntidad: 'DATOS',
              descripcion: 'Datos demostrativos restablecidos con la fecha vigente.',
              fechaHora: ahoraIso(),
            },
          ])
        : nuevos
      confirmar(conRegistro)
    },
    [confirmar],
  )

  const valor = useMemo<ValorContextoApp>(
    () => ({ datos, regeneradoAlIniciar: inicial.regenerado, aplicar, restablecer }),
    [datos, inicial.regenerado, aplicar, restablecer],
  )

  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>
}
