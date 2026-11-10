import type { DatosGuia, Documento, Evidencia, TipoDocumento } from '@/tipos/dominio'
import { guardar, obtener } from '@/servicios/repositorio'
import { siguienteNumeroGuia, versionSiguiente } from '@/servicios/documentos'
import { siguienteCodigo } from '@/utilidades/calculos'
import { ETIQUETAS_TIPO_DOCUMENTO, PREFIJOS } from '@/utilidades/constantes'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

const CAMPOS_GUIA_OBLIGATORIOS: (keyof DatosGuia)[] = ['remitente', 'destinatario', 'identificacionDestinatario', 'transportista', 'chofer', 'unidad', 'placa', 'origen', 'destino', 'carga', 'recorrido']

function limpiarGuia(datosGuia: DatosGuia): DatosGuia {
  const { contenedor, ...resto } = datosGuia
  const limpio = Object.fromEntries(Object.entries(resto).map(([clave, valor]) => [clave, String(valor).trim()])) as Omit<DatosGuia, 'contenedor'>
  return contenedor?.trim() ? { ...limpio, contenedor: contenedor.trim() } : limpio
}

export function generarGuia(viajeCodigo: string, datosGuia: DatosGuia, emisor: string, receptor: string): Operacion<Documento> {
  return (datos, { usuarioCodigo, ahora }) => {
    const viaje = obtener(datos, 'viajes', viajeCodigo)
    if (!viaje) return fallo(`El viaje ${viajeCodigo} no existe.`)
    if (viaje.estado === 'cancelado') return fallo('No se generan guías para viajes cancelados.')
    if (viaje.estado === 'solicitado') return fallo('Asigne transportista, chofer y unidad antes de generar la guía.')
    const faltantes = CAMPOS_GUIA_OBLIGATORIOS.filter((c) => !String(datosGuia[c] ?? '').trim() || datosGuia[c] === 'Sin asignar')
    if (faltantes.length > 0) return fallo('Complete todos los campos documentales de la guía.')
    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.documento)
    const version = versionSiguiente(datos, viajeCodigo, 'guia_remision')
    const documento: Documento = {
      codigo: generado.codigo,
      viajeCodigo,
      tipo: 'guia_remision',
      numeroReferencial: siguienteNumeroGuia(datos),
      fechaGeneracion: ahora,
      emisor: emisor.trim(),
      receptor: receptor.trim(),
      nombreArchivo: `guia_remision_${viajeCodigo}_v${version}.pdf`,
      descripcion: `Guía de remisión demostrativa del viaje ${viajeCodigo}, versión ${version}.`,
      version,
      datosGuia: limpiarGuia(datosGuia),
      creadoPor: usuarioCodigo,
    }
    return exito(
      { ...guardar(datos, 'documentos', documento), configuracion: generado.configuracion },
      [{ usuarioCodigo, accion: 'documento', entidad: 'documento', codigoEntidad: documento.codigo, descripcion: `Guía ${documento.numeroReferencial} (versión ${version}) generada para ${viajeCodigo}.` }],
      documento,
    )
  }
}

export interface EntradaAdjunto {
  viajeCodigo: string
  tipo: TipoDocumento
  numeroReferencial: string
  emisor: string
  receptor: string
  descripcion: string
  archivo: Evidencia
}

export function adjuntarDocumento(entrada: EntradaAdjunto): Operacion<Documento> {
  return (datos, { usuarioCodigo, ahora }) => {
    const viaje = obtener(datos, 'viajes', entrada.viajeCodigo)
    if (!viaje) return fallo('El viaje seleccionado no existe.')
    if (entrada.tipo === 'guia_remision') return fallo('Las guías de remisión se generan desde el formulario de guía.')
    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.documento)
    const documento: Documento = {
      codigo: generado.codigo,
      viajeCodigo: viaje.codigo,
      tipo: entrada.tipo,
      ...(entrada.numeroReferencial.trim() ? { numeroReferencial: entrada.numeroReferencial.trim() } : {}),
      fechaGeneracion: ahora,
      emisor: entrada.emisor.trim(),
      receptor: entrada.receptor.trim(),
      nombreArchivo: entrada.archivo.nombre,
      descripcion: entrada.descripcion.trim(),
      version: versionSiguiente(datos, viaje.codigo, entrada.tipo),
      creadoPor: usuarioCodigo,
    }
    return exito(
      { ...guardar(datos, 'documentos', documento), configuracion: generado.configuracion },
      [{ usuarioCodigo, accion: 'documento', entidad: 'documento', codigoEntidad: documento.codigo, descripcion: `Documento adjuntado a ${viaje.codigo}: ${ETIQUETAS_TIPO_DOCUMENTO[documento.tipo].toLowerCase()}, ${documento.nombreArchivo}.` }],
      documento,
    )
  }
}
