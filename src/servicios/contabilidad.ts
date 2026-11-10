import type { DatosApp, EstadoFactura, Factura, Pago, Viaje } from '@/tipos/dominio'
import { obtener } from '@/servicios/repositorio'
import {
  diasParaVencer,
  esProximaAVencer,
  estadoDeFactura,
  estadoFacturacionServicio,
  pagosDeFactura,
  redondear,
  saldoDeFactura,
  saldoDisponibleParaPago,
  totalRegistradoSinValidar,
  totalValidado,
} from '@/utilidades/calculos'
import { claveDia } from '@/utilidades/fechas'

export const DIAS_CREDITO_PREDETERMINADOS = 30
export const DIAS_CONTRA_FACTURA_PREDETERMINADOS = 8

export interface ResumenFactura {
  factura: Factura
  clienteNombre: string
  validado: number
  porValidar: number
  saldo: number
  disponibleParaPago: number
  estado: EstadoFactura
  proximaAVencer: boolean
  diasParaVencer: number
  pagos: Pago[]
}

export function resumenFactura(datos: DatosApp, factura: Factura, hoy: string | Date): ResumenFactura {
  const estado = estadoDeFactura(factura, datos.pagos, hoy)
  return {
    factura,
    clienteNombre: obtener(datos, 'clientes', factura.clienteCodigo)?.razonSocial ?? factura.clienteCodigo,
    validado: totalValidado(factura, datos.pagos),
    porValidar: totalRegistradoSinValidar(factura, datos.pagos),
    saldo: saldoDeFactura(factura, datos.pagos),
    disponibleParaPago: saldoDisponibleParaPago(factura, datos.pagos),
    estado,
    proximaAVencer: esProximaAVencer(factura, datos.pagos, hoy, datos.configuracion.diasAlertaVencimiento),
    diasParaVencer: diasParaVencer(factura, hoy),
    pagos: pagosDeFactura(factura.codigo, datos.pagos).sort((a, b) => b.fecha.localeCompare(a.fecha)),
  }
}

export function resumenesDeFacturas(datos: DatosApp, hoy: string | Date): ResumenFactura[] {
  return datos.facturas.map((f) => resumenFactura(datos, f, hoy))
}

export function textoVencimiento(resumen: Pick<ResumenFactura, 'estado' | 'diasParaVencer'>): string {
  if (resumen.estado === 'cobrada') return 'Sin saldo pendiente'
  const dias = resumen.diasParaVencer
  if (dias < 0) return `Vencida hace ${-dias} ${dias === -1 ? 'día' : 'días'}`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function cumpleFiltroEstado(resumen: ResumenFactura, filtro: string): boolean {
  if (!filtro) return true
  if (filtro === 'proxima') return resumen.proximaAVencer
  if (filtro === 'abiertas') return resumen.saldo > 0
  return resumen.estado === filtro
}

export function serviciosPorFacturar(datos: DatosApp): Viaje[] {
  return datos.viajes
    .filter((v) => estadoFacturacionServicio(v, datos.facturas) === 'por_facturar')
    .sort((a, b) => (a.cierreReal ?? '').localeCompare(b.cierreReal ?? ''))
}

export function descripcionServicio(datos: DatosApp, viaje: Viaje): string {
  const origen = obtener(datos, 'lugares', viaje.origenCodigo)?.nombre ?? viaje.origenCodigo
  const destino = obtener(datos, 'lugares', viaje.destinoCodigo)?.nombre ?? viaje.destinoCodigo
  const contenedor = viaje.carga.contenedor?.numero ? ` · ${viaje.carga.contenedor.numero}` : ''
  return `Transporte ${origen} - ${destino}${contenedor}`
}

export interface GrupoPorFacturar {
  clienteCodigo: string
  clienteNombre: string
  viajes: Viaje[]
  total: number
  cierreMasAntiguo?: string
}

export function agruparPorCliente(datos: DatosApp, viajes: readonly Viaje[]): GrupoPorFacturar[] {
  const grupos = new Map<string, Viaje[]>()
  for (const viaje of viajes) grupos.set(viaje.clienteCodigo, [...(grupos.get(viaje.clienteCodigo) ?? []), viaje])
  return Array.from(grupos.entries())
    .map(([clienteCodigo, lista]) => ({
      clienteCodigo,
      clienteNombre: obtener(datos, 'clientes', clienteCodigo)?.razonSocial ?? clienteCodigo,
      viajes: lista,
      total: redondear(lista.reduce((s, v) => s + v.valorReferencial, 0)),
      cierreMasAntiguo: lista.map((v) => v.cierreReal).filter((c): c is string => Boolean(c)).sort()[0],
    }))
    .sort((a, b) => b.total - a.total)
}

export const TRAMOS_ANTIGUEDAD = [
  { clave: 'por_vencer', etiqueta: 'Por vencer', corta: 'Por vencer' },
  { clave: 'hasta_30', etiqueta: 'Vencida 1 a 30 días', corta: '1-30 d' },
  { clave: 'hasta_60', etiqueta: 'Vencida 31 a 60 días', corta: '31-60 d' },
  { clave: 'mas_60', etiqueta: 'Vencida más de 60 días', corta: '+60 d' },
] as const
export type TramoAntiguedad = (typeof TRAMOS_ANTIGUEDAD)[number]['clave']

export function tramoDeAntiguedad(diasParaVencer: number): TramoAntiguedad {
  if (diasParaVencer >= 0) return 'por_vencer'
  if (diasParaVencer >= -30) return 'hasta_30'
  if (diasParaVencer >= -60) return 'hasta_60'
  return 'mas_60'
}

export interface ResumenCartera {
  porFacturar: { cantidad: number; valor: number }
  abiertas: number
  carteraPendiente: number
  vencida: { cantidad: number; saldo: number }
  proxima: { cantidad: number; saldo: number }
  porValidar: { cantidad: number; valor: number }
  antiguedad: { clave: TramoAntiguedad; etiqueta: string; corta: string; saldo: number; cantidad: number }[]
}

export function resumenCartera(datos: DatosApp, hoy: string | Date): ResumenCartera {
  const pendientes = serviciosPorFacturar(datos)
  const abiertas = resumenesDeFacturas(datos, hoy).filter((r) => r.saldo > 0)
  const sumar = (lista: readonly ResumenFactura[]) => redondear(lista.reduce((s, r) => s + r.saldo, 0))
  const vencidas = abiertas.filter((r) => r.estado === 'vencida')
  const proximas = abiertas.filter((r) => r.proximaAVencer)
  const registrados = datos.pagos.filter((p) => p.estado === 'registrado')
  return {
    porFacturar: { cantidad: pendientes.length, valor: redondear(pendientes.reduce((s, v) => s + v.valorReferencial, 0)) },
    abiertas: abiertas.length,
    carteraPendiente: sumar(abiertas),
    vencida: { cantidad: vencidas.length, saldo: sumar(vencidas) },
    proxima: { cantidad: proximas.length, saldo: sumar(proximas) },
    porValidar: { cantidad: registrados.length, valor: redondear(registrados.reduce((s, p) => s + p.valor, 0)) },
    antiguedad: TRAMOS_ANTIGUEDAD.map((t) => {
      const delTramo = abiertas.filter((r) => tramoDeAntiguedad(r.diasParaVencer) === t.clave)
      return { clave: t.clave, etiqueta: t.etiqueta, corta: t.corta, saldo: sumar(delTramo), cantidad: delTramo.length }
    }),
  }
}

export interface CarteraCliente {
  clienteCodigo: string
  clienteNombre: string
  facturasAbiertas: number
  saldo: number
  vencido: number
  porValidar: number
  proximoVencimiento?: string
}

export function carteraPorCliente(datos: DatosApp, hoy: string | Date): CarteraCliente[] {
  const abiertas = resumenesDeFacturas(datos, hoy).filter((r) => r.saldo > 0)
  const codigos = Array.from(new Set(abiertas.map((r) => r.factura.clienteCodigo)))
  return codigos
    .map((clienteCodigo) => {
      const propias = abiertas.filter((r) => r.factura.clienteCodigo === clienteCodigo)
      return {
        clienteCodigo,
        clienteNombre: propias[0]?.clienteNombre ?? clienteCodigo,
        facturasAbiertas: propias.length,
        saldo: redondear(propias.reduce((s, r) => s + r.saldo, 0)),
        vencido: redondear(propias.filter((r) => r.estado === 'vencida').reduce((s, r) => s + r.saldo, 0)),
        porValidar: redondear(propias.reduce((s, r) => s + r.porValidar, 0)),
        proximoVencimiento: propias.filter((r) => r.estado !== 'vencida').map((r) => r.factura.fechaVencimiento).sort()[0],
      }
    })
    .sort((a, b) => b.saldo - a.saldo)
}

export interface MovimientoPeriodo {
  facturado: number
  facturas: number
  cobrado: number
  pagos: number
}

export function movimientoDelPeriodo(datos: DatosApp, desde: string, hasta: string): MovimientoPeriodo {
  const enRango = (iso: string) => {
    const clave = claveDia(iso)
    return clave >= desde && clave <= hasta
  }
  const facturas = datos.facturas.filter((f) => enRango(f.fechaEmision))
  const pagos = datos.pagos.filter((p) => p.estado === 'validado' && enRango(p.fecha))
  return {
    facturado: redondear(facturas.reduce((s, f) => s + f.valor, 0)),
    facturas: facturas.length,
    cobrado: redondear(pagos.reduce((s, p) => s + p.valor, 0)),
    pagos: pagos.length,
  }
}
