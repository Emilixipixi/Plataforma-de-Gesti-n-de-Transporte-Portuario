import { useMemo } from 'react'
import type { Tono } from '@/utilidades/constantes'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import {
  esProximaAVencer,
  esViajeAbierto,
  estadoDeFactura,
  estadoFacturacionServicio,
  estaRetrasado,
  saldoDeFactura,
  tieneAsignacionCompleta,
} from '@/utilidades/calculos'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

export interface Alerta {
  id: string
  tono: Tono
  titulo: string
  descripcion: string
  ruta: string
}

export function usarAlertas(): Alerta[] {
  const { datos } = usarApp()
  const { perfil } = usarAutenticacion()

  return useMemo(() => {
    const ahora = new Date()
    const nombreCliente = (codigo: string) => datos.clientes.find((c) => c.codigo === codigo)?.razonSocial ?? codigo
    const alertas: Alerta[] = []

    if (perfil === 'operaciones') {
      for (const incidencia of datos.incidencias.filter((i) => i.estado === 'abierta')) {
        const tipo = datos.tiposIncidencia.find((t) => t.codigo === incidencia.tipoIncidenciaCodigo)?.nombre ?? 'Incidencia'
        alertas.push({ id: incidencia.codigo, tono: 'peligro', titulo: `${tipo} en ${incidencia.viajeCodigo}`, descripcion: incidencia.descripcion, ruta: `/viajes/${incidencia.viajeCodigo}` })
      }
      for (const viaje of datos.viajes.filter((v) => esViajeAbierto(v) && estaRetrasado(v, datos.eventos, ahora))) {
        alertas.push({ id: `retraso-${viaje.codigo}`, tono: 'peligro', titulo: `${viaje.codigo} retrasado`, descripcion: `Llegada comprometida superada · ${nombreCliente(viaje.clienteCodigo)}`, ruta: `/viajes/${viaje.codigo}` })
      }
      for (const viaje of datos.viajes.filter((v) => v.estado === 'solicitado' && !tieneAsignacionCompleta(v))) {
        alertas.push({ id: `asignacion-${viaje.codigo}`, tono: 'pendiente', titulo: `${viaje.codigo} sin asignación`, descripcion: `Falta asignar transportista, chofer o unidad · ${nombreCliente(viaje.clienteCodigo)}`, ruta: '/programacion' })
      }
      for (const solicitud of datos.solicitudes.filter((s) => s.estado === 'recibida')) {
        alertas.push({ id: solicitud.codigo, tono: 'info', titulo: `Solicitud ${solicitud.codigo} por revisar`, descripcion: nombreCliente(solicitud.clienteCodigo), ruta: '/solicitudes' })
      }
    }

    if (perfil === 'contabilidad') {
      const dias = datos.configuracion.diasAlertaVencimiento
      for (const factura of datos.facturas) {
        const saldo = saldoDeFactura(factura, datos.pagos)
        if (estadoDeFactura(factura, datos.pagos, ahora) === 'vencida') {
          alertas.push({ id: `vencida-${factura.codigo}`, tono: 'peligro', titulo: `${factura.codigo} vencida`, descripcion: `Saldo ${formatearMoneda(saldo)}, venció el ${formatearFecha(factura.fechaVencimiento)}.`, ruta: '/contabilidad/cartera' })
        } else if (esProximaAVencer(factura, datos.pagos, ahora, dias)) {
          alertas.push({ id: `proxima-${factura.codigo}`, tono: 'pendiente', titulo: `${factura.codigo} próxima a vencer`, descripcion: `Saldo ${formatearMoneda(saldo)}, vence el ${formatearFecha(factura.fechaVencimiento)}.`, ruta: '/contabilidad/cartera' })
        }
      }
      for (const pago of datos.pagos.filter((p) => p.estado === 'registrado')) {
        alertas.push({ id: pago.codigo, tono: 'info', titulo: `Pago ${pago.codigo} por validar`, descripcion: `${formatearMoneda(pago.valor)} para ${pago.facturaCodigo}.`, ruta: '/contabilidad/pagos' })
      }
      for (const viaje of datos.viajes.filter((v) => estadoFacturacionServicio(v, datos.facturas) === 'por_facturar')) {
        alertas.push({ id: `facturar-${viaje.codigo}`, tono: 'pendiente', titulo: `${viaje.codigo} por facturar`, descripcion: `${nombreCliente(viaje.clienteCodigo)} · ${formatearMoneda(viaje.valorReferencial)}`, ruta: '/contabilidad/por-facturar' })
      }
    }

    return alertas
  }, [datos, perfil])
}
