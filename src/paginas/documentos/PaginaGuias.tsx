import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, FileText } from 'lucide-react'
import type { Documento } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Panel } from '@/componentes/comunes/Panel'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { descargarGuia, ModalGenerarGuia, ModalVerGuia } from '@/componentes/documentos/ModalesDocumentos'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreUsuario } from '@/servicios/consultas'
import { LEYENDA_GUIA_DEMOSTRATIVA } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

export default function PaginaGuias() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const [viajeGuia, establecerViajeGuia] = useState('')
  const [generando, establecerGenerando] = useState(false)
  const [visible, establecerVisible] = useState<Documento | null>(null)
  const guias = datos.documentos.filter((d) => d.tipo === 'guia_remision')
  const ultimaVersion = (d: Documento) => !guias.some((g) => g.viajeCodigo === d.viajeCodigo && g.version > d.version)
  const elegibles = datos.viajes.filter((v) => v.estado !== 'cancelado' && v.estado !== 'solicitado')
  const viaje = obtener(datos, 'viajes', viajeGuia || undefined)

  const filas = guias.filter((d) => {
    const v = obtener(datos, 'viajes', d.viajeCodigo)
    return coincideTexto(listado.busqueda, [d.numeroReferencial, d.viajeCodigo, d.datosGuia?.placa, d.datosGuia?.chofer, nombreCliente(datos, v?.clienteCodigo)])
  })

  const columnas: Columna<Documento>[] = [
    { clave: 'numero', titulo: 'Número', valorOrden: (d) => d.numeroReferencial, celda: (d) => <span className="font-mono font-semibold whitespace-nowrap">{d.numeroReferencial}</span> },
    {
      clave: 'viaje',
      titulo: 'Viaje',
      valorOrden: (d) => d.viajeCodigo,
      celda: (d) => (
        <span className="block leading-tight">
          <Link to={`/viajes/${d.viajeCodigo}?pestana=documentos`} className="font-mono text-info hover:underline underline-offset-2">{d.viajeCodigo}</Link>
          <span className="block text-xs text-texto-secundario truncate max-w-56">{nombreCliente(datos, obtener(datos, 'viajes', d.viajeCodigo)?.clienteCodigo)}</span>
        </span>
      ),
    },
    { clave: 'transporte', titulo: 'Chofer y placa', visibleDesde: 'lg', celda: (d) => <span className="whitespace-nowrap">{d.datosGuia?.chofer.split(' (')[0]} · {d.datosGuia?.placa}</span> },
    { clave: 'version', titulo: 'Versión', valorOrden: (d) => d.version, celda: (d) => <span className="inline-flex items-center gap-1.5">v{d.version}{ultimaVersion(d) ? <Insignia tono="exito">Vigente</Insignia> : <Insignia>Histórica</Insignia>}</span> },
    { clave: 'fecha', titulo: 'Generación', valorOrden: (d) => d.fechaGeneracion, celda: (d) => <span className="block leading-tight whitespace-nowrap"><span className="block">{formatearFechaHora(d.fechaGeneracion)}</span><span className="block text-xs text-texto-secundario">{nombreUsuario(datos, d.creadoPor)}</span></span> },
  ]

  return (
    <>
      <EncabezadoPagina titulo="Guías de remisión" descripcion="Vista previa, impresión, descarga y consulta histórica de las guías por viaje." />
      <AvisoDemostrativo className="mb-5">{LEYENDA_GUIA_DEMOSTRATIVA} La emisión electrónica ante el SRI no forma parte del prototipo.</AvisoDemostrativo>
      {puede('documentos.escribir') && (
        <Panel titulo="Generar guía" descripcion="Elija un viaje con asignación de recursos. Cada generación crea una nueva versión." className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <Selector etiqueta="Viaje" textoTodos="Seleccione un viaje" className="sm:w-96" value={viajeGuia} onChange={(e) => establecerViajeGuia(e.target.value)} opciones={elegibles.map((v) => ({ valor: v.codigo, etiqueta: `${v.codigo} · ${nombreCliente(datos, v.clienteCodigo)}` }))} />
            <Boton variante="primario" icono={FileText} disabled={!viaje} onClick={() => establecerGenerando(true)}>Completar y generar</Boton>
          </div>
        </Panel>
      )}
      <div className="mb-4 sm:w-96">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Número, viaje, cliente, chofer o placa" />
      </div>
      <Tabla
        etiqueta="Guías de remisión"
        columnas={columnas}
        filas={filas}
        claveFila={(d) => d.codigo}
        listado={listado}
        onFila={(d) => establecerVisible(d)}
        acciones={(d) => (
          <span className="inline-flex gap-0.5">
            <BotonIcono icono={Eye} etiqueta={`Ver ${d.numeroReferencial}`} onClick={() => establecerVisible(d)} />
            <BotonIcono icono={Download} etiqueta={`Descargar ${d.numeroReferencial}`} onClick={() => void descargarGuia(d)} />
          </span>
        )}
      />
      {viaje && <ModalGenerarGuia viaje={viaje} abierto={generando} onCerrar={() => establecerGenerando(false)} onGenerada={establecerVisible} />}
      <ModalVerGuia documento={visible} onCerrar={() => establecerVisible(null)} />
    </>
  )
}
