export const PERFILES = ['operaciones', 'contabilidad'] as const
export type Perfil = (typeof PERFILES)[number]

export const MODALIDADES = [
  'importacion_contenedorizada',
  'importacion_suelta',
  'exportacion',
] as const
export type Modalidad = (typeof MODALIDADES)[number]

export const TIPOS_CARGA = ['contenedorizada', 'suelta'] as const
export type TipoCarga = (typeof TIPOS_CARGA)[number]

export const ESTADOS_VIAJE = [
  'solicitado',
  'programado',
  'en_ejecucion',
  'entregado_pendiente_devolucion',
  'finalizado',
  'cancelado',
] as const
export type EstadoViaje = (typeof ESTADOS_VIAJE)[number]

export const ESTADOS_SOLICITUD = ['recibida', 'aceptada', 'convertida', 'rechazada'] as const
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]

export const ESTADOS_INCIDENCIA = ['abierta', 'resuelta'] as const
export type EstadoIncidencia = (typeof ESTADOS_INCIDENCIA)[number]

export const ESTADOS_PAGO = ['registrado', 'validado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const MODALIDADES_COBRO = ['contra_factura', 'credito'] as const
export type ModalidadCobro = (typeof MODALIDADES_COBRO)[number]

export const ESTADOS_CATALOGO = ['activo', 'inactivo'] as const
export type EstadoCatalogo = (typeof ESTADOS_CATALOGO)[number]

export const TIPOS_LUGAR = ['puerto', 'deposito', 'planta', 'instalacion_cliente', 'otro'] as const
export type TipoLugar = (typeof TIPOS_LUGAR)[number]

export const DISPONIBILIDADES_CHOFER = ['disponible', 'en_servicio', 'no_disponible'] as const
export type DisponibilidadChofer = (typeof DISPONIBILIDADES_CHOFER)[number]

export const DISPONIBILIDADES_UNIDAD = ['disponible', 'en_servicio', 'mantenimiento'] as const
export type DisponibilidadUnidad = (typeof DISPONIBILIDADES_UNIDAD)[number]

export const FUNCIONES_PUNTO_RUTA = ['origen', 'parada', 'destino', 'devolucion'] as const
export type FuncionPuntoRuta = (typeof FUNCIONES_PUNTO_RUTA)[number]

export const TIPOS_DOCUMENTO = [
  'guia_remision',
  'conocimiento_embarque',
  'acta_entrega',
  'evidencia',
  'otro',
] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

export const ESTADOS_SERVICIO = ['por_facturar', 'facturado'] as const
export type EstadoServicio = (typeof ESTADOS_SERVICIO)[number]

export const ESTADOS_FACTURA = ['pendiente_parcial', 'vencida', 'cobrada'] as const
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number]

export const ACCIONES_ACTIVIDAD = [
  'creacion',
  'edicion',
  'conversion',
  'asignacion',
  'cambio_programacion',
  'cambio_estado',
  'evento',
  'incidencia',
  'resolucion_incidencia',
  'documento',
  'factura',
  'pago',
  'validacion_pago',
  'cancelacion',
  'finalizacion',
  'activacion',
  'desactivacion',
  'importacion',
  'restablecimiento',
] as const
export type AccionActividad = (typeof ACCIONES_ACTIVIDAD)[number]

export const ENTIDADES = [
  'cliente',
  'solicitud',
  'viaje',
  'evento',
  'incidencia',
  'documento',
  'factura',
  'pago',
  'catalogo',
  'sistema',
] as const
export type Entidad = (typeof ENTIDADES)[number]

export interface Usuario {
  codigo: string
  nombre: string
  perfil: Perfil
  estado: EstadoCatalogo
}

export interface Cliente {
  codigo: string
  razonSocial: string
  identificacion: string
  contacto: string
  correo: string
  telefono: string
  estado: EstadoCatalogo
}

export interface Lugar {
  codigo: string
  nombre: string
  tipo: TipoLugar
  ciudad: string
  estado: EstadoCatalogo
}

export interface Transportista {
  codigo: string
  razonSocial: string
  contacto: string
  telefono: string
  estado: EstadoCatalogo
}

export interface Chofer {
  codigo: string
  nombre: string
  identificacion: string
  telefono: string
  transportistaCodigo: string
  disponibilidad: DisponibilidadChofer
  estado: EstadoCatalogo
}

export interface Unidad {
  codigo: string
  placa: string
  tipo: string
  transportistaCodigo: string
  disponibilidad: DisponibilidadUnidad
  estado: EstadoCatalogo
}

export interface TipoCatalogo {
  codigo: string
  nombre: string
  estado: EstadoCatalogo
}

export interface TipoEvento extends TipoCatalogo {
  modalidades: Modalidad[]
  orden: number
}

export interface Evidencia {
  nombre: string
  tipo: string
  fecha: string
}

export interface Solicitud {
  codigo: string
  clienteCodigo: string
  modalidad: Modalidad
  tipoCarga: TipoCarga
  categoriaCargaCodigo?: string
  descripcionCarga: string
  origenCodigo: string
  destinoCodigo: string
  fechaRequerida: string
  indicacionesCliente: string
  valorAproximado?: number
  observaciones: string
  estado: EstadoSolicitud
  motivoRechazo?: string
  viajeCodigo?: string
  fechaCreacion: string
  creadoPor: string
}

export interface Contenedor {
  tipo: string
  numero: string
}

export interface Carga {
  tipo: TipoCarga
  categoriaCodigo?: string
  descripcion: string
  observaciones: string
  contenedor?: Contenedor
}

export interface PuntoRuta {
  orden: number
  lugarCodigo: string
  funcion: FuncionPuntoRuta
}

export interface CambioEstado {
  fecha: string
  estadoAnterior: EstadoViaje | null
  estadoNuevo: EstadoViaje
  usuarioCodigo: string
  motivo?: string
}

export interface AjusteProgramacion {
  fecha: string
  motivo: string
  usuarioCodigo: string
  campo: string
  valorAnterior: string
  valorNuevo: string
}

export interface Viaje {
  codigo: string
  solicitudCodigo?: string
  clienteCodigo: string
  modalidad: Modalidad
  estado: EstadoViaje
  carga: Carga
  origenCodigo: string
  destinoCodigo: string
  rutaPuntos: PuntoRuta[]
  transportistaCodigo?: string
  choferCodigo?: string
  unidadCodigo?: string
  salidaPrevista?: string
  llegadaPrevista?: string
  cierrePrevisto?: string
  salidaReal?: string
  llegadaReal?: string
  cierreReal?: string
  modalidadCobro: ModalidadCobro
  valorReferencial: number
  observaciones: string
  observacionCierre?: string
  motivoCancelacion?: string
  historialEstados: CambioEstado[]
  ajustesProgramacion: AjusteProgramacion[]
  creadoPor: string
  fechaCreacion: string
}

export interface Evento {
  codigo: string
  viajeCodigo: string
  tipoEventoCodigo: string
  ubicacion: string
  horaPrevista?: string
  horaReal?: string
  responsableCodigo: string
  comentario: string
  evidencias: Evidencia[]
}

export interface Incidencia {
  codigo: string
  viajeCodigo: string
  tipoIncidenciaCodigo: string
  fechaHora: string
  ubicacion: string
  descripcion: string
  responsableCodigo: string
  evidencias: Evidencia[]
  estado: EstadoIncidencia
  accionCorrectiva?: string
  fechaResolucion?: string
}

export interface DatosGuia {
  remitente: string
  destinatario: string
  identificacionDestinatario: string
  transportista: string
  chofer: string
  unidad: string
  placa: string
  origen: string
  destino: string
  carga: string
  contenedor?: string
  recorrido: string
}

export interface Documento {
  codigo: string
  viajeCodigo: string
  tipo: TipoDocumento
  numeroReferencial?: string
  fechaGeneracion: string
  emisor: string
  receptor: string
  nombreArchivo: string
  descripcion: string
  version: number
  datosGuia?: DatosGuia
  creadoPor: string
}

export interface Factura {
  codigo: string
  clienteCodigo: string
  viajeCodigos: string[]
  referencia: string
  fechaEmision: string
  fechaVencimiento: string
  valor: number
  modalidadCobro: ModalidadCobro
  creadoPor: string
}

export interface Pago {
  codigo: string
  facturaCodigo: string
  fecha: string
  valor: number
  referencia: string
  estado: EstadoPago
  observacion?: string
  comprobante?: Evidencia
  registradoPor?: string
  validadorCodigo?: string
  fechaValidacion?: string
}

export interface Actividad {
  codigo: string
  usuarioCodigo: string
  fechaHora: string
  accion: AccionActividad
  entidad: Entidad
  codigoEntidad: string
  descripcion: string
}

export interface Configuracion {
  versionEsquema: number
  fechaBaseDemostracion?: string
  diasAlertaVencimiento: number
  contadores: Record<string, number>
  usuarioActivoCodigo: string
}

export interface DatosApp {
  usuarios: Usuario[]
  clientes: Cliente[]
  lugares: Lugar[]
  transportistas: Transportista[]
  choferes: Chofer[]
  unidades: Unidad[]
  tiposCarga: TipoCatalogo[]
  tiposEvento: TipoEvento[]
  tiposIncidencia: TipoCatalogo[]
  solicitudes: Solicitud[]
  viajes: Viaje[]
  eventos: Evento[]
  incidencias: Incidencia[]
  documentos: Documento[]
  facturas: Factura[]
  pagos: Pago[]
  actividad: Actividad[]
  configuracion: Configuracion
}

export type ColeccionDatos = Exclude<keyof DatosApp, 'configuracion'>
