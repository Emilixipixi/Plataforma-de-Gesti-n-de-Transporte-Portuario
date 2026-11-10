import type { Chofer, DatosApp, Lugar, Unidad } from '@/tipos/dominio'
import type { Opcion } from '@/utilidades/constantes'
import { ETIQUETAS_DISPONIBILIDAD_CHOFER, ETIQUETAS_DISPONIBILIDAD_UNIDAD, ETIQUETAS_TIPO_LUGAR } from '@/utilidades/constantes'

export function opcionesLugar(lugares: readonly Lugar[]): Opcion<string>[] {
  return [...lugares]
    .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre))
    .map((l) => ({ valor: l.codigo, etiqueta: `${l.nombre} · ${ETIQUETAS_TIPO_LUGAR[l.tipo]}, ${l.ciudad}` }))
}

export function lugaresDisponibles(datos: DatosApp, incluir: readonly string[] = []): Lugar[] {
  return datos.lugares.filter((l) => l.estado === 'activo' || incluir.includes(l.codigo))
}

export function opcionesChofer(choferes: readonly Chofer[]): Opcion<string>[] {
  return choferes.map((c) => ({ valor: c.codigo, etiqueta: `${c.nombre} · ${ETIQUETAS_DISPONIBILIDAD_CHOFER[c.disponibilidad]}` }))
}

export function opcionesUnidad(unidades: readonly Unidad[]): Opcion<string>[] {
  return unidades.map((u) => ({ valor: u.codigo, etiqueta: `${u.placa} · ${u.tipo} · ${ETIQUETAS_DISPONIBILIDAD_UNIDAD[u.disponibilidad]}` }))
}
