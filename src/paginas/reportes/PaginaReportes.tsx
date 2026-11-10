import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, FileDown, FileSpreadsheet, Flag, TimerOff, TriangleAlert, Truck, Users } from 'lucide-react'
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
  type FiltrosReporte,
} from '@/servicios/reportes'
import type { Celda } from '@/servicios/exportacion'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, opcionesDe } from '@/utilidades/constantes'
import { claveDia, sumarDiasAClave } from '@/utilidades/fechas'
import { formatearMoneda, formatearPorcentaje } from '@/utilidades/formateadores'

const CRITERIOS: { valor: CriterioAgrupacion; etiqueta: string }[] = [
  { valor: 'cliente', etiqueta: 'Por cliente' },
  { valor: 'modalidad', etiqueta: 'Por modalidad' },
  { valor: 'transportista', etiqueta: 'Por transportista' },
  { valor: 'estado', etiqueta: 'Por estado' },
]

function TablaSimple({ columnas, filas, onFila }: { columnas: string[]; filas: Celda[][]; onFila?: (indice: number) => void }) {
  if (filas.length === 0) return <EstadoVacio titulo="Sin datos" descripcion="No hay viajes que coincidan con los filtros." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-fondo text-texto-secundario text-xs uppercase tracking-wide">
          <tr>{columnas.map((c, i) => <th key={c} className={`px-4 py-2 font-medium whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {filas.map((fila, f) => (
            <tr key={`${fila[0]}-${f}`} onClick={onFila ? () => onFila(f) : undefined} className={onFila ? 'cursor-pointer hover:bg-fondo' : ''}>
              {fila.map((celda, i) => <td key={i} className={`px-4 py-2 ${i === 0 ? 'text-left font-medium' : 'text-right tabular-nums whitespace-nowrap'}`}>{celda}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-5">
        <TarjetaIndicador titulo="Viajes" valor={viajes.length} detalle={`${resumen.cancelados} cancelados`} icono={Truck} tono="info" />
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
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Panel
                  titulo="Desempeño agrupado"
                  sinRelleno
                  acciones={
                    <div className="flex rounded-md border border-borde overflow-hidden" role="group" aria-label="Agrupar">
                      {CRITERIOS.map((c) => (
                        <button key={c.valor} type="button" aria-pressed={criterio === c.valor} onClick={() => fijar('agrupar', c.valor === 'cliente' ? '' : c.valor)} className={`px-2.5 h-8 text-xs font-medium ${criterio === c.valor ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
                          {c.etiqueta}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <TablaSimple columnas={COLUMNAS_AGREGADO} filas={agregados.map(filaAgregadaACeldas)} />
                </Panel>
                <Panel titulo="Incidencias por tipo" sinRelleno>
                  <TablaSimple columnas={['Tipo', 'Total', 'Abiertas', 'Resueltas']} filas={incidenciasPorTipo} />
                </Panel>
              </div>
            ),
          },
          {
            clave: 'detalle',
            titulo: 'Detalle de viajes',
            contador: viajes.length,
            contenido: () => (
              <Panel titulo="Previsto contra efectivo" descripcion="Clic en un viaje para ver su reporte." sinRelleno>
                <TablaSimple
                  columnas={columnasDetalle(true)}
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
