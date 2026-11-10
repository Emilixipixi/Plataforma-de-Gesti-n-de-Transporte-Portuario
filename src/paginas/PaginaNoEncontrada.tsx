import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RUTA_INICIO } from '@/rutas/definicionRutas'

export default function PaginaNoEncontrada() {
  return (
    <section className="bg-superficie border border-borde rounded-lg p-6 max-w-xl">
      <div className="flex items-start gap-3">
        <SearchX className="size-5 text-texto-secundario mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">Página no encontrada</h1>
          <p className="text-sm text-texto-secundario mt-1">La dirección solicitada no existe en el prototipo.</p>
          <Link to={RUTA_INICIO} className="inline-block mt-4 text-sm font-medium text-info underline underline-offset-2">
            Volver al dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
