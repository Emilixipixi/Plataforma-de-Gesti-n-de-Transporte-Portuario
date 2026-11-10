import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { RUTA_INICIO } from '@/rutas/definicionRutas'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'

export default function PaginaNoEncontrada() {
  return (
    <div className="bg-superficie border border-borde rounded-lg">
      <EstadoVacio
        icono={SearchX}
        titulo="Página no encontrada"
        descripcion="La dirección solicitada no existe en el prototipo."
        accion={<Link to={RUTA_INICIO} className="text-sm font-medium text-info underline underline-offset-2">Volver al dashboard</Link>}
      />
    </div>
  )
}
