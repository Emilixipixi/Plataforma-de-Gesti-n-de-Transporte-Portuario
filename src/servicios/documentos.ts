import type { DatosApp, DatosGuia, Viaje } from '@/tipos/dominio'
import { obtener } from '@/servicios/repositorio'

const SIN_ASIGNAR = 'Sin asignar'

export function nombreDeLugar(datos: DatosApp, codigo: string | undefined): string {
  return obtener(datos, 'lugares', codigo)?.nombre ?? SIN_ASIGNAR
}

export function recorridoDeViaje(datos: DatosApp, viaje: Viaje): string {
  return [...viaje.rutaPuntos]
    .sort((a, b) => a.orden - b.orden)
    .map((punto) => nombreDeLugar(datos, punto.lugarCodigo))
    .join(' → ')
}

export function construirDatosGuia(datos: DatosApp, viaje: Viaje): DatosGuia {
  const cliente = obtener(datos, 'clientes', viaje.clienteCodigo)
  const transportista = obtener(datos, 'transportistas', viaje.transportistaCodigo)
  const chofer = obtener(datos, 'choferes', viaje.choferCodigo)
  const unidad = obtener(datos, 'unidades', viaje.unidadCodigo)
  const destino = obtener(datos, 'lugares', viaje.destinoCodigo)
  const esExportacion = viaje.modalidad === 'exportacion'
  const contenedor = viaje.carga.contenedor
  return {
    remitente: cliente?.razonSocial ?? SIN_ASIGNAR,
    destinatario: esExportacion ? `Terminal de carga, ${destino?.nombre ?? SIN_ASIGNAR}` : (cliente?.razonSocial ?? SIN_ASIGNAR),
    identificacionDestinatario: cliente?.identificacion ?? SIN_ASIGNAR,
    transportista: transportista?.razonSocial ?? SIN_ASIGNAR,
    chofer: chofer ? `${chofer.nombre} (${chofer.identificacion})` : SIN_ASIGNAR,
    unidad: unidad?.tipo ?? SIN_ASIGNAR,
    placa: unidad?.placa ?? SIN_ASIGNAR,
    origen: nombreDeLugar(datos, viaje.origenCodigo),
    destino: destino?.nombre ?? SIN_ASIGNAR,
    carga: viaje.carga.descripcion,
    contenedor: contenedor ? `${contenedor.numero} (${contenedor.tipo})` : undefined,
    recorrido: recorridoDeViaje(datos, viaje),
  }
}
