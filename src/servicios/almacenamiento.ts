import type { DatosApp, Perfil } from '@/tipos/dominio'
import { CLAVE_ALMACENAMIENTO, VERSION_ESQUEMA } from '@/utilidades/constantes'

const CLAVE_SESION = `${CLAVE_ALMACENAMIENTO}:sesion`

const COLECCIONES_REQUERIDAS: readonly (keyof DatosApp)[] = [
  'usuarios',
  'clientes',
  'lugares',
  'transportistas',
  'choferes',
  'unidades',
  'tiposCarga',
  'tiposEvento',
  'tiposIncidencia',
  'solicitudes',
  'viajes',
  'eventos',
  'incidencias',
  'documentos',
  'facturas',
  'pagos',
  'actividad',
]

export interface Sesion {
  perfil: Perfil
  usuarioCodigo: string
}

type Migracion = (datos: Record<string, unknown>) => Record<string, unknown>

const MIGRACIONES: Record<number, Migracion> = {}

const memoriaAlternativa = new Map<string, string>()

function leerTexto(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return memoriaAlternativa.get(clave) ?? null
  }
}

function escribirTexto(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor)
  } catch {
    memoriaAlternativa.set(clave, valor)
  }
}

function borrarTexto(clave: string): void {
  try {
    window.localStorage.removeItem(clave)
  } catch {
    memoriaAlternativa.delete(clave)
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function versionDe(datos: Record<string, unknown>): number | null {
  const configuracion = datos.configuracion
  if (!esObjeto(configuracion)) return null
  const version = configuracion.versionEsquema
  return typeof version === 'number' ? version : null
}

function migrar(datos: Record<string, unknown>): Record<string, unknown> | null {
  let actual = datos
  let version = versionDe(actual)
  if (version === null || version > VERSION_ESQUEMA) return null
  while (version < VERSION_ESQUEMA) {
    const migracion = MIGRACIONES[version]
    if (!migracion) return null
    actual = migracion(actual)
    const siguiente = versionDe(actual)
    if (siguiente === null || siguiente <= version) return null
    version = siguiente
  }
  return actual
}

function tieneEstructuraValida(datos: Record<string, unknown>): datos is Record<string, unknown> & DatosApp {
  return COLECCIONES_REQUERIDAS.every((coleccion) => Array.isArray(datos[coleccion])) && esObjeto(datos.configuracion)
}

export function leerDatos(): DatosApp | null {
  const texto = leerTexto(CLAVE_ALMACENAMIENTO)
  if (!texto) return null
  try {
    const crudo: unknown = JSON.parse(texto)
    if (!esObjeto(crudo)) return null
    const migrado = migrar(crudo)
    if (!migrado || !tieneEstructuraValida(migrado)) return null
    return migrado
  } catch {
    return null
  }
}

export function guardarDatos(datos: DatosApp): void {
  escribirTexto(CLAVE_ALMACENAMIENTO, JSON.stringify(datos))
}

export function borrarDatos(): void {
  borrarTexto(CLAVE_ALMACENAMIENTO)
}

export function leerSesion(): Sesion | null {
  const texto = leerTexto(CLAVE_SESION)
  if (!texto) return null
  try {
    const crudo: unknown = JSON.parse(texto)
    if (!esObjeto(crudo)) return null
    const { perfil, usuarioCodigo } = crudo
    if ((perfil !== 'operaciones' && perfil !== 'contabilidad') || typeof usuarioCodigo !== 'string') return null
    return { perfil, usuarioCodigo }
  } catch {
    return null
  }
}

export function guardarSesion(sesion: Sesion): void {
  escribirTexto(CLAVE_SESION, JSON.stringify(sesion))
}

export function borrarSesion(): void {
  borrarTexto(CLAVE_SESION)
}
