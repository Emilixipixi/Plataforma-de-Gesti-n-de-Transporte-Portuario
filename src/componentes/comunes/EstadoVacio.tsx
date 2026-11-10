import type { ComponentType, ReactNode } from 'react'
import { Inbox, type LucideProps } from 'lucide-react'

interface PropiedadesEstadoVacio {
  titulo: string
  descripcion?: string
  icono?: ComponentType<LucideProps>
  accion?: ReactNode
}

export function EstadoVacio({ titulo, descripcion, icono: Icono = Inbox, accion }: PropiedadesEstadoVacio) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <Icono className="size-8 text-texto-secundario" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-texto">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-texto-secundario max-w-sm">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
