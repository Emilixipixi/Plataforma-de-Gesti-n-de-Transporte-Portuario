import type { DatosApp, Documento, Solicitud, Viaje } from '@/tipos/dominio'
import { obtener } from '@/servicios/repositorio'
import {
  esViajeAbierto,
  estadoFacturacionServicio,
  porcentajeCumplimiento,
  tieneIncidenciaAbierta,
} from '@/utilidades/calculos'

export function nombreCliente(datos: DatosApp, codigo: string | undefined): string {
  return obtener(datos, 'clientes', codigo)?.razonSocial ?? codigo ?? 'Sin cliente'
}

export function nombreLugar(datos: DatosApp, codigo: string | undefined): string {
  return obtener(datos, 'lugares', codigo)?.nombre ?? codigo ?? 'Sin lugar'
}

export function nombreUsuario(datos: DatosApp, codigo: string | undefined): string {
  return obtener(datos, 'usuarios', codigo)?.nombre ?? codigo ?? 'Sin usuario'
}

export function nombreTransportista(datos: DatosApp, codigo: string | undefined): string {
  return obtener(datos, 'transportistas', codigo)?.razonSocial ?? 'Sin asignar'
}

export function viajesDeCliente(datos: DatosApp, clienteCodigo: string): Viaje[] {
  return datos.viajes.filter((v) => v.clienteCodigo === clienteCodigo)
}

export function solicitudesDeCliente(datos: DatosApp, clienteCodigo: string): Solicitud[] {
  return datos.solicitudes.filter((s) => s.clienteCodigo === clienteCodigo)
}

export function documentosDeCliente(datos: DatosApp, clienteCodigo: string): Documento[] {
  const codigos = new Set(viajesDeCliente(datos, clienteCodigo).map((v) => v.codigo))
  return datos.documentos.filter((d) => codigos.has(d.viajeCodigo))
}

export interface ResumenCliente {
  viajesTotales: number
  viajesAbiertos: number
  finalizados: number
  cancelados: number
  conIncidencia: number
  solicitudesPendientes: number
  porFacturar: number
  valorServicios: number
  cumplimiento: number | null
}

export function resumenCliente(datos: DatosApp, clienteCodigo: string): ResumenCliente {
  const viajes = viajesDeCliente(datos, clienteCodigo)
  const finalizados = viajes.filter((v) => v.estado === 'finalizado')
  return {
    viajesTotales: viajes.length,
    viajesAbiertos: viajes.filter(esViajeAbierto).length,
    finalizados: finalizados.length,
    cancelados: viajes.filter((v) => v.estado === 'cancelado').length,
    conIncidencia: viajes.filter((v) => tieneIncidenciaAbierta(v.codigo, datos.incidencias)).length,
    solicitudesPendientes: solicitudesDeCliente(datos, clienteCodigo).filter((s) => s.estado === 'recibida' || s.estado === 'aceptada').length,
    porFacturar: finalizados.filter((v) => estadoFacturacionServicio(v, datos.facturas) === 'por_facturar').length,
    valorServicios: finalizados.reduce((suma, v) => suma + v.valorReferencial, 0),
    cumplimiento: porcentajeCumplimiento(viajes, datos.eventos).porcentaje,
  }
}
