import type { Perfil } from '@/tipos/dominio'

export const ACCIONES = [
  'dashboard.operativo.ver',
  'dashboard.contable.ver',
  'clientes.ver',
  'clientes.escribir',
  'solicitudes.ver',
  'solicitudes.escribir',
  'programacion.ver',
  'programacion.escribir',
  'viajes.ver',
  'viajes.verCompleto',
  'viajes.escribir',
  'viajes.cerrar',
  'viajes.cancelar',
  'seguimiento.ver',
  'seguimiento.escribir',
  'incidencias.ver',
  'incidencias.escribir',
  'documentos.ver',
  'documentos.escribir',
  'reportes.operativos.ver',
  'reportes.cliente.ver',
  'reportes.contables.ver',
  'facturacion.ver',
  'facturas.escribir',
  'cartera.ver',
  'pagos.ver',
  'pagos.registrar',
  'pagos.validar',
  'catalogos.ver',
  'catalogos.escribir',
  'importacion.usar',
  'actividad.ver',
  'integraciones.ver',
  'configuracion.ver',
  'configuracion.restablecer',
] as const
export type Accion = (typeof ACCIONES)[number]

const ACCIONES_OPERACIONES: readonly Accion[] = [
  'dashboard.operativo.ver',
  'clientes.ver',
  'clientes.escribir',
  'solicitudes.ver',
  'solicitudes.escribir',
  'programacion.ver',
  'programacion.escribir',
  'viajes.ver',
  'viajes.verCompleto',
  'viajes.escribir',
  'viajes.cerrar',
  'viajes.cancelar',
  'seguimiento.ver',
  'seguimiento.escribir',
  'incidencias.ver',
  'incidencias.escribir',
  'documentos.ver',
  'documentos.escribir',
  'reportes.operativos.ver',
  'reportes.cliente.ver',
  'catalogos.ver',
  'catalogos.escribir',
  'importacion.usar',
  'actividad.ver',
  'integraciones.ver',
  'configuracion.ver',
  'configuracion.restablecer',
]

const ACCIONES_CONTABILIDAD: readonly Accion[] = [
  'dashboard.contable.ver',
  'clientes.ver',
  'viajes.ver',
  'reportes.contables.ver',
  'facturacion.ver',
  'facturas.escribir',
  'cartera.ver',
  'pagos.ver',
  'pagos.registrar',
  'pagos.validar',
  'integraciones.ver',
]

const PERMISOS_POR_PERFIL: Record<Perfil, ReadonlySet<Accion>> = {
  operaciones: new Set(ACCIONES_OPERACIONES),
  contabilidad: new Set(ACCIONES_CONTABILIDAD),
}

export function puede(perfil: Perfil | null | undefined, accion: Accion): boolean {
  if (!perfil) return false
  return PERMISOS_POR_PERFIL[perfil].has(accion)
}

export function puedeAlguna(perfil: Perfil | null | undefined, acciones: readonly Accion[]): boolean {
  return acciones.some((accion) => puede(perfil, accion))
}

const EXPLICACIONES_POR_PERFIL: Record<Perfil, string> = {
  operaciones: 'Esta función es exclusiva del perfil Contabilidad.',
  contabilidad: 'El perfil Contabilidad solo consulta esta información; la edición logística corresponde a Operaciones.',
}

export function explicacionSinPermiso(perfil: Perfil | null | undefined): string {
  if (!perfil) return 'Seleccione un perfil para continuar.'
  return EXPLICACIONES_POR_PERFIL[perfil]
}
