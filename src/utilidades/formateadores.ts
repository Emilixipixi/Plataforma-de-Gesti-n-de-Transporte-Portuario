import { LOCALE, MONEDA, OFFSET_ECUADOR_HORAS, ZONA_HORARIA } from '@/utilidades/constantes'
import { esFechaValida } from '@/utilidades/fechas'

export const SIN_DATO = 'Sin registrar'

const formatoFecha = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatoHora = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const formatoDiaSemana = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const formatoMoneda = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: MONEDA,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatoNumero = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatearFecha(iso: string | undefined | null): string {
  return esFechaValida(iso) ? formatoFecha.format(new Date(iso)) : SIN_DATO
}

export function formatearHora(iso: string | undefined | null): string {
  return esFechaValida(iso) ? formatoHora.format(new Date(iso)) : SIN_DATO
}

export function formatearFechaHora(iso: string | undefined | null): string {
  return esFechaValida(iso) ? `${formatoFecha.format(new Date(iso))} ${formatoHora.format(new Date(iso))}` : SIN_DATO
}

export function formatearDiaLargo(iso: string | Date): string {
  const texto = formatoDiaSemana.format(typeof iso === 'string' ? new Date(iso) : iso)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatearMoneda(valor: number): string {
  return formatoMoneda.format(valor)
}

export function formatearNumero(valor: number): string {
  return formatoNumero.format(valor)
}

export function formatearPorcentaje(valor: number | null): string {
  return valor === null ? SIN_DATO : `${Math.round(valor)} %`
}

export function formatearDuracion(minutos: number): string {
  const absoluto = Math.abs(minutos)
  const horas = Math.floor(absoluto / 60)
  const resto = absoluto % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

export function formatearDesvio(minutos: number | null): string {
  if (minutos === null) return SIN_DATO
  if (minutos === 0) return 'Sin desvío'
  return `${minutos > 0 ? '+' : '-'}${formatearDuracion(minutos)}`
}

export function aValorFechaHoraLocal(iso: string | undefined): string {
  if (!esFechaValida(iso)) return ''
  const fecha = new Date(iso)
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha)
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${valor('year')}-${valor('month')}-${valor('day')}T${valor('hour')}:${valor('minute')}`
}

export function desdeValorFechaHoraLocal(valor: string): string | undefined {
  if (!valor) return undefined
  const signo = OFFSET_ECUADOR_HORAS < 0 ? '-' : '+'
  const desplazamiento = `${signo}${String(Math.abs(OFFSET_ECUADOR_HORAS)).padStart(2, '0')}:00`
  const fecha = new Date(`${valor}:00${desplazamiento}`)
  return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString()
}
