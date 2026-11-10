import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { BotonIcono } from '@/componentes/comunes/Boton'

const SELECTOR_ENFOCABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type AnchoModal = 'pequeno' | 'mediano' | 'grande'

const CLASES_ANCHO: Record<AnchoModal, string> = {
  pequeno: 'max-w-md',
  mediano: 'max-w-xl',
  grande: 'max-w-3xl',
}

interface PropiedadesModal {
  abierto: boolean
  titulo: string
  descripcion?: string
  onCerrar: () => void
  children?: ReactNode
  pie?: ReactNode
  ancho?: AnchoModal
}

export function Modal({ abierto, titulo, descripcion, onCerrar, children, pie, ancho = 'mediano' }: PropiedadesModal) {
  const contenedor = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idDescripcion = useId()
  const cerrarActual = useRef(onCerrar)
  cerrarActual.current = onCerrar

  useEffect(() => {
    if (!abierto) return
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const enfocables = contenedor.current?.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE)
    const primero = Array.from(enfocables ?? []).find((el) => !el.dataset.cerrarModal) ?? enfocables?.[0]
    primero?.focus()

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        cerrarActual.current()
        return
      }
      if (evento.key !== 'Tab' || !contenedor.current) return
      const lista = Array.from(contenedor.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE))
      if (lista.length === 0) return
      const inicio = lista[0]
      const fin = lista[lista.length - 1]
      if (evento.shiftKey && document.activeElement === inicio) {
        evento.preventDefault()
        fin?.focus()
      } else if (!evento.shiftKey && document.activeElement === fin) {
        evento.preventDefault()
        inicio?.focus()
      }
    }
    document.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = desbordeAnterior
      anterior?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-barra/60" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className={`relative w-full ${CLASES_ANCHO[ancho]} bg-superficie rounded-t-lg sm:rounded-lg border border-borde shadow-lg max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-borde">
          <div className="flex-1 min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-texto">{titulo}</h2>
            {descripcion && <p id={idDescripcion} className="text-sm text-texto-secundario mt-0.5">{descripcion}</p>}
          </div>
          <BotonIcono icono={X} etiqueta="Cerrar" onClick={onCerrar} data-cerrar-modal="si" className="-mr-2 -mt-1" />
        </div>
        {children && <div className="px-5 py-4 overflow-y-auto text-sm">{children}</div>}
        {pie && <div className="px-5 py-3 border-t border-borde flex flex-wrap justify-end gap-2">{pie}</div>}
      </div>
    </div>,
    document.body,
  )
}
