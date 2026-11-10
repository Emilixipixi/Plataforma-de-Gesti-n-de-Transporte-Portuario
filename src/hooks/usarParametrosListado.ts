import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TAMANOS_PAGINA, TAMANO_PAGINA_PREDETERMINADO } from '@/utilidades/constantes'

export type DireccionOrden = 'asc' | 'desc'

export interface OpcionesListado {
  prefijo?: string
  ordenPredeterminado?: string
  direccionPredeterminada?: DireccionOrden
}

export interface ParametrosListado {
  busqueda: string
  establecerBusqueda: (valor: string) => void
  filtro: (clave: string) => string
  establecerFiltro: (clave: string, valor: string) => void
  orden: string
  direccion: DireccionOrden
  alternarOrden: (clave: string) => void
  pagina: number
  establecerPagina: (pagina: number) => void
  tamano: number
  establecerTamano: (tamano: number) => void
  hayFiltros: boolean
  limpiar: () => void
}

export function usarParametrosListado({ prefijo = '', ordenPredeterminado = '', direccionPredeterminada = 'asc' }: OpcionesListado = {}): ParametrosListado {
  const [parametros, establecerParametros] = useSearchParams()
  const clave = useCallback((nombre: string) => (prefijo ? `${prefijo}_${nombre}` : nombre), [prefijo])

  const actualizar = useCallback(
    (cambios: Record<string, string | null>, reiniciarPagina = true) => {
      establecerParametros(
        (actuales) => {
          const nuevos = new URLSearchParams(actuales)
          for (const [nombre, valor] of Object.entries(cambios)) {
            if (valor === null || valor === '') nuevos.delete(clave(nombre))
            else nuevos.set(clave(nombre), valor)
          }
          if (reiniciarPagina) nuevos.delete(clave('pagina'))
          return nuevos
        },
        { replace: true },
      )
    },
    [establecerParametros, clave],
  )

  const busqueda = parametros.get(clave('q')) ?? ''
  const orden = parametros.get(clave('orden')) ?? ordenPredeterminado
  const direccionTexto = parametros.get(clave('dir'))
  const direccion: DireccionOrden = direccionTexto === 'asc' || direccionTexto === 'desc' ? direccionTexto : direccionPredeterminada
  const pagina = Math.max(1, Number(parametros.get(clave('pagina'))) || 1)
  const tamanoLeido = Number(parametros.get(clave('tam')))
  const tamano = (TAMANOS_PAGINA as readonly number[]).includes(tamanoLeido) ? tamanoLeido : TAMANO_PAGINA_PREDETERMINADO

  const reservadas = useMemo(() => new Set(['q', 'orden', 'dir', 'pagina', 'tam'].map(clave)), [clave])
  const hayFiltros =
    busqueda !== '' ||
    Array.from(parametros.keys()).some((nombre) => !reservadas.has(nombre) && (prefijo ? nombre.startsWith(`${prefijo}_`) : true))

  return {
    busqueda,
    establecerBusqueda: (valor) => actualizar({ q: valor }),
    filtro: (nombre) => parametros.get(clave(nombre)) ?? '',
    establecerFiltro: (nombre, valor) => actualizar({ [nombre]: valor }),
    orden,
    direccion,
    alternarOrden: (columna) =>
      actualizar({ orden: columna, dir: orden === columna && direccion === 'asc' ? 'desc' : 'asc' }, false),
    pagina,
    establecerPagina: (nueva) => actualizar({ pagina: nueva <= 1 ? null : String(nueva) }, false),
    tamano,
    establecerTamano: (nuevo) => actualizar({ tam: nuevo === TAMANO_PAGINA_PREDETERMINADO ? null : String(nuevo) }),
    hayFiltros,
    limpiar: () =>
      establecerParametros(
        (actuales) => {
          const nuevos = new URLSearchParams()
          for (const [nombre, valor] of actuales) {
            if (prefijo && !nombre.startsWith(`${prefijo}_`)) nuevos.set(nombre, valor)
          }
          return nuevos
        },
        { replace: true },
      ),
  }
}
