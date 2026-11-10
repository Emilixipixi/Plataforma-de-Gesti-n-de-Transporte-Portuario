import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, Flag, Plus, Route, TriangleAlert } from 'lucide-react'
import { MODALIDADES, type EstadoViaje, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniasViaje } from '@/componentes/comunes/InsigniasViaje'
import { Selector } from '@/componentes/formularios/Selector'
import { LineaTiempo } from '@/componentes/viajes/LineaTiempo'
import { ModalEvento, ModalFinalizar, ModalIncidencia } from '@/componentes/viajes/ModalesSeguimiento'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar } from '@/servicios/consultas'
import { estaRetrasado, hitosRegistrados, tieneIncidenciaAbierta } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_CORTA, SECUENCIA_HITOS, opcionesDe } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

const ESTADOS_EN_SEGUIMIENTO: readonly EstadoViaje[] = ['en_ejecucion', 'entregado_pendiente_devolucion', 'programado']

function progreso(viaje: Viaje, registrados: Set<string>): { hechos: number; total: number } {
  const secuencia = SECUENCIA_HITOS[viaje.modalidad]
  return { hechos: secuencia.filter((h) => registrados.has(h)).length, total: secuencia.length }
}

export default function PaginaSeguimiento() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const [parametros, establecerParametros] = useSearchParams()
  const [modal, establecerModal] = useState<'evento' | 'incidencia' | 'finalizar' | null>(null)
  const ahora = useMemo(() => new Date(), [])
  const modalidad = parametros.get('modalidad') ?? ''
  const cliente = parametros.get('cliente') ?? ''

  const actualizar = (clave: string, valor: string) =>
    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
        return nuevos
      },
      { replace: true },
    )

  const viajes = datos.viajes
    .filter((v) => ESTADOS_EN_SEGUIMIENTO.includes(v.estado) && (!modalidad || v.modalidad === modalidad) && (!cliente || v.clienteCodigo === cliente))
    .sort((a, b) => ESTADOS_EN_SEGUIMIENTO.indexOf(a.estado) - ESTADOS_EN_SEGUIMIENTO.indexOf(b.estado) || (a.salidaPrevista ?? '').localeCompare(b.salidaPrevista ?? ''))
  const seleccionado = obtener(datos, 'viajes', parametros.get('viaje') ?? undefined) ?? viajes[0]
  const abierto = seleccionado && seleccionado.estado !== 'finalizado' && seleccionado.estado !== 'cancelado'

  return (
    <>
      <EncabezadoPagina titulo="Seguimiento" descripcion="Monitoreo manual por hitos de los viajes en curso y programados. Cada registro guarda hora real, responsable y detalle." />
      <AvisoDemostrativo className="mb-5">El seguimiento es manual por hitos y no muestra posiciones GPS. El rastreo satelital continúa en Tracklink.</AvisoDemostrativo>
      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel titulo="Viajes en seguimiento" descripcion={`${viajes.length} en ejecución, pendientes de devolución o programados.`} sinRelleno>
          <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-borde">
            <Selector etiqueta="Modalidad" textoTodos="Todas" value={modalidad} onChange={(e) => actualizar('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD_CORTA, MODALIDADES)} />
            <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => actualizar('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
          </div>
          {viajes.length === 0 ? (
            <EstadoVacio icono={Route} titulo="Sin viajes en seguimiento" descripcion="No hay viajes que coincidan con los filtros." />
          ) : (
            <ul className="divide-y divide-borde max-h-[640px] overflow-y-auto">
              {viajes.map((v) => {
                const { hechos, total } = progreso(v, hitosRegistrados(v, datos.eventos))
                const activo = seleccionado?.codigo === v.codigo
                const alerta = tieneIncidenciaAbierta(v.codigo, datos.incidencias) || estaRetrasado(v, datos.eventos, ahora)
                return (
                  <li key={v.codigo}>
                    <button type="button" onClick={() => actualizar('viaje', v.codigo)} aria-current={activo ? 'true' : undefined} className={`w-full text-left px-4 py-3 ${activo ? 'bg-fondo' : 'hover:bg-fondo/60'} ${alerta ? 'border-l-2 border-l-peligro' : 'border-l-2 border-l-transparent'}`}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{v.codigo}</span>
                        <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}</span>
                        <span className="ml-auto text-xs tabular-nums text-texto-secundario">{hechos}/{total}</span>
                      </span>
                      <span className="block text-sm text-texto truncate mt-0.5">{nombreCliente(datos, v.clienteCodigo)}</span>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-borde overflow-hidden" aria-hidden="true">
                        <span className="block h-full rounded-full bg-grafico-1" style={{ width: `${(hechos / total) * 100}%` }} />
                      </span>
                      <span className="mt-1.5 block"><InsigniasViaje viaje={v} /></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
        {seleccionado ? (
          <Panel
            titulo={`${seleccionado.codigo} · ${nombreCliente(datos, seleccionado.clienteCodigo)}`}
            descripcion={`${ETIQUETAS_MODALIDAD[seleccionado.modalidad]} · ${nombreLugar(datos, seleccionado.origenCodigo)} a ${nombreLugar(datos, seleccionado.destinoCodigo)} · Salida prevista ${formatearFechaHora(seleccionado.salidaPrevista)}`}
            acciones={
              <div className="flex flex-wrap gap-2">
                {abierto && puede('seguimiento.escribir') && seleccionado.estado !== 'solicitado' && <Boton tamano="pequeno" variante="primario" icono={Plus} onClick={() => establecerModal('evento')}>Registrar evento</Boton>}
                {abierto && puede('incidencias.escribir') && <Boton tamano="pequeno" icono={TriangleAlert} onClick={() => establecerModal('incidencia')}>Incidencia</Boton>}
                {abierto && puede('viajes.cerrar') && (seleccionado.estado === 'en_ejecucion' || seleccionado.estado === 'entregado_pendiente_devolucion') && (
                  <Boton tamano="pequeno" icono={Flag} onClick={() => establecerModal('finalizar')}>Finalizar</Boton>
                )}
                <Link to={`/viajes/${seleccionado.codigo}`} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-borde text-xs font-medium text-texto hover:bg-fondo">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Detalle
                </Link>
              </div>
            }
          >
            <LineaTiempo viaje={seleccionado} />
          </Panel>
        ) : (
          <Panel><EstadoVacio icono={Route} titulo="Seleccione un viaje" /></Panel>
        )}
      </div>
      {seleccionado && abierto && (
        <>
          <ModalEvento viaje={seleccionado} abierto={modal === 'evento'} onCerrar={() => establecerModal(null)} />
          <ModalIncidencia viaje={seleccionado} abierto={modal === 'incidencia'} onCerrar={() => establecerModal(null)} />
          <ModalFinalizar viaje={seleccionado} abierto={modal === 'finalizar'} onCerrar={() => establecerModal(null)} />
        </>
      )}
    </>
  )
}
