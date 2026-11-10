import type { ReactNode } from 'react'

export interface Dato {
  etiqueta: string
  valor: ReactNode
  ancho?: 'normal' | 'completo'
}

export function ListaDatos({ datos, columnas = 2 }: { datos: readonly Dato[]; columnas?: 1 | 2 | 3 }) {
  const clasesColumnas = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[columnas]
  return (
    <dl className={`grid gap-x-6 gap-y-3 ${clasesColumnas}`}>
      {datos.map((dato) => (
        <div key={dato.etiqueta} className={dato.ancho === 'completo' ? 'sm:col-span-full' : ''}>
          <dt className="text-xs text-texto-secundario">{dato.etiqueta}</dt>
          <dd className="text-sm text-texto mt-0.5 break-words">{dato.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
