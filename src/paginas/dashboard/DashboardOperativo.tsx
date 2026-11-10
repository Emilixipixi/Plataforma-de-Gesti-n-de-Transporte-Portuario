import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CircleCheckBig,
  ClipboardPlus,
  Clock,
  FileBarChart,
  Flag,
  PackageCheck,
  Plus,
  Route,
  TimerOff,
  TriangleAlert,
  Truck,
  Undo2,
} from 'lucide-react'
import { ESTADOS_VIAJE, MODALIDADES, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { Insignia } from '@/componentes/comunes/Insignia'
import { InsigniasViaje } from '@/componentes/comunes/InsigniasViaje'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { GraficoBarras } from '@/componentes/graficos/GraficoBarras'
import { BarraProporcion } from '@/componentes/graficos/BarraProporcion'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreUsuario } from '@/servicios/consultas'
import {
  desvioEnMinutos,
  esViajeAbierto,
  estaRetrasado,
  hitosRegistrados,
  porcentajeCumplimiento,
  tieneAsignacionCompleta,
} from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_CORTA, HITO_ENTREGA, opcionesDe } from '@/utilidades/constantes'
import { claveDia, sumarDiasAClave } from '@/utilidades/fechas'
import { formatearDesvio, formatearFechaHora, formatearPorcentaje } from '@/utilidades/formateadores'

const DIAS_ATRAS_PREDETERMINADOS = 30
const DIAS_ADELANTE_PREDETERMINADOS = 7
const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function ListaPanel<T>({ elementos, vacio, render, clave }: { elementos: readonly T[]; vacio: string; render: (e: T) => ReactNode; clave: (e: T) => string }) {
  if (elementos.length === 0) return <p className="px-4 py-6 text-sm text-texto-secundario text-center">{vacio}</p>
  return <ul className="divide-y divide-borde">{elementos.map((e) => <li key={clave(e)}>{render(e)}</li>)}</ul>
}

function FilaViaje({ viaje, detalle }: { viaje: Viaje; detalle: ReactNode }) {
  const { datos } = usarApp()
  return (
    <Link to={`/viajes/${viaje.codigo}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-fondo">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{viaje.codigo}</span>
          <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[viaje.modalidad]}</span>
        </span>
        <span className="block text-xs text-texto-secundario truncate">{nombreCliente(datos, viaje.clienteCodigo)}</span>
      </span>
      <span className="text-right text-xs text-texto-secundario shrink-0">{detalle}</span>
    </Link>
  )
}

export default function DashboardOperativo() {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const listado = usarParametrosListado()
  const ahora = useMemo(() => new Date(), [])
  const hoy = claveDia(ahora)

  const desde = listado.filtro('desde') || sumarDiasAClave(hoy, -DIAS_ATRAS_PREDETERMINADOS)
  const hasta = listado.filtro('hasta') || sumarDiasAClave(hoy, DIAS_ADELANTE_PREDETERMINADOS)
  const cliente = listado.filtro('cliente')
  const modalidad = listado.filtro('modalidad')
  const transportista = listado.filtro('transportista')
  const estado = listado.filtro('estado')

  const enPeriodo = (v: Viaje) => {
    const referencia = claveDia(v.salidaPrevista ?? v.fechaCreacion)
    return referencia >= desde && referencia <= hasta
  }
  const viajes = datos.viajes.filter(
    (v) =>
      (!cliente || v.clienteCodigo === cliente) &&
      (!modalidad || v.modalidad === modalidad) &&
      (!transportista || v.transportistaCodigo === transportista) &&
      (!estado || v.estado === estado),
  )
  const delPeriodo = viajes.filter(enPeriodo)
  const abiertos = viajes.filter(esViajeAbierto)
  const conEntrega = (v: Viaje) => hitosRegistrados(v, datos.eventos).has(HITO_ENTREGA[v.modalidad])
  const retrasados = abiertos.filter((v) => estaRetrasado(v, datos.eventos, ahora))
  const codigosFiltrados = new Set(viajes.map((v) => v.codigo))
  const incidenciasAbiertas = datos.incidencias.filter((i) => i.estado === 'abierta' && codigosFiltrados.has(i.viajeCodigo))

  const indicadores = {
    delDia: viajes.filter((v) => v.estado !== 'cancelado' && v.salidaPrevista && claveDia(v.salidaPrevista) === hoy).length,
    programados: viajes.filter((v) => v.estado === 'programado').length,
    enRuta: viajes.filter((v) => v.estado === 'en_ejecucion').length,
    entregas: delPeriodo.filter(conEntrega).length,
    pendientesDevolucion: viajes.filter((v) => v.estado === 'entregado_pendiente_devolucion').length,
    pendientesCierre: abiertos.filter(conEntrega).length,
    finalizados: delPeriodo.filter((v) => v.estado === 'finalizado').length,
    retrasados: retrasados.length,
    incidencias: incidenciasAbiertas.length,
  }
  const cumplimiento = porcentajeCumplimiento(delPeriodo, datos.eventos)

  const porModalidad = MODALIDADES.map((m) => ({ etiqueta: ETIQUETAS_MODALIDAD_CORTA[m], valor: delPeriodo.filter((v) => v.modalidad === m).length, detalle: ETIQUETAS_MODALIDAD[m], enlace: `/viajes?modalidad=${m}` }))
  const porEstado = ESTADOS_VIAJE.map((e) => ({ etiqueta: ETIQUETAS_ESTADO_VIAJE[e].replace(' / pendiente devolución', ' pend. dev.'), valor: delPeriodo.filter((v) => v.estado === e).length, detalle: ETIQUETAS_ESTADO_VIAJE[e], enlace: `/viajes?estado=${e}` }))
  const semana = Array.from({ length: 7 }, (_, i) => sumarDiasAClave(hoy, i - 6))
  const actividadSemanal = semana.map((dia) => {
    const fecha = new Date(`${dia}T12:00:00Z`)
    return {
      etiqueta: `${NOMBRES_DIA[fecha.getUTCDay()]} ${Number(dia.slice(8))}`,
      valor: datos.eventos.filter((e) => e.horaReal && claveDia(e.horaReal) === dia && codigosFiltrados.has(e.viajeCodigo)).length,
      detalle: 'Hitos y eventos registrados',
    }
  })
  const importaciones = delPeriodo.filter((v) => v.modalidad !== 'exportacion').length
  const exportaciones = delPeriodo.length - importaciones

  const proximasLlegadas = abiertos
    .filter((v) => v.llegadaPrevista && !v.llegadaReal && v.estado !== 'solicitado')
    .sort((a, b) => (a.llegadaPrevista ?? '').localeCompare(b.llegadaPrevista ?? ''))
    .slice(0, 5)
  const activas = viajes.filter((v) => v.estado === 'en_ejecucion' || v.estado === 'entregado_pendiente_devolucion')
  const sinAsignacion = abiertos.filter((v) => !tieneAsignacionCompleta(v))
  const ultimosEventos = datos.eventos
    .filter((e) => e.horaReal && codigosFiltrados.has(e.viajeCodigo))
    .sort((a, b) => (b.horaReal ?? '').localeCompare(a.horaReal ?? ''))
    .slice(0, 6)

  const textoPeriodo = `${desde.split('-').reverse().join('/')} al ${hasta.split('-').reverse().join('/')}`

  return (
    <>
      <EncabezadoPagina titulo="Dashboard operativo" descripcion="Indicadores calculados desde los viajes, eventos e incidencias registrados." />

      <div className="flex flex-wrap gap-2 mb-5" aria-label="Acciones rápidas">
        <Boton icono={ClipboardPlus} onClick={() => navegar('/solicitudes/nueva')}>Nueva solicitud</Boton>
        <Boton icono={Plus} onClick={() => navegar('/viajes/nuevo')}>Crear viaje</Boton>
        <Boton icono={TriangleAlert} onClick={() => navegar('/incidencias?registrar=1')}>Registrar incidencia</Boton>
        <Boton icono={CalendarDays} onClick={() => navegar('/programacion?vista=calendario')}>Consultar programación</Boton>
        <Boton icono={FileBarChart} onClick={() => navegar('/reportes')}>Abrir reportes</Boton>
      </div>

      <section aria-label="Filtros" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[repeat(6,minmax(0,1fr))_auto] 2xl:items-end mb-2">
        <CampoTexto etiqueta="Desde" type="date" value={desde} max={hasta} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Modalidad" textoTodos="Todas" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <Selector etiqueta="Transportista" textoTodos="Todos" value={transportista} onChange={(e) => listado.establecerFiltro('transportista', e.target.value)} opciones={datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))} />
        <Selector etiqueta="Estado" textoTodos="Todos" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_VIAJE, ESTADOS_VIAJE)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Restablecer filtros</Boton> : <span className="hidden 2xl:block" />}
      </section>
      <p className="text-xs text-texto-secundario mb-4">
        Periodo {textoPeriodo} por fecha de salida prevista: aplica a entregas, finalizados, cumplimiento y gráficos. Los demás indicadores muestran la situación actual con los filtros de cliente, modalidad, transportista y estado.
      </p>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-5">
        <TarjetaIndicador titulo="Servicios del día" valor={indicadores.delDia} detalle="Salida prevista hoy" icono={CalendarCheck} tono="info" enlace={`/programacion?vista=calendario&modo=semana`} />
        <TarjetaIndicador titulo="Programados" valor={indicadores.programados} detalle="Pendientes de iniciar" icono={CalendarDays} tono="info" enlace="/viajes?estado=programado" />
        <TarjetaIndicador titulo="En ruta" valor={indicadores.enRuta} detalle="En ejecución" icono={Truck} tono="info" enlace="/viajes?estado=en_ejecucion" />
        <TarjetaIndicador titulo="Entregas realizadas" valor={indicadores.entregas} detalle="En el periodo" icono={PackageCheck} tono="exito" />
        <TarjetaIndicador titulo="Pend. devolución" valor={indicadores.pendientesDevolucion} detalle="Contenedores por devolver" icono={Undo2} tono="pendiente" enlace="/viajes?estado=entregado_pendiente_devolucion" />
        <TarjetaIndicador titulo="Pendientes de cierre" valor={indicadores.pendientesCierre} detalle="Entregados sin finalizar" icono={Flag} tono="pendiente" />
        <TarjetaIndicador titulo="Finalizados" valor={indicadores.finalizados} detalle="En el periodo" icono={CircleCheckBig} tono="exito" enlace="/viajes?estado=finalizado" />
        <TarjetaIndicador titulo="Retrasados" valor={indicadores.retrasados} detalle="Contra compromiso" icono={TimerOff} tono={indicadores.retrasados > 0 ? 'peligro' : 'neutro'} enlace="/viajes?alerta=retrasado" />
        <TarjetaIndicador titulo="Incidencias abiertas" valor={indicadores.incidencias} detalle="Sin resolver" icono={TriangleAlert} tono={indicadores.incidencias > 0 ? 'peligro' : 'neutro'} enlace="/incidencias?estado=abierta" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3 mb-5">
        <Panel titulo="Cumplimiento de entregas" descripcion="Entregas a tiempo sobre entregas con compromiso y hora real registrada.">
          <p className="text-3xl font-semibold text-texto tabular-nums">{formatearPorcentaje(cumplimiento.porcentaje)}</p>
          <p className="text-xs text-texto-secundario mb-4">{cumplimiento.medidas} {cumplimiento.medidas === 1 ? 'entrega medida' : 'entregas medidas'} en el periodo</p>
          <BarraProporcion
            descripcion="Entregas a tiempo y retrasadas"
            unidad="entregas"
            segmentos={[
              { etiqueta: 'A tiempo', valor: cumplimiento.aTiempo, color: 'exito' },
              { etiqueta: 'Retrasadas', valor: cumplimiento.retrasadas, color: 'peligro' },
            ]}
          />
        </Panel>
        <Panel titulo="Operaciones por modalidad" descripcion="Viajes del periodo. Clic en una barra para ver el listado.">
          <GraficoBarras datos={porModalidad} descripcion="Viajes por modalidad" />
        </Panel>
        <Panel titulo="Importaciones y exportaciones" descripcion="Distribución de viajes del periodo.">
          <p className="text-3xl font-semibold text-texto tabular-nums">{delPeriodo.length}</p>
          <p className="text-xs text-texto-secundario mb-4">viajes en el periodo</p>
          <BarraProporcion
            descripcion="Distribución de importaciones y exportaciones"
            segmentos={[
              { etiqueta: 'Importaciones', valor: importaciones, color: 'grafico-1' },
              { etiqueta: 'Exportaciones', valor: exportaciones, color: 'grafico-2' },
            ]}
          />
        </Panel>
        <Panel titulo="Viajes por estado" descripcion="Viajes del periodo según su estado actual." className="2xl:col-span-2">
          <GraficoBarras datos={porEstado} orientacion="horizontal" descripcion="Viajes por estado" />
        </Panel>
        <Panel titulo="Actividad semanal" descripcion="Hitos y eventos registrados en los últimos 7 días.">
          <GraficoBarras datos={actividadSemanal} unidad="registros" descripcion="Eventos registrados por día" color="grafico-3" />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <Panel titulo="Próximas llegadas" descripcion="Compromisos de llegada o entrega pendientes." sinRelleno>
          <ListaPanel
            elementos={proximasLlegadas}
            clave={(v) => v.codigo}
            vacio="Sin llegadas pendientes."
            render={(v) => (
              <FilaViaje
                viaje={v}
                detalle={
                  <>
                    <span className="block text-texto tabular-nums">{formatearFechaHora(v.llegadaPrevista)}</span>
                    {estaRetrasado(v, datos.eventos, ahora) && <Insignia tono="peligro">Vencida</Insignia>}
                  </>
                }
              />
            )}
          />
        </Panel>
        <Panel titulo="Operaciones activas" descripcion="En ejecución o pendientes de devolución." sinRelleno>
          <ListaPanel elementos={activas} clave={(v) => v.codigo} vacio="Sin operaciones activas." render={(v) => <FilaViaje viaje={v} detalle={<InsigniasViaje viaje={v} />} />} />
        </Panel>
        <Panel titulo="Incidencias pendientes" sinRelleno acciones={<Link to="/incidencias?estado=abierta" className="text-xs text-info hover:underline inline-flex items-center gap-1">Ver todas<ArrowRight className="size-3" aria-hidden="true" /></Link>}>
          <ListaPanel
            elementos={incidenciasAbiertas}
            clave={(i) => i.codigo}
            vacio="Sin incidencias abiertas."
            render={(i) => (
              <Link to={`/viajes/${i.viajeCodigo}?pestana=incidencias`} className="block px-4 py-2.5 hover:bg-fondo">
                <span className="flex items-center gap-2 text-sm">
                  <TriangleAlert className="size-3.5 text-peligro" aria-hidden="true" />
                  <span className="font-medium">{obtener(datos, 'tiposIncidencia', i.tipoIncidenciaCodigo)?.nombre}</span>
                  <span className="font-mono text-xs text-texto-secundario">{i.viajeCodigo}</span>
                  <span className="ml-auto text-xs text-texto-secundario">{formatearFechaHora(i.fechaHora)}</span>
                </span>
                <span className="block text-xs text-texto-secundario line-clamp-2 mt-0.5">{i.descripcion}</span>
              </Link>
            )}
          />
        </Panel>
        <Panel titulo="Viajes sin asignación" sinRelleno acciones={<Link to="/programacion" className="text-xs text-info hover:underline inline-flex items-center gap-1">Programación<ArrowRight className="size-3" aria-hidden="true" /></Link>}>
          <ListaPanel elementos={sinAsignacion} clave={(v) => v.codigo} vacio="Todos los viajes abiertos tienen asignación." render={(v) => <FilaViaje viaje={v} detalle={v.salidaPrevista ? `Requerido ${formatearFechaHora(v.salidaPrevista)}` : 'Sin fecha'} />} />
        </Panel>
        <Panel titulo="Últimos eventos" descripcion="Registros manuales más recientes." sinRelleno className="2xl:col-span-2">
          <ListaPanel
            elementos={ultimosEventos}
            clave={(e) => e.codigo}
            vacio="Sin eventos registrados."
            render={(e) => {
              const desvio = desvioEnMinutos(e.horaPrevista, e.horaReal)
              return (
                <Link to={`/viajes/${e.viajeCodigo}?pestana=seguimiento`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-fondo">
                  <Route className="size-4 text-texto-secundario shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-texto truncate">
                      {obtener(datos, 'tiposEvento', e.tipoEventoCodigo)?.nombre} <span className="font-mono text-xs text-texto-secundario">{e.viajeCodigo}</span>
                    </span>
                    <span className="block text-xs text-texto-secundario truncate">{e.ubicacion} · {nombreUsuario(datos, e.responsableCodigo)}</span>
                  </span>
                  {desvio !== null && desvio > 0 && <Insignia tono="peligro" icono={Clock}>{formatearDesvio(desvio)}</Insignia>}
                  <span className="text-xs text-texto-secundario tabular-nums shrink-0">{formatearFechaHora(e.horaReal)}</span>
                </Link>
              )
            }}
          />
        </Panel>
      </div>
      {viajes.length === 0 && <EstadoVacio titulo="Sin viajes para los filtros" descripcion="Ajuste los filtros para ver indicadores." />}
    </>
  )
}
