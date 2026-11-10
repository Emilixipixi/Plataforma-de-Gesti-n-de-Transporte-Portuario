import { OFFSET_ECUADOR_HORAS } from '@/utilidades/constantes'

const MS_MINUTO = 60_000
const MS_HORA = 60 * MS_MINUTO
const MS_DIA = 24 * MS_HORA

export type FechaEntrada = string | Date

function aMilisegundos(fecha: FechaEntrada): number {
  return typeof fecha === 'string' ? new Date(fecha).getTime() : fecha.getTime()
}

export function esFechaValida(fecha: string | undefined | null): fecha is string {
  return typeof fecha === 'string' && fecha.length > 0 && !Number.isNaN(new Date(fecha).getTime())
}

export function claveDia(fecha: FechaEntrada): string {
  return new Date(aMilisegundos(fecha) + OFFSET_ECUADOR_HORAS * MS_HORA).toISOString().slice(0, 10)
}

function inicioDiaUtc(clave: string): number {
  const [anio, mes, dia] = clave.split('-').map(Number)
  return Date.UTC(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1)
}

export function diferenciaDias(desde: FechaEntrada, hasta: FechaEntrada): number {
  return Math.round((inicioDiaUtc(claveDia(hasta)) - inicioDiaUtc(claveDia(desde))) / MS_DIA)
}

export function minutosEntre(desde: FechaEntrada, hasta: FechaEntrada): number {
  return Math.round((aMilisegundos(hasta) - aMilisegundos(desde)) / MS_MINUTO)
}

export function esAnterior(a: FechaEntrada, b: FechaEntrada): boolean {
  return aMilisegundos(a) < aMilisegundos(b)
}

export function esMismoDia(a: FechaEntrada, b: FechaEntrada): boolean {
  return claveDia(a) === claveDia(b)
}

export function sumarDias(fecha: FechaEntrada, dias: number): string {
  return new Date(aMilisegundos(fecha) + dias * MS_DIA).toISOString()
}

export function sumarMinutos(fecha: FechaEntrada, minutos: number): string {
  return new Date(aMilisegundos(fecha) + minutos * MS_MINUTO).toISOString()
}

export function inicioDelDia(fecha: FechaEntrada): string {
  return new Date(inicioDiaUtc(claveDia(fecha)) - OFFSET_ECUADOR_HORAS * MS_HORA).toISOString()
}

export function finDelDia(fecha: FechaEntrada): string {
  return new Date(inicioDiaUtc(claveDia(fecha)) + MS_DIA - 1 - OFFSET_ECUADOR_HORAS * MS_HORA).toISOString()
}

export function intervalosSeSolapan(
  inicioA: FechaEntrada,
  finA: FechaEntrada,
  inicioB: FechaEntrada,
  finB: FechaEntrada,
): boolean {
  return aMilisegundos(inicioA) < aMilisegundos(finB) && aMilisegundos(inicioB) < aMilisegundos(finA)
}

export function ahoraIso(): string {
  return new Date().toISOString()
}

export function fechaDesdeClave(clave: string): Date {
  return new Date(inicioDiaUtc(clave))
}

export function sumarDiasAClave(clave: string, dias: number): string {
  return new Date(inicioDiaUtc(clave) + dias * MS_DIA).toISOString().slice(0, 10)
}

export function diaDeSemana(clave: string): number {
  const dia = fechaDesdeClave(clave).getUTCDay()
  return dia === 0 ? 7 : dia
}

export function inicioDeSemana(clave: string): string {
  return sumarDiasAClave(clave, 1 - diaDeSemana(clave))
}

export function inicioDeMes(clave: string): string {
  return `${clave.slice(0, 8)}01`
}

export function sumarMesesAClave(clave: string, meses: number): string {
  const fecha = fechaDesdeClave(inicioDeMes(clave))
  fecha.setUTCMonth(fecha.getUTCMonth() + meses)
  return fecha.toISOString().slice(0, 10)
}

export function esClaveValida(valor: string | null): valor is string {
  return valor !== null && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(fechaDesdeClave(valor).getTime())
}

export function isoDesdeClave(clave: string, hora = 12): string {
  return new Date(inicioDiaUtc(clave) + (hora - OFFSET_ECUADOR_HORAS) * MS_HORA).toISOString()
}
