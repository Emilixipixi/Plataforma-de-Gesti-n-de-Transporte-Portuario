import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { rgbTema } from '@/utilidades/colores'
import { NOMBRE_DESCRIPTIVO, NOMBRE_SISTEMA } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'

export type Celda = string | number

export interface SeccionTabla {
  titulo: string
  columnas: string[]
  filas: Celda[][]
  pie?: string
}

export interface SeccionDatos {
  titulo: string
  pares: [string, string][]
}

export type Seccion = ({ tipo: 'tabla' } & SeccionTabla) | ({ tipo: 'datos' } & SeccionDatos) | { tipo: 'texto'; titulo?: string; texto: string; destacado?: boolean }

export interface DocumentoPdf {
  titulo: string
  subtitulo?: string
  secciones: Seccion[]
  leyenda?: string
  nombreArchivo: string
  horizontal?: boolean
}

const MARGEN = 14

export function textoPdf(texto: string): string {
  return texto.replace(/→/g, '>').replace(/[–—]/g, '-').replace(/[^\x20-\xFF\n]/g, '')
}

function encabezado(pdf: jsPDF, titulo: string, subtitulo?: string): number {
  const ancho = pdf.internal.pageSize.getWidth()
  pdf.setFillColor(...rgbTema('barra'))
  pdf.rect(0, 0, ancho, 18, 'F')
  pdf.setTextColor(...rgbTema('acento'))
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text(NOMBRE_SISTEMA, MARGEN, 11.5)
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text(textoPdf(NOMBRE_DESCRIPTIVO), MARGEN + 30, 11.5)
  pdf.text(textoPdf(`Generado ${formatearFechaHora(new Date().toISOString())}`), ancho - MARGEN, 11.5, { align: 'right' })
  pdf.setTextColor(...rgbTema('texto'))
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.text(textoPdf(titulo), MARGEN, 29)
  let y = 29
  if (subtitulo) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...rgbTema('texto-secundario'))
    const lineas = pdf.splitTextToSize(textoPdf(subtitulo), ancho - MARGEN * 2) as string[]
    pdf.text(lineas, MARGEN, 35)
    y = 35 + (lineas.length - 1) * 4
  }
  return y + 6
}

function pies(pdf: jsPDF, leyenda?: string) {
  const total = pdf.getNumberOfPages()
  const ancho = pdf.internal.pageSize.getWidth()
  const alto = pdf.internal.pageSize.getHeight()
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i)
    pdf.setFontSize(7.5)
    pdf.setTextColor(...rgbTema('texto-secundario'))
    pdf.text(textoPdf(leyenda ?? 'Prototipo demostrativo con datos ficticios.'), MARGEN, alto - 8)
    pdf.text(`Página ${i} de ${total}`, ancho - MARGEN, alto - 8, { align: 'right' })
  }
}

export function agregarSecciones(pdf: jsPDF, secciones: Seccion[], inicioY: number): number {
  let y = inicioY
  const ancho = pdf.internal.pageSize.getWidth()
  const estiloTabla = {
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: rgbTema('texto'), lineColor: rgbTema('borde'), lineWidth: 0.1 },
    headStyles: { fillColor: rgbTema('fondo'), textColor: rgbTema('texto-secundario'), fontStyle: 'bold' as const },
    margin: { left: MARGEN, right: MARGEN },
  }
  for (const seccion of secciones) {
    if (y > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage()
      y = 20
    }
    if (seccion.tipo === 'texto') {
      if (seccion.titulo) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(...rgbTema('texto'))
        pdf.text(textoPdf(seccion.titulo), MARGEN, y)
        y += 5
      }
      pdf.setFont('helvetica', seccion.destacado ? 'bold' : 'normal')
      pdf.setFontSize(8.5)
      const lineas = pdf.splitTextToSize(textoPdf(seccion.texto), ancho - MARGEN * 2 - (seccion.destacado ? 6 : 0)) as string[]
      if (seccion.destacado) {
        pdf.setFillColor(...rgbTema('peligro-fondo'))
        pdf.rect(MARGEN, y - 4, ancho - MARGEN * 2, lineas.length * 4 + 4, 'F')
        pdf.setTextColor(...rgbTema('peligro'))
        pdf.text(lineas, MARGEN + 3, y)
      } else {
        pdf.setTextColor(...rgbTema('texto'))
        pdf.text(lineas, MARGEN, y)
      }
      y += lineas.length * 4 + 6
      continue
    }
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...rgbTema('texto'))
    pdf.text(textoPdf(seccion.titulo), MARGEN, y)
    if (seccion.tipo === 'datos') {
      autoTable(pdf, {
        ...estiloTabla,
        startY: y + 2,
        body: seccion.pares.map(([etiqueta, valor]) => [textoPdf(etiqueta), textoPdf(valor)]),
        columnStyles: { 0: { fontStyle: 'bold', textColor: rgbTema('texto-secundario'), cellWidth: 50 } },
        theme: 'grid',
      })
    } else {
      autoTable(pdf, {
        ...estiloTabla,
        startY: y + 2,
        head: [seccion.columnas.map(textoPdf)],
        body: seccion.filas.length > 0 ? seccion.filas.map((f) => f.map((c) => (typeof c === 'number' ? c : textoPdf(c)))) : [[{ content: 'Sin registros', colSpan: seccion.columnas.length }]],
        theme: 'grid',
      })
    }
    const final = (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
    y = final + 4
    if (seccion.tipo === 'tabla' && seccion.pie) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(...rgbTema('texto-secundario'))
      pdf.text(textoPdf(seccion.pie), MARGEN, y + 2)
      y += 6
    }
    y += 4
  }
  return y
}

export function crearPdf(documento: Omit<DocumentoPdf, 'nombreArchivo'>): jsPDF {
  const pdf = new jsPDF({ orientation: documento.horizontal ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const y = encabezado(pdf, documento.titulo, documento.subtitulo)
  agregarSecciones(pdf, documento.secciones, y)
  pies(pdf, documento.leyenda)
  return pdf
}

export function exportarPdf(documento: DocumentoPdf): void {
  crearPdf(documento).save(documento.nombreArchivo)
}

export interface HojaExcel {
  nombre: string
  columnas: string[]
  filas: Celda[][]
}

export async function exportarExcel(nombreArchivo: string, hojas: HojaExcel[]): Promise<void> {
  const { utils, writeFile } = await import('xlsx')
  const libro = utils.book_new()
  for (const hoja of hojas) {
    const datos = [hoja.columnas, ...hoja.filas]
    const pagina = utils.aoa_to_sheet(datos)
    pagina['!cols'] = hoja.columnas.map((columna, i) => ({ wch: Math.min(48, Math.max(columna.length, ...hoja.filas.map((f) => String(f[i] ?? '').length)) + 2) }))
    utils.book_append_sheet(libro, pagina, hoja.nombre.slice(0, 31))
  }
  writeFile(libro, nombreArchivo)
}

export function nombreArchivoSeguro(base: string, extension: 'pdf' | 'xlsx'): string {
  const limpio = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
  return `${limpio}.${extension}`
}
