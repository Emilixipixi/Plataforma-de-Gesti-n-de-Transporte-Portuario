import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { migasDeRuta } from '@/rutas/definicionRutas'
import { NOMBRE_SISTEMA } from '@/utilidades/constantes'

export function Migas() {
  const { pathname } = useLocation()
  const migas = migasDeRuta(pathname)
  if (migas.length === 0) return null
  return (
    <nav aria-label="Ruta de navegación" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-texto-secundario">
        <li>{NOMBRE_SISTEMA}</li>
        {migas.map((miga, indice) => {
          const ultima = indice === migas.length - 1
          return (
            <li key={miga.ruta} className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              {ultima ? (
                <span aria-current="page" className="text-texto font-medium">{miga.titulo}</span>
              ) : (
                <Link to={miga.ruta} className="hover:text-texto hover:underline underline-offset-2">{miga.titulo}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
