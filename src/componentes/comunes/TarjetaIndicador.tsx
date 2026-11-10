import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import type { LucideProps } from 'lucide-react'
import type { Tono } from '@/utilidades/constantes'

const COLOR_ICONO: Record<Tono, string> = {
  exito: 'text-exito bg-exito-fondo',
  pendiente: 'text-pendiente bg-pendiente-fondo',
  peligro: 'text-peligro bg-peligro-fondo',
  info: 'text-info bg-info-fondo',
  neutro: 'text-texto-secundario bg-fondo',
}

interface PropiedadesTarjetaIndicador {
  titulo: string
  valor: string | number
  detalle?: string
  icono?: ComponentType<LucideProps>
  tono?: Tono
  enlace?: string
}

export function TarjetaIndicador({ titulo, valor, detalle, icono: Icono, tono = 'neutro', enlace }: PropiedadesTarjetaIndicador) {
  const contenido = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-texto-secundario">{titulo}</p>
        <p className="mt-1 text-2xl font-semibold text-texto tabular-nums">{valor}</p>
        {detalle && <p className="mt-0.5 text-xs text-texto-secundario">{detalle}</p>}
      </div>
      {Icono && (
        <span className={`grid place-items-center size-8 rounded-md shrink-0 ${COLOR_ICONO[tono]}`}>
          <Icono className="size-4" aria-hidden="true" />
        </span>
      )}
    </div>
  )
  const clases = 'block bg-superficie border border-borde rounded-lg px-4 py-3'
  return enlace ? (
    <Link to={enlace} className={`${clases} hover:border-texto-secundario/40`}>{contenido}</Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}
