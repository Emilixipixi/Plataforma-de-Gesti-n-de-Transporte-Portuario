import { z } from 'zod'
import { DISPONIBILIDADES_CHOFER, DISPONIBILIDADES_UNIDAD, ESTADOS_CATALOGO, MODALIDADES, TIPOS_LUGAR } from '@/tipos/dominio'

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
