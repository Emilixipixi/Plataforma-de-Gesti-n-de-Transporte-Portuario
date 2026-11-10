import type { DatosApp, Documento, Viaje } from '@/tipos/dominio'
import { agregarSecciones, crearPdf, exportarPdf, nombreArchivoSeguro, textoPdf, type Seccion } from '@/servicios/exportacion'
import { reporteDeViaje, seccionesReporteViaje } from '@/servicios/reportes'
import { ETIQUETAS_TIPO_DOCUMENTO, LEYENDA_GUIA_DEMOSTRATIVA } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

export function seccionesGuia(documento: Documento): Seccion[] {
  const guia = documento.datosGuia
  if (!guia) return []
  return [
    {
      tipo: 'datos',
      titulo: 'Datos del documento',
      pares: [
        ['Número referencial', documento.numeroReferencial ?? ''],
        ['Código de viaje', documento.viajeCodigo],
        ['Fecha de generación', formatearFechaHora(documento.fechaGeneracion)],
        ['Versión', String(documento.version)],
        ['Emisor', documento.emisor],
        ['Receptor', documento.receptor],
      ],
    },
    {
      tipo: 'datos',
      titulo: 'Remitente y destinatario',
      pares: [
        ['Remitente', guia.remitente],
        ['Destinatario', guia.destinatario],
        ['Identificación del destinatario', guia.identificacionDestinatario],
      ],
    },
    {
      tipo: 'datos',
      titulo: 'Transporte',
      pares: [
        ['Transportista', guia.transportista],
        ['Chofer', guia.chofer],
        ['Unidad', guia.unidad],
        ['Placa', guia.placa],
      ],
    },
    {
      tipo: 'datos',
      titulo: 'Carga y recorrido',
      pares: [
        ['Origen', guia.origen],
        ['Destino', guia.destino],
        ['Carga', guia.carga],
        ['Contenedor', guia.contenedor ?? 'No aplica'],
        ['Recorrido', guia.recorrido],
      ],
    },
    { tipo: 'texto', texto: LEYENDA_GUIA_DEMOSTRATIVA, destacado: true },
  ]
}

export function descargarGuiaPdf(documento: Documento): void {
  exportarPdf({
    titulo: 'Guía de remisión (demostrativa)',
    subtitulo: `${documento.numeroReferencial ?? documento.codigo} · Viaje ${documento.viajeCodigo} · Versión ${documento.version}`,
    secciones: seccionesGuia(documento),
    leyenda: LEYENDA_GUIA_DEMOSTRATIVA,
    nombreArchivo: nombreArchivoSeguro(documento.nombreArchivo.replace(/\.pdf$/i, ''), 'pdf'),
  })
}

export function descargarPaqueteDocumental(datos: DatosApp, viaje: Viaje, ahora: Date): void {
  const documentos = datos.documentos.filter((d) => d.viajeCodigo === viaje.codigo).sort((a, b) => a.fechaGeneracion.localeCompare(b.fechaGeneracion))
  const guiaVigente = documentos.filter((d) => d.tipo === 'guia_remision').at(-1)
  const reporte = reporteDeViaje(datos, viaje, ahora)
  const pdf = crearPdf({
    titulo: `Paquete documental del viaje ${viaje.codigo}`,
    subtitulo: `${reporte.cliente} · ${reporte.modalidad} · ${reporte.ruta}`,
    leyenda: 'Paquete demostrativo. Los archivos adjuntos se listan como referencia; su contenido no se almacena en el prototipo.',
    secciones: [
      {
        tipo: 'tabla',
        titulo: 'Índice de documentos',
        columnas: ['Código', 'Tipo', 'Número', 'Archivo', 'Versión', 'Fecha'],
        filas: documentos.map((d) => [d.codigo, ETIQUETAS_TIPO_DOCUMENTO[d.tipo], d.numeroReferencial ?? '', d.nombreArchivo, d.version, formatearFechaHora(d.fechaGeneracion)]),
        pie: guiaVigente ? `Se incluye la guía vigente ${guiaVigente.numeroReferencial ?? guiaVigente.codigo} (versión ${guiaVigente.version}) y el reporte del viaje.` : 'El viaje no tiene guía de remisión generada.',
      },
      ...seccionesReporteViaje(reporte, false),
    ],
  })
  if (guiaVigente) {
    pdf.addPage()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text(textoPdf(`Guía de remisión ${guiaVigente.numeroReferencial ?? ''} (versión ${guiaVigente.version})`), 14, 20)
    agregarSecciones(pdf, seccionesGuia(guiaVigente), 28)
  }
  pdf.save(nombreArchivoSeguro(`paquete_documental_${viaje.codigo}`, 'pdf'))
}

