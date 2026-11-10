import { CheckCircle2, Circle, CircleDot, Paperclip } from 'lucide-react'
import type { Evento, Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { Insignia } from '@/componentes/comunes/Insignia'
import { nombreUsuario } from '@/servicios/consultas'
import { desvioEnMinutos, esViajeAbierto, eventosDeViaje, secuenciaDeHitos } from '@/utilidades/calculos'
import { HITO_REQUERIDO_PARA_CIERRE } from '@/utilidades/constantes'
import { formatearDesvio, formatearFechaHora } from '@/utilidades/formateadores'

interface Paso {
  clave: string
  nombre: string
  evento?: Evento
  adicional: boolean
}

function Desvio({ evento }: { evento: Evento }) {
  const minutos = desvioEnMinutos(evento.horaPrevista, evento.horaReal)
  if (minutos === null) return null
  return (
    <Insignia tono={minutos > 0 ? 'peligro' : 'exito'}>
      {minutos > 0 ? `Retraso ${formatearDesvio(minutos)}` : minutos === 0 ? 'A tiempo' : `A tiempo (${formatearDesvio(minutos)})`}
    </Insignia>
  )
}

export function LineaTiempo({ viaje }: { viaje: Viaje }) {
  const { datos } = usarApp()
  const eventos = eventosDeViaje(viaje.codigo, datos.eventos)
  const secuencia = secuenciaDeHitos(viaje.modalidad, datos.tiposEvento)
  const codigosSecuencia = new Set(secuencia.map((h) => h.codigo))
  const pasos: Paso[] = [
    ...secuencia.map((hito) => {
      const evento = eventos.find((e) => e.tipoEventoCodigo === hito.codigo)
      return { clave: hito.codigo, nombre: hito.nombre, adicional: false, ...(evento ? { evento } : {}) }
    }),
  ]
  const adicionales = eventos.filter((e) => !codigosSecuencia.has(e.tipoEventoCodigo))
  for (const evento of adicionales) {
    const nombre = datos.tiposEvento.find((t) => t.codigo === evento.tipoEventoCodigo)?.nombre ?? evento.tipoEventoCodigo
    const indice = pasos.findIndex((p) => p.evento?.horaReal && evento.horaReal && p.evento.horaReal > evento.horaReal)
    const paso: Paso = { clave: evento.codigo, nombre, evento, adicional: true }
    if (indice === -1) {
      const ultimoRegistrado = pasos.map((p) => Boolean(p.evento)).lastIndexOf(true)
      pasos.splice(ultimoRegistrado + 1, 0, paso)
    } else pasos.splice(indice, 0, paso)
  }
  const siguiente = esViajeAbierto(viaje) ? pasos.find((p) => !p.evento && !p.adicional) : undefined
  const requerido = HITO_REQUERIDO_PARA_CIERRE[viaje.modalidad]

  return (
    <ol className="relative">
      {pasos.map((paso, indice) => {
        const registrado = Boolean(paso.evento)
        const esSiguiente = siguiente?.clave === paso.clave
        const Icono = registrado ? CheckCircle2 : esSiguiente ? CircleDot : Circle
        const ultimo = indice === pasos.length - 1
        return (
          <li key={paso.clave} className="relative flex gap-3 pb-5">
            {!ultimo && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${registrado ? 'bg-exito/40' : 'bg-borde'}`} aria-hidden="true" />}
            <Icono className={`size-6 shrink-0 bg-superficie ${registrado ? 'text-exito' : esSiguiente ? 'text-info' : 'text-borde'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1 -mt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-medium ${registrado || esSiguiente ? 'text-texto' : 'text-texto-secundario'}`}>{paso.nombre}</p>
                {paso.adicional && <Insignia>Evento adicional</Insignia>}
                {paso.clave === requerido && <Insignia tono="info">Requerido para el cierre</Insignia>}
                {esSiguiente && <Insignia tono="pendiente">Siguiente hito</Insignia>}
                {paso.evento && <Desvio evento={paso.evento} />}
              </div>
              {paso.evento ? (
                <div className="mt-1 text-sm text-texto-secundario space-y-0.5">
                  <p>
                    Real {formatearFechaHora(paso.evento.horaReal)}
                    {paso.evento.horaPrevista && <> · Prevista {formatearFechaHora(paso.evento.horaPrevista)}</>}
                  </p>
                  <p>{paso.evento.ubicacion} · Registró {nombreUsuario(datos, paso.evento.responsableCodigo)}</p>
                  {paso.evento.comentario && <p className="text-texto">{paso.evento.comentario}</p>}
                  {paso.evento.evidencias.map((ev) => (
                    <p key={ev.nombre} className="inline-flex items-center gap-1 text-xs">
                      <Paperclip className="size-3.5" aria-hidden="true" />
                      {ev.nombre}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-texto-secundario">{viaje.estado === 'cancelado' ? 'No realizado' : 'Pendiente de registro'}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
