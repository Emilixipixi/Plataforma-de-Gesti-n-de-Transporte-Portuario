import type {
  Actividad,
  CambioEstado,
  Carga,
  Chofer,
  Cliente,
  DatosApp,
  Documento,
  EstadoViaje,
  Evento,
  Evidencia,
  Factura,
  FuncionPuntoRuta,
  Incidencia,
  Lugar,
  Modalidad,
  ModalidadCobro,
  Pago,
  Solicitud,
  TipoDocumento,
  Transportista,
  Unidad,
  Usuario,
  AjusteProgramacion,
  Viaje,
} from '@/tipos/dominio'
import {
  CATALOGO_HITOS_BASE,
  CATALOGO_TIPOS_CARGA_BASE,
  CATALOGO_TIPOS_INCIDENCIA_BASE,
  DIAS_ALERTA_VENCIMIENTO_PREDETERMINADOS,
  DIGITOS_CODIGO,
  EMPRESA_OPERADORA,
  ETIQUETAS_MODALIDAD,
  HITOS,
  HITO_ENTREGA,
  HITO_INICIO,
  OFFSET_ECUADOR_HORAS,
  SECUENCIA_HITOS,
  TIPO_CARGA_POR_MODALIDAD,
  VERSION_ESQUEMA,
  type CodigoHito,
} from '@/utilidades/constantes'
import { crearActividad, ordenarActividadReciente, type DatosNuevaActividad } from '@/servicios/actividad'
import { construirDatosGuia } from '@/servicios/documentos'
import { calcularContadores } from '@/servicios/repositorio'
import { formatearFechaHora } from '@/utilidades/formateadores'
import {
  CHOFERES_AMPLIADOS,
  CLIENTES_AMPLIADOS,
  facturacionAmpliada,
  LUGARES_AMPLIADOS,
  planesAmpliados,
  solicitudesPendientesAmpliadas,
  TRANSPORTISTAS_AMPLIADOS,
  UNIDADES_AMPLIADAS,
  type ResultadoAmpliado,
} from '@/datos/datosAmpliados'

const MS_MINUTO = 60_000
const MS_HORA = 60 * MS_MINUTO
const MS_DIA = 24 * MS_HORA

export interface Reloj {
  dia: (desplazamientoDias: number, hora: number, minuto?: number) => string
  relativo: (desplazamientoHoras: number, minutosExtra?: number) => string
  sumarMinutos: (iso: string, minutos: number) => string
  sumarDias: (iso: string, dias: number) => string
}

function crearReloj(fechaBase: Date): Reloj {
  const enEcuador = new Date(fechaBase.getTime() + OFFSET_ECUADOR_HORAS * MS_HORA)
  const anio = enEcuador.getUTCFullYear()
  const mes = enEcuador.getUTCMonth()
  const diaMes = enEcuador.getUTCDate()
  const ahoraRedondeado = Math.floor(fechaBase.getTime() / (5 * MS_MINUTO)) * 5 * MS_MINUTO
  return {
    dia: (desplazamientoDias, hora, minuto = 0) =>
      new Date(Date.UTC(anio, mes, diaMes + desplazamientoDias, hora - OFFSET_ECUADOR_HORAS, minuto)).toISOString(),
    relativo: (desplazamientoHoras, minutosExtra = 0) =>
      new Date(ahoraRedondeado + desplazamientoHoras * MS_HORA + minutosExtra * MS_MINUTO).toISOString(),
    sumarMinutos: (iso, minutos) => new Date(new Date(iso).getTime() + minutos * MS_MINUTO).toISOString(),
    sumarDias: (iso, dias) => new Date(new Date(iso).getTime() + dias * MS_DIA).toISOString(),
  }
}

function codigo(prefijo: string, numero: number): string {
  return `${prefijo}-${String(numero).padStart(DIGITOS_CODIGO, '0')}`
}

const USUARIOS: Usuario[] = [
  { codigo: 'USR-001', nombre: 'Andrea Salazar', perfil: 'operaciones', estado: 'activo' },
  { codigo: 'USR-002', nombre: 'Diego Paredes', perfil: 'operaciones', estado: 'activo' },
  { codigo: 'USR-003', nombre: 'Mónica Vera', perfil: 'operaciones', estado: 'activo' },
  { codigo: 'USR-004', nombre: 'Patricia León', perfil: 'contabilidad', estado: 'activo' },
]

const USUARIO_CONTABLE = 'USR-004'

const CLIENTES: Cliente[] = [
  { codigo: 'CLI-001', razonSocial: 'Importadora Andina del Pacífico S.A.', identificacion: '0991234567001', contacto: 'Ricardo Méndez', correo: 'logistica@andinapacifico-demo.ec', telefono: '04 260 1100', estado: 'activo' },
  { codigo: 'CLI-002', razonSocial: 'Agroexportadora Costa Verde Cía. Ltda.', identificacion: '0992345678001', contacto: 'Lucía Benítez', correo: 'operaciones@costaverde-demo.ec', telefono: '04 271 3320', estado: 'activo' },
  { codigo: 'CLI-003', razonSocial: 'Distribuidora Industrial Sierra Norte S.A.', identificacion: '1791234567001', contacto: 'Fernando Ortiz', correo: 'compras@sierranorte-demo.ec', telefono: '02 245 8870', estado: 'activo' },
  { codigo: 'CLI-004', razonSocial: 'Comercializadora Litoral Sur S.A.', identificacion: '0993456789001', contacto: 'Gabriela Torres', correo: 'importaciones@litoralsur-demo.ec', telefono: '04 239 5540', estado: 'activo' },
  { codigo: 'CLI-005', razonSocial: 'Frutas Tropicales del Guayas S.A.', identificacion: '0994567890001', contacto: 'Martín Cedeño', correo: 'exportaciones@frutastropicales-demo.ec', telefono: '04 280 6610', estado: 'activo' },
  { codigo: 'CLI-006', razonSocial: 'Manufacturas Metálicas Durán Cía. Ltda.', identificacion: '0995678901001', contacto: 'Sofía Ramírez', correo: 'abastecimiento@metalicasduran-demo.ec', telefono: '04 281 4490', estado: 'activo' },
]

const LUGARES: Lugar[] = [
  { codigo: 'LUG-001', nombre: 'Puerto de Guayaquil', tipo: 'puerto', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-002', nombre: 'Puerto de Posorja', tipo: 'puerto', ciudad: 'Posorja', estado: 'activo' },
  { codigo: 'LUG-003', nombre: 'Depósito de Contenedores Norte', tipo: 'deposito', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-004', nombre: 'Depósito de Contenedores Durán', tipo: 'deposito', ciudad: 'Durán', estado: 'activo' },
  { codigo: 'LUG-005', nombre: 'Planta Andina del Pacífico', tipo: 'planta', ciudad: 'Durán', estado: 'activo' },
  { codigo: 'LUG-006', nombre: 'Bodega Andina del Pacífico Quito', tipo: 'instalacion_cliente', ciudad: 'Quito', estado: 'activo' },
  { codigo: 'LUG-007', nombre: 'Centro de Acopio Costa Verde', tipo: 'planta', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-008', nombre: 'Planta Sierra Norte', tipo: 'planta', ciudad: 'Quito', estado: 'activo' },
  { codigo: 'LUG-009', nombre: 'Centro de Distribución Litoral Sur', tipo: 'instalacion_cliente', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-010', nombre: 'Empacadora Frutas Tropicales', tipo: 'planta', ciudad: 'Durán', estado: 'activo' },
  { codigo: 'LUG-011', nombre: 'Planta Manufacturas Metálicas', tipo: 'planta', ciudad: 'Durán', estado: 'activo' },
  { codigo: 'LUG-012', nombre: 'Patio de espera Vía Perimetral', tipo: 'otro', ciudad: 'Guayaquil', estado: 'activo' },
]

const TRANSPORTISTAS: Transportista[] = [
  { codigo: 'TRA-001', razonSocial: 'Transportes Pacífico Express S.A.', contacto: 'Jorge Villacís', telefono: '0991 112 233', estado: 'activo' },
  { codigo: 'TRA-002', razonSocial: 'Logística Terrestre del Sur Cía. Ltda.', contacto: 'Carmen Aguirre', telefono: '0992 223 344', estado: 'activo' },
  { codigo: 'TRA-003', razonSocial: 'Carga Pesada Andina S.A.', contacto: 'Raúl Espinoza', telefono: '0993 334 455', estado: 'activo' },
  { codigo: 'TRA-004', razonSocial: 'Transmar Servicios de Carga S.A.', contacto: 'Verónica Quinde', telefono: '0994 445 566', estado: 'activo' },
]

const CHOFERES_BASE: Omit<Chofer, 'disponibilidad'>[] = [
  { codigo: 'CHO-001', nombre: 'Luis Alvarado', identificacion: '0912345678', telefono: '0981 100 201', transportistaCodigo: 'TRA-001', estado: 'activo' },
  { codigo: 'CHO-002', nombre: 'Pedro Zambrano', identificacion: '0923456789', telefono: '0981 100 202', transportistaCodigo: 'TRA-001', estado: 'activo' },
  { codigo: 'CHO-003', nombre: 'Carlos Mora', identificacion: '0934567890', telefono: '0981 100 203', transportistaCodigo: 'TRA-002', estado: 'activo' },
  { codigo: 'CHO-004', nombre: 'Javier Bravo', identificacion: '0945678901', telefono: '0981 100 204', transportistaCodigo: 'TRA-002', estado: 'activo' },
  { codigo: 'CHO-005', nombre: 'Miguel Castro', identificacion: '0956789012', telefono: '0981 100 205', transportistaCodigo: 'TRA-003', estado: 'activo' },
  { codigo: 'CHO-006', nombre: 'Andrés Loor', identificacion: '0967890123', telefono: '0981 100 206', transportistaCodigo: 'TRA-003', estado: 'activo' },
  { codigo: 'CHO-007', nombre: 'Hernán Pincay', identificacion: '0978901234', telefono: '0981 100 207', transportistaCodigo: 'TRA-004', estado: 'activo' },
  { codigo: 'CHO-008', nombre: 'Roberto Suárez', identificacion: '0989012345', telefono: '0981 100 208', transportistaCodigo: 'TRA-004', estado: 'activo' },
]

const UNIDADES_BASE: Omit<Unidad, 'disponibilidad'>[] = [
  { codigo: 'UNI-001', placa: 'GBA-4521', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-001', estado: 'activo' },
  { codigo: 'UNI-002', placa: 'GBC-7834', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-001', estado: 'activo' },
  { codigo: 'UNI-003', placa: 'GSD-1209', tipo: 'Camión 10 t', transportistaCodigo: 'TRA-002', estado: 'activo' },
  { codigo: 'UNI-004', placa: 'GSE-5567', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-002', estado: 'activo' },
  { codigo: 'UNI-005', placa: 'GTF-3388', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-003', estado: 'activo' },
  { codigo: 'UNI-006', placa: 'GTH-9045', tipo: 'Camión 15 t', transportistaCodigo: 'TRA-003', estado: 'activo' },
  { codigo: 'UNI-007', placa: 'GPK-2716', tipo: 'Camión 15 t', transportistaCodigo: 'TRA-004', estado: 'activo' },
  { codigo: 'UNI-008', placa: 'GPM-6150', tipo: 'Cabezal con plataforma', transportistaCodigo: 'TRA-004', estado: 'activo' },
]

export interface HitoPlan {
  hito: CodigoHito
  prevista: string
  real?: string
  lugar: string
  responsable: string
  comentario: string
  evidencias?: Evidencia[]
}

export interface PlanViaje {
  codigo: string
  solicitudCodigo?: string
  clienteCodigo: string
  modalidad: Modalidad
  estado: EstadoViaje
  descripcionCarga: string
  categoriaCarga: string
  observacionesCarga?: string
  contenedor?: { tipo: string; numero: string }
  ruta: [string, FuncionPuntoRuta][]
  recursos?: { transportista: string; chofer: string; unidad: string }
  salidaPrevista: string
  llegadaPrevista: string
  cierrePrevisto: string
  modalidadCobro: ModalidadCobro
  valorReferencial: number
  observaciones: string
  creadoPor: string
  hitos: HitoPlan[]
  ajustes?: AjusteProgramacion[]
  cancelacion?: { fecha: string; motivo: string; usuario: string }
  observacionCierre?: string
}

export interface PlanIncidencia {
  viajeCodigo: string
  tipo: string
  fechaHora: string
  ubicacion: string
  descripcion: string
  responsable: string
  evidencias: Evidencia[]
  resolucion?: { accion: string; fecha: string }
}

const TODOS_LOS_LUGARES: Lugar[] = [...LUGARES, ...LUGARES_AMPLIADOS]
const TODOS_LOS_CHOFERES: Omit<Chofer, 'disponibilidad'>[] = [...CHOFERES_BASE, ...CHOFERES_AMPLIADOS]
const TODAS_LAS_UNIDADES: Omit<Unidad, 'disponibilidad'>[] = [...UNIDADES_BASE, ...UNIDADES_AMPLIADAS]

function ubicacionDe(lugarCodigo: string): string {
  return TODOS_LOS_LUGARES.find((lugar) => lugar.codigo === lugarCodigo)?.nombre ?? lugarCodigo
}

function planesDeViaje(r: Reloj): PlanViaje[] {
  const imp001 = (h: number, m = 0) => r.dia(-12, h, m)
  const imp002 = (h: number, m = 0) => r.dia(-10, h, m)
  const imp008 = (h: number, m = 0) => r.dia(-3, h, m)
  const imp009 = (h: number, m = 0) => r.dia(-45, h, m)
  const imp010 = (h: number, m = 0) => r.dia(-5, h, m)
  const imp011 = (h: number, m = 0) => r.dia(-25, h, m)
  const exp003 = (h: number, m = 0) => r.dia(-20, h, m)

  return [
    {
      codigo: 'IMP-001',
      solicitudCodigo: 'SOL-001',
      clienteCodigo: 'CLI-001',
      modalidad: 'importacion_contenedorizada',
      estado: 'finalizado',
      descripcionCarga: 'Repuestos automotrices en cajas paletizadas',
      categoriaCarga: 'TCA-003',
      contenedor: { tipo: "40' Dry", numero: 'PFLU4821935' },
      ruta: [['LUG-001', 'origen'], ['LUG-005', 'destino'], ['LUG-004', 'devolucion']],
      recursos: { transportista: 'TRA-001', chofer: 'CHO-001', unidad: 'UNI-001' },
      salidaPrevista: imp001(8),
      llegadaPrevista: imp001(10, 30),
      cierrePrevisto: imp001(17),
      modalidadCobro: 'credito',
      valorReferencial: 650,
      observaciones: 'Cliente solicita aviso telefónico 30 minutos antes de la llegada.',
      creadoPor: 'USR-001',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: imp001(8), real: imp001(7, 55), lugar: 'LUG-001', responsable: 'USR-001', comentario: 'Contenedor retirado de patio sin novedad.' },
        { hito: HITOS.llegadaCliente, prevista: imp001(10, 30), real: imp001(10, 20), lugar: 'LUG-005', responsable: 'USR-002', comentario: 'Ingreso a planta confirmado por garita.' },
        { hito: HITOS.descarga, prevista: imp001(12), real: imp001(11, 50), lugar: 'LUG-005', responsable: 'USR-002', comentario: 'Descarga completa con montacargas del cliente.' },
        { hito: HITOS.entrega, prevista: imp001(12, 30), real: imp001(12, 20), lugar: 'LUG-005', responsable: 'USR-002', comentario: 'Entrega firmada por bodega del cliente.', evidencias: [{ nombre: 'acta_entrega_IMP-001.pdf', tipo: 'application/pdf', fecha: imp001(12, 25) }] },
        { hito: HITOS.devolucionContenedor, prevista: imp001(15, 30), real: imp001(15, 10), lugar: 'LUG-004', responsable: 'USR-003', comentario: 'Contenedor vacío devuelto; recibo de depósito entregado.' },
        { hito: HITOS.cierre, prevista: imp001(17), real: imp001(16, 30), lugar: 'LUG-004', responsable: 'USR-003', comentario: 'Servicio cerrado dentro del plazo comprometido.' },
      ],
    },
    {
      codigo: 'IMP-002',
      solicitudCodigo: 'SOL-002',
      clienteCodigo: 'CLI-001',
      modalidad: 'importacion_suelta',
      estado: 'finalizado',
      descripcionCarga: 'Rollos de material de empaque (24 bultos)',
      categoriaCarga: 'TCA-001',
      ruta: [['LUG-001', 'origen'], ['LUG-005', 'destino']],
      recursos: { transportista: 'TRA-002', chofer: 'CHO-003', unidad: 'UNI-003' },
      salidaPrevista: imp002(9),
      llegadaPrevista: imp002(11),
      cierrePrevisto: imp002(15),
      modalidadCobro: 'credito',
      valorReferencial: 420,
      observaciones: 'Carga suelta; no requiere devolución de contenedor.',
      creadoPor: 'USR-002',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: imp002(9), real: imp002(9, 5), lugar: 'LUG-001', responsable: 'USR-002', comentario: 'Salida con 24 bultos verificados.' },
        { hito: HITOS.llegadaCliente, prevista: imp002(11), real: imp002(12, 15), lugar: 'LUG-005', responsable: 'USR-002', comentario: 'Llegada posterior a la hora prevista por parada de 60 minutos en la vía Perimetral.' },
        { hito: HITOS.descarga, prevista: imp002(12), real: imp002(13), lugar: 'LUG-005', responsable: 'USR-001', comentario: 'Descarga reprogramada por la llegada tardía.' },
        { hito: HITOS.entregaConfirmada, prevista: imp002(13), real: imp002(13, 40), lugar: 'LUG-005', responsable: 'USR-001', comentario: 'Entrega confirmada por el jefe de bodega.' },
        { hito: HITOS.cierre, prevista: imp002(15), real: imp002(15, 20), lugar: 'LUG-005', responsable: 'USR-001', comentario: 'Cierre con retraso explicado por la incidencia INC-001.' },
      ],
    },
    {
      codigo: 'IMP-003',
      clienteCodigo: 'CLI-002',
      modalidad: 'importacion_contenedorizada',
      estado: 'entregado_pendiente_devolucion',
      descripcionCarga: 'Fertilizantes en sacos de 50 kg',
      categoriaCarga: 'TCA-004',
      contenedor: { tipo: "20' Dry", numero: 'PFLU3307142' },
      ruta: [['LUG-002', 'origen'], ['LUG-007', 'destino'], ['LUG-003', 'devolucion']],
      recursos: { transportista: 'TRA-003', chofer: 'CHO-005', unidad: 'UNI-005' },
      salidaPrevista: r.dia(-1, 7),
      llegadaPrevista: r.dia(-1, 10),
      cierrePrevisto: r.dia(0, 16),
      modalidadCobro: 'contra_factura',
      valorReferencial: 780,
      observaciones: 'Devolución del contenedor en Depósito Norte antes del vencimiento de la libre estadía.',
      creadoPor: 'USR-003',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: r.dia(-1, 7), real: r.dia(-1, 7, 10), lugar: 'LUG-002', responsable: 'USR-003', comentario: 'Salida de Posorja con sello verificado.' },
        { hito: HITOS.llegadaCliente, prevista: r.dia(-1, 10), real: r.dia(-1, 9, 55), lugar: 'LUG-007', responsable: 'USR-003', comentario: 'Arribo al centro de acopio.' },
        { hito: HITOS.descarga, prevista: r.dia(-1, 11, 30), real: r.dia(-1, 11, 30), lugar: 'LUG-007', responsable: 'USR-001', comentario: 'Descarga manual de sacos.' },
        { hito: HITOS.entrega, prevista: r.dia(-1, 12), real: r.dia(-1, 12, 5), lugar: 'LUG-007', responsable: 'USR-001', comentario: 'Entrega recibida por el supervisor de acopio.' },
      ],
    },
    {
      codigo: 'IMP-004',
      clienteCodigo: 'CLI-003',
      modalidad: 'importacion_suelta',
      estado: 'en_ejecucion',
      descripcionCarga: 'Maquinaria industrial desarmada (6 piezas)',
      categoriaCarga: 'TCA-003',
      observacionesCarga: 'Piezas con sobredimensión; asegurar con cadenas.',
      ruta: [['LUG-001', 'origen'], ['LUG-008', 'destino']],
      recursos: { transportista: 'TRA-004', chofer: 'CHO-007', unidad: 'UNI-007' },
      salidaPrevista: r.relativo(-6),
      llegadaPrevista: r.relativo(3),
      cierrePrevisto: r.relativo(6),
      modalidadCobro: 'credito',
      valorReferencial: 1250,
      observaciones: 'Recorrido Guayaquil a Quito; reportar cada parada.',
      creadoPor: 'USR-001',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: r.relativo(-6), real: r.relativo(-6, 15), lugar: 'LUG-001', responsable: 'USR-001', comentario: 'Salida con 15 minutos de demora por revisión de amarres.' },
      ],
    },
    {
      codigo: 'IMP-005',
      solicitudCodigo: 'SOL-003',
      clienteCodigo: 'CLI-001',
      modalidad: 'importacion_contenedorizada',
      estado: 'en_ejecucion',
      descripcionCarga: 'Llantas para vehículos livianos',
      categoriaCarga: 'TCA-006',
      contenedor: { tipo: "40' High Cube", numero: 'PFLU5590218' },
      ruta: [['LUG-001', 'origen'], ['LUG-005', 'destino'], ['LUG-004', 'devolucion']],
      recursos: { transportista: 'TRA-001', chofer: 'CHO-002', unidad: 'UNI-002' },
      salidaPrevista: r.relativo(-3),
      llegadaPrevista: r.relativo(-1),
      cierrePrevisto: r.relativo(5),
      modalidadCobro: 'credito',
      valorReferencial: 680,
      observaciones: 'Segundo servicio simultáneo del cliente; bitácora independiente de IMP-001.',
      creadoPor: 'USR-002',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: r.relativo(-3), real: r.relativo(-3, 5), lugar: 'LUG-001', responsable: 'USR-002', comentario: 'Salida de puerto sin novedad.' },
        { hito: HITOS.llegadaCliente, prevista: r.relativo(-1), real: r.relativo(-1, -10), lugar: 'LUG-005', responsable: 'USR-002', comentario: 'Llegada a planta antes de lo previsto.' },
      ],
    },
    {
      codigo: 'IMP-006',
      solicitudCodigo: 'SOL-004',
      clienteCodigo: 'CLI-004',
      modalidad: 'importacion_suelta',
      estado: 'programado',
      descripcionCarga: 'Electrodomésticos en cajas (180 unidades)',
      categoriaCarga: 'TCA-006',
      ruta: [['LUG-001', 'origen'], ['LUG-009', 'destino']],
      recursos: { transportista: 'TRA-002', chofer: 'CHO-004', unidad: 'UNI-003' },
      salidaPrevista: r.dia(1, 8),
      llegadaPrevista: r.dia(1, 10, 30),
      cierrePrevisto: r.dia(1, 16),
      modalidadCobro: 'contra_factura',
      valorReferencial: 390,
      observaciones: 'Entrega en andén 3 del centro de distribución.',
      creadoPor: 'USR-003',
      hitos: [],
      ajustes: [
        { fecha: r.dia(-1, 16, 20), motivo: 'El cliente solicitó recibir la carga después de las 10:00.', usuarioCodigo: 'USR-003', campo: 'Salida prevista', valorAnterior: formatearFechaHora(r.dia(1, 6)), valorNuevo: formatearFechaHora(r.dia(1, 8)) },
      ],
    },
    {
      codigo: 'IMP-007',
      solicitudCodigo: 'SOL-005',
      clienteCodigo: 'CLI-005',
      modalidad: 'importacion_contenedorizada',
      estado: 'solicitado',
      descripcionCarga: 'Cajas de cartón corrugado para empaque',
      categoriaCarga: 'TCA-001',
      contenedor: { tipo: "40' Dry", numero: 'PFLU6012774' },
      ruta: [['LUG-002', 'origen'], ['LUG-010', 'destino'], ['LUG-003', 'devolucion']],
      salidaPrevista: r.dia(3, 7),
      llegadaPrevista: r.dia(3, 10),
      cierrePrevisto: r.dia(3, 17),
      modalidadCobro: 'credito',
      valorReferencial: 720,
      observaciones: 'Pendiente de asignar transportista, chofer y unidad.',
      creadoPor: 'USR-001',
      hitos: [],
    },
    {
      codigo: 'IMP-008',
      clienteCodigo: 'CLI-002',
      modalidad: 'importacion_suelta',
      estado: 'finalizado',
      descripcionCarga: 'Insumos agrícolas en pallets (12 pallets)',
      categoriaCarga: 'TCA-004',
      ruta: [['LUG-001', 'origen'], ['LUG-007', 'destino']],
      recursos: { transportista: 'TRA-003', chofer: 'CHO-006', unidad: 'UNI-006' },
      salidaPrevista: imp008(6),
      llegadaPrevista: imp008(9),
      cierrePrevisto: imp008(14),
      modalidadCobro: 'contra_factura',
      valorReferencial: 450,
      observaciones: 'Servicio listo para revisión contable.',
      creadoPor: 'USR-002',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: imp008(6), real: imp008(6), lugar: 'LUG-001', responsable: 'USR-002', comentario: 'Salida puntual.' },
        { hito: HITOS.llegadaCliente, prevista: imp008(9), real: imp008(8, 45), lugar: 'LUG-007', responsable: 'USR-002', comentario: 'Llegada antes de la hora comprometida.' },
        { hito: HITOS.descarga, prevista: imp008(10), real: imp008(9, 50), lugar: 'LUG-007', responsable: 'USR-003', comentario: 'Descarga con montacargas.' },
        { hito: HITOS.entregaConfirmada, prevista: imp008(11), real: imp008(10, 40), lugar: 'LUG-007', responsable: 'USR-003', comentario: 'Entrega confirmada por recepción.' },
        { hito: HITOS.cierre, prevista: imp008(14), real: imp008(13, 10), lugar: 'LUG-007', responsable: 'USR-003', comentario: 'Cierre operativo sin novedades.' },
      ],
    },
    {
      codigo: 'IMP-009',
      clienteCodigo: 'CLI-003',
      modalidad: 'importacion_contenedorizada',
      estado: 'finalizado',
      descripcionCarga: 'Acero en bobinas',
      categoriaCarga: 'TCA-005',
      contenedor: { tipo: "20' Dry", numero: 'PFLU2245609' },
      ruta: [['LUG-001', 'origen'], ['LUG-008', 'destino'], ['LUG-003', 'devolucion']],
      recursos: { transportista: 'TRA-004', chofer: 'CHO-008', unidad: 'UNI-008' },
      salidaPrevista: imp009(4),
      llegadaPrevista: imp009(13),
      cierrePrevisto: r.dia(-44, 18),
      modalidadCobro: 'credito',
      valorReferencial: 1380,
      observaciones: 'Recorrido largo; devolución al día siguiente.',
      creadoPor: 'USR-001',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: imp009(4), real: imp009(4, 10), lugar: 'LUG-001', responsable: 'USR-001', comentario: 'Salida de madrugada.' },
        { hito: HITOS.llegadaCliente, prevista: imp009(13), real: imp009(13, 25), lugar: 'LUG-008', responsable: 'USR-001', comentario: 'Llegada con 25 minutos de retraso por tráfico en el ingreso a Quito.' },
        { hito: HITOS.descarga, prevista: imp009(15), real: imp009(15, 20), lugar: 'LUG-008', responsable: 'USR-002', comentario: 'Descarga con grúa del cliente.' },
        { hito: HITOS.entrega, prevista: imp009(16), real: imp009(16, 10), lugar: 'LUG-008', responsable: 'USR-002', comentario: 'Entrega firmada.' },
        { hito: HITOS.devolucionContenedor, prevista: r.dia(-44, 14), real: r.dia(-44, 13, 40), lugar: 'LUG-003', responsable: 'USR-003', comentario: 'Contenedor devuelto en Depósito Norte.' },
        { hito: HITOS.cierre, prevista: r.dia(-44, 18), real: r.dia(-44, 17, 15), lugar: 'LUG-003', responsable: 'USR-003', comentario: 'Servicio cerrado.' },
      ],
    },
    {
      codigo: 'IMP-010',
      clienteCodigo: 'CLI-004',
      modalidad: 'importacion_suelta',
      estado: 'cancelado',
      descripcionCarga: 'Muebles de oficina desarmados',
      categoriaCarga: 'TCA-001',
      ruta: [['LUG-001', 'origen'], ['LUG-009', 'destino']],
      recursos: { transportista: 'TRA-002', chofer: 'CHO-003', unidad: 'UNI-003' },
      salidaPrevista: imp010(9),
      llegadaPrevista: imp010(11),
      cierrePrevisto: imp010(15),
      modalidadCobro: 'contra_factura',
      valorReferencial: 360,
      observaciones: 'Servicio cancelado antes de la salida.',
      creadoPor: 'USR-002',
      hitos: [],
      cancelacion: { fecha: r.dia(-6, 17, 30), motivo: 'El cliente informó que la carga no fue liberada por la naviera; el servicio se reprogramará con una nueva solicitud.', usuario: 'USR-002' },
    },
    {
      codigo: 'IMP-011',
      clienteCodigo: 'CLI-006',
      modalidad: 'importacion_contenedorizada',
      estado: 'finalizado',
      descripcionCarga: 'Planchas de aluminio',
      categoriaCarga: 'TCA-005',
      contenedor: { tipo: "40' Dry", numero: 'PFLU7781350' },
      ruta: [['LUG-002', 'origen'], ['LUG-011', 'destino'], ['LUG-004', 'devolucion']],
      recursos: { transportista: 'TRA-001', chofer: 'CHO-001', unidad: 'UNI-001' },
      salidaPrevista: imp011(6),
      llegadaPrevista: imp011(9, 30),
      cierrePrevisto: imp011(17),
      modalidadCobro: 'credito',
      valorReferencial: 920,
      observaciones: 'Crédito a 30 días.',
      creadoPor: 'USR-003',
      hitos: [
        { hito: HITOS.salidaPuerto, prevista: imp011(6), real: imp011(6, 5), lugar: 'LUG-002', responsable: 'USR-003', comentario: 'Salida de Posorja.' },
        { hito: HITOS.llegadaCliente, prevista: imp011(9, 30), real: imp011(9, 15), lugar: 'LUG-011', responsable: 'USR-003', comentario: 'Llegada a planta.' },
        { hito: HITOS.descarga, prevista: imp011(11), real: imp011(10, 45), lugar: 'LUG-011', responsable: 'USR-001', comentario: 'Descarga con puente grúa.' },
        { hito: HITOS.entrega, prevista: imp011(11, 30), real: imp011(11, 20), lugar: 'LUG-011', responsable: 'USR-001', comentario: 'Entrega firmada por producción.' },
        { hito: HITOS.devolucionContenedor, prevista: imp011(14, 30), real: imp011(14, 10), lugar: 'LUG-004', responsable: 'USR-001', comentario: 'Devolución en Depósito Durán.' },
        { hito: HITOS.cierre, prevista: imp011(17), real: imp011(16, 20), lugar: 'LUG-004', responsable: 'USR-001', comentario: 'Servicio cerrado a tiempo.' },
      ],
    },
    {
      codigo: 'EXP-001',
      solicitudCodigo: 'SOL-006',
      clienteCodigo: 'CLI-002',
      modalidad: 'exportacion',
      estado: 'en_ejecucion',
      descripcionCarga: 'Banano en cajas (1.080 cajas)',
      categoriaCarga: 'TCA-002',
      observacionesCarga: 'Contenedor refrigerado a 13 °C.',
      contenedor: { tipo: "40' Reefer", numero: 'PFLU9034461' },
      ruta: [['LUG-003', 'origen'], ['LUG-007', 'parada'], ['LUG-001', 'destino']],
      recursos: { transportista: 'TRA-002', chofer: 'CHO-004', unidad: 'UNI-004' },
      salidaPrevista: r.relativo(-8),
      llegadaPrevista: r.relativo(1),
      cierrePrevisto: r.relativo(3),
      modalidadCobro: 'credito',
      valorReferencial: 870,
      observaciones: 'Entrega en puerto antes del cierre de recepción de la nave.',
      creadoPor: 'USR-001',
      hitos: [
        { hito: HITOS.retiroDeposito, prevista: r.relativo(-8), real: r.relativo(-8, 10), lugar: 'LUG-003', responsable: 'USR-001', comentario: 'Contenedor refrigerado retirado y preenfriado.' },
        { hito: HITOS.salidaACliente, prevista: r.relativo(-7, -30), real: r.relativo(-7, -20), lugar: 'LUG-003', responsable: 'USR-001', comentario: 'Salida hacia el centro de acopio.' },
        { hito: HITOS.llegadaCliente, prevista: r.relativo(-6), real: r.relativo(-6, 5), lugar: 'LUG-007', responsable: 'USR-002', comentario: 'Llegada al centro de acopio.' },
        { hito: HITOS.carga, prevista: r.relativo(-4, -30), real: r.relativo(-4, -20), lugar: 'LUG-007', responsable: 'USR-002', comentario: 'Carga completa y sellada.' },
        { hito: HITOS.salidaAPuerto, prevista: r.relativo(-3), real: r.relativo(-3), lugar: 'LUG-007', responsable: 'USR-002', comentario: 'Salida hacia Puerto de Guayaquil.' },
      ],
    },
    {
      codigo: 'EXP-002',
      solicitudCodigo: 'SOL-007',
      clienteCodigo: 'CLI-005',
      modalidad: 'exportacion',
      estado: 'programado',
      descripcionCarga: 'Mango en cajas (1.200 cajas)',
      categoriaCarga: 'TCA-002',
      contenedor: { tipo: "40' Reefer", numero: 'PFLU4419083' },
      ruta: [['LUG-004', 'origen'], ['LUG-010', 'parada'], ['LUG-002', 'destino']],
      recursos: { transportista: 'TRA-004', chofer: 'CHO-008', unidad: 'UNI-008' },
      salidaPrevista: r.dia(2, 6),
      llegadaPrevista: r.dia(2, 14),
      cierrePrevisto: r.dia(2, 16),
      modalidadCobro: 'credito',
      valorReferencial: 840,
      observaciones: 'Temperatura de transporte 8 °C.',
      creadoPor: 'USR-002',
      hitos: [],
    },
    {
      codigo: 'EXP-003',
      clienteCodigo: 'CLI-004',
      modalidad: 'exportacion',
      estado: 'finalizado',
      descripcionCarga: 'Cacao en grano en sacos de yute',
      categoriaCarga: 'TCA-004',
      contenedor: { tipo: "20' Dry", numero: 'PFLU1176524' },
      ruta: [['LUG-003', 'origen'], ['LUG-009', 'parada'], ['LUG-001', 'destino']],
      recursos: { transportista: 'TRA-001', chofer: 'CHO-002', unidad: 'UNI-002' },
      salidaPrevista: exp003(6),
      llegadaPrevista: exp003(15),
      cierrePrevisto: exp003(17),
      modalidadCobro: 'contra_factura',
      valorReferencial: 760,
      observaciones: 'Exportación entregada en puerto; sin trámites posteriores.',
      creadoPor: 'USR-003',
      hitos: [
        { hito: HITOS.retiroDeposito, prevista: exp003(6), real: exp003(6, 10), lugar: 'LUG-003', responsable: 'USR-003', comentario: 'Retiro de contenedor vacío.' },
        { hito: HITOS.salidaACliente, prevista: exp003(6, 30), real: exp003(6, 35), lugar: 'LUG-003', responsable: 'USR-003', comentario: 'Salida hacia el centro de distribución.' },
        { hito: HITOS.llegadaCliente, prevista: exp003(8), real: exp003(7, 55), lugar: 'LUG-009', responsable: 'USR-003', comentario: 'Llegada al cliente.' },
        { hito: HITOS.carga, prevista: exp003(11), real: exp003(10, 50), lugar: 'LUG-009', responsable: 'USR-002', comentario: 'Carga y sellado.' },
        { hito: HITOS.salidaAPuerto, prevista: exp003(12), real: exp003(12), lugar: 'LUG-009', responsable: 'USR-002', comentario: 'Salida a puerto.' },
        { hito: HITOS.entregaEnPuerto, prevista: exp003(15), real: exp003(14, 30), lugar: 'LUG-001', responsable: 'USR-002', comentario: 'Contenedor recibido en terminal.' },
        { hito: HITOS.cierre, prevista: exp003(17), real: exp003(16), lugar: 'LUG-001', responsable: 'USR-002', comentario: 'Servicio cerrado con entrega en puerto.' },
      ],
    },
  ]
}

function planesDeIncidencia(r: Reloj): PlanIncidencia[] {
  return [
    {
      viajeCodigo: 'IMP-002',
      tipo: 'TIN-002',
      fechaHora: r.dia(-10, 9, 50),
      ubicacion: 'Vía Perimetral, sector Bastión Popular',
      descripcion: 'Parada de 60 minutos por congestión vehicular en la vía Perimetral.',
      responsable: 'USR-002',
      evidencias: [{ nombre: 'parada_via_perimetral.jpg', tipo: 'image/jpeg', fecha: r.dia(-10, 10) }],
      resolucion: { accion: 'Se notificó al cliente la nueva hora estimada y se reprogramó la descarga.', fecha: r.dia(-10, 13, 45) },
    },
    {
      viajeCodigo: 'IMP-004',
      tipo: 'TIN-004',
      fechaHora: r.relativo(-2),
      ubicacion: 'Vía Guayaquil – El Triunfo, km 45',
      descripcion: 'Falla en el sistema de frenos de aire; unidad detenida en espera de mecánico.',
      responsable: 'USR-001',
      evidencias: [{ nombre: 'falla_frenos_UNI-007.jpg', tipo: 'image/jpeg', fecha: r.relativo(-2, 10) }],
    },
  ]
}

function estadoInicialCompleto(plan: PlanViaje): boolean {
  return plan.recursos !== undefined
}

function construirHistorial(plan: PlanViaje, fechaCreacion: string, r: Reloj): CambioEstado[] {
  const historial: CambioEstado[] = []
  const agregar = (fecha: string, estadoNuevo: EstadoViaje, usuarioCodigo: string, motivo?: string) => {
    const anterior = historial.at(-1)?.estadoNuevo ?? null
    historial.push({ fecha, estadoAnterior: anterior, estadoNuevo, usuarioCodigo, ...(motivo ? { motivo } : {}) })
  }
  agregar(fechaCreacion, 'solicitado', plan.creadoPor, plan.solicitudCodigo ? `Conversión de ${plan.solicitudCodigo}` : 'Creación directa del viaje')
  if (estadoInicialCompleto(plan)) agregar(r.sumarMinutos(fechaCreacion, 120), 'programado', plan.creadoPor, 'Asignación de transportista, chofer y unidad')
  const realDe = (hito: CodigoHito) => plan.hitos.find((h) => h.hito === hito)
  const inicio = realDe(HITO_INICIO[plan.modalidad])
  if (inicio?.real) agregar(inicio.real, 'en_ejecucion', inicio.responsable)
  if (plan.modalidad === 'importacion_contenedorizada') {
    const entrega = realDe(HITO_ENTREGA[plan.modalidad])
    if (entrega?.real) agregar(entrega.real, 'entregado_pendiente_devolucion', entrega.responsable)
  }
  const cierre = realDe(HITOS.cierre)
  if (cierre?.real) agregar(cierre.real, 'finalizado', cierre.responsable)
  if (plan.cancelacion) agregar(plan.cancelacion.fecha, 'cancelado', plan.cancelacion.usuario, plan.cancelacion.motivo)
  return historial
}

function construirViaje(plan: PlanViaje, r: Reloj): Viaje {
  const tresDiasAntes = r.sumarDias(plan.salidaPrevista, -3)
  const limiteCreacion = r.relativo(-20)
  const fechaCreacion = tresDiasAntes < limiteCreacion ? tresDiasAntes : limiteCreacion
  const carga: Carga = {
    tipo: TIPO_CARGA_POR_MODALIDAD[plan.modalidad],
    categoriaCodigo: plan.categoriaCarga,
    descripcion: plan.descripcionCarga,
    observaciones: plan.observacionesCarga ?? '',
    ...(plan.contenedor ? { contenedor: plan.contenedor } : {}),
  }
  const real = (hito: CodigoHito) => plan.hitos.find((h) => h.hito === hito)?.real
  const hitoLlegada = plan.modalidad === 'exportacion' ? HITOS.entregaEnPuerto : HITOS.llegadaCliente
  const origen = plan.ruta.find(([, funcion]) => funcion === 'origen')?.[0] ?? plan.ruta[0]?.[0] ?? ''
  const destino = plan.ruta.find(([, funcion]) => funcion === 'destino')?.[0] ?? ''
  const viaje: Viaje = {
    codigo: plan.codigo,
    clienteCodigo: plan.clienteCodigo,
    modalidad: plan.modalidad,
    estado: plan.estado,
    carga,
    origenCodigo: origen,
    destinoCodigo: destino,
    rutaPuntos: plan.ruta.map(([lugarCodigo, funcion], indice) => ({ orden: indice + 1, lugarCodigo, funcion })),
    salidaPrevista: plan.salidaPrevista,
    llegadaPrevista: plan.llegadaPrevista,
    cierrePrevisto: plan.cierrePrevisto,
    modalidadCobro: plan.modalidadCobro,
    valorReferencial: plan.valorReferencial,
    observaciones: plan.observaciones,
    historialEstados: construirHistorial(plan, fechaCreacion, r),
    ajustesProgramacion: plan.ajustes ?? [],
    creadoPor: plan.creadoPor,
    fechaCreacion,
  }
  if (plan.solicitudCodigo) viaje.solicitudCodigo = plan.solicitudCodigo
  if (plan.recursos) {
    viaje.transportistaCodigo = plan.recursos.transportista
    viaje.choferCodigo = plan.recursos.chofer
    viaje.unidadCodigo = plan.recursos.unidad
  }
  const salidaReal = real(HITO_INICIO[plan.modalidad])
  const llegadaReal = real(hitoLlegada)
  const cierreReal = real(HITOS.cierre)
  if (salidaReal) viaje.salidaReal = salidaReal
  if (llegadaReal) viaje.llegadaReal = llegadaReal
  if (cierreReal) viaje.cierreReal = cierreReal
  if (plan.cancelacion) viaje.motivoCancelacion = plan.cancelacion.motivo
  if (plan.observacionCierre) viaje.observacionCierre = plan.observacionCierre
  return viaje
}

function construirEventos(planes: readonly PlanViaje[]): Evento[] {
  const eventos: Evento[] = []
  for (const plan of planes) {
    const secuencia = SECUENCIA_HITOS[plan.modalidad]
    const ordenados = [...plan.hitos].sort((a, b) => secuencia.indexOf(a.hito) - secuencia.indexOf(b.hito))
    for (const hito of ordenados) {
      if (!hito.real) continue
      eventos.push({
        codigo: codigo('EVT', eventos.length + 1),
        viajeCodigo: plan.codigo,
        tipoEventoCodigo: hito.hito,
        ubicacion: ubicacionDe(hito.lugar),
        horaPrevista: hito.prevista,
        horaReal: hito.real,
        responsableCodigo: hito.responsable,
        comentario: hito.comentario,
        evidencias: hito.evidencias ?? [],
      })
    }
  }
  return eventos
}

function construirIncidencias(planes: readonly PlanIncidencia[]): Incidencia[] {
  return planes.map((plan, indice) => {
    const incidencia: Incidencia = {
      codigo: codigo('INC', indice + 1),
      viajeCodigo: plan.viajeCodigo,
      tipoIncidenciaCodigo: plan.tipo,
      fechaHora: plan.fechaHora,
      ubicacion: plan.ubicacion,
      descripcion: plan.descripcion,
      responsableCodigo: plan.responsable,
      evidencias: plan.evidencias,
      estado: plan.resolucion ? 'resuelta' : 'abierta',
    }
    if (plan.resolucion) {
      incidencia.accionCorrectiva = plan.resolucion.accion
      incidencia.fechaResolucion = plan.resolucion.fecha
    }
    return incidencia
  })
}

function construirSolicitudes(viajes: readonly Viaje[], r: Reloj, ampliado: ResultadoAmpliado): Solicitud[] {
  const desdeViaje = (codigoSolicitud: string, viajeCodigo: string, indicaciones: string): Solicitud => {
    const viaje = viajes.find((v) => v.codigo === viajeCodigo)
    if (!viaje) throw new Error(`Viaje ${viajeCodigo} inexistente en el generador.`)
    return {
      codigo: codigoSolicitud,
      clienteCodigo: viaje.clienteCodigo,
      modalidad: viaje.modalidad,
      tipoCarga: viaje.carga.tipo,
      ...(viaje.carga.categoriaCodigo ? { categoriaCargaCodigo: viaje.carga.categoriaCodigo } : {}),
      descripcionCarga: viaje.carga.descripcion,
      origenCodigo: viaje.origenCodigo,
      destinoCodigo: viaje.destinoCodigo,
      fechaRequerida: viaje.salidaPrevista ?? viaje.fechaCreacion,
      indicacionesCliente: indicaciones,
      valorAproximado: viaje.valorReferencial,
      observaciones: viaje.observaciones,
      estado: 'convertida',
      viajeCodigo: viaje.codigo,
      fechaCreacion: r.sumarDias(viaje.fechaCreacion, -1),
      creadoPor: viaje.creadoPor,
    }
  }
  const vinculadas = ampliado.planes
    .filter((plan) => plan.solicitudCodigo)
    .map((plan) => desdeViaje(plan.solicitudCodigo ?? '', plan.codigo, ampliado.indicaciones.get(plan.codigo) ?? 'Sin indicaciones adicionales.'))
  const siguiente = 11 + vinculadas.length
  return [
    ...solicitudesBase(desdeViaje, r),
    ...vinculadas,
    ...solicitudesPendientesAmpliadas(r, siguiente),
  ]
}

function solicitudesBase(desdeViaje: (codigoSolicitud: string, viajeCodigo: string, indicaciones: string) => Solicitud, r: Reloj): Solicitud[] {
  return [
    desdeViaje('SOL-001', 'IMP-001', 'Retirar el contenedor en el primer turno de puerto.'),
    desdeViaje('SOL-002', 'IMP-002', 'Entregar en bodega de materias primas.'),
    desdeViaje('SOL-003', 'IMP-005', 'Coordinar con la garita de planta antes del ingreso.'),
    desdeViaje('SOL-004', 'IMP-006', 'Recepción en andén 3 a partir de las 10:00.'),
    desdeViaje('SOL-005', 'IMP-007', 'Cliente confirmará la liberación de la carga.'),
    desdeViaje('SOL-006', 'EXP-001', 'Cumplir el cierre de recepción de la nave.'),
    desdeViaje('SOL-007', 'EXP-002', 'Contenedor refrigerado previamente enfriado.'),
    {
      codigo: 'SOL-008',
      clienteCodigo: 'CLI-003',
      modalidad: 'importacion_suelta',
      tipoCarga: 'suelta',
      categoriaCargaCodigo: 'TCA-003',
      descripcionCarga: 'Tableros eléctricos (8 bultos)',
      origenCodigo: 'LUG-001',
      destinoCodigo: 'LUG-008',
      fechaRequerida: r.dia(5, 6),
      indicacionesCliente: 'Carga frágil; transporte con lona.',
      valorAproximado: 1150,
      observaciones: 'Pendiente de revisión por Operaciones.',
      estado: 'recibida',
      fechaCreacion: r.dia(0, 8, 15),
      creadoPor: 'USR-002',
    },
    {
      codigo: 'SOL-009',
      clienteCodigo: 'CLI-006',
      modalidad: 'importacion_contenedorizada',
      tipoCarga: 'contenedorizada',
      categoriaCargaCodigo: 'TCA-005',
      descripcionCarga: 'Perfiles de acero galvanizado',
      origenCodigo: 'LUG-002',
      destinoCodigo: 'LUG-011',
      fechaRequerida: r.dia(4, 7),
      indicacionesCliente: 'Devolver el contenedor en Depósito Durán.',
      valorAproximado: 980,
      observaciones: 'Aceptada; lista para convertir en viaje.',
      estado: 'aceptada',
      fechaCreacion: r.dia(-1, 15, 40),
      creadoPor: 'USR-003',
    },
    {
      codigo: 'SOL-010',
      clienteCodigo: 'CLI-005',
      modalidad: 'exportacion',
      tipoCarga: 'contenedorizada',
      categoriaCargaCodigo: 'TCA-002',
      descripcionCarga: 'Piña en cajas',
      origenCodigo: 'LUG-003',
      destinoCodigo: 'LUG-002',
      fechaRequerida: r.dia(-2, 6),
      indicacionesCliente: 'Requiere contenedor refrigerado.',
      valorAproximado: 820,
      observaciones: 'Cliente informado por correo.',
      estado: 'rechazada',
      motivoRechazo: 'No había contenedor refrigerado disponible para la fecha requerida.',
      fechaCreacion: r.dia(-6, 11),
      creadoPor: 'USR-001',
    },
  ]
}

interface PlanDocumento {
  viajeCodigo: string
  tipo: TipoDocumento
  numeroReferencial?: string
  fecha: string
  nombreArchivo: string
  descripcion: string
  creadoPor: string
  version?: number
}

function construirDocumentos(datos: DatosApp, r: Reloj, codigosAmpliados: readonly string[]): Documento[] {
  const viaje = (codigoViaje: string) => {
    const encontrado = datos.viajes.find((v) => v.codigo === codigoViaje)
    if (!encontrado) throw new Error(`Viaje ${codigoViaje} inexistente en el generador.`)
    return encontrado
  }
  const guia = (codigoViaje: string, numero: string, desplazamientoMinutos: number, creadoPor: string): PlanDocumento => {
    const v = viaje(codigoViaje)
    return {
      viajeCodigo: codigoViaje,
      tipo: 'guia_remision',
      numeroReferencial: numero,
      fecha: r.sumarMinutos(v.salidaPrevista ?? v.fechaCreacion, desplazamientoMinutos),
      nombreArchivo: `guia_remision_${codigoViaje}_v1.pdf`,
      descripcion: `Guía de remisión demostrativa del viaje ${codigoViaje}.`,
      creadoPor,
    }
  }
  const planes: PlanDocumento[] = [
    guia('IMP-001', 'GR-DEMO-0001', -60, 'USR-001'),
    { viajeCodigo: 'IMP-001', tipo: 'acta_entrega', fecha: r.dia(-12, 12, 25), nombreArchivo: 'acta_entrega_IMP-001.pdf', descripcion: 'Acta de entrega firmada por la bodega del cliente.', creadoPor: 'USR-002' },
    guia('IMP-002', 'GR-DEMO-0002', -45, 'USR-002'),
    { viajeCodigo: 'IMP-002', tipo: 'evidencia', fecha: r.dia(-10, 10), nombreArchivo: 'parada_via_perimetral.jpg', descripcion: 'Fotografía de la parada registrada en la incidencia INC-001.', creadoPor: 'USR-002' },
    guia('IMP-003', 'GR-DEMO-0003', -40, 'USR-003'),
    guia('IMP-004', 'GR-DEMO-0004', -50, 'USR-001'),
    guia('IMP-005', 'GR-DEMO-0005', -30, 'USR-002'),
    guia('IMP-009', 'GR-DEMO-0006', -60, 'USR-001'),
    guia('IMP-011', 'GR-DEMO-0007', -45, 'USR-003'),
    guia('EXP-001', 'GR-DEMO-0008', -30, 'USR-001'),
    guia('EXP-003', 'GR-DEMO-0009', -40, 'USR-003'),
    { viajeCodigo: 'EXP-003', tipo: 'conocimiento_embarque', numeroReferencial: 'BL-DEMO-55210', fecha: r.dia(-20, 16, 30), nombreArchivo: 'conocimiento_embarque_EXP-003.pdf', descripcion: 'Copia ilustrativa del conocimiento de embarque.', creadoPor: 'USR-002' },
  ]
  let numeroGuia = 10
  let numeroBl = 55211
  for (const codigoViaje of codigosAmpliados) {
    const v = viaje(codigoViaje)
    if (!v.salidaReal) continue
    const creador = v.creadoPor
    planes.push(guia(codigoViaje, `GR-DEMO-${String(numeroGuia++).padStart(4, '0')}`, -45, creador))
    if (v.estado !== 'finalizado') continue
    if (v.modalidad === 'exportacion') {
      planes.push({ viajeCodigo: codigoViaje, tipo: 'conocimiento_embarque', numeroReferencial: `BL-DEMO-${numeroBl++}`, fecha: r.sumarMinutos(v.cierreReal ?? v.salidaReal, 30), nombreArchivo: `conocimiento_embarque_${codigoViaje}.pdf`, descripcion: 'Copia ilustrativa del conocimiento de embarque.', creadoPor: creador })
    } else if (numeroGuia % 2 === 0) {
      planes.push({ viajeCodigo: codigoViaje, tipo: 'acta_entrega', fecha: r.sumarMinutos(v.llegadaReal ?? v.salidaReal, 120), nombreArchivo: `acta_entrega_${codigoViaje}.pdf`, descripcion: 'Acta de entrega firmada por el cliente.', creadoPor: creador })
    }
  }
  for (const incidencia of datos.incidencias) {
    if (!codigosAmpliados.includes(incidencia.viajeCodigo)) continue
    for (const evidencia of incidencia.evidencias) {
      planes.push({ viajeCodigo: incidencia.viajeCodigo, tipo: 'evidencia', fecha: evidencia.fecha, nombreArchivo: evidencia.nombre, descripcion: `Fotografía de la novedad registrada en ${incidencia.codigo}.`, creadoPor: incidencia.responsableCodigo })
    }
  }
  planes.sort((a, b) => a.fecha.localeCompare(b.fecha))
  return planes.map((plan, indice) => {
    const v = viaje(plan.viajeCodigo)
    const cliente = datos.clientes.find((c) => c.codigo === v.clienteCodigo)
    const documento: Documento = {
      codigo: codigo('DOC', indice + 1),
      viajeCodigo: plan.viajeCodigo,
      tipo: plan.tipo,
      fechaGeneracion: plan.fecha,
      emisor: EMPRESA_OPERADORA,
      receptor: cliente?.razonSocial ?? '',
      nombreArchivo: plan.nombreArchivo,
      descripcion: plan.descripcion,
      version: plan.version ?? 1,
      creadoPor: plan.creadoPor,
    }
    if (plan.numeroReferencial) documento.numeroReferencial = plan.numeroReferencial
    if (plan.tipo === 'guia_remision') documento.datosGuia = construirDatosGuia(datos, v)
    return documento
  })
}

function construirFacturas(viajes: readonly Viaje[], r: Reloj): Factura[] {
  const valorDe = (codigos: string[]) =>
    codigos.reduce((suma, c) => suma + (viajes.find((v) => v.codigo === c)?.valorReferencial ?? 0), 0)
  const factura = (
    numero: number,
    clienteCodigo: string,
    viajeCodigos: string[],
    referencia: string,
    emision: string,
    diasCredito: number,
    modalidadCobro: ModalidadCobro,
  ): Factura => ({
    codigo: codigo('FAC', numero),
    clienteCodigo,
    viajeCodigos,
    referencia,
    fechaEmision: emision,
    fechaVencimiento: r.sumarDias(emision, diasCredito),
    valor: valorDe(viajeCodigos),
    modalidadCobro,
    creadoPor: USUARIO_CONTABLE,
  })
  return [
    factura(1, 'CLI-001', ['IMP-001', 'IMP-002'], 'REF-CONT-001-0412', r.dia(-8, 10), 30, 'credito'),
    factura(2, 'CLI-003', ['IMP-009'], 'REF-CONT-001-0377', r.dia(-40, 9), 30, 'credito'),
    factura(3, 'CLI-006', ['IMP-011'], 'REF-CONT-001-0398', r.dia(-23, 11), 27, 'credito'),
    factura(4, 'CLI-004', ['EXP-003'], 'REF-CONT-001-0389', r.dia(-19, 9, 30), 15, 'contra_factura'),
  ]
}

function construirPagos(r: Reloj): Pago[] {
  const pago = (numero: number, facturaCodigo: string, fecha: string, valor: number, referencia: string, validado: boolean): Pago => ({
    codigo: codigo('PAG', numero),
    facturaCodigo,
    fecha,
    valor,
    referencia,
    estado: validado ? 'validado' : 'registrado',
    registradoPor: USUARIO_CONTABLE,
    ...(validado ? { validadorCodigo: USUARIO_CONTABLE, fechaValidacion: new Date(new Date(fecha).getTime() + 2 * MS_HORA).toISOString() } : {}),
  })
  return [
    pago(1, 'FAC-001', r.dia(-3, 11), 400, 'TRF-DEMO-88120', true),
    pago(2, 'FAC-002', r.dia(-25, 15), 500, 'TRF-DEMO-87344', true),
    pago(3, 'FAC-003', r.dia(-1, 16), 300, 'TRF-DEMO-88301', false),
    pago(4, 'FAC-004', r.dia(-15, 10), 400, 'TRF-DEMO-87702', true),
    pago(5, 'FAC-004', r.dia(-12, 10), 360, 'TRF-DEMO-87955', true),
  ]
}

function construirDisponibilidad(viajes: readonly Viaje[]): { choferes: Chofer[]; unidades: Unidad[] } {
  const activos = viajes.filter((v) => v.estado === 'en_ejecucion' || v.estado === 'entregado_pendiente_devolucion')
  const choferesOcupados = new Set(activos.map((v) => v.choferCodigo))
  const unidadesOcupadas = new Set(activos.map((v) => v.unidadCodigo))
  return {
    choferes: TODOS_LOS_CHOFERES.map((chofer) => ({
      ...chofer,
      disponibilidad: choferesOcupados.has(chofer.codigo) ? 'en_servicio' : 'disponible',
    })),
    unidades: TODAS_LAS_UNIDADES.map((unidad) => ({
      ...unidad,
      disponibilidad: unidadesOcupadas.has(unidad.codigo) ? 'en_servicio' : unidad.codigo === 'UNI-006' ? 'mantenimiento' : 'disponible',
    })),
  }
}

function construirActividad(datos: DatosApp, fechaBase: Date): Actividad[] {
  const entradas: DatosNuevaActividad[] = []
  const nombreCliente = (codigoCliente: string) => datos.clientes.find((c) => c.codigo === codigoCliente)?.razonSocial ?? codigoCliente
  const nombreHito = (codigoHito: string) => datos.tiposEvento.find((t) => t.codigo === codigoHito)?.nombre ?? codigoHito

  for (const solicitud of datos.solicitudes) {
    entradas.push({ usuarioCodigo: solicitud.creadoPor, accion: 'creacion', entidad: 'solicitud', codigoEntidad: solicitud.codigo, descripcion: `Solicitud registrada para ${nombreCliente(solicitud.clienteCodigo)}.`, fechaHora: solicitud.fechaCreacion })
  }
  for (const viaje of datos.viajes) {
    const etiqueta = ETIQUETAS_MODALIDAD[viaje.modalidad].toLowerCase()
    if (viaje.solicitudCodigo) {
      entradas.push({ usuarioCodigo: viaje.creadoPor, accion: 'conversion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Solicitud ${viaje.solicitudCodigo} convertida en viaje de ${etiqueta}.`, fechaHora: viaje.fechaCreacion })
    } else {
      entradas.push({ usuarioCodigo: viaje.creadoPor, accion: 'creacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Viaje de ${etiqueta} creado para ${nombreCliente(viaje.clienteCodigo)}.`, fechaHora: viaje.fechaCreacion })
    }
    const programado = viaje.historialEstados.find((c) => c.estadoNuevo === 'programado')
    if (programado && viaje.choferCodigo && viaje.unidadCodigo) {
      entradas.push({ usuarioCodigo: programado.usuarioCodigo, accion: 'asignacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Asignados chofer ${viaje.choferCodigo} y unidad ${viaje.unidadCodigo}.`, fechaHora: programado.fecha })
    }
    for (const ajuste of viaje.ajustesProgramacion) {
      entradas.push({ usuarioCodigo: ajuste.usuarioCodigo, accion: 'cambio_programacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Ajuste de programación: ${ajuste.motivo}`, fechaHora: ajuste.fecha })
    }
    const finalizado = viaje.historialEstados.find((c) => c.estadoNuevo === 'finalizado')
    if (finalizado) {
      entradas.push({ usuarioCodigo: finalizado.usuarioCodigo, accion: 'finalizacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: 'Viaje finalizado con todos los hitos de la modalidad.', fechaHora: finalizado.fecha })
    }
    const cancelado = viaje.historialEstados.find((c) => c.estadoNuevo === 'cancelado')
    if (cancelado) {
      entradas.push({ usuarioCodigo: cancelado.usuarioCodigo, accion: 'cancelacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Viaje cancelado. Motivo: ${cancelado.motivo ?? 'sin motivo'}`, fechaHora: cancelado.fecha })
    }
  }
  for (const evento of datos.eventos) {
    if (evento.tipoEventoCodigo === HITOS.cierre || !evento.horaReal) continue
    entradas.push({ usuarioCodigo: evento.responsableCodigo, accion: 'evento', entidad: 'evento', codigoEntidad: evento.codigo, descripcion: `${nombreHito(evento.tipoEventoCodigo)} registrado en ${evento.viajeCodigo}.`, fechaHora: evento.horaReal })
  }
  for (const incidencia of datos.incidencias) {
    entradas.push({ usuarioCodigo: incidencia.responsableCodigo, accion: 'incidencia', entidad: 'incidencia', codigoEntidad: incidencia.codigo, descripcion: `Incidencia registrada en ${incidencia.viajeCodigo}: ${incidencia.descripcion}`, fechaHora: incidencia.fechaHora })
    if (incidencia.fechaResolucion) {
      entradas.push({ usuarioCodigo: incidencia.responsableCodigo, accion: 'resolucion_incidencia', entidad: 'incidencia', codigoEntidad: incidencia.codigo, descripcion: `Incidencia resuelta: ${incidencia.accionCorrectiva ?? ''}`, fechaHora: incidencia.fechaResolucion })
    }
  }
  for (const documento of datos.documentos) {
    entradas.push({ usuarioCodigo: documento.creadoPor, accion: 'documento', entidad: 'documento', codigoEntidad: documento.codigo, descripcion: `${documento.tipo === 'guia_remision' ? 'Guía de remisión generada' : 'Documento adjuntado'} para ${documento.viajeCodigo}.`, fechaHora: documento.fechaGeneracion })
  }
  for (const factura of datos.facturas) {
    entradas.push({ usuarioCodigo: factura.creadoPor, accion: 'factura', entidad: 'factura', codigoEntidad: factura.codigo, descripcion: `Factura ${factura.referencia} registrada para ${factura.viajeCodigos.join(', ')}.`, fechaHora: factura.fechaEmision })
  }
  for (const pago of datos.pagos) {
    entradas.push({ usuarioCodigo: USUARIO_CONTABLE, accion: 'pago', entidad: 'pago', codigoEntidad: pago.codigo, descripcion: `Pago ${pago.referencia} registrado para ${pago.facturaCodigo}.`, fechaHora: pago.fecha })
    if (pago.estado === 'validado') {
      entradas.push({ usuarioCodigo: pago.validadorCodigo ?? USUARIO_CONTABLE, accion: 'validacion_pago', entidad: 'pago', codigoEntidad: pago.codigo, descripcion: `Pago ${pago.referencia} validado.`, fechaHora: pago.fechaValidacion ?? pago.fecha })
    }
  }
  const limite = fechaBase.toISOString()
  const ordenadas = entradas
    .filter((entrada) => (entrada.fechaHora ?? limite) <= limite)
    .sort((a, b) => (a.fechaHora ?? '').localeCompare(b.fechaHora ?? ''))
  return ordenarActividadReciente(ordenadas.map((entrada, indice) => crearActividad(entrada, indice + 1)))
}

export function generarDatosDemostrativos(fechaBase: Date = new Date()): DatosApp {
  const reloj = crearReloj(fechaBase)
  const planesBase = planesDeViaje(reloj)
  const ampliado = planesAmpliados(reloj, 12, 4, 11)
  const planes = [...planesBase, ...ampliado.planes]
  const viajes = planes.map((plan) => construirViaje(plan, reloj))
  const { choferes, unidades } = construirDisponibilidad(viajes)
  const facturasBase = construirFacturas(viajes, reloj)
  const yaFacturados = new Set(['IMP-008', ...facturasBase.flatMap((f) => f.viajeCodigos)])
  const facturacion = facturacionAmpliada(viajes, reloj, facturasBase.length + 1, 6, yaFacturados)

  const datos: DatosApp = {
    usuarios: USUARIOS.map((u) => ({ ...u })),
    clientes: [...CLIENTES, ...CLIENTES_AMPLIADOS].map((c) => ({ ...c })),
    lugares: TODOS_LOS_LUGARES.map((l) => ({ ...l })),
    transportistas: [...TRANSPORTISTAS, ...TRANSPORTISTAS_AMPLIADOS].map((t) => ({ ...t })),
    choferes,
    unidades,
    tiposCarga: CATALOGO_TIPOS_CARGA_BASE.map((t) => ({ ...t })),
    tiposEvento: CATALOGO_HITOS_BASE.map((t) => ({ ...t, modalidades: [...t.modalidades] })),
    tiposIncidencia: CATALOGO_TIPOS_INCIDENCIA_BASE.map((t) => ({ ...t })),
    solicitudes: construirSolicitudes(viajes, reloj, ampliado),
    viajes,
    eventos: construirEventos(planes),
    incidencias: construirIncidencias([...planesDeIncidencia(reloj), ...ampliado.incidencias]),
    documentos: [],
    facturas: [...facturasBase, ...facturacion.facturas],
    pagos: [...construirPagos(reloj), ...facturacion.pagos],
    actividad: [],
    configuracion: {
      versionEsquema: VERSION_ESQUEMA,
      fechaBaseDemostracion: fechaBase.toISOString(),
      diasAlertaVencimiento: DIAS_ALERTA_VENCIMIENTO_PREDETERMINADOS,
      contadores: {},
      usuarioActivoCodigo: USUARIOS[0]?.codigo ?? 'USR-001',
    },
  }
  datos.documentos = construirDocumentos(datos, reloj, ampliado.planes.map((p) => p.codigo))
  datos.actividad = construirActividad(datos, fechaBase)
  datos.configuracion.contadores = calcularContadores(datos)
  return datos
}
