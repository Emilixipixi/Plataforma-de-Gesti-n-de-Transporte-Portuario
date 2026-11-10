import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { colorTema, type ColorTema } from '@/componentes/graficos/colores'

export interface DatoBarra {
  etiqueta: string
  valor: number
  detalle?: string
  enlace?: string
}

interface PropiedadesGraficoBarras {
  datos: readonly DatoBarra[]
  orientacion?: 'vertical' | 'horizontal'
  color?: ColorTema
  unidad?: string
  descripcion: string
  alto?: number
  formatoValor?: (valor: number) => string
  anchoEtiquetas?: number
}

function formatoCompacto(valor: number): string {
  return valor >= 1000 ? `$${Math.round(valor / 100) / 10}k` : `$${valor}`
}

function ContenidoTooltip({ active, payload, unidad, formatoValor }: Pick<TooltipContentProps<ValueType, NameType>, 'active' | 'payload'> & { unidad: string; formatoValor?: (valor: number) => string }) {
  const dato = payload?.[0]?.payload as DatoBarra | undefined
  if (!active || !dato) return null
  return (
    <div className="rounded-md border border-borde bg-superficie px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-texto">{dato.etiqueta}</p>
      <p className="text-texto-secundario tabular-nums">{formatoValor ? formatoValor(dato.valor) : `${dato.valor} ${unidad}`}</p>
      {dato.detalle && <p className="text-texto-secundario">{dato.detalle}</p>}
    </div>
  )
}

export function GraficoBarras({ datos, orientacion = 'vertical', color = 'grafico-1', unidad = 'viajes', descripcion, alto, formatoValor, anchoEtiquetas = 150 }: PropiedadesGraficoBarras) {
  const navegar = useNavigate()
  const colores = useMemo(() => ({ marca: colorTema(color), rejilla: colorTema('grafico-rejilla'), texto: colorTema('texto-secundario'), valor: colorTema('texto'), cursor: colorTema('fondo') }), [color])
  const horizontal = orientacion === 'horizontal'
  const altura = alto ?? (horizontal ? Math.max(160, datos.length * 40 + 24) : 220)
  const filas = datos.map((d) => ({ ...d }))
  const ejeTexto = { fill: colores.texto, fontSize: 12 }
  const formatoEje = (v: number) => (formatoValor ? formatoCompacto(v) : String(v))

  return (
    <figure aria-label={descripcion}>
      <div style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 18, right: horizontal ? (formatoValor ? 84 : 36) : 8, bottom: 0, left: horizontal ? 8 : -16 }} barCategoryGap="25%">
            <CartesianGrid stroke={colores.rejilla} strokeWidth={1} horizontal={!horizontal} vertical={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" allowDecimals={false} tick={ejeTexto} axisLine={false} tickLine={false} tickFormatter={formatoEje} />
                <YAxis type="category" dataKey="etiqueta" width={anchoEtiquetas} tick={ejeTexto} axisLine={false} tickLine={false} />
              </>
            ) : (
              <>
                <XAxis dataKey="etiqueta" tick={ejeTexto} axisLine={{ stroke: colores.rejilla }} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={ejeTexto} axisLine={false} tickLine={false} tickFormatter={formatoEje} width={formatoValor ? 64 : undefined} />
              </>
            )}
            <Tooltip cursor={{ fill: colores.cursor }} content={({ active, payload }) => <ContenidoTooltip active={active} payload={payload} unidad={unidad} formatoValor={formatoValor} />} />
            <Bar
              dataKey="valor"
              fill={colores.marca}
              maxBarSize={24}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              isAnimationActive={false}
              cursor={datos.some((d) => d.enlace) ? 'pointer' : undefined}
              onClick={(entrada) => {
                const enlace = (entrada as { payload?: DatoBarra }).payload?.enlace
                if (enlace) navegar(enlace)
              }}
            >
              <LabelList dataKey="valor" position={horizontal ? 'right' : 'top'} fill={colores.valor} fontSize={12} formatter={(v) => (formatoValor && typeof v === 'number' ? formatoValor(v) : String(v ?? ''))} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {descripcion}: {datos.map((d) => `${d.etiqueta} ${formatoValor ? formatoValor(d.valor) : d.valor}`).join(', ')}
      </figcaption>
    </figure>
  )
}
