import type {
  AccionActividad,
  DisponibilidadChofer,
  Entidad,
  DisponibilidadUnidad,
  EstadoCatalogo,
  EstadoFactura,
  EstadoIncidencia,
  EstadoPago,
  EstadoServicio,
  EstadoSolicitud,
  EstadoViaje,
  FuncionPuntoRuta,
  Modalidad,
  ModalidadCobro,
  Perfil,
  TipoCarga,
  TipoDocumento,
  TipoEvento,
  TipoCatalogo,
  TipoLugar,
} from '@/tipos/dominio'

export const NOMBRE_SISTEMA = 'PORTFLOW'
export const NOMBRE_DESCRIPTIVO = 'Gestión de Transporte Portuario'
export const SUBTITULO_SISTEMA = 'Importaciones · Exportaciones · Operaciones · Documentación'

export const CLAVE_ALMACENAMIENTO = 'portflow:v1'
export const VERSION_ESQUEMA = 1
export const DIAS_ALERTA_VENCIMIENTO_PREDETERMINADOS = 7

export const ZONA_HORARIA = 'America/Guayaquil'
export const LOCALE = 'es-EC'
export const MONEDA = 'USD'

export const EMPRESA_OPERADORA = 'Operador de Transporte Portuario (demostrativo)'
export const RUC_EMPRESA_OPERADORA = '0999999999001'
export const OFFSET_ECUADOR_HORAS = -5

export const LEYENDA_GUIA_DEMOSTRATIVA =
  'Documento demostrativo de transporte. No constituye un documento tributario autorizado.'

export const PREFIJOS = {
  cliente: 'CLI',
  solicitud: 'SOL',
  importacion: 'IMP',
  exportacion: 'EXP',
  transportista: 'TRA',
  chofer: 'CHO',
  unidad: 'UNI',
  evento: 'EVT',
  incidencia: 'INC',
  documento: 'DOC',
  factura: 'FAC',
  pago: 'PAG',
  lugar: 'LUG',
  usuario: 'USR',
  actividad: 'ACT',
  tipoCarga: 'TCA',
  tipoEvento: 'TEV',
  tipoIncidencia: 'TIN',
} as const
export type ClavePrefijo = keyof typeof PREFIJOS
export type Prefijo = (typeof PREFIJOS)[ClavePrefijo]

export const DIGITOS_CODIGO = 3

export function prefijoDeViaje(modalidad: Modalidad): Prefijo {
  return modalidad === 'exportacion' ? PREFIJOS.exportacion : PREFIJOS.importacion
}

export type Tono = 'exito' | 'pendiente' | 'peligro' | 'info' | 'neutro'

export interface Opcion<T extends string> {
  valor: T
  etiqueta: string
}

export const ETIQUETAS_PERFIL: Record<Perfil, string> = {
  operaciones: 'Operaciones',
  contabilidad: 'Contabilidad',
}

export const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = {
  importacion_contenedorizada: 'Importación contenedorizada',
  importacion_suelta: 'Importación de carga suelta',
  exportacion: 'Exportación',
}

export const ETIQUETAS_MODALIDAD_CORTA: Record<Modalidad, string> = {
  importacion_contenedorizada: 'Imp. contenedor',
  importacion_suelta: 'Imp. suelta',
  exportacion: 'Exportación',
}

export const TIPO_CARGA_POR_MODALIDAD: Record<Modalidad, TipoCarga> = {
  importacion_contenedorizada: 'contenedorizada',
  importacion_suelta: 'suelta',
  exportacion: 'contenedorizada',
}

export const ETIQUETAS_TIPO_CARGA: Record<TipoCarga, string> = {
  contenedorizada: 'Contenedorizada',
  suelta: 'Suelta',
}

export const ETIQUETAS_ESTADO_VIAJE: Record<EstadoViaje, string> = {
  solicitado: 'Solicitado',
  programado: 'Programado',
  en_ejecucion: 'En ejecución',
  entregado_pendiente_devolucion: 'Entregado / pendiente devolución',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

export const TONOS_ESTADO_VIAJE: Record<EstadoViaje, Tono> = {
  solicitado: 'neutro',
  programado: 'info',
  en_ejecucion: 'info',
  entregado_pendiente_devolucion: 'pendiente',
  finalizado: 'exito',
  cancelado: 'neutro',
}

export const ETIQUETA_CON_INCIDENCIA = 'Con incidencia'
export const ETIQUETA_RETRASADO = 'Retrasado'
export const ETIQUETA_A_TIEMPO = 'A tiempo'

export const ETIQUETAS_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  recibida: 'Recibida',
  aceptada: 'Aceptada',
  convertida: 'Convertida en viaje',
  rechazada: 'Rechazada',
}

export const TONOS_ESTADO_SOLICITUD: Record<EstadoSolicitud, Tono> = {
  recibida: 'pendiente',
  aceptada: 'info',
  convertida: 'exito',
  rechazada: 'neutro',
}

export const ETIQUETAS_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  resuelta: 'Resuelta',
}

export const TONOS_ESTADO_INCIDENCIA: Record<EstadoIncidencia, Tono> = {
  abierta: 'peligro',
  resuelta: 'exito',
}

export const ETIQUETAS_ESTADO_PAGO: Record<EstadoPago, string> = {
  registrado: 'Registrado',
  validado: 'Validado',
}

export const TONOS_ESTADO_PAGO: Record<EstadoPago, Tono> = {
  registrado: 'pendiente',
  validado: 'exito',
}

export const ETIQUETAS_MODALIDAD_COBRO: Record<ModalidadCobro, string> = {
  contra_factura: 'Contra factura',
  credito: 'A crédito',
}

export const ETIQUETAS_ESTADO_SERVICIO: Record<EstadoServicio, string> = {
  por_facturar: 'Por facturar',
  facturado: 'Facturado',
}

export const TONOS_ESTADO_SERVICIO: Record<EstadoServicio, Tono> = {
  por_facturar: 'pendiente',
  facturado: 'info',
}

export const ETIQUETAS_ESTADO_FACTURA: Record<EstadoFactura, string> = {
  pendiente_parcial: 'Pendiente / parcial',
  vencida: 'Vencido',
  cobrada: 'Cobrado',
}

export const TONOS_ESTADO_FACTURA: Record<EstadoFactura, Tono> = {
  pendiente_parcial: 'pendiente',
  vencida: 'peligro',
  cobrada: 'exito',
}

export const ETIQUETA_PROXIMA_A_VENCER = 'Próxima a vencer'

export const ETIQUETAS_ESTADO_CATALOGO: Record<EstadoCatalogo, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

export const TONOS_ESTADO_CATALOGO: Record<EstadoCatalogo, Tono> = {
  activo: 'exito',
  inactivo: 'neutro',
}

export const ETIQUETAS_TIPO_LUGAR: Record<TipoLugar, string> = {
  puerto: 'Puerto',
  deposito: 'Depósito de contenedores',
  planta: 'Planta',
  instalacion_cliente: 'Instalación de cliente',
  otro: 'Otro',
}

export const ETIQUETAS_DISPONIBILIDAD_CHOFER: Record<DisponibilidadChofer, string> = {
  disponible: 'Disponible',
  en_servicio: 'En servicio',
  no_disponible: 'No disponible',
}

export const TONOS_DISPONIBILIDAD_CHOFER: Record<DisponibilidadChofer, Tono> = {
  disponible: 'exito',
  en_servicio: 'info',
  no_disponible: 'neutro',
}

export const ETIQUETAS_DISPONIBILIDAD_UNIDAD: Record<DisponibilidadUnidad, string> = {
  disponible: 'Disponible',
  en_servicio: 'En servicio',
  mantenimiento: 'Mantenimiento',
}

export const TONOS_DISPONIBILIDAD_UNIDAD: Record<DisponibilidadUnidad, Tono> = {
  disponible: 'exito',
  en_servicio: 'info',
  mantenimiento: 'pendiente',
}

export const ETIQUETAS_FUNCION_PUNTO_RUTA: Record<FuncionPuntoRuta, string> = {
  origen: 'Origen',
  parada: 'Parada',
  destino: 'Destino',
  devolucion: 'Devolución',
}

export const ETIQUETAS_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  guia_remision: 'Guía de remisión',
  conocimiento_embarque: 'Conocimiento de embarque',
  acta_entrega: 'Acta de entrega',
  evidencia: 'Evidencia',
  otro: 'Otro',
}

export const TIPOS_CONTENEDOR = ["20' Dry", "40' Dry", "40' High Cube", "20' Reefer", "40' Reefer"] as const

export const TIPOS_UNIDAD = ['Cabezal con plataforma', 'Cabezal con chasis portacontenedor', 'Camión 10 t', 'Camión 15 t'] as const

export const HITOS = {
  salidaPuerto: 'TEV-001',
  llegadaCliente: 'TEV-002',
  descarga: 'TEV-003',
  entrega: 'TEV-004',
  entregaConfirmada: 'TEV-005',
  devolucionContenedor: 'TEV-006',
  retiroDeposito: 'TEV-007',
  salidaACliente: 'TEV-008',
  carga: 'TEV-009',
  salidaAPuerto: 'TEV-010',
  entregaEnPuerto: 'TEV-011',
  cierre: 'TEV-012',
} as const
export type CodigoHito = (typeof HITOS)[keyof typeof HITOS]

export const CATALOGO_HITOS_BASE: readonly TipoEvento[] = [
  { codigo: HITOS.salidaPuerto, nombre: 'Salida de puerto', estado: 'activo', orden: 1, modalidades: ['importacion_contenedorizada', 'importacion_suelta'] },
  { codigo: HITOS.llegadaCliente, nombre: 'Llegada a cliente o planta', estado: 'activo', orden: 2, modalidades: ['importacion_contenedorizada', 'importacion_suelta', 'exportacion'] },
  { codigo: HITOS.descarga, nombre: 'Descarga', estado: 'activo', orden: 3, modalidades: ['importacion_contenedorizada', 'importacion_suelta'] },
  { codigo: HITOS.entrega, nombre: 'Entrega', estado: 'activo', orden: 4, modalidades: ['importacion_contenedorizada'] },
  { codigo: HITOS.entregaConfirmada, nombre: 'Entrega confirmada', estado: 'activo', orden: 5, modalidades: ['importacion_suelta'] },
  { codigo: HITOS.devolucionContenedor, nombre: 'Devolución de contenedor', estado: 'activo', orden: 6, modalidades: ['importacion_contenedorizada'] },
  { codigo: HITOS.retiroDeposito, nombre: 'Retiro de contenedor en depósito', estado: 'activo', orden: 7, modalidades: ['exportacion'] },
  { codigo: HITOS.salidaACliente, nombre: 'Salida a cliente o planta', estado: 'activo', orden: 8, modalidades: ['exportacion'] },
  { codigo: HITOS.carga, nombre: 'Carga', estado: 'activo', orden: 9, modalidades: ['exportacion'] },
  { codigo: HITOS.salidaAPuerto, nombre: 'Salida a puerto', estado: 'activo', orden: 10, modalidades: ['exportacion'] },
  { codigo: HITOS.entregaEnPuerto, nombre: 'Entrega en puerto', estado: 'activo', orden: 11, modalidades: ['exportacion'] },
  { codigo: HITOS.cierre, nombre: 'Cierre', estado: 'activo', orden: 12, modalidades: ['importacion_contenedorizada', 'importacion_suelta', 'exportacion'] },
]

export const SECUENCIA_HITOS: Record<Modalidad, readonly CodigoHito[]> = {
  importacion_contenedorizada: [
    HITOS.salidaPuerto,
    HITOS.llegadaCliente,
    HITOS.descarga,
    HITOS.entrega,
    HITOS.devolucionContenedor,
    HITOS.cierre,
  ],
  importacion_suelta: [
    HITOS.salidaPuerto,
    HITOS.llegadaCliente,
    HITOS.descarga,
    HITOS.entregaConfirmada,
    HITOS.cierre,
  ],
  exportacion: [
    HITOS.retiroDeposito,
    HITOS.salidaACliente,
    HITOS.llegadaCliente,
    HITOS.carga,
    HITOS.salidaAPuerto,
    HITOS.entregaEnPuerto,
    HITOS.cierre,
  ],
}

export const HITO_INICIO: Record<Modalidad, CodigoHito> = {
  importacion_contenedorizada: HITOS.salidaPuerto,
  importacion_suelta: HITOS.salidaPuerto,
  exportacion: HITOS.retiroDeposito,
}

export const HITO_ENTREGA: Record<Modalidad, CodigoHito> = {
  importacion_contenedorizada: HITOS.entrega,
  importacion_suelta: HITOS.entregaConfirmada,
  exportacion: HITOS.entregaEnPuerto,
}

export const HITO_REQUERIDO_PARA_CIERRE: Record<Modalidad, CodigoHito> = {
  importacion_contenedorizada: HITOS.devolucionContenedor,
  importacion_suelta: HITOS.entregaConfirmada,
  exportacion: HITOS.entregaEnPuerto,
}

export const CATALOGO_TIPOS_INCIDENCIA_BASE: readonly TipoCatalogo[] = [
  { codigo: 'TIN-001', nombre: 'Demora', estado: 'activo' },
  { codigo: 'TIN-002', nombre: 'Parada', estado: 'activo' },
  { codigo: 'TIN-003', nombre: 'Espera', estado: 'activo' },
  { codigo: 'TIN-004', nombre: 'Problema mecánico', estado: 'activo' },
  { codigo: 'TIN-005', nombre: 'Problema operativo', estado: 'activo' },
  { codigo: 'TIN-006', nombre: 'Cambio de ruta', estado: 'activo' },
  { codigo: 'TIN-007', nombre: 'Documentación', estado: 'activo' },
  { codigo: 'TIN-008', nombre: 'Entrega', estado: 'activo' },
  { codigo: 'TIN-009', nombre: 'Otro', estado: 'activo' },
]

export const CATALOGO_TIPOS_CARGA_BASE: readonly TipoCatalogo[] = [
  { codigo: 'TCA-001', nombre: 'Carga general', estado: 'activo' },
  { codigo: 'TCA-002', nombre: 'Carga refrigerada', estado: 'activo' },
  { codigo: 'TCA-003', nombre: 'Maquinaria y equipos', estado: 'activo' },
  { codigo: 'TCA-004', nombre: 'Productos agrícolas', estado: 'activo' },
  { codigo: 'TCA-005', nombre: 'Materiales de construcción', estado: 'activo' },
  { codigo: 'TCA-006', nombre: 'Productos de consumo masivo', estado: 'activo' },
]

export const ETIQUETAS_ACCION_ACTIVIDAD: Record<AccionActividad, string> = {
  creacion: 'Creación',
  edicion: 'Edición',
  conversion: 'Conversión',
  asignacion: 'Asignación',
  cambio_programacion: 'Cambio de programación',
  cambio_estado: 'Cambio de estado',
  evento: 'Evento',
  incidencia: 'Incidencia',
  resolucion_incidencia: 'Resolución de incidencia',
  documento: 'Documento',
  factura: 'Factura',
  pago: 'Pago',
  validacion_pago: 'Validación de pago',
  cancelacion: 'Cancelación',
  finalizacion: 'Finalización',
  activacion: 'Activación',
  desactivacion: 'Desactivación',
  importacion: 'Importación',
  restablecimiento: 'Restablecimiento',
}

export const ETIQUETAS_ENTIDAD: Record<Entidad, string> = {
  cliente: 'Cliente',
  solicitud: 'Solicitud',
  viaje: 'Viaje',
  evento: 'Evento',
  incidencia: 'Incidencia',
  documento: 'Documento',
  factura: 'Factura',
  pago: 'Pago',
  catalogo: 'Catálogo',
  sistema: 'Sistema',
}

export const TAMANOS_PAGINA = [10, 20, 50] as const
export const TAMANO_PAGINA_PREDETERMINADO = 10

export function opcionesDe<T extends string>(etiquetas: Record<T, string>, orden?: readonly T[]): Opcion<T>[] {
  const valores = orden ?? (Object.keys(etiquetas) as T[])
  return valores.map((valor) => ({ valor, etiqueta: etiquetas[valor] }))
}
