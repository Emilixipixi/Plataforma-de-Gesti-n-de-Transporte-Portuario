import { useMemo } from 'react'
import type { Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { InsigniaConIncidencia, InsigniaEstadoViaje, InsigniaRetrasado } from '@/componentes/comunes/Insignia'
import { esViajeAbierto, estaRetrasado, tieneIncidenciaAbierta } from '@/utilidades/calculos'

export function usarAlertasViaje(viaje: Viaje) {
  const { datos } = usarApp()
  const ahora = useMemo(() => new Date(), [])
  return {
    conIncidencia: tieneIncidenciaAbierta(viaje.codigo, datos.incidencias),
    retrasado: esViajeAbierto(viaje) && estaRetrasado(viaje, datos.eventos, ahora),
  }
}

export function InsigniasViaje({ viaje }: { viaje: Viaje }) {
  const { conIncidencia, retrasado } = usarAlertasViaje(viaje)
  return (
    <span className="inline-flex flex-wrap gap-1">
      <InsigniaEstadoViaje estado={viaje.estado} />
      {conIncidencia && <InsigniaConIncidencia />}
      {retrasado && <InsigniaRetrasado />}
    </span>
  )
}
