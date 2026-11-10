import { z } from 'zod'
import { DISPONIBILIDADES_CHOFER, DISPONIBILIDADES_UNIDAD, ESTADOS_CATALOGO, MODALIDADES, MODALIDADES_COBRO, TIPOS_LUGAR } from '@/tipos/dominio'

export const MENSAJES = {
  requerido: 'Este campo es obligatorio.',
  correo: 'Ingrese un correo válido.',
  telefono: 'Ingrese un teléfono válido (solo números, espacios o guiones).',
  identificacion: 'Ingrese una cédula de 10 dígitos o un RUC de 13 dígitos.',
  identificacionDuplicada: 'Ya existe un cliente con esta identificación.',
  fecha: 'Ingrese una fecha válida.',
  numeroPositivo: 'Ingrese un valor mayor a cero.',
} as const

export const PATRON_IDENTIFICACION = /^(\d{10}|\d{13})$/
export const PATRON_TELEFONO = /^[0-9][0-9 -]{5,18}$/
export const PATRON_CEDULA = /^\d{10}$/
export const PATRON_PLACA = /^[A-Z]{3}-\d{3,4}$/

export const textoRequerido = (minimo = 1, mensajeMinimo?: string) =>
  z.string().trim().min(1, MENSAJES.requerido).min(minimo, mensajeMinimo ?? `Ingrese al menos ${minimo} caracteres.`)

export const textoOpcional = z.string().trim()

export const esquemaCliente = z.object({
  razonSocial: textoRequerido(3),
  identificacion: z.string().trim().min(1, MENSAJES.requerido).regex(PATRON_IDENTIFICACION, MENSAJES.identificacion),
  contacto: textoRequerido(3),
  correo: z.string().trim().min(1, MENSAJES.requerido).pipe(z.email(MENSAJES.correo)),
  telefono: z.string().trim().min(1, MENSAJES.requerido).regex(PATRON_TELEFONO, MENSAJES.telefono),
  estado: z.enum(ESTADOS_CATALOGO),
})

export type EntradaCliente = z.infer<typeof esquemaCliente>

export function identificacionDisponible(
  identificacion: string,
  clientes: readonly { codigo: string; identificacion: string }[],
  codigoActual?: string,
): boolean {
  const normalizada = identificacion.trim()
  return !clientes.some((c) => c.identificacion === normalizada && c.codigo !== codigoActual)
}

export const ESTADOS_SOLICITUD_EDITABLES = ['recibida', 'aceptada'] as const

export const esquemaSolicitud = z
  .object({
    clienteCodigo: z.string().min(1, 'Seleccione un cliente.'),
    modalidad: z.enum(MODALIDADES, { message: 'Seleccione el tipo de operación.' }),
    categoriaCargaCodigo: z.string().min(1, 'Seleccione el tipo de carga.'),
    descripcionCarga: textoRequerido(3),
    origenCodigo: z.string().min(1, 'Seleccione el origen.'),
    destinoCodigo: z.string().min(1, 'Seleccione el destino.'),
    fechaRequerida: z.string().min(1, MENSAJES.requerido).refine((valor) => !Number.isNaN(new Date(valor).getTime()), MENSAJES.fecha),
    indicacionesCliente: textoOpcional,
    observaciones: textoOpcional,
    estado: z.enum(ESTADOS_SOLICITUD_EDITABLES),
  })
  .refine((datos) => datos.origenCodigo !== datos.destinoCodigo, {
    path: ['destinoCodigo'],
    message: 'El destino debe ser distinto del origen.',
  })

export type EntradaSolicitud = z.infer<typeof esquemaSolicitud>

export const esquemaMotivo = z.object({ motivo: textoRequerido(5, 'Describa el motivo con al menos 5 caracteres.') })
export type EntradaMotivo = z.infer<typeof esquemaMotivo>

const estadoCatalogo = z.enum(ESTADOS_CATALOGO)

export const esquemaTransportista = z.object({
  razonSocial: textoRequerido(3),
  contacto: textoRequerido(3),
  telefono: z.string().trim().min(1, MENSAJES.requerido).regex(PATRON_TELEFONO, MENSAJES.telefono),
  estado: estadoCatalogo,
})
export type EntradaTransportista = z.infer<typeof esquemaTransportista>

export const esquemaChofer = z.object({
  nombre: textoRequerido(3),
  identificacion: z.string().trim().min(1, MENSAJES.requerido).regex(PATRON_CEDULA, 'Ingrese una cédula de 10 dígitos.'),
  telefono: z.string().trim().min(1, MENSAJES.requerido).regex(PATRON_TELEFONO, MENSAJES.telefono),
  transportistaCodigo: z.string().min(1, 'Seleccione el transportista.'),
  disponibilidad: z.enum(DISPONIBILIDADES_CHOFER),
  estado: estadoCatalogo,
})
export type EntradaChofer = z.infer<typeof esquemaChofer>

export const esquemaUnidad = z.object({
  placa: z.string().trim().toUpperCase().min(1, MENSAJES.requerido).regex(PATRON_PLACA, 'Use el formato ABC-1234.'),
  tipo: z.string().min(1, 'Seleccione el tipo de unidad.'),
  transportistaCodigo: z.string().min(1, 'Seleccione el transportista.'),
  disponibilidad: z.enum(DISPONIBILIDADES_UNIDAD),
  estado: estadoCatalogo,
})
export type EntradaUnidad = z.infer<typeof esquemaUnidad>

export const esquemaLugar = z.object({
  nombre: textoRequerido(3),
  tipo: z.enum(TIPOS_LUGAR),
  ciudad: textoRequerido(3),
  estado: estadoCatalogo,
})
export type EntradaLugar = z.infer<typeof esquemaLugar>

export const esquemaTipoCatalogo = z.object({
  nombre: textoRequerido(3),
  estado: estadoCatalogo,
})
export type EntradaTipoCatalogo = z.infer<typeof esquemaTipoCatalogo>

export const esquemaTipoEvento = z.object({
  nombre: textoRequerido(3),
  modalidades: z.array(z.enum(MODALIDADES)).min(1, 'Seleccione al menos una modalidad.'),
  estado: estadoCatalogo,
})
export type EntradaTipoEvento = z.infer<typeof esquemaTipoEvento>

export const PATRON_CONTENEDOR = /^[A-Z]{4}\d{7}$/

const fechaLocalOpcional = z.string().refine((v) => v === '' || !Number.isNaN(new Date(v).getTime()), MENSAJES.fecha)

export const esquemaViaje = z
  .object({
    clienteCodigo: z.string().min(1, 'Seleccione un cliente.'),
    modalidad: z.enum(MODALIDADES, { message: 'Seleccione la modalidad.' }),
    categoriaCargaCodigo: z.string().min(1, 'Seleccione el tipo de carga.'),
    descripcionCarga: textoRequerido(3),
    observacionesCarga: textoOpcional,
    contenedorTipo: z.string(),
    contenedorNumero: z.string().trim().toUpperCase(),
    origenCodigo: z.string().min(1, 'Seleccione el origen.'),
    paradas: z.array(z.object({ lugarCodigo: z.string().min(1, 'Seleccione el lugar de la parada.') })),
    destinoCodigo: z.string().min(1, 'Seleccione el destino.'),
    devolucionCodigo: z.string(),
    transportistaCodigo: z.string(),
    choferCodigo: z.string(),
    unidadCodigo: z.string(),
    salidaPrevista: fechaLocalOpcional,
    llegadaPrevista: fechaLocalOpcional,
    cierrePrevisto: fechaLocalOpcional,
    modalidadCobro: z.enum(MODALIDADES_COBRO),
    valorReferencial: z.number({ message: 'Ingrese un valor numérico.' }).min(0, 'El valor no puede ser negativo.'),
    observaciones: textoOpcional,
    motivoAjuste: textoOpcional,
  })
  .superRefine((v, ctx) => {
    const error = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (v.modalidad !== 'importacion_suelta' && !v.contenedorTipo) error('contenedorTipo', 'Seleccione el tipo de contenedor.')
    if (v.contenedorNumero && !PATRON_CONTENEDOR.test(v.contenedorNumero)) error('contenedorNumero', 'Use 4 letras y 7 dígitos, por ejemplo PFLU4821935.')
    if (v.origenCodigo && v.origenCodigo === v.destinoCodigo) error('destinoCodigo', 'El destino debe ser distinto del origen.')
    if (v.modalidad === 'importacion_contenedorizada' && !v.devolucionCodigo) error('devolucionCodigo', 'Indique el depósito de devolución del contenedor.')
    if (v.modalidad === 'exportacion' && v.paradas.length === 0) error('paradas', 'Agregue el paso por cliente o planta donde se carga el contenedor.')
    if (v.choferCodigo && !v.transportistaCodigo) error('transportistaCodigo', 'Seleccione el transportista del chofer.')
    if (v.unidadCodigo && !v.transportistaCodigo) error('transportistaCodigo', 'Seleccione el transportista de la unidad.')
    if ((v.llegadaPrevista || v.cierrePrevisto) && !v.salidaPrevista) error('salidaPrevista', 'Indique la salida prevista.')
    if (v.salidaPrevista && v.llegadaPrevista && v.llegadaPrevista <= v.salidaPrevista) error('llegadaPrevista', 'Debe ser posterior a la salida prevista.')
    if (v.llegadaPrevista && v.cierrePrevisto && v.cierrePrevisto < v.llegadaPrevista) error('cierrePrevisto', 'No puede ser anterior a la llegada prevista.')
  })

export type EntradaViaje = z.infer<typeof esquemaViaje>

export const esquemaCancelacion = z.object({ motivo: textoRequerido(10, 'Documente el motivo con al menos 10 caracteres.') })
export type EntradaCancelacion = z.infer<typeof esquemaCancelacion>

const fechaLocalRequerida = z.string().min(1, MENSAJES.requerido).refine((v) => !Number.isNaN(new Date(v).getTime()), MENSAJES.fecha)

export const esquemaEvento = z.object({
  tipoEventoCodigo: z.string().min(1, 'Seleccione el hito o evento.'),
  ubicacion: textoRequerido(3),
  horaPrevista: fechaLocalOpcional,
  horaReal: fechaLocalRequerida,
  comentario: textoOpcional,
})
export type EntradaEvento = z.infer<typeof esquemaEvento>

export const esquemaIncidencia = z.object({
  viajeCodigo: z.string().min(1, 'Seleccione el viaje.'),
  tipoIncidenciaCodigo: z.string().min(1, 'Seleccione el tipo de incidencia.'),
  fechaHora: fechaLocalRequerida,
  ubicacion: textoRequerido(3),
  descripcion: textoRequerido(10, 'Describa la incidencia con al menos 10 caracteres.'),
})
export type EntradaIncidencia = z.infer<typeof esquemaIncidencia>

export const esquemaResolucion = z.object({
  accionCorrectiva: textoRequerido(10, 'Describa la acción correctiva con al menos 10 caracteres.'),
  fechaResolucion: fechaLocalRequerida,
})
export type EntradaResolucion = z.infer<typeof esquemaResolucion>

export const esquemaFinalizacion = z.object({
  horaCierre: fechaLocalRequerida,
  observacionCierre: textoOpcional,
})
export type EntradaFinalizacion = z.infer<typeof esquemaFinalizacion>

export const esquemaGuia = z.object({
  remitente: textoRequerido(3),
  destinatario: textoRequerido(3),
  identificacionDestinatario: textoRequerido(5),
  transportista: textoRequerido(3),
  chofer: textoRequerido(3),
  unidad: textoRequerido(3),
  placa: z.string().trim().toUpperCase().min(1, MENSAJES.requerido).regex(PATRON_PLACA, 'Use el formato ABC-1234.'),
  origen: textoRequerido(3),
  destino: textoRequerido(3),
  carga: textoRequerido(3),
  contenedor: textoOpcional,
  recorrido: textoRequerido(3),
  emisor: textoRequerido(3),
  receptor: textoRequerido(3),
})
export type EntradaGuia = z.infer<typeof esquemaGuia>

export const esquemaAdjunto = z.object({
  viajeCodigo: z.string().min(1, 'Seleccione el viaje.'),
  tipo: z.enum(['conocimiento_embarque', 'acta_entrega', 'evidencia', 'otro'], { message: 'Seleccione el tipo de documento.' }),
  numeroReferencial: textoOpcional,
  emisor: textoRequerido(3),
  receptor: textoRequerido(3),
  descripcion: textoRequerido(5),
})
export type EntradaAdjuntoFormulario = z.infer<typeof esquemaAdjunto>

const claveFechaRequerida = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, MENSAJES.fecha)
const valorMonetario = z.number({ message: 'Ingrese un valor numérico.' }).positive(MENSAJES.numeroPositivo).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Use como máximo dos decimales.')

export const esquemaFactura = z
  .object({
    clienteCodigo: z.string().min(1, 'Seleccione el cliente.'),
    viajeCodigos: z.array(z.string()).min(1, 'Seleccione al menos un servicio por facturar.'),
    referencia: textoRequerido(3),
    fechaEmision: claveFechaRequerida,
    fechaVencimiento: claveFechaRequerida,
    valor: valorMonetario,
    modalidadCobro: z.enum(MODALIDADES_COBRO, { message: 'Seleccione la modalidad de cobro.' }),
  })
  .refine((f) => f.fechaVencimiento >= f.fechaEmision, { path: ['fechaVencimiento'], message: 'El vencimiento no puede ser anterior a la emisión.' })
export type EntradaFactura = z.infer<typeof esquemaFactura>

export const esquemaPago = z.object({
  facturaCodigo: z.string().min(1, 'Seleccione la factura.'),
  fecha: claveFechaRequerida,
  valor: valorMonetario,
  referencia: textoRequerido(3),
  observacion: textoOpcional,
})
export type EntradaPago = z.infer<typeof esquemaPago>
