import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { buscarDefinicion } from '@/rutas/definicionRutas'

export default function PaginaPendiente() {
  const { pathname } = useLocation()
  const encontrada = buscarDefinicion(pathname)
  const definicion = encontrada?.definicion

  return (
    <section className="bg-superficie border border-borde rounded-lg p-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <Construction className="size-5 text-texto-secundario mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">{definicion?.titulo ?? 'Pantalla'}</h1>
          <p className="text-sm text-texto-secundario mt-1">{definicion?.descripcion}</p>
          <p className="mt-4 text-sm bg-info-fondo text-info rounded-md px-3 py-2">
            {definicion
              ? `Pantalla ${definicion.pantalla}. Se implementa en la Fase ${definicion.fase} del prototipo.`
              : 'Pantalla en construcción.'}
          </p>
        </div>
      </div>
    </section>
  )
}
