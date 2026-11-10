import type { AccionActividad, Actividad, Entidad } from '@/tipos/dominio'
import { DIGITOS_CODIGO, PREFIJOS } from '@/utilidades/constantes'

export interface DatosNuevaActividad {
  usuarioCodigo: string
  accion: AccionActividad
  entidad: Entidad
  codigoEntidad: string
  descripcion: string
  fechaHora?: string
}

export function codigoActividad(numero: number): string {
  return `${PREFIJOS.actividad}-${String(numero).padStart(DIGITOS_CODIGO, '0')}`
}

export function crearActividad(datos: DatosNuevaActividad, numero: number): Actividad {
  return {
    codigo: codigoActividad(numero),
    usuarioCodigo: datos.usuarioCodigo,
    fechaHora: datos.fechaHora ?? new Date().toISOString(),
    accion: datos.accion,
    entidad: datos.entidad,
    codigoEntidad: datos.codigoEntidad,
    descripcion: datos.descripcion,
  }
}

export function ordenarActividadReciente(actividad: readonly Actividad[]): Actividad[] {
  return [...actividad].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || b.codigo.localeCompare(a.codigo))
}

export function registrarActividades<T extends { actividad: Actividad[]; configuracion: { contadores: Record<string, number> } }>(
  datos: T,
  entradas: readonly DatosNuevaActividad[],
): T {
  if (entradas.length === 0) return datos
  let contador = datos.configuracion.contadores[PREFIJOS.actividad] ?? 0
  const nuevas = entradas.map((entrada) => {
    contador += 1
    return crearActividad(entrada, contador)
  })
  return {
    ...datos,
    actividad: ordenarActividadReciente([...nuevas, ...datos.actividad]),
    configuracion: {
      ...datos.configuracion,
      contadores: { ...datos.configuracion.contadores, [PREFIJOS.actividad]: contador },
    },
  }
}
