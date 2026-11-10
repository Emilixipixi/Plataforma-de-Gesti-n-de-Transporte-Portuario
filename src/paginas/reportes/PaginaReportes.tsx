import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Banknote, CheckCircle2, FileDown, FileSpreadsheet, Flag, TimerOff, TriangleAlert, Truck, Users } from 'lucide-react'
import { ESTADOS_VIAJE, MODALIDADES } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { Pestanas } from '@/componentes/comunes/Pestanas'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { ReporteViaje } from '@/componentes/reportes/ReporteViaje'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreTransportista } from '@/servicios/consultas'
import {
  agregarViajes,
  COLUMNAS_AGREGADO,
  columnasDetalle,
  detalleDeViajes,
  filaAgregadaACeldas,
  resumenDeClientePeriodo,
  viajesDelReporte,
  type CriterioAgrupacion,
  type FilaAgregada,
  type FiltrosReporte,
} from '@/servicios/reportes'
import type { Celda } from '@/servicios/exportacion'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, opcionesDe, TONOS_ESTADO_VIAJE, type Tono } from '@/utilidades/constantes'
import { claveDia, sumarDiasAClave } from '@/utilidades/fechas'
import { formatearMoneda, formatearPorcentaje } from '@/utilidades/formateadores'

const CRITERIOS: { valor: CriterioAgrupacion; etiqueta: string }[] = [
  { valor: 'cliente', etiqueta: 'Por cliente' },
  { valor: 'modalidad', etiqueta: 'Por modalidad' },
  { valor: 'transportista', etiqueta: 'Por transportista' },
  { valor: 'estado', etiqueta: 'Por estado' },
]

const VISIBILIDAD_COLUMNA = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell', '2xl': 'hidden 2xl:table-cell' } as const

const FONDO_TONO: Record<Tono, string> = {
  exito: 'bg-exito',
  pendiente: 'bg-acento',
  peligro: 'bg-peligro',
  info: 'bg-info',
  neutro: 'bg-texto-secundario/50',
}

function TablaDetalle({ columnas, filas, onFila, ocultas = {}, textuales = [] }: { columnas: string[]; filas: Celda[][]; onFila?: (indice: number) => void; ocultas?: Partial<Record<number, keyof typeof VISIBILIDAD_COLUMNA>>; textuales?: number[] }) {
  if (filas.length === 0) return <EstadoVacio titulo="Sin datos" descripcion="No hay viajes que coincidan con los filtros." />
  const clase = (i: number) => {
    const oculta = ocultas[i]
    return oculta ? VISIBILIDAD_COLUMNA[oculta] : ''
  }
  const esTexto = (i: number) => i === 0 || textuales.includes(i)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-fondo text-texto-secundario uppercase tracking-wide">
          <tr>{columnas.map((c, i) => <th key={c} className={`px-2.5 py-2 font-medium ${esTexto(i) ? 'text-left' : 'text-right'} ${clase(i)}`}>{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {filas.map((fila, f) => (
            <tr key={`${fila[0]}-${f}`} onClick={onFila ? () => onFila(f) : undefined} className={onFila ? 'cursor-pointer hover:bg-fondo' : ''}>
              {fila.map((celda, i) => (
                <td key={i} className={`px-2.5 py-2 align-top ${i === 0 ? 'font-mono font-semibold whitespace-nowrap' : ''} ${esTexto(i) ? 'text-left' : 'text-right tabular-nums whitespace-nowrap'} ${clase(i)}`}>{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function tonoCumplimiento(valor: number | null): Tono {
  if (valor === null) return 'neutro'
  if (valor >= 0.9) return 'exito'
  if (valor >= 0.75) return 'pendiente'
  return 'peligro'
}

function BarraCumplimiento({ valor }: { valor: number | null }) {
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="hidden sm:block w-20 xl:w-28 h-1.5 rounded-full bg-borde overflow-hidden" aria-hidden="true">
        <span className={`block h-full rounded-full ${FONDO_TONO[tonoCumplimiento(valor)]}`} style={{ width: `${Math.round((valor ?? 0) * 100)}%` }} />
      </span>
      <span className="tabular-nums w-12 text-right">{formatearPorcentaje(valor)}</span>
    </span>
  )
}

function TablaDesempeno({ filas, titulo }: { filas: FilaAgregada[]; titulo: string }) {
  if (filas.length === 0) return <EstadoVacio titulo="Sin datos" descripcion="No hay viajes que coincidan con los filtros." />
  const total = filas.reduce(
    (s, f) => ({ total: s.total + f.total, finalizados: s.finalizados + f.finalizados, enCurso: s.enCurso + f.enCurso, aTiempo: s.aTiempo + f.aTiempo, retrasados: s.retrasados + f.retrasados, incidencias: s.incidencias + f.incidencias }),
    { total: 0, finalizados: 0, enCurso: 0, aTiempo: 0, retrasados: 0, incidencias: 0 },
  )
  const cumplimientoTotal = total.aTiempo + total.retrasados > 0 ? total.aTiempo / (total.aTiempo + total.retrasados) : null
  const numero = 'px-3 py-2.5 text-right tabular-nums whitespace-nowrap'
  return (
    <table className="w-full text-sm">
      <thead className="bg-fondo text-texto-secundario text-xs uppercase tracking-wide">
        <tr>
          <th className="px-4 py-2 text-left font-medium">{titulo}</th>
          <th className="px-3 py-2 text-right font-medium">Viajes</th>
          <th className="px-3 py-2 text-right font-medium">Finalizados</th>
          <th className="px-3 py-2 text-right font-medium hidden md:table-cell">En curso</th>
          <th className="px-3 py-2 text-right font-medium hidden md:table-cell">A tiempo</th>
          <th className="px-3 py-2 text-right font-medium">Retrasados</th>
          <th className="px-3 py-2 text-right font-medium">Cumplimiento</th>
          <th className="px-4 py-2 text-right font-medium hidden sm:table-cell">Incidencias</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-borde">
        {filas.map((f) => (
          <tr key={f.grupo} className="hover:bg-fondo/60">
            <td className="px-4 py-2.5 font-medium text-texto">{f.grupo}</td>
            <td className={numero}>{f.total}</td>
            <td className={numero}>{f.finalizados}</td>
            <td className={`${numero} hidden md:table-cell`}>{f.enCurso}</td>
            <td className={`${numero} hidden md:table-cell`}>{f.aTiempo}</td>
            <td className={`${numero} ${f.retrasados > 0 ? 'text-peligro' : ''}`}>{f.retrasados}</td>
            <td className="px-3 py-2.5"><BarraCumplimiento valor={f.cumplimiento} /></td>
            <td className={`${numero} hidden sm:table-cell pr-4`}>{f.incidencias}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-fondo font-semibold border-t border-borde">
        <tr>
          <td className="px-4 py-2.5">Total</td>
          <td className={numero}>{total.total}</td>
          <td className={numero}>{total.finalizados}</td>
          <td className={`${numero} hidden md:table-cell`}>{total.enCurso}</td>
          <td className={`${numero} hidden md:table-cell`}>{total.aTiempo}</td>
          <td className={numero}>{total.retrasados}</td>
          <td className="px-3 py-2.5"><BarraCumplimiento valor={cumplimientoTotal} /></td>
          <td className={`${numero} hidden sm:table-cell pr-4`}>{total.incidencias}</td>
        </tr>
      </tfoot>
    </table>
  )
}

function ListaBarras({ elementos, vacio }: { elementos: { etiqueta: string; valor: number; detalle?: string; tono: Tono }[]; vacio: string }) {
  if (elementos.length === 0) return <EstadoVacio titulo="Sin datos" descripcion={vacio} />
  const maximo = Math.max(...elementos.map((e) => e.valor), 1)
  return (
    <ul className="space-y-3">
      {elementos.map((e) => (
        <li key={e.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-texto min-w-0">{e.etiqueta}</span>
            <span className="tabular-nums font-semibold text-texto shrink-0">{e.valor}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-fondo overflow-hidden" aria-hidden="true">
            <div className={`h-full rounded-full ${FONDO_TONO[e.tono]}`} style={{ width: `${(e.valor / maximo) * 100}%` }} />
          </div>
          {e.detalle && <p className="mt-0.5 text-xs text-texto-secundario">{e.detalle}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function PaginaReportes() {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const [parametros, establecerParametros] = useSearchParams()
  const listado = usarParametrosListado({ conservar: ['pestana', 'agrupar', 'viaje'] })
  const ahora = useMemo(() => new Date(), [])
  const hoy = claveDia(ahora)
  const [exportando, establecerExportando] = useState(false)

  const filtros: FiltrosReporte = {
    desde: listado.filtro('desde') || sumarDiasAClave(hoy, -30),
    hasta: listado.filtro('hasta') || sumarDiasAClave(hoy, 7),
    cliente: listado.filtro('cliente'),
    modalidad: listado.filtro('modalidad'),
    transportista: listado.filtro('transportista'),
    estado: listado.filtro('estado'),
  }
  const criterio = (parametros.get('agrupar') as CriterioAgrupacion | null) ?? 'cliente'
  const viajes = viajesDelReporte(datos, filtros)
  const resumen = resumenDeClientePeriodo(datos, viajes, ahora)
  const agregados = agregarViajes(datos, viajes, criterio, ahora)
  const detalle = detalleDeViajes(datos, viajes, ahora, true)
  const incidenciasPorTipo = datos.tiposIncidencia
    .map((t) => {
      const lista = datos.incidencias.filter((i) => i.tipoIncidenciaCodigo === t.codigo && viajes.some((v) => v.codigo === i.viajeCodigo))
      return [t.nombre, lista.length, lista.filter((i) => i.estado === 'abierta').length, lista.filter((i) => i.estado === 'resuelta').length] as Celda[]
    })
    .filter((f) => Number(f[1]) > 0)
  const valorTotal = viajes.filter((v) => v.estado !== 'cancelado').reduce((s, v) => s + v.valorReferencial, 0)
  const viajeElegido = obtener(datos, 'viajes', parametros.get('viaje') ?? undefined)

  const fijarVarios = (cambios: Record<string, string>) =>
    establecerParametros((actuales) => {
      const nuevos = new URLSearchParams(actuales)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
      }
      return nuevos
    }, { replace: true })
  const fijar = (clave: string, valor: string) => fijarVarios({ [clave]: valor })

  const textoFiltros = [
    `Periodo ${filtros.desde.split('-').reverse().join('/')} al ${filtros.hasta.split('-').reverse().join('/')}`,
    filtros.cliente && `Cliente: ${nombreCliente(datos, filtros.cliente)}`,
    filtros.modalidad && `Modalidad: ${ETIQUETAS_MODALIDAD[filtros.modalidad as keyof typeof ETIQUETAS_MODALIDAD]}`,
    filtros.transportista && `Transportista: ${nombreTransportista(datos, filtros.transportista)}`,
    filtros.estado && `Estado: ${ETIQUETAS_ESTADO_VIAJE[filtros.estado as keyof typeof ETIQUETAS_ESTADO_VIAJE]}`,
  ].filter(Boolean).join(' · ')

  const exportar = async (formato: 'pdf' | 'excel') => {
    establecerExportando(true)
    const { exportarExcel, exportarPdf, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    const base = `reporte_operativo_${filtros.desde}_${filtros.hasta}`
    const hojasAgregadas = CRITERIOS.map((c) => ({ nombre: c.etiqueta, columnas: COLUMNAS_AGREGADO, filas: agregarViajes(datos, viajes, c.valor, ahora).map(filaAgregadaACeldas) }))
    if (formato === 'excel') {
      await exportarExcel(nombreArchivoSeguro(base, 'xlsx'), [
        ...hojasAgregadas,
        { nombre: 'Detalle de viajes', columnas: columnasDetalle(true), filas: detalle.map((d) => d.celdas) },
        { nombre: 'Incidencias por tipo', columnas: ['Tipo', 'Total', 'Abiertas', 'Resueltas'], filas: incidenciasPorTipo },
      ])
    } else {
      exportarPdf({
        titulo: 'Reporte operativo',
        subtitulo: textoFiltros,
        horizontal: true,
        nombreArchivo: nombreArchivoSeguro(base, 'pdf'),
        leyenda: 'Reporte interno con datos filtrados. Prototipo demostrativo.',
        secciones: [
          {
            tipo: 'datos',
            titulo: 'Indicadores',
            pares: [
              ['Viajes', String(viajes.length)],
              ['Finalizados', String(resumen.realizados)],
              ['En ruta', String(resumen.enRuta)],
              ['Entregas a tiempo', `${resumen.aTiempo} de ${resumen.aTiempo + resumen.retrasados}`],
              ['Cumplimiento', formatearPorcentaje(resumen.cumplimiento)],
              ['Incidencias', `${resumen.incidencias} (${resumen.incidenciasAbiertas} abiertas)`],
              ['Valor referencial', formatearMoneda(valorTotal)],
            ],
          },
          ...hojasAgregadas.map((h) => ({ tipo: 'tabla' as const, titulo: h.nombre, columnas: h.columnas, filas: h.filas })),
          { tipo: 'tabla', titulo: 'Detalle de viajes', columnas: columnasDetalle(true), filas: detalle.map((d) => d.celdas) },
        ],
      })
    }
    establecerExportando(false)
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes operativos"
        descripcion="Desempeño por viajes, clientes, modalidad, transportistas y estados, con cumplimiento e incidencias."
        acciones={
          <>
            <Link to="/reportes/cliente" className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-borde bg-superficie text-sm font-medium text-texto hover:bg-fondo"><Users className="size-4" aria-hidden="true" />Reporte para cliente</Link>
            <Boton icono={FileSpreadsheet} disabled={exportando} onClick={() => void exportar('excel')}>Exportar Excel</Boton>
            <Boton variante="primario" icono={FileDown} disabled={exportando} onClick={() => void exportar('pdf')}>Exportar PDF</Boton>
          </>
        }
      />
      <section aria-label="Filtros" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[repeat(6,minmax(0,1fr))_auto] 2xl:items-end mb-2">
        <CampoTexto etiqueta="Desde" type="date" value={filtros.desde} max={filtros.hasta} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={filtros.hasta} min={filtros.desde} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={filtros.cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Modalidad" textoTodos="Todas" value={filtros.modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <Selector etiqueta="Transportista" textoTodos="Todos" value={filtros.transportista} onChange={(e) => listado.establecerFiltro('transportista', e.target.value)} opciones={datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))} />
        <Selector etiqueta="Estado" textoTodos="Todos" value={filtros.estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_VIAJE, ESTADOS_VIAJE)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Restablecer filtros</Boton> : <span className="hidden 2xl:block" />}
      </section>
      <p className="text-xs text-texto-secundario mb-4">{textoFiltros}. Las exportaciones contienen exactamente los datos filtrados.</p>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-5">
        <TarjetaIndicador titulo="Viajes" valor={viajes.length} detalle={`${resumen.cancelados} cancelados`} icono={Truck} tono="info" />
        <TarjetaIndicador titulo="Valor referencial" valor={formatearMoneda(valorTotal)} detalle="Sin cancelados" icono={Banknote} tono="info" />
        <TarjetaIndicador titulo="Finalizados" valor={resumen.realizados} detalle={`${resumen.enRuta} en ruta`} icono={Flag} tono="exito" />
        <TarjetaIndicador titulo="Cumplimiento" valor={formatearPorcentaje(resumen.cumplimiento)} detalle={`${resumen.aTiempo} a tiempo de ${resumen.aTiempo + resumen.retrasados}`} icono={CheckCircle2} tono="exito" />
        <TarjetaIndicador titulo="Retrasados" valor={resumen.retrasados} detalle="Contra compromiso" icono={TimerOff} tono={resumen.retrasados > 0 ? 'peligro' : 'neutro'} />
        <TarjetaIndicador titulo="Incidencias" valor={resumen.incidencias} detalle={`${resumen.incidenciasAbiertas} abiertas`} icono={TriangleAlert} tono={resumen.incidenciasAbiertas > 0 ? 'peligro' : 'neutro'} />
      </div>
      <Pestanas
        pestanas={[
          {
            clave: 'resumen',
            titulo: 'Resumen',
            contenido: () => (
              <div className="space-y-5">
                <Panel
                  titulo="Desempeño agrupado"
                  descripcion="Cumplimiento: entregas a tiempo sobre entregas con hora real registrada."
                  sinRelleno
                  acciones={
                    <div className="grid grid-cols-2 sm:flex rounded-md border border-borde overflow-hidden" role="group" aria-label="Agrupar">
                      {CRITERIOS.map((c) => (
                        <button key={c.valor} type="button" aria-pressed={criterio === c.valor} onClick={() => fijar('agrupar', c.valor === 'cliente' ? '' : c.valor)} className={`px-3 h-8 text-xs font-medium ${criterio === c.valor ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
                          {c.etiqueta}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <TablaDesempeno filas={agregados} titulo={CRITERIOS.find((c) => c.valor === criterio)?.etiqueta.replace('Por ', '') ?? 'Grupo'} />
                </Panel>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel titulo="Viajes por estado" descripcion="Distribución de los viajes del periodo.">
                    <ListaBarras
                      vacio="No hay viajes en el periodo."
                      elementos={ESTADOS_VIAJE.map((e) => ({ etiqueta: ETIQUETAS_ESTADO_VIAJE[e], valor: viajes.filter((v) => v.estado === e).length, tono: TONOS_ESTADO_VIAJE[e] })).filter((e) => e.valor > 0)}
                    />
                  </Panel>
                  <Panel titulo="Incidencias por tipo" descripcion="Novedades registradas en los viajes del periodo.">
                    <ListaBarras
                      vacio="No hay incidencias en el periodo."
                      elementos={[...incidenciasPorTipo]
                        .sort((a, b) => Number(b[1]) - Number(a[1]))
                        .map(([tipo, totalTipo, abiertas, resueltas]) => ({ etiqueta: String(tipo), valor: Number(totalTipo), detalle: `${String(abiertas)} abiertas · ${String(resueltas)} resueltas`, tono: Number(abiertas) > 0 ? 'peligro' : 'info' }))}
                    />
                  </Panel>
                </div>
              </div>
            ),
          },
          {
            clave: 'detalle',
            titulo: 'Detalle de viajes',
            contador: viajes.length,
            contenido: () => (
              <Panel titulo="Previsto contra efectivo" descripcion="Clic en un viaje para ver su reporte." sinRelleno>
                <TablaDetalle
                  columnas={columnasDetalle(true)}
                  textuales={[1, 2, 3, 4, 5, 10, 14]}
                  ocultas={{ 3: 'xl', 4: 'xl', 5: '2xl', 7: 'lg', 12: 'md' }}
                  filas={detalle.map((d) => d.celdas.map((c, i) => (i === 13 && typeof c === 'number' ? formatearMoneda(c) : c)))}
                  onFila={(i) => {
                    const fila = detalle[i]
                    if (fila) fijarVarios({ viaje: fila.viaje.codigo, pestana: 'viaje' })
                  }}
                />
              </Panel>
            ),
          },
          {
            clave: 'viaje',
            titulo: 'Reporte por viaje',
            contenido: () => (
              <div className="space-y-4">
                <Selector etiqueta="Viaje" textoTodos="Seleccione un viaje" className="sm:w-96" value={viajeElegido?.codigo ?? ''} onChange={(e) => fijar('viaje', e.target.value)} opciones={viajes.map((v) => ({ valor: v.codigo, etiqueta: `${v.codigo} · ${nombreCliente(datos, v.clienteCodigo)}` }))} />
                {viajeElegido ? (
                  <>
                    <ReporteViaje key={viajeElegido.codigo} viaje={viajeElegido} />
                    <Boton variante="fantasma" onClick={() => navegar(`/viajes/${viajeElegido.codigo}`)}>Abrir detalle del viaje</Boton>
                  </>
                ) : (
                  <Panel><EstadoVacio titulo="Seleccione un viaje" descripcion="El reporte muestra etapas, marcas horarias, novedades y cumplimiento del plazo." /></Panel>
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
