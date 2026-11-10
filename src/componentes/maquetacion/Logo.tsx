import { Anchor } from 'lucide-react'
import { NOMBRE_DESCRIPTIVO, NOMBRE_SISTEMA } from '@/utilidades/constantes'

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="grid place-items-center size-8 rounded-md bg-barra-hover border border-barra-borde shrink-0">
        <Anchor className="size-4.5 text-acento" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold tracking-wider text-sobre-primario leading-tight">{NOMBRE_SISTEMA}</span>
        {!compacto && <span className="block text-[11px] text-barra-texto-tenue leading-tight truncate">{NOMBRE_DESCRIPTIVO}</span>}
      </span>
    </div>
  )
}
