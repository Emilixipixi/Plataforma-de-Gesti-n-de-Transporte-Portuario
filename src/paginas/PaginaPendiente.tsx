import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { buscarDefinicion } from '@/rutas/definicionRutas'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'

export default function PaginaPendiente() {
  const { pathname } = useLocation()
  const definicion = buscarDefinicion(pathname)?.definicion

  return (
    <>
      <EncabezadoPagina titulo={definicion?.titulo ?? 'Pantalla'} descripcion={definicion?.descripcion} />
      <div className="bg-superficie border border-borde rounded-lg">
        <EstadoVacio
          icono={Construction}
          titulo={definicion ? `Pantalla ${definicion.pantalla} en construcción` : 'Pantalla en construcción'}
          descripcion={definicion ? `Esta pantalla se implementa en la Fase ${definicion.fase} del prototipo.` : undefined}
        />
      </div>
    </>
  )
}
