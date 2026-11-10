import { useEffect, useMemo, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Paginacion } from '@/componentes/tablas/Paginacion'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import type { ParametrosListado } from '@/hooks/usarParametrosListado'

export interface Columna<T> {
  clave: string
  titulo: string
  celda: (fila: T) => ReactNode
  valorOrden?: (fila: T) => string | number | undefined
  alinear?: 'izquierda' | 'derecha' | 'centro'
  ancho?: string
  ocultarEnMovil?: boolean
  visibleDesde?: 'md' | 'lg' | 'xl' | '2xl'
}

interface PropiedadesTabla<T> {
  columnas: readonly Columna<T>[]
  filas: readonly T[]
  claveFila: (fila: T) => string
  listado: ParametrosListado
  acciones?: (fila: T) => ReactNode
  onFila?: (fila: T) => void
  resaltarFila?: (fila: T) => boolean
  tituloVacio?: string
  descripcionVacio?: string
  etiqueta: string
}

const ALINEACION = { izquierda: 'text-left', derecha: 'text-right', centro: 'text-center' } as const

const VISIBILIDAD = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell', '2xl': 'hidden 2xl:table-cell' } as const

function claseVisibilidad<T>(columna: Columna<T>): string {
  if (columna.visibleDesde) return VISIBILIDAD[columna.visibleDesde]
  return columna.ocultarEnMovil ? VISIBILIDAD.md : ''
}

function comparar(a: string | number | undefined, b: string | number | undefined): number {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

export function Tabla<T>({
  columnas,
  filas,
  claveFila,
  listado,
  acciones,
  onFila,
  resaltarFila,
  tituloVacio = 'Sin resultados',
  descripcionVacio = 'No hay registros que coincidan con los filtros aplicados.',
  etiqueta,
}: PropiedadesTabla<T>) {
  const { orden, direccion, pagina, tamano, alternarOrden, establecerPagina, establecerTamano } = listado

  const ordenadas = useMemo(() => {
    const columna = columnas.find((c) => c.clave === orden && c.valorOrden)
    if (!columna?.valorOrden) return [...filas]
    const obtener = columna.valorOrden
    const factor = direccion === 'asc' ? 1 : -1
    return [...filas].sort((a, b) => factor * comparar(obtener(a), obtener(b)))
  }, [filas, columnas, orden, direccion])

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamano))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = ordenadas.slice((paginaActual - 1) * tamano, paginaActual * tamano)

  useEffect(() => {
    if (pagina > totalPaginas) establecerPagina(totalPaginas)
  }, [pagina, totalPaginas, establecerPagina])

  return (
    <div className="bg-superficie border border-borde rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={etiqueta}>
          <thead className="bg-fondo text-texto-secundario">
            <tr>
              {columnas.map((columna) => {
                const activa = orden === columna.clave
                const Icono = activa ? (direccion === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <th
                    key={columna.clave}
                    scope="col"
                    style={columna.ancho ? { width: columna.ancho } : undefined}
                    aria-sort={activa ? (direccion === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`px-3 py-2.5 font-medium text-xs uppercase tracking-wide whitespace-nowrap ${ALINEACION[columna.alinear ?? 'izquierda']} ${claseVisibilidad(columna)}`}
                  >
                    {columna.valorOrden ? (
                      <button type="button" onClick={() => alternarOrden(columna.clave)} className={`inline-flex items-center gap-1 uppercase hover:text-texto ${activa ? 'text-texto' : ''}`}>
                        {columna.titulo}
                        <Icono className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      columna.titulo
                    )}
                  </th>
                )
              })}
              {acciones && <th scope="col" className="px-3 py-2.5 text-right font-medium text-xs uppercase tracking-wide">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((fila) => (
              <tr
                key={claveFila(fila)}
                onClick={onFila ? () => onFila(fila) : undefined}
                className={`${onFila ? 'cursor-pointer hover:bg-fondo' : ''} ${resaltarFila?.(fila) ? 'bg-peligro-fondo/40' : ''}`}
              >
                {columnas.map((columna) => (
                  <td key={columna.clave} className={`px-3 py-3 align-middle ${ALINEACION[columna.alinear ?? 'izquierda']} ${claseVisibilidad(columna)}`}>
                    {columna.celda(fila)}
                  </td>
                ))}
                {acciones && (
                  <td className="px-3 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {acciones(fila)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibles.length === 0 ? (
        <EstadoVacio titulo={tituloVacio} descripcion={descripcionVacio} />
      ) : (
        <Paginacion pagina={paginaActual} tamano={tamano} total={ordenadas.length} onPagina={establecerPagina} onTamano={establecerTamano} />
      )}
    </div>
  )
}
