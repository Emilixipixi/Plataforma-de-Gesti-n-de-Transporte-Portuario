import { createContext, useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export type TipoNotificacion = 'exito' | 'error' | 'advertencia' | 'info'

interface Notificacion {
  id: number
  tipo: TipoNotificacion
  titulo: string
  detalle?: string
}

export interface ValorContextoNotificaciones {
  notificar: (tipo: TipoNotificacion, titulo: string, detalle?: string) => void
}

export const ContextoNotificaciones = createContext<ValorContextoNotificaciones | null>(null)

const DURACION_MS = 4500

const ESTILOS: Record<TipoNotificacion, { icono: ComponentType<LucideProps>; borde: string; color: string }> = {
  exito: { icono: CheckCircle2, borde: 'border-l-exito', color: 'text-exito' },
  error: { icono: XCircle, borde: 'border-l-peligro', color: 'text-peligro' },
  advertencia: { icono: AlertTriangle, borde: 'border-l-pendiente', color: 'text-pendiente' },
  info: { icono: Info, borde: 'border-l-info', color: 'text-info' },
}

export function ProveedorNotificaciones({ children }: { children: ReactNode }) {
  const [lista, establecerLista] = useState<Notificacion[]>([])
  const siguienteId = useRef(1)

  const descartar = useCallback((id: number) => {
    establecerLista((actual) => actual.filter((n) => n.id !== id))
  }, [])

  const notificar = useCallback(
    (tipo: TipoNotificacion, titulo: string, detalle?: string) => {
      const id = siguienteId.current++
      establecerLista((actual) => [...actual.slice(-3), detalle === undefined ? { id, tipo, titulo } : { id, tipo, titulo, detalle }])
      window.setTimeout(() => descartar(id), DURACION_MS)
    },
    [descartar],
  )

  const valor = useMemo(() => ({ notificar }), [notificar])

  return (
    <ContextoNotificaciones.Provider value={valor}>
      {children}
      <div className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2" aria-live="polite" aria-atomic="false">
        {lista.map((n) => {
          const { icono: Icono, borde, color } = ESTILOS[n.tipo]
          return (
            <div key={n.id} role={n.tipo === 'error' ? 'alert' : 'status'} className={`bg-superficie border border-borde border-l-4 rounded-md shadow-md px-3 py-2.5 flex items-start gap-2.5 ${borde}`}>
              <Icono className={`size-4 mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium text-texto">{n.titulo}</p>
                {n.detalle && <p className="text-texto-secundario mt-0.5">{n.detalle}</p>}
              </div>
              <button type="button" onClick={() => descartar(n.id)} className="text-texto-secundario hover:text-texto rounded p-0.5" aria-label="Cerrar notificación">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ContextoNotificaciones.Provider>
  )
}
