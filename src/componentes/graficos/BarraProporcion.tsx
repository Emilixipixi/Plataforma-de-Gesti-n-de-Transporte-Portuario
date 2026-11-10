import type { ColorTema } from '@/componentes/graficos/colores'

const CLASE_FONDO: Partial<Record<ColorTema, string>> = {
  'grafico-1': 'bg-grafico-1',
  'grafico-2': 'bg-grafico-2',
  'grafico-3': 'bg-grafico-3',
  exito: 'bg-exito',
  peligro: 'bg-peligro',
  pendiente: 'bg-pendiente',
  info: 'bg-info',
}

export interface SegmentoProporcion {
  etiqueta: string
  valor: number
  color: ColorTema
}

export function BarraProporcion({ segmentos, descripcion, unidad = 'viajes' }: { segmentos: readonly SegmentoProporcion[]; descripcion: string; unidad?: string }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0)
  const porcentaje = (v: number) => (total === 0 ? 0 : Math.round((v / total) * 100))
  return (
    <figure aria-label={descripcion}>
      {total === 0 ? (
        <div className="h-3 rounded-full bg-fondo border border-borde" />
      ) : (
        <div className="flex h-3 gap-0.5 rounded-full overflow-hidden" role="img" aria-label={segmentos.map((s) => `${s.etiqueta} ${porcentaje(s.valor)} %`).join(', ')}>
          {segmentos.filter((s) => s.valor > 0).map((s) => (
            <div key={s.etiqueta} className={`h-full first:rounded-l-full last:rounded-r-full ${CLASE_FONDO[s.color] ?? 'bg-info'}`} style={{ width: `${(s.valor / total) * 100}%` }} title={`${s.etiqueta}: ${s.valor} ${unidad}`} />
          ))}
        </div>
      )}
      <figcaption>
        <ul className="mt-3 space-y-1.5">
          {segmentos.map((s) => (
            <li key={s.etiqueta} className="flex items-center gap-2 text-sm">
              <span className={`size-2.5 rounded-sm shrink-0 ${CLASE_FONDO[s.color] ?? 'bg-info'}`} aria-hidden="true" />
              <span className="text-texto">{s.etiqueta}</span>
              <span className="ml-auto tabular-nums text-texto">{s.valor}</span>
              <span className="w-12 text-right tabular-nums text-texto-secundario">{porcentaje(s.valor)} %</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
