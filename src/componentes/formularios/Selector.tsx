import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Opcion } from '@/utilidades/constantes'

interface PropiedadesSelector extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  etiqueta: string
  opciones: readonly Opcion<string>[]
  textoTodos?: string
  ocultarEtiqueta?: boolean
  error?: string
  ayuda?: string
  requerido?: boolean
}

export const Selector = forwardRef<HTMLSelectElement, PropiedadesSelector>(function Selector(
  { etiqueta, opciones, textoTodos, ocultarEtiqueta = false, error, ayuda, requerido, className = '', id, ...resto },
  referencia,
) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={idCampo} className={ocultarEtiqueta ? 'sr-only' : 'text-xs font-medium text-texto-secundario'}>
        {etiqueta}
        {requerido && <span className="text-peligro" aria-hidden="true"> *</span>}
      </label>
      <div className="relative">
        <select
          ref={referencia}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-required={requerido || undefined}
          className={`h-9 w-full appearance-none rounded-md border bg-superficie pl-3 pr-8 text-sm text-texto ${error ? 'border-peligro' : 'border-borde'}`}
          {...resto}
        >
          {textoTodos !== undefined && <option value="">{textoTodos}</option>}
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-texto-secundario" aria-hidden="true" />
      </div>
      {error ? <p className="text-xs text-peligro">{error}</p> : ayuda ? <p className="text-xs text-texto-secundario">{ayuda}</p> : null}
    </div>
  )
})
