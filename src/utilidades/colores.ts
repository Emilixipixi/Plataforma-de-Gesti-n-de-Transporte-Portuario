export type ColorTema =
  | 'grafico-1'
  | 'grafico-2'
  | 'grafico-3'
  | 'grafico-rejilla'
  | 'exito'
  | 'exito-fondo'
  | 'peligro'
  | 'peligro-fondo'
  | 'pendiente'
  | 'pendiente-fondo'
  | 'info'
  | 'info-fondo'
  | 'texto'
  | 'texto-secundario'
  | 'borde'
  | 'superficie'
  | 'fondo'
  | 'primario'
  | 'barra'
  | 'acento'

export function colorTema(nombre: ColorTema): string {
  if (typeof window === 'undefined') return 'currentColor'
  const valor = getComputedStyle(document.documentElement).getPropertyValue(`--color-${nombre}`).trim()
  return valor || 'currentColor'
}

export function rgbTema(nombre: ColorTema): [number, number, number] {
  const valor = colorTema(nombre).replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(valor)) return [0, 0, 0]
  return [0, 2, 4].map((i) => parseInt(valor.slice(i, i + 2), 16)) as [number, number, number]
}
