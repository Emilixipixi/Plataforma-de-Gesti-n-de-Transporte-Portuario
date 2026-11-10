import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Anchor, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { Insignia } from '@/componentes/comunes/Insignia'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { Selector } from '@/componentes/formularios/Selector'
import { NOTA_COMPARTIBLE, SelectorVersion, type VersionReporte } from '@/componentes/reportes/SelectorVersion'
import { obtener } from '@/servicios/repositorio'
import { nombreLugar, viajesDeCliente } from '@/servicios/consultas'
import { cumplimientoDeViaje, reporteDeViaje, resumenDeClientePeriodo, type Cumplimiento } from '@/servicios/reportes'
import type { Celda, Seccion } from '@/servicios/exportacion'
import { desvioDeLlegada, estadoFacturacionServicio, llegadaRealDeViaje } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_SERVICIO, ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD_CORTA, LOCALE, NOMBRE_SISTEMA } from '@/utilidades/constantes'
import { claveDia, esClaveValida, fechaDesdeClave, inicioDeMes, inicioDeSemana, sumarDiasAClave, sumarMesesAClave } from '@/utilidades/fechas'
import { formatearDesvio, formatearFechaHora, formatearMoneda, formatearPorcentaje } from '@/utilidades/formateadores'

type Periodo = 'semanal' | 'mensual'

const formatoDia = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', timeZone: 'UTC' })
const formatoMes = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' })
const TONO: Record<Cumplimiento, 'exito' | 'peligro' | 'neutro'> = { 'A tiempo': 'exito', Retrasado: 'peligro', 'Sin medir': 'neutro' }

function rango(periodo: Periodo, ancla: string): { desde: string; hasta: string; etiqueta: string } {
  if (periodo === 'mensual') {
    const desde = inicioDeMes(ancla)
    const hasta = sumarDiasAClave(sumarMesesAClave(ancla, 1), -1)
    const texto = formatoMes.format(fechaDesdeClave(desde))
    return { desde, hasta, etiqueta: texto.charAt(0).toUpperCase() + texto.slice(1) }
  }
  const desde = inicioDeSemana(ancla)
  const hasta = sumarDiasAClave(desde, 6)
  return { desde, hasta, etiqueta: `Semana del ${formatoDia.format(fechaDesdeClave(desde))} al ${formatoDia.format(fechaDesdeClave(hasta))} de ${hasta.slice(0, 4)}` }
}

export default function PaginaReporteCliente() {
  const { datos } = usarApp()
  const [parametros, establecerParametros] = useSearchParams()
  const ahora = useMemo(() => new Date(), [])
  const hoy = claveDia(ahora)
  const periodo: Periodo = parametros.get('periodo') === 'mensual' ? 'mensual' : 'semanal'
  const fechaParametro = parametros.get('fecha')
  const ancla = esClaveValida(fechaParametro) ? fechaParametro : hoy
  const version: VersionReporte = parametros.get('version') === 'compartible' ? 'compartible' : 'interna'
  const interno = version === 'interna'
  const { desde, hasta, etiqueta } = rango(periodo, ancla)

  const clientePredeterminado = useMemo(() => {
    const semana = rango('semanal', hoy)
    const conteo = datos.clientes.map((c) => ({ c, n: viajesDeCliente(datos, c.codigo).filter((v) => { const d = claveDia(v.salidaPrevista ?? v.fechaCreacion); return d >= semana.desde && d <= semana.hasta }).length }))
    return conteo.sort((a, b) => b.n - a.n)[0]?.c.codigo ?? ''
  }, [datos, hoy])
  const clienteCodigo = parametros.get('cliente') ?? clientePredeterminado
  const cliente = obtener(datos, 'clientes', clienteCodigo)

  const fijar = (cambios: Record<string, string | null>) =>
    establecerParametros((actuales) => {
      const nuevos = new URLSearchParams(actuales)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
      }
      return nuevos
    }, { replace: true })

  const viajes = viajesDeCliente(datos, clienteCodigo)
    .filter((v) => {
      const dia = claveDia(v.salidaPrevista ?? v.fechaCreacion)
      return dia >= desde && dia <= hasta
    })
    .sort((a, b) => (a.salidaPrevista ?? '').localeCompare(b.salidaPrevista ?? ''))
  const resumen = resumenDeClientePeriodo(datos, viajes, ahora)
  const incidencias = datos.incidencias.filter((i) => viajes.some((v) => v.codigo === i.viajeCodigo))
  const retrasados = viajes.filter((v) => cumplimientoDeViaje(datos, v, ahora) === 'Retrasado').map((v) => reporteDeViaje(datos, v, ahora))

  const columnas = ['Viaje', 'Modalidad', 'Origen', 'Destino', 'Salida prevista', 'Llegada prevista', 'Llegada real', 'Desvío', 'Estado', 'Cumplimiento', 'Incidencias', ...(interno ? ['Valor', 'Facturación'] : [])]
  const filas: Celda[][] = viajes.map((v) => {
    const servicio = estadoFacturacionServicio(v, datos.facturas)
    return [
      v.codigo,
      ETIQUETAS_MODALIDAD_CORTA[v.modalidad],
      nombreLugar(datos, v.origenCodigo),
      nombreLugar(datos, v.destinoCodigo),
      formatearFechaHora(v.salidaPrevista),
      formatearFechaHora(v.llegadaPrevista),
      formatearFechaHora(llegadaRealDeViaje(v, datos.eventos)),
      formatearDesvio(desvioDeLlegada(v, datos.eventos)),
      ETIQUETAS_ESTADO_VIAJE[v.estado],
      cumplimientoDeViaje(datos, v, ahora),
      datos.incidencias.filter((i) => i.viajeCodigo === v.codigo).length,
      ...(interno ? [formatearMoneda(v.valorReferencial), servicio ? ETIQUETAS_ESTADO_SERVICIO[servicio] : 'No aplica'] : []),
    ]
  })
  const indicadores: [string, string][] = [
    ['Servicios del periodo', String(resumen.servicios)],
    ['Realizados (finalizados)', String(resumen.realizados)],
    ['En ruta', String(resumen.enRuta)],
    ['Programados', String(resumen.programados)],
    ['Entregas a tiempo', `${resumen.aTiempo} de ${resumen.aTiempo + resumen.retrasados}`],
    ['Cumplimiento', formatearPorcentaje(resumen.cumplimiento)],
    ['Retrasados', String(resumen.retrasados)],
    ['Incidencias', String(resumen.incidencias)],
  ]

  const exportar = async (formato: 'pdf' | 'excel') => {
    if (!cliente) return
    const { exportarExcel, exportarPdf, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    const base = `reporte_${periodo}_${cliente.codigo}_${desde}_${version}`
    const tablaIncidencias = { columnas: ['Código', 'Viaje', 'Tipo', 'Fecha', 'Descripción', 'Estado', 'Acción correctiva'], filas: incidencias.map((i) => [i.codigo, i.viajeCodigo, obtener(datos, 'tiposIncidencia', i.tipoIncidenciaCodigo)?.nombre ?? '', formatearFechaHora(i.fechaHora), i.descripcion, i.estado === 'abierta' ? 'Abierta' : 'Resuelta', i.accionCorrectiva ?? ''] as Celda[]) }
    if (formato === 'excel') {
      await exportarExcel(nombreArchivoSeguro(base, 'xlsx'), [
        { nombre: 'Resumen', columnas: ['Indicador', 'Valor'], filas: [['Cliente', cliente.razonSocial], ['Periodo', etiqueta], ...indicadores] },
        { nombre: 'Servicios', columnas, filas },
        { nombre: 'Incidencias', ...tablaIncidencias },
      ])
      return
    }
    const secciones: Seccion[] = [
      { tipo: 'datos', titulo: 'Resumen del periodo', pares: [['Cliente', `${cliente.razonSocial} (${cliente.identificacion})`], ['Periodo', etiqueta], ...indicadores] },
      { tipo: 'tabla', titulo: 'Consolidado de servicios', columnas, filas },
      { tipo: 'tabla', titulo: 'Novedades e incidencias', ...tablaIncidencias },
      ...retrasados.map((r) => ({ tipo: 'texto' as const, titulo: `Observación de retraso ${r.viaje.codigo}`, texto: r.explicacionRetraso })),
    ]
    exportarPdf({
      titulo: `Reporte ${periodo} de servicios${interno ? ' (interno)' : ''}`,
      subtitulo: `${cliente.razonSocial} · ${etiqueta}`,
      secciones,
      horizontal: true,
      leyenda: interno ? 'Uso interno. Prototipo demostrativo.' : `Reporte para el cliente generado por ${NOMBRE_SISTEMA}. Prototipo demostrativo.`,
      nombreArchivo: nombreArchivoSeguro(base, 'pdf'),
    })
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Reporte para cliente"
        descripcion="Consolidado semanal o mensual por cliente con servicios realizados, en ruta y entregas a tiempo."
        acciones={
          <>
            <Boton icono={FileSpreadsheet} disabled={!cliente} onClick={() => void exportar('excel')}>Exportar Excel</Boton>
            <Boton variante="primario" icono={FileDown} disabled={!cliente} onClick={() => void exportar('pdf')}>Descargar PDF</Boton>
          </>
        }
      />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Selector etiqueta="Cliente" className="w-full sm:w-80" value={clienteCodigo} onChange={(e) => fijar({ cliente: e.target.value })} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <div className="flex rounded-md border border-borde overflow-hidden self-start lg:self-end" role="group" aria-label="Periodo">
          {(['semanal', 'mensual'] as const).map((p) => (
            <button key={p} type="button" aria-pressed={periodo === p} onClick={() => fijar({ periodo: p === 'semanal' ? null : p })} className={`px-3 h-9 text-sm font-medium ${periodo === p ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
              {p === 'semanal' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Boton icono={ChevronLeft} onClick={() => fijar({ fecha: periodo === 'semanal' ? sumarDiasAClave(ancla, -7) : sumarMesesAClave(ancla, -1) })}>Anterior</Boton>
          <Boton onClick={() => fijar({ fecha: null })}>Actual</Boton>
          <Boton onClick={() => fijar({ fecha: periodo === 'semanal' ? sumarDiasAClave(ancla, 7) : sumarMesesAClave(ancla, 1) })}>
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </Boton>
        </div>
        <div className="lg:ml-auto">
          <SelectorVersion version={version} onCambiar={(v) => fijar({ version: v === 'interna' ? null : v })} />
        </div>
      </div>
      {!interno && <AvisoDemostrativo className="mb-4">{NOTA_COMPARTIBLE}</AvisoDemostrativo>}
      {!cliente ? (
        <Panel><EstadoVacio titulo="Seleccione un cliente" /></Panel>
      ) : (
        <article className="bg-superficie border border-borde rounded-lg overflow-hidden">
          <header className="bg-barra text-sobre-primario px-5 py-4 flex flex-wrap items-center gap-3">
            <Anchor className="size-5 text-acento" aria-hidden="true" />
            <div>
              <p className="text-sm text-barra-texto-tenue">{NOMBRE_SISTEMA} · Reporte {periodo} {interno ? '(vista interna)' : 'para el cliente'}</p>
              <h2 className="text-lg font-semibold">{cliente.razonSocial}</h2>
            </div>
            <p className="ml-auto text-sm text-barra-texto">{etiqueta}</p>
          </header>
          <div className="p-5 space-y-6">
            <dl className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {indicadores.map(([e, v]) => (
                <div key={e} className="rounded-md border border-borde px-3 py-2">
                  <dt className="text-xs text-texto-secundario">{e}</dt>
                  <dd className="text-xl font-semibold tabular-nums text-texto">{v}</dd>
                </div>
              ))}
            </dl>
            <section>
              <h3 className="text-sm font-semibold text-texto mb-2">Consolidado de servicios</h3>
              {viajes.length === 0 ? (
                <EstadoVacio titulo="Sin servicios en el periodo" descripcion="Cambie de semana o de mes para ver otros servicios del cliente." />
              ) : (
                <div className="overflow-x-auto border border-borde rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-fondo text-texto-secundario text-xs uppercase tracking-wide">
                      <tr>{columnas.map((c) => <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-borde">
                      {filas.map((fila) => (
                        <tr key={String(fila[0])}>
                          {fila.map((celda, i) => (
                            <td key={i} className="px-3 py-2 whitespace-nowrap">
                              {i === 0 ? (
                                <Link to={`/viajes/${celda}?pestana=reportes`} className="font-mono font-semibold text-info hover:underline">{celda}</Link>
                              ) : i === 9 ? (
                                <Insignia tono={TONO[celda as Cumplimiento]}>{celda}</Insignia>
                              ) : (
                                celda
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            {retrasados.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-texto mb-2">Observaciones de retraso</h3>
                <ul className="space-y-2">
                  {retrasados.map((r) => (
                    <li key={r.viaje.codigo} className="rounded-md bg-peligro-fondo text-peligro px-3 py-2 text-sm"><span className="font-mono font-semibold">{r.viaje.codigo}</span>: {r.explicacionRetraso}</li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="text-sm font-semibold text-texto mb-2">Novedades e incidencias</h3>
              {incidencias.length === 0 ? (
                <p className="text-sm text-texto-secundario">Sin novedades en el periodo.</p>
              ) : (
                <ul className="divide-y divide-borde border border-borde rounded-md">
                  {incidencias.map((i) => (
                    <li key={i.codigo} className="px-3 py-2 text-sm flex flex-wrap gap-2">
                      <span className="font-mono">{i.viajeCodigo}</span>
                      <Insignia>{obtener(datos, 'tiposIncidencia', i.tipoIncidenciaCodigo)?.nombre}</Insignia>
                      <span className="flex-1 min-w-48">{i.descripcion}{i.accionCorrectiva ? ` Acción: ${i.accionCorrectiva}` : ''}</span>
                      <Insignia tono={i.estado === 'abierta' ? 'peligro' : 'exito'}>{i.estado === 'abierta' ? 'Abierta' : 'Resuelta'}</Insignia>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </article>
      )}
    </>
  )
}
