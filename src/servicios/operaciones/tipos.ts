import type { DatosApp } from '@/tipos/dominio'
import type { DatosNuevaActividad } from '@/servicios/actividad'

export interface ContextoOperacion {
  usuarioCodigo: string
  ahora: string
}

export type ResultadoOperacion<T = undefined> =
  | { ok: true; datos: DatosApp; actividad: DatosNuevaActividad[]; valor: T; mensaje?: string }
  | { ok: false; error: string }

export type Operacion<T = undefined> = (datos: DatosApp, contexto: ContextoOperacion) => ResultadoOperacion<T>

export function exito<T>(datos: DatosApp, actividad: DatosNuevaActividad[], valor: T, mensaje?: string): ResultadoOperacion<T> {
  return mensaje === undefined ? { ok: true, datos, actividad, valor } : { ok: true, datos, actividad, valor, mensaje }
}

export function fallo<T = undefined>(error: string): ResultadoOperacion<T> {
  return { ok: false, error }
}
