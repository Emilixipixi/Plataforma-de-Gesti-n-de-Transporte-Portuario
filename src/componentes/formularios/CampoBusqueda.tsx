import { useEffect, useId, useState } from 'react'
import { Search, X } from 'lucide-react'

interface PropiedadesCampoBusqueda {
  valor: string
  onCambiar: (valor: string) => void
  marcador?: string
  etiqueta?: string
  className?: string
  esperaMs?: number
}

export function CampoBusqueda({ valor, onCambiar, marcador = 'Buscar', etiqueta = 'Buscar', className = '', esperaMs = 250 }: PropiedadesCampoBusqueda) {
  const id = useId()
  const [texto, establecerTexto] = useState(valor)

  useEffect(() => {
    establecerTexto(valor)
  }, [valor])

  useEffect(() => {
    if (texto === valor) return
    const temporizador = window.setTimeout(() => onCambiar(texto), esperaMs)
    return () => window.clearTimeout(temporizador)
  }, [texto, valor, onCambiar, esperaMs])

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-texto-secundario" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={texto}
        onChange={(e) => establecerTexto(e.target.value)}
        placeholder={marcador}
        className="h-9 w-full rounded-md border border-borde bg-superficie pl-8 pr-8 text-sm text-texto placeholder:text-texto-secundario [&::-webkit-search-cancel-button]:hidden"
      />
      {texto && (
        <button type="button" onClick={() => { establecerTexto(''); onCambiar('') }} className="absolute right-2 top-1/2 -translate-y-1/2 text-texto-secundario hover:text-texto" aria-label="Limpiar búsqueda">
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
