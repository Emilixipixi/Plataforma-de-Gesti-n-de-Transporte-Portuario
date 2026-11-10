import type { ReactNode } from 'react'

interface PropiedadesEncabezadoPagina {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
  etiqueta?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, acciones, etiqueta }: PropiedadesEncabezadoPagina) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-texto">{titulo}</h1>
          {etiqueta}
        </div>
        {descripcion && <p className="text-sm text-texto-secundario mt-1">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2 shrink-0">{acciones}</div>}
    </div>
  )
}
