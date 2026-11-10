import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import type { Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { NOTA_COMPARTIBLE, SelectorVersion, type VersionReporte } from '@/componentes/reportes/SelectorVersion'
import { reporteDeViaje, seccionesReporteViaje, type Cumplimiento } from '@/servicios/reportes'
import { formatearDesvio, formatearFechaHora } from '@/utilidades/formateadores'

const TONO_CUMPLIMIENTO: Record<Cumplimiento, 'exito' | 'peligro' | 'neutro'> = { 'A tiempo': 'exito', Retrasado: 'peligro', 'Sin medir': 'neutro' }

export function ReporteViaje({ viaje }: { viaje: Viaje }) {
  const { datos } = usarApp()
  const [version, establecerVersion] = useState<VersionReporte>('interna')
  const ahora = useMemo(() => new Date(), [])
  const reporte = reporteDeViaje(datos, viaje, ahora)
  const interno = version === 'interna'

  const exportarPdfViaje = async () => {
    const { exportarPdf, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    exportarPdf({
      titulo: `Reporte del viaje ${viaje.codigo}${interno ? ' (interno)' : ''}`,
      subtitulo: `${reporte.cliente} · ${reporte.modalidad} · ${reporte.ruta}`,
      secciones: seccionesReporteViaje(reporte, interno),
      leyenda: interno ? 'Uso interno. Prototipo demostrativo.' : 'Reporte para el cliente. Prototipo demostrativo.',
      nombreArchivo: nombreArchivoSeguro(`reporte_${viaje.codigo}_${version}`, 'pdf'),
    })
  }
  const exportarExcelViaje = async () => {
    const { exportarExcel, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    const secciones = seccionesReporteViaje(reporte, interno)
    await exportarExcel(
      nombreArchivoSeguro(`reporte_${viaje.codigo}_${version}`, 'xlsx'),
      secciones.flatMap((s) =>
        s.tipo === 'tabla'
          ? [{ nombre: s.titulo.slice(0, 31), columnas: s.columnas, filas: s.filas }]
          : s.tipo === 'datos'
            ? [{ nombre: s.titulo.slice(0, 31), columnas: ['Campo', 'Valor'], filas: s.pares }]
            : [],
      ),
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <SelectorVersion version={version} onCambiar={establecerVersion} />
        <div className="ml-auto flex gap-2">
          <Boton icono={FileDown} onClick={() => void exportarPdfViaje()}>Descargar PDF</Boton>
          <Boton icono={FileSpreadsheet} onClick={() => void exportarExcelViaje()}>Exportar Excel</Boton>
        </div>
      </div>
      {!interno && <AvisoDemostrativo>{NOTA_COMPARTIBLE}</AvisoDemostrativo>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel titulo="Datos del servicio">
          <ListaDatos
            datos={[
              { etiqueta: 'Cliente', valor: reporte.cliente, ancho: 'completo' },
              { etiqueta: 'Modalidad', valor: reporte.modalidad },
              { etiqueta: 'Estado', valor: reporte.estado },
              { etiqueta: 'Recorrido', valor: reporte.ruta, ancho: 'completo' },
              { etiqueta: 'Transportista', valor: reporte.transportista },
              { etiqueta: 'Chofer y placa', valor: `${reporte.chofer} · ${reporte.placa}` },
              { etiqueta: 'Contenedor', valor: reporte.contenedor },
              { etiqueta: 'Carga', valor: reporte.carga },
              ...(interno
                ? [
                    { etiqueta: 'Valor referencial', valor: reporte.valor },
                    { etiqueta: 'Cobro y facturación', valor: `${reporte.cobro} · ${reporte.facturacion}` },
                  ]
                : []),
            ]}
          />
        </Panel>
        <Panel titulo="Cumplimiento del plazo" descripcion="Llegada o entrega real comparada con el compromiso registrado.">
          <div className="flex items-center gap-3">
            <Insignia tono={TONO_CUMPLIMIENTO[reporte.cumplimiento]}>{reporte.cumplimiento}</Insignia>
            <span className="text-sm text-texto-secundario">Desvío {formatearDesvio(reporte.desvioLlegada)}</span>
          </div>
          <ListaDatos
            datos={[
              { etiqueta: 'Prevista', valor: formatearFechaHora(viaje.llegadaPrevista) },
              { etiqueta: 'Real', valor: formatearFechaHora(reporte.llegadaReal) },
            ]}
          />
          {reporte.explicacionRetraso && <p className="mt-3 rounded-md bg-peligro-fondo text-peligro px-3 py-2 text-sm">{reporte.explicacionRetraso}</p>}
        </Panel>
      </div>
      <Panel titulo="Etapas y marcas horarias" sinRelleno>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-fondo text-texto-secundario text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Hito</th>
                <th className="px-4 py-2 text-left font-medium">Ubicación</th>
                <th className="px-4 py-2 text-left font-medium">Prevista</th>
                <th className="px-4 py-2 text-left font-medium">Real</th>
                <th className="px-4 py-2 text-left font-medium">Desvío</th>
                {interno && <th className="px-4 py-2 text-left font-medium">Registró</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {reporte.etapas.map((e) => (
                <tr key={e.hito} className={e.registrado ? '' : 'text-texto-secundario'}>
                  <td className="px-4 py-2">{e.hito}</td>
                  <td className="px-4 py-2">{e.ubicacion}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatearFechaHora(e.prevista)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{e.registrado ? formatearFechaHora(e.real) : 'Pendiente'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{e.desvio === null ? '' : <Insignia tono={e.desvio > 0 ? 'peligro' : 'exito'}>{e.desvio > 0 ? formatearDesvio(e.desvio) : 'A tiempo'}</Insignia>}</td>
                  {interno && <td className="px-4 py-2">{e.responsable}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel titulo="Novedades e incidencias" sinRelleno>
        {reporte.incidencias.length === 0 ? (
          <p className="px-4 py-5 text-sm text-texto-secundario">Sin novedades registradas.</p>
        ) : (
          <ul className="divide-y divide-borde">
            {reporte.incidencias.map((i) => (
              <li key={i.codigo} className="px-4 py-3 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">{i.codigo}</span>
                  <Insignia>{i.tipo}</Insignia>
                  <Insignia tono={i.estado === 'Resuelta' ? 'exito' : 'peligro'}>{i.estado}</Insignia>
                  <span className="ml-auto text-xs text-texto-secundario">{formatearFechaHora(i.fechaHora)}</span>
                </p>
                <p className="mt-1 text-texto">{i.descripcion}</p>
                {i.accionCorrectiva && <p className="mt-1 text-texto-secundario">Acción correctiva: {i.accionCorrectiva}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {interno && reporte.observaciones && (
        <Panel titulo="Observaciones internas">
          <p className="text-sm whitespace-pre-line">{reporte.observaciones}</p>
        </Panel>
      )}
    </div>
  )
}
