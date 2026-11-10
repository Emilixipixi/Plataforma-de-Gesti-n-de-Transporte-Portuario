import { Anchor, FileWarning } from 'lucide-react'
import type { DatosGuia } from '@/tipos/dominio'
import { LEYENDA_GUIA_DEMOSTRATIVA, NOMBRE_DESCRIPTIVO, NOMBRE_SISTEMA } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

interface PropiedadesVistaGuia {
  datos: DatosGuia
  numero: string
  viajeCodigo: string
  fecha: string
  version: number
  emisor: string
  receptor: string
  borrador?: boolean
}

function Bloque({ titulo, filas }: { titulo: string; filas: [string, string | undefined][] }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-texto-secundario border-b border-borde pb-1 mb-2">{titulo}</h3>
      <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className="text-texto-secundario">{etiqueta}</dt>
            <dd className="text-texto break-words">{valor || 'Sin registrar'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function VistaGuia({ datos, numero, viajeCodigo, fecha, version, emisor, receptor, borrador = false }: PropiedadesVistaGuia) {
  return (
    <article className="zona-impresion bg-superficie border border-borde rounded-lg overflow-hidden text-texto">
      <header className="bg-barra text-sobre-primario px-5 py-3 flex flex-wrap items-center gap-3">
        <Anchor className="size-5 text-acento" aria-hidden="true" />
        <div className="leading-tight">
          <p className="font-semibold tracking-wider">{NOMBRE_SISTEMA}</p>
          <p className="text-[11px] text-barra-texto-tenue">{NOMBRE_DESCRIPTIVO}</p>
        </div>
        <div className="ml-auto text-right leading-tight">
          <p className="text-sm font-semibold">Guía de remisión (demostrativa)</p>
          <p className="text-[11px] text-barra-texto">{numero}{borrador ? ' · borrador' : ''}</p>
        </div>
      </header>
      <div className="px-5 py-4 space-y-4">
        <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <p><span className="text-texto-secundario">Código de viaje: </span><span className="font-mono font-semibold">{viajeCodigo}</span></p>
          <p><span className="text-texto-secundario">Fecha de generación: </span>{formatearFechaHora(fecha)}</p>
          <p><span className="text-texto-secundario">Emisor: </span>{emisor}</p>
          <p><span className="text-texto-secundario">Receptor: </span>{receptor}</p>
          <p><span className="text-texto-secundario">Versión: </span>{version}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Bloque titulo="Remitente y destinatario" filas={[['Remitente', datos.remitente], ['Destinatario', datos.destinatario], ['Identificación', datos.identificacionDestinatario]]} />
          <Bloque titulo="Transporte" filas={[['Transportista', datos.transportista], ['Chofer', datos.chofer], ['Unidad', datos.unidad], ['Placa', datos.placa]]} />
          <Bloque titulo="Carga" filas={[['Carga', datos.carga], ['Contenedor', datos.contenedor || 'No aplica']]} />
          <Bloque titulo="Recorrido" filas={[['Origen', datos.origen], ['Destino', datos.destino], ['Recorrido', datos.recorrido]]} />
        </div>
        <div className="grid grid-cols-2 gap-6 pt-6">
          <p className="border-t border-texto-secundario/50 pt-1 text-center text-xs text-texto-secundario">Firma del chofer</p>
          <p className="border-t border-texto-secundario/50 pt-1 text-center text-xs text-texto-secundario">Recibido por el cliente</p>
        </div>
        <p className="flex items-start gap-2 rounded-md bg-peligro-fondo text-peligro px-3 py-2 text-sm font-medium">
          <FileWarning className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          {LEYENDA_GUIA_DEMOSTRATIVA}
        </p>
      </div>
    </article>
  )
}
