import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { usarAlertas } from '@/hooks/usarAlertas'
import { usarClicFuera } from '@/hooks/usarClicFuera'
import type { Tono } from '@/utilidades/constantes'

const PUNTO_TONO: Record<Tono, string> = {
  peligro: 'bg-peligro',
  pendiente: 'bg-pendiente',
  info: 'bg-info',
  exito: 'bg-exito',
  neutro: 'bg-texto-secundario',
}

export function PanelNotificaciones() {
  const alertas = usarAlertas()
  const [abierto, establecerAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const cerrar = useCallback(() => establecerAbierto(false), [])
  usarClicFuera(contenedor, abierto, cerrar)

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => establecerAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={`Notificaciones (${alertas.length})`}
        className="relative grid place-items-center size-9 rounded-md text-barra-texto hover:bg-barra-hover hover:text-sobre-primario"
      >
        <Bell className="size-4.5" aria-hidden="true" />
        {alertas.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-acento text-barra text-[10px] font-bold grid place-items-center">
            {alertas.length > 99 ? '99+' : alertas.length}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 bg-superficie border border-borde rounded-md shadow-lg">
          <div className="px-3 py-2.5 border-b border-borde">
            <p className="text-sm font-semibold text-texto">Notificaciones</p>
            <p className="text-xs text-texto-secundario">Calculadas a partir de los datos actuales.</p>
          </div>
          {alertas.length === 0 ? (
            <p className="px-3 py-4 text-sm text-texto-secundario">No hay alertas pendientes.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-borde">
              {alertas.map((alerta) => (
                <li key={alerta.id}>
                  <Link to={alerta.ruta} onClick={cerrar} className="flex gap-2.5 px-3 py-2.5 hover:bg-fondo">
                    <span className={`mt-1.5 size-2 rounded-full shrink-0 ${PUNTO_TONO[alerta.tono]}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-texto">{alerta.titulo}</span>
                      <span className="block text-xs text-texto-secundario line-clamp-2">{alerta.descripcion}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
