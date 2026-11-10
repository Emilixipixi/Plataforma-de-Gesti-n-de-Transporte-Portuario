import type { ColeccionDatos, DatosApp } from '@/tipos/dominio'
import { generarDatosDemostrativos } from '@/datos/generadorDatos'
import { borrarDatos, guardarDatos, leerDatos } from '@/servicios/almacenamiento'

export type EntidadDe<C extends ColeccionDatos> = DatosApp[C][number]

export const COLECCIONES: readonly ColeccionDatos[] = [
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

export interface ResultadoCarga {
  datos: DatosApp
  regenerado: boolean
}

export function cargarDatos(): ResultadoCarga {
  const guardados = leerDatos()
  if (guardados) return { datos: guardados, regenerado: false }
  const nuevos = generarDatosDemostrativos()
  guardarDatos(nuevos)
  return { datos: nuevos, regenerado: true }
}

export function persistir(datos: DatosApp): void {
  guardarDatos(datos)
}

export function restablecerDatos(fechaBase: Date = new Date()): DatosApp {
  borrarDatos()
  const nuevos = generarDatosDemostrativos(fechaBase)
  guardarDatos(nuevos)
  return nuevos
}

export function listar<C extends ColeccionDatos>(datos: DatosApp, coleccion: C): DatosApp[C] {
  return datos[coleccion]
}

export function obtener<C extends ColeccionDatos>(
  datos: DatosApp,
  coleccion: C,
  codigo: string | undefined,
): EntidadDe<C> | undefined {
  if (!codigo) return undefined
  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  return lista.find((entidad) => entidad.codigo === codigo)
}

export function existe<C extends ColeccionDatos>(datos: DatosApp, coleccion: C, codigo: string): boolean {
  return obtener(datos, coleccion, codigo) !== undefined
}

export function guardar<C extends ColeccionDatos>(datos: DatosApp, coleccion: C, entidad: EntidadDe<C>): DatosApp {
  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  const indice = lista.findIndex((actual) => actual.codigo === entidad.codigo)
  const nuevaLista = indice === -1 ? [...lista, entidad] : lista.map((actual, i) => (i === indice ? entidad : actual))
  return { ...datos, [coleccion]: nuevaLista }
}

export function guardarVarios<C extends ColeccionDatos>(
  datos: DatosApp,
  coleccion: C,
  entidades: readonly EntidadDe<C>[],
): DatosApp {
  return entidades.reduce<DatosApp>((acumulado, entidad) => guardar(acumulado, coleccion, entidad), datos)
}

export function eliminar<C extends ColeccionDatos>(datos: DatosApp, coleccion: C, codigo: string): DatosApp {
  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  return { ...datos, [coleccion]: lista.filter((entidad) => entidad.codigo !== codigo) }
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function coincideTexto(consulta: string, valores: readonly (string | undefined)[]): boolean {
  const termino = normalizarTexto(consulta)
  if (!termino) return true
  return valores.some((valor) => valor !== undefined && normalizarTexto(valor).includes(termino))
}

export function buscar<C extends ColeccionDatos>(
  datos: DatosApp,
  coleccion: C,
  consulta: string,
  campos: (entidad: EntidadDe<C>) => readonly (string | undefined)[],
): EntidadDe<C>[] {
  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  return lista.filter((entidad) => coincideTexto(consulta, campos(entidad)))
}

const PATRON_CODIGO = /^([A-Z]{3})-(\d+)$/

export function calcularContadores(datos: DatosApp): Record<string, number> {
  const contadores: Record<string, number> = {}
  for (const coleccion of COLECCIONES) {
    const lista: readonly { codigo: string }[] = datos[coleccion]
    for (const { codigo } of lista) {
      const coincidencia = PATRON_CODIGO.exec(codigo)
      if (!coincidencia) continue
      const [, prefijo, numero] = coincidencia
      if (prefijo === undefined || numero === undefined) continue
      contadores[prefijo] = Math.max(contadores[prefijo] ?? 0, Number(numero))
    }
  }
  return contadores
}
