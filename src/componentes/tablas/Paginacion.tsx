import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BotonIcono } from '@/componentes/comunes/Boton'
import { TAMANOS_PAGINA } from '@/utilidades/constantes'

interface PropiedadesPaginacion {
  pagina: number
  tamano: number
  total: number
  onPagina: (pagina: number) => void
  onTamano: (tamano: number) => void
}

export function Paginacion({ pagina, tamano, total, onPagina, onTamano }: PropiedadesPaginacion) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamano))
  const desde = total === 0 ? 0 : (pagina - 1) * tamano + 1
  const hasta = Math.min(total, pagina * tamano)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-borde text-sm text-texto-secundario">
      <p>Mostrando {desde}–{hasta} de {total}</p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span>Filas</span>
          <select value={tamano} onChange={(e) => onTamano(Number(e.target.value))} className="h-8 rounded-md border border-borde bg-superficie px-2 text-sm text-texto">
            {TAMANOS_PAGINA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <span>Página {pagina} de {totalPaginas}</span>
        <div className="flex gap-1">
          <BotonIcono icono={ChevronLeft} etiqueta="Página anterior" variante="secundario" tamano="pequeno" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)} className="w-8" />
          <BotonIcono icono={ChevronRight} etiqueta="Página siguiente" variante="secundario" tamano="pequeno" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)} className="w-8" />
        </div>
      </div>
    </div>
  )
}
