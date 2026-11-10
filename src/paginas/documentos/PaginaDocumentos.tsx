import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, FileArchive, FilePlus2 } from 'lucide-react'
import { TIPOS_DOCUMENTO, type Documento } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Panel } from '@/componentes/comunes/Panel'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { descargarGuia, ModalAdjuntarDocumento, ModalVerGuia } from '@/componentes/documentos/ModalesDocumentos'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreUsuario } from '@/servicios/consultas'
import { ETIQUETAS_TIPO_DOCUMENTO, opcionesDe } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

export default function PaginaDocumentos() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const [adjuntando, establecerAdjuntando] = useState(false)
  const [guia, establecerGuia] = useState<Documento | null>(null)
  const [viajePaquete, establecerViajePaquete] = useState('')
  const tipo = listado.filtro('tipo')
  const cliente = listado.filtro('cliente')
  const clienteDe = (d: Documento) => obtener(datos, 'viajes', d.viajeCodigo)?.clienteCodigo ?? ''

  const filas = datos.documentos.filter(
    (d) =>
      (!tipo || d.tipo === tipo) &&
      (!cliente || clienteDe(d) === cliente) &&
      coincideTexto(listado.busqueda, [d.codigo, d.viajeCodigo, d.numeroReferencial, d.nombreArchivo, d.descripcion, nombreCliente(datos, clienteDe(d))]),
  )

  const descargarPaquete = async () => {
    const viaje = obtener(datos, 'viajes', viajePaquete)
    if (!viaje) return
    const { descargarPaqueteDocumental } = await import('@/servicios/documentosPdf')
    descargarPaqueteDocumental(datos, viaje, new Date())
  }

  const columnas: Columna<Documento>[] = [
    { clave: 'codigo', titulo: 'Código', valorOrden: (d) => d.codigo, celda: (d) => <span className="font-mono font-semibold whitespace-nowrap">{d.codigo}</span> },
    { clave: 'tipo', titulo: 'Tipo', valorOrden: (d) => ETIQUETAS_TIPO_DOCUMENTO[d.tipo], celda: (d) => <Insignia tono={d.tipo === 'guia_remision' ? 'info' : 'neutro'}>{ETIQUETAS_TIPO_DOCUMENTO[d.tipo]}</Insignia> },
    {
      clave: 'viaje',
      titulo: 'Viaje',
      valorOrden: (d) => d.viajeCodigo,
      celda: (d) => (
        <span className="block leading-tight">
          <Link to={`/viajes/${d.viajeCodigo}?pestana=documentos`} className="font-mono text-info hover:underline underline-offset-2">{d.viajeCodigo}</Link>
          <span className="block text-xs text-texto-secundario truncate max-w-48">{nombreCliente(datos, clienteDe(d))}</span>
        </span>
      ),
    },
    {
      clave: 'archivo',
      titulo: 'Documento',
      visibleDesde: 'lg',
      celda: (d) => (
        <span className="block leading-tight max-w-96">
          <span className="block break-all">{d.numeroReferencial ? `${d.numeroReferencial} · ` : ''}{d.nombreArchivo}</span>
          <span className="block text-xs text-texto-secundario">{d.emisor} a {d.receptor}</span>
        </span>
      ),
    },
    { clave: 'version', titulo: 'Versión', alinear: 'centro', valorOrden: (d) => d.version, celda: (d) => d.version, visibleDesde: 'md' },
    {
      clave: 'fecha',
      titulo: 'Fecha',
      valorOrden: (d) => d.fechaGeneracion,
      celda: (d) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block">{formatearFechaHora(d.fechaGeneracion)}</span>
          <span className="block text-xs text-texto-secundario">{nombreUsuario(datos, d.creadoPor)}</span>
        </span>
      ),
    },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Documentos"
        descripcion="Guías, conocimientos de embarque, actas y evidencias de cada viaje."
        acciones={puede('documentos.escribir') && <Boton variante="primario" icono={FilePlus2} onClick={() => establecerAdjuntando(true)}>Adjuntar documento</Boton>}
      />
      <Panel titulo="Paquete documental del viaje" descripcion="Descarga demostrativa en PDF con el índice de documentos, la guía vigente y el reporte del viaje." className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <Selector etiqueta="Viaje" textoTodos="Seleccione un viaje" className="sm:w-96" value={viajePaquete} onChange={(e) => establecerViajePaquete(e.target.value)} opciones={datos.viajes.filter((v) => v.estado !== 'cancelado').map((v) => ({ valor: v.codigo, etiqueta: `${v.codigo} · ${nombreCliente(datos, v.clienteCodigo)}` }))} />
          <Boton icono={FileArchive} disabled={!viajePaquete} onClick={() => void descargarPaquete()}>Descargar paquete</Boton>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto] lg:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Código, viaje, número o archivo" className="sm:col-span-2 lg:col-span-1" />
        <Selector etiqueta="Tipo" textoTodos="Todos" value={tipo} onChange={(e) => listado.establecerFiltro('tipo', e.target.value)} opciones={opcionesDe(ETIQUETAS_TIPO_DOCUMENTO, TIPOS_DOCUMENTO)} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden lg:block" />}
      </div>
      <Tabla
        etiqueta="Documentos"
        columnas={columnas}
        filas={filas}
        claveFila={(d) => d.codigo}
        listado={listado}
        acciones={(d) =>
          d.datosGuia ? (
            <span className="inline-flex gap-0.5">
              <BotonIcono icono={Eye} etiqueta={`Ver guía ${d.numeroReferencial ?? d.codigo}`} onClick={() => establecerGuia(d)} />
              <BotonIcono icono={Download} etiqueta={`Descargar guía ${d.numeroReferencial ?? d.codigo}`} onClick={() => void descargarGuia(d)} />
            </span>
          ) : (
            <span className="text-xs text-texto-secundario">Archivo ilustrativo</span>
          )
        }
      />
      {puede('documentos.escribir') && <ModalAdjuntarDocumento abierto={adjuntando} onCerrar={() => establecerAdjuntando(false)} />}
      <ModalVerGuia documento={guia} onCerrar={() => establecerGuia(null)} />
    </>
  )
}
