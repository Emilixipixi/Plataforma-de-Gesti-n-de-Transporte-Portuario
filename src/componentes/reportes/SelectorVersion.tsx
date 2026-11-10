import { Eye, Lock } from 'lucide-react'

export type VersionReporte = 'interna' | 'compartible'

export function SelectorVersion({ version, onCambiar }: { version: VersionReporte; onCambiar: (v: VersionReporte) => void }) {
  return (
    <div className="flex rounded-md border border-borde overflow-hidden" role="group" aria-label="Versión del reporte">
      {([['interna', Lock, 'Vista interna'], ['compartible', Eye, 'Versión para el cliente']] as const).map(([valor, Icono, texto]) => (
        <button key={valor} type="button" aria-pressed={version === valor} onClick={() => onCambiar(valor)} className={`inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium whitespace-nowrap ${version === valor ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
          <Icono className="size-4" aria-hidden="true" />
          {texto}
        </button>
      ))}
    </div>
  )
}

export const NOTA_COMPARTIBLE = 'La versión para el cliente excluye cartera, pagos, valores, estado de facturación, responsables internos y observaciones internas.'
