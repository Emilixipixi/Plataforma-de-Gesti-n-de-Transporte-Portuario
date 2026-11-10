import type { ReactNode } from 'react'

interface PropiedadesPanel {
  titulo?: string
  descripcion?: string
  acciones?: ReactNode
  children: ReactNode
  className?: string
  sinRelleno?: boolean
}

export function Panel({ titulo, descripcion, acciones, children, className = '', sinRelleno = false }: PropiedadesPanel) {
  return (
    <section className={`bg-superficie border border-borde rounded-lg ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 border-b border-borde">
          <div>
            {titulo && <h2 className="text-sm font-semibold text-texto">{titulo}</h2>}
            {descripcion && <p className="text-xs text-texto-secundario mt-0.5">{descripcion}</p>}
          </div>
          {acciones}
        </header>
      )}
      <div className={sinRelleno ? '' : 'p-4'}>{children}</div>
    </section>
  )
}
