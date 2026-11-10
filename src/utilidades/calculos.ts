import type {
  Configuracion,
  EstadoFactura,
  EstadoServicio,
  EstadoViaje,
  Evento,
  Factura,
  Incidencia,
  Modalidad,
  Pago,
  TipoEvento,
  Viaje,
} from '@/tipos/dominio'
import {
  DIGITOS_CODIGO,
  HITOS,
  HITO_ENTREGA,
  HITO_INICIO,
  HITO_REQUERIDO_PARA_CIERRE,
  SECUENCIA_HITOS,
  type CodigoHito,
  type Prefijo,
} from '@/utilidades/constantes'
import { diferenciaDias, esAnterior, esFechaValida, intervalosSeSolapan, minutosEntre } from '@/utilidades/fechas'

const ESTADOS_ABIERTOS: readonly EstadoViaje[] = ['solicitado', 'programado', 'en_ejecucion', 'entregado_pendiente_devolucion']
const ESTADOS_CON_RECURSOS_OCUPADOS: readonly EstadoViaje[] = ['programado', 'en_ejecucion', 'entregado_pendiente_devolucion']

export function esViajeAbierto(viaje: Viaje): boolean {
  return ESTADOS_ABIERTOS.includes(viaje.estado)
}

export function desvioEnMinutos(prevista: string | undefined, real: string | undefined): number | null {
  if (!esFechaValida(prevista) || !esFechaValida(real)) return null
  return minutosEntre(prevista, real)
}

export function eventosDeViaje(viajeCodigo: string, eventos: readonly Evento[]): Evento[] {
  return eventos
    .filter((evento) => evento.viajeCodigo === viajeCodigo)
    .sort((a, b) => (a.horaReal ?? a.horaPrevista ?? '').localeCompare(b.horaReal ?? b.horaPrevista ?? ''))
}

export function ultimoEvento(viajeCodigo: string, eventos: readonly Evento[]): Evento | undefined {
  return eventosDeViaje(viajeCodigo, eventos).filter((evento) => evento.horaReal).at(-1)
}

export function hitoDeCompromiso(modalidad: Modalidad): CodigoHito {
  return modalidad === 'exportacion' ? HITOS.entregaEnPuerto : HITOS.llegadaCliente
}

export function llegadaRealDeViaje(viaje: Viaje, eventos: readonly Evento[]): string | undefined {
  const hito = hitoDeCompromiso(viaje.modalidad)
  const evento = eventos.find((e) => e.viajeCodigo === viaje.codigo && e.tipoEventoCodigo === hito && e.horaReal)
  return evento?.horaReal ?? viaje.llegadaReal
}

export function desvioDeLlegada(viaje: Viaje, eventos: readonly Evento[]): number | null {
  return desvioEnMinutos(viaje.llegadaPrevista, llegadaRealDeViaje(viaje, eventos))
}

export function estaRetrasado(viaje: Viaje, eventos: readonly Evento[], ahora: string | Date): boolean {
  if (viaje.estado === 'cancelado' || viaje.estado === 'solicitado') return false
  if (!esFechaValida(viaje.llegadaPrevista)) return false
  const real = llegadaRealDeViaje(viaje, eventos)
  if (esFechaValida(real)) return esAnterior(viaje.llegadaPrevista, real)
  if (viaje.estado === 'finalizado') return false
  return esAnterior(viaje.llegadaPrevista, ahora)
}

export interface ResultadoCumplimiento {
  aTiempo: number
  retrasadas: number
  medidas: number
  porcentaje: number | null
}

export function porcentajeCumplimiento(viajes: readonly Viaje[], eventos: readonly Evento[]): ResultadoCumplimiento {
  let aTiempo = 0
  let medidas = 0
  for (const viaje of viajes) {
    const desvio = desvioDeLlegada(viaje, eventos)
    if (desvio === null) continue
    medidas += 1
    if (desvio <= 0) aTiempo += 1
  }
  return {
    aTiempo,
    retrasadas: medidas - aTiempo,
    medidas,
    porcentaje: medidas === 0 ? null : (aTiempo / medidas) * 100,
  }
}

export function secuenciaDeHitos(modalidad: Modalidad, tiposEvento: readonly TipoEvento[]): TipoEvento[] {
  return SECUENCIA_HITOS[modalidad]
    .map((codigo) => tiposEvento.find((tipo) => tipo.codigo === codigo))
    .filter((tipo): tipo is TipoEvento => tipo !== undefined)
}

export function hitosRegistrados(viaje: Viaje, eventos: readonly Evento[]): Set<string> {
  return new Set(
    eventos.filter((e) => e.viajeCodigo === viaje.codigo && e.horaReal).map((e) => e.tipoEventoCodigo),
  )
}

export function hitosPendientes(viaje: Viaje, eventos: readonly Evento[]): CodigoHito[] {
  const registrados = hitosRegistrados(viaje, eventos)
  return SECUENCIA_HITOS[viaje.modalidad].filter((codigo) => !registrados.has(codigo))
}

export function siguienteHito(viaje: Viaje, eventos: readonly Evento[]): CodigoHito | undefined {
  return hitosPendientes(viaje, eventos).find((codigo) => codigo !== HITOS.cierre)
}

export function estadoSiguienteTrasEvento(viaje: Viaje, tipoEventoCodigo: string): EstadoViaje | null {
  if (viaje.estado === 'cancelado' || viaje.estado === 'finalizado') return null
  if (!SECUENCIA_HITOS[viaje.modalidad].includes(tipoEventoCodigo as CodigoHito)) return null
  if (tipoEventoCodigo === HITOS.cierre) return null
  if (viaje.modalidad === 'importacion_contenedorizada' && tipoEventoCodigo === HITO_ENTREGA[viaje.modalidad]) {
    return 'entregado_pendiente_devolucion'
  }
  if (viaje.estado === 'solicitado' || viaje.estado === 'programado') return 'en_ejecucion'
  return null
}

export function esHitoDeInicio(viaje: Viaje, tipoEventoCodigo: string): boolean {
  return HITO_INICIO[viaje.modalidad] === tipoEventoCodigo
}

export function tieneAsignacionCompleta(viaje: Viaje): boolean {
  return Boolean(
    viaje.transportistaCodigo &&
      viaje.choferCodigo &&
      viaje.unidadCodigo &&
      esFechaValida(viaje.salidaPrevista) &&
      esFechaValida(viaje.llegadaPrevista),
  )
}

export interface Solapamiento {
  viajeCodigo: string
  recurso: 'chofer' | 'unidad'
  recursoCodigo: string
}

function finPrevisto(viaje: Viaje): string | undefined {
  if (esFechaValida(viaje.cierrePrevisto)) return viaje.cierrePrevisto
  if (esFechaValida(viaje.llegadaPrevista)) return viaje.llegadaPrevista
  return undefined
}

export function hayAdvertenciaSolapamiento(viaje: Viaje, viajes: readonly Viaje[]): Solapamiento[] {
  const inicio = viaje.salidaPrevista
  const fin = finPrevisto(viaje)
  if (!esFechaValida(inicio) || !fin) return []
  const resultado: Solapamiento[] = []
  for (const otro of viajes) {
    if (otro.codigo === viaje.codigo || !ESTADOS_CON_RECURSOS_OCUPADOS.includes(otro.estado)) continue
    const inicioOtro = otro.salidaPrevista
    const finOtro = finPrevisto(otro)
    if (!esFechaValida(inicioOtro) || !finOtro) continue
    if (!intervalosSeSolapan(inicio, fin, inicioOtro, finOtro)) continue
    if (viaje.choferCodigo && viaje.choferCodigo === otro.choferCodigo) {
      resultado.push({ viajeCodigo: otro.codigo, recurso: 'chofer', recursoCodigo: viaje.choferCodigo })
    }
    if (viaje.unidadCodigo && viaje.unidadCodigo === otro.unidadCodigo) {
      resultado.push({ viajeCodigo: otro.codigo, recurso: 'unidad', recursoCodigo: viaje.unidadCodigo })
    }
  }
  return resultado
}

export function incidenciasAbiertas(viajeCodigo: string, incidencias: readonly Incidencia[]): Incidencia[] {
  return incidencias.filter((i) => i.viajeCodigo === viajeCodigo && i.estado === 'abierta')
}

export function tieneIncidenciaAbierta(viajeCodigo: string, incidencias: readonly Incidencia[]): boolean {
  return incidenciasAbiertas(viajeCodigo, incidencias).length > 0
}

export interface EvaluacionCierre {
  permitido: boolean
  requiereObservacion: boolean
  motivos: string[]
  hitoRequerido: CodigoHito
}

export function puedeFinalizar(
  viaje: Viaje,
  eventos: readonly Evento[],
  incidencias: readonly Incidencia[],
  observacionCierre = '',
): EvaluacionCierre {
  const hitoRequerido = HITO_REQUERIDO_PARA_CIERRE[viaje.modalidad]
  const motivos: string[] = []
  if (viaje.estado === 'finalizado') motivos.push('El viaje ya está finalizado.')
  if (viaje.estado === 'cancelado') motivos.push('Un viaje cancelado no puede finalizarse.')
  if (!hitosRegistrados(viaje, eventos).has(hitoRequerido)) {
    motivos.push(
      viaje.modalidad === 'importacion_contenedorizada'
        ? 'Falta registrar la devolución del contenedor.'
        : viaje.modalidad === 'importacion_suelta'
          ? 'Falta registrar la entrega confirmada.'
          : 'Falta registrar la entrega en puerto.',
    )
  }
  const requiereObservacion = tieneIncidenciaAbierta(viaje.codigo, incidencias)
  if (requiereObservacion && observacionCierre.trim().length === 0) {
    motivos.push('Hay incidencias abiertas: resuélvalas o documente una observación de cierre.')
  }
  return { permitido: motivos.length === 0, requiereObservacion, motivos, hitoRequerido }
}

export function facturaDeViaje(viajeCodigo: string, facturas: readonly Factura[]): Factura | undefined {
  return facturas.find((factura) => factura.viajeCodigos.includes(viajeCodigo))
}

export function estadoFacturacionServicio(viaje: Viaje, facturas: readonly Factura[]): EstadoServicio | null {
  if (viaje.estado !== 'finalizado') return null
  return facturaDeViaje(viaje.codigo, facturas) ? 'facturado' : 'por_facturar'
}

export function pagosDeFactura(facturaCodigo: string, pagos: readonly Pago[]): Pago[] {
  return pagos.filter((pago) => pago.facturaCodigo === facturaCodigo)
}

export function totalValidado(factura: Factura, pagos: readonly Pago[]): number {
  return redondear(
    pagosDeFactura(factura.codigo, pagos)
      .filter((pago) => pago.estado === 'validado')
      .reduce((suma, pago) => suma + pago.valor, 0),
  )
}

export function totalRegistradoSinValidar(factura: Factura, pagos: readonly Pago[]): number {
  return redondear(
    pagosDeFactura(factura.codigo, pagos)
      .filter((pago) => pago.estado === 'registrado')
      .reduce((suma, pago) => suma + pago.valor, 0),
  )
}

export function saldoDeFactura(factura: Factura, pagos: readonly Pago[]): number {
  return Math.max(0, redondear(factura.valor - totalValidado(factura, pagos)))
}

export function diasParaVencer(factura: Factura, hoy: string | Date): number {
  return diferenciaDias(hoy, factura.fechaVencimiento)
}

export function estadoDeFactura(factura: Factura, pagos: readonly Pago[], hoy: string | Date): EstadoFactura {
  if (saldoDeFactura(factura, pagos) === 0) return 'cobrada'
  if (diasParaVencer(factura, hoy) < 0) return 'vencida'
  return 'pendiente_parcial'
}

export function esProximaAVencer(factura: Factura, pagos: readonly Pago[], hoy: string | Date, dias: number): boolean {
  if (saldoDeFactura(factura, pagos) === 0) return false
  const restantes = diasParaVencer(factura, hoy)
  return restantes >= 0 && restantes <= dias
}

export function saldoDisponibleParaPago(factura: Factura, pagos: readonly Pago[]): number {
  return Math.max(0, redondear(saldoDeFactura(factura, pagos) - totalRegistradoSinValidar(factura, pagos)))
}

export function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}

export function formatearCodigo(prefijo: Prefijo | string, numero: number): string {
  return `${prefijo}-${String(numero).padStart(DIGITOS_CODIGO, '0')}`
}

export interface CodigoGenerado {
  codigo: string
  configuracion: Configuracion
}

export function siguienteCodigo(configuracion: Configuracion, prefijo: Prefijo | string): CodigoGenerado {
  const siguiente = (configuracion.contadores[prefijo] ?? 0) + 1
  return {
    codigo: formatearCodigo(prefijo, siguiente),
    configuracion: { ...configuracion, contadores: { ...configuracion.contadores, [prefijo]: siguiente } },
  }
}
