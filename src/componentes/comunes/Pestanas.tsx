import { useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'

export interface Pestana {
  clave: string
  titulo: string
  contador?: number
  contenido: () => ReactNode
}

export function Pestanas({ pestanas, parametro = 'pestana' }: { pestanas: readonly Pestana[]; parametro?: string }) {
  const [parametros, establecerParametros] = useSearchParams()
  const primera = pestanas[0]
  const activa = pestanas.find((p) => p.clave === parametros.get(parametro)) ?? primera
  if (!activa) return null

  const elegir = (clave: string) =>
    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams()
        if (primera && clave !== primera.clave) nuevos.set(parametro, clave)
        for (const [nombre, valor] of actuales) if (nombre !== parametro && !nombre.includes('_')) nuevos.set(nombre, valor)
        return nuevos
      },
      { replace: true },
    )

  return (
    <div>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-borde mb-4">
        {pestanas.map((p) => {
          const seleccionada = p.clave === activa.clave
          return (
            <button
              key={p.clave}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => elegir(p.clave)}
              className={`relative px-3 py-2 text-sm whitespace-nowrap ${seleccionada ? 'text-texto font-medium' : 'text-texto-secundario hover:text-texto'}`}
            >
              {p.titulo}
              {p.contador !== undefined && (
                <span className="ml-1.5 rounded-full bg-fondo border border-borde px-1.5 text-xs text-texto-secundario">{p.contador}</span>
              )}
              {seleccionada && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-primario rounded-full" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <div role="tabpanel">{activa.contenido()}</div>
    </div>
  )
}
