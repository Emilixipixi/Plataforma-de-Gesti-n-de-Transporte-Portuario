import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma'
export type TamanoBoton = 'pequeno' | 'normal'

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario: 'bg-primario text-sobre-primario hover:bg-barra-hover border border-primario',
  secundario: 'bg-superficie text-texto border border-borde hover:bg-fondo',
  peligro: 'bg-peligro text-sobre-primario border border-peligro hover:bg-peligro/90',
  fantasma: 'bg-transparent text-texto-secundario border border-transparent hover:bg-fondo hover:text-texto',
}

const CLASES_TAMANO: Record<TamanoBoton, string> = {
  pequeno: 'h-8 px-2.5 text-xs gap-1.5',
  normal: 'h-9 px-3.5 text-sm gap-2',
}

export interface PropiedadesBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  icono?: ComponentType<LucideProps>
  motivoDeshabilitado?: string
  children?: ReactNode
}

export const Boton = forwardRef<HTMLButtonElement, PropiedadesBoton>(function Boton(
  { variante = 'secundario', tamano = 'normal', icono: Icono, motivoDeshabilitado, className = '', children, disabled, title, type = 'button', ...resto },
  referencia,
) {
  const deshabilitado = disabled || Boolean(motivoDeshabilitado)
  return (
    <button
      ref={referencia}
      type={type}
      disabled={deshabilitado}
      title={motivoDeshabilitado ?? title}
      aria-disabled={deshabilitado}
      className={`inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${CLASES_VARIANTE[variante]} ${CLASES_TAMANO[tamano]} ${className}`}
      {...resto}
    >
      {Icono && <Icono className={tamano === 'pequeno' ? 'size-3.5' : 'size-4'} aria-hidden="true" />}
      {children}
    </button>
  )
})

interface PropiedadesBotonIcono extends Omit<PropiedadesBoton, 'children' | 'icono'> {
  icono: ComponentType<LucideProps>
  etiqueta: string
}

export const BotonIcono = forwardRef<HTMLButtonElement, PropiedadesBotonIcono>(function BotonIcono(
  { icono: Icono, etiqueta, variante = 'fantasma', className = '', ...resto },
  referencia,
) {
  return (
    <Boton ref={referencia} variante={variante} aria-label={etiqueta} title={etiqueta} className={`px-0! w-9 ${className}`} {...resto}>
      <Icono className="size-4" aria-hidden="true" />
    </Boton>
  )
})
