import type { Solicitud, Viaje } from '@/tipos/dominio'
import { guardar, obtener } from '@/servicios/repositorio'
import { siguienteCodigo } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_SOLICITUD, ETIQUETAS_MODALIDAD, PREFIJOS, prefijoDeViaje, TIPO_CARGA_POR_MODALIDAD } from '@/utilidades/constantes'
import { desdeValorFechaHoraLocal } from '@/utilidades/formateadores'
import type { EntradaSolicitud } from '@/utilidades/validadores'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

function camposDesdeEntrada(entrada: EntradaSolicitud): Omit<Solicitud, 'codigo' | 'fechaCreacion' | 'creadoPor'> | null {
  const fechaRequerida = desdeValorFechaHoraLocal(entrada.fechaRequerida)
  if (!fechaRequerida) return null
  return {
    clienteCodigo: entrada.clienteCodigo,
    modalidad: entrada.modalidad,
    tipoCarga: TIPO_CARGA_POR_MODALIDAD[entrada.modalidad],
    categoriaCargaCodigo: entrada.categoriaCargaCodigo,
    descripcionCarga: entrada.descripcionCarga.trim(),
    origenCodigo: entrada.origenCodigo,
    destinoCodigo: entrada.destinoCodigo,
    fechaRequerida,
    indicacionesCliente: entrada.indicacionesCliente.trim(),
    observaciones: entrada.observaciones.trim(),
    estado: entrada.estado,
  }
}

export function crearSolicitud(entrada: EntradaSolicitud): Operacion<Solicitud> {
  return (datos, { usuarioCodigo, ahora }) => {
    const cliente = obtener(datos, 'clientes', entrada.clienteCodigo)
    if (!cliente) return fallo('El cliente seleccionado no existe.')
    if (cliente.estado !== 'activo') return fallo('El cliente está inactivo; actívelo antes de registrar solicitudes.')
    const campos = camposDesdeEntrada(entrada)
    if (!campos) return fallo('La fecha requerida no es válida.')
    const { codigo, configuracion } = siguienteCodigo(datos.configuracion, PREFIJOS.solicitud)
    const solicitud: Solicitud = { codigo, ...campos, fechaCreacion: ahora, creadoPor: usuarioCodigo }
    return exito(
      { ...guardar(datos, 'solicitudes', solicitud), configuracion },
      [{ usuarioCodigo, accion: 'creacion', entidad: 'solicitud', codigoEntidad: codigo, descripcion: `Solicitud de ${ETIQUETAS_MODALIDAD[solicitud.modalidad].toLowerCase()} registrada para ${cliente.razonSocial}.` }],
      solicitud,
    )
  }
}

export function editarSolicitud(codigo: string, entrada: EntradaSolicitud): Operacion<Solicitud> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, 'solicitudes', codigo)
    if (!actual) return fallo(`La solicitud ${codigo} no existe.`)
    if (actual.estado === 'convertida' || actual.estado === 'rechazada') {
      return fallo(`Una solicitud ${ETIQUETAS_ESTADO_SOLICITUD[actual.estado].toLowerCase()} no se puede editar.`)
    }
    const campos = camposDesdeEntrada(entrada)
    if (!campos) return fallo('La fecha requerida no es válida.')
    const solicitud: Solicitud = { ...actual, ...campos }
    const descripcion = actual.estado !== solicitud.estado ? `Solicitud editada; estado ${ETIQUETAS_ESTADO_SOLICITUD[solicitud.estado].toLowerCase()}.` : 'Solicitud editada.'
    return exito(guardar(datos, 'solicitudes', solicitud), [{ usuarioCodigo, accion: 'edicion', entidad: 'solicitud', codigoEntidad: codigo, descripcion }], solicitud)
  }
}

export function aceptarSolicitud(codigo: string): Operacion<Solicitud> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, 'solicitudes', codigo)
    if (!actual) return fallo(`La solicitud ${codigo} no existe.`)
    if (actual.estado !== 'recibida') return fallo('Solo una solicitud recibida puede aceptarse.')
    const solicitud: Solicitud = { ...actual, estado: 'aceptada' }
    return exito(guardar(datos, 'solicitudes', solicitud), [{ usuarioCodigo, accion: 'edicion', entidad: 'solicitud', codigoEntidad: codigo, descripcion: 'Solicitud aceptada; lista para convertir en viaje.' }], solicitud)
  }
}

export function rechazarSolicitud(codigo: string, motivo: string): Operacion<Solicitud> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, 'solicitudes', codigo)
    if (!actual) return fallo(`La solicitud ${codigo} no existe.`)
    if (actual.estado !== 'recibida' && actual.estado !== 'aceptada') return fallo('Solo una solicitud recibida o aceptada puede rechazarse.')
    const texto = motivo.trim()
    if (texto.length < 5) return fallo('Documente el motivo del rechazo.')
    const solicitud: Solicitud = { ...actual, estado: 'rechazada', motivoRechazo: texto }
    return exito(guardar(datos, 'solicitudes', solicitud), [{ usuarioCodigo, accion: 'edicion', entidad: 'solicitud', codigoEntidad: codigo, descripcion: `Solicitud rechazada. Motivo: ${texto}` }], solicitud)
  }
}

function observacionesDeViaje(solicitud: Solicitud): string {
  return [
    solicitud.indicacionesCliente && `Indicaciones del cliente: ${solicitud.indicacionesCliente}`,
    solicitud.observaciones && `Observaciones de la solicitud: ${solicitud.observaciones}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function convertirSolicitud(codigo: string): Operacion<Viaje> {
  return (datos, { usuarioCodigo, ahora }) => {
    const solicitud = obtener(datos, 'solicitudes', codigo)
    if (!solicitud) return fallo(`La solicitud ${codigo} no existe.`)
    if (solicitud.estado !== 'aceptada') return fallo('Solo una solicitud aceptada puede convertirse en viaje.')
    const cliente = obtener(datos, 'clientes', solicitud.clienteCodigo)
    if (!cliente || cliente.estado !== 'activo') return fallo('El cliente de la solicitud está inactivo.')
    const prefijo = prefijoDeViaje(solicitud.modalidad)
    const { codigo: viajeCodigo, configuracion } = siguienteCodigo(datos.configuracion, prefijo)
    const viaje: Viaje = {
      codigo: viajeCodigo,
      solicitudCodigo: solicitud.codigo,
      clienteCodigo: solicitud.clienteCodigo,
      modalidad: solicitud.modalidad,
      estado: 'solicitado',
      carga: {
        tipo: solicitud.tipoCarga,
        ...(solicitud.categoriaCargaCodigo ? { categoriaCodigo: solicitud.categoriaCargaCodigo } : {}),
        descripcion: solicitud.descripcionCarga,
        observaciones: '',
      },
      origenCodigo: solicitud.origenCodigo,
      destinoCodigo: solicitud.destinoCodigo,
      rutaPuntos: [
        { orden: 1, lugarCodigo: solicitud.origenCodigo, funcion: 'origen' },
        { orden: 2, lugarCodigo: solicitud.destinoCodigo, funcion: 'destino' },
      ],
      salidaPrevista: solicitud.fechaRequerida,
      modalidadCobro: 'contra_factura',
      valorReferencial: 0,
      observaciones: observacionesDeViaje(solicitud),
      historialEstados: [{ fecha: ahora, estadoAnterior: null, estadoNuevo: 'solicitado', usuarioCodigo, motivo: `Conversión de ${solicitud.codigo}` }],
      ajustesProgramacion: [],
      creadoPor: usuarioCodigo,
      fechaCreacion: ahora,
    }
    const solicitudActualizada: Solicitud = { ...solicitud, estado: 'convertida', viajeCodigo }
    const conViaje = guardar(guardar(datos, 'viajes', viaje), 'solicitudes', solicitudActualizada)
    return exito(
      { ...conViaje, configuracion },
      [
        { usuarioCodigo, accion: 'conversion', entidad: 'viaje', codigoEntidad: viajeCodigo, descripcion: `Solicitud ${solicitud.codigo} convertida en viaje de ${ETIQUETAS_MODALIDAD[viaje.modalidad].toLowerCase()} para ${cliente.razonSocial}.` },
      ],
      viaje,
      `Viaje ${viajeCodigo} creado desde ${solicitud.codigo}`,
    )
  }
}
