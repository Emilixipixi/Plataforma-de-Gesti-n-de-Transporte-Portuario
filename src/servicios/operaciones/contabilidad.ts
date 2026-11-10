import type { Evidencia, Factura, ModalidadCobro, Pago } from '@/tipos/dominio'
import { guardar, obtener } from '@/servicios/repositorio'
import { estadoFacturacionServicio, facturaDeViaje, redondear, saldoDeFactura, saldoDisponibleParaPago, siguienteCodigo } from '@/utilidades/calculos'
import { PREFIJOS } from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearMoneda } from '@/utilidades/formateadores'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

export interface EntradaRegistroFactura {
  clienteCodigo: string
  viajeCodigos: string[]
  referencia: string
  fechaEmision: string
  fechaVencimiento: string
  valor: number
  modalidadCobro: ModalidadCobro
}

const normalizar = (texto: string) => texto.trim().toUpperCase()

export function registrarFactura(entrada: EntradaRegistroFactura): Operacion<Factura> {
  return (datos, { usuarioCodigo, ahora }) => {
    const cliente = obtener(datos, 'clientes', entrada.clienteCodigo)
    if (!cliente) return fallo('Seleccione el cliente de la factura.')
    const codigos = Array.from(new Set(entrada.viajeCodigos))
    if (codigos.length === 0) return fallo('Seleccione al menos un servicio por facturar.')
    for (const codigo of codigos) {
      const viaje = obtener(datos, 'viajes', codigo)
      if (!viaje) return fallo(`El viaje ${codigo} no existe.`)
      if (viaje.clienteCodigo !== cliente.codigo) return fallo(`El viaje ${codigo} pertenece a otro cliente; solo se agrupan servicios del mismo cliente.`)
      if (viaje.estado !== 'finalizado') return fallo(`El viaje ${codigo} aún no está finalizado.`)
      if (estadoFacturacionServicio(viaje, datos.facturas) === 'facturado') return fallo(`El viaje ${codigo} ya figura en la factura ${facturaDeViaje(codigo, datos.facturas)?.codigo}.`)
    }
    const referencia = entrada.referencia.trim()
    if (referencia.length < 3) return fallo('Ingrese la referencia de la factura emitida.')
    if (datos.facturas.some((f) => normalizar(f.referencia) === normalizar(referencia))) return fallo(`La referencia ${referencia} ya está registrada en otra factura.`)
    const valor = redondear(entrada.valor)
    if (!(valor > 0)) return fallo('El valor de la factura debe ser mayor a cero.')
    if (claveDia(entrada.fechaEmision) > claveDia(ahora)) return fallo('La fecha de emisión no puede ser posterior a hoy.')
    if (claveDia(entrada.fechaVencimiento) < claveDia(entrada.fechaEmision)) return fallo('El vencimiento no puede ser anterior a la emisión.')
    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.factura)
    const factura: Factura = {
      codigo: generado.codigo,
      clienteCodigo: cliente.codigo,
      viajeCodigos: codigos,
      referencia,
      fechaEmision: entrada.fechaEmision,
      fechaVencimiento: entrada.fechaVencimiento,
      valor,
      modalidadCobro: entrada.modalidadCobro,
      creadoPor: usuarioCodigo,
    }
    return exito(
      { ...guardar(datos, 'facturas', factura), configuracion: generado.configuracion },
      [{ usuarioCodigo, accion: 'factura', entidad: 'factura', codigoEntidad: factura.codigo, descripcion: `Factura ${referencia} registrada por ${formatearMoneda(valor)} para ${codigos.join(', ')}.` }],
      factura,
    )
  }
}

export interface EntradaRegistroPago {
  facturaCodigo: string
  fecha: string
  valor: number
  referencia: string
  observacion: string
  comprobante?: Evidencia
}

export function registrarPago(entrada: EntradaRegistroPago): Operacion<Pago> {
  return (datos, { usuarioCodigo, ahora }) => {
    const factura = obtener(datos, 'facturas', entrada.facturaCodigo)
    if (!factura) return fallo('Seleccione la factura a la que corresponde el pago.')
    const disponible = saldoDisponibleParaPago(factura, datos.pagos)
    if (disponible <= 0) return fallo(`La factura ${factura.codigo} no tiene saldo disponible; revise los pagos por validar.`)
    const valor = redondear(entrada.valor)
    if (!(valor > 0)) return fallo('El valor del pago debe ser mayor a cero.')
    if (valor > disponible) return fallo(`El pago supera el saldo disponible de ${formatearMoneda(disponible)}.`)
    const referencia = entrada.referencia.trim()
    if (referencia.length < 3) return fallo('Ingrese la referencia del pago.')
    if (datos.pagos.some((p) => normalizar(p.referencia) === normalizar(referencia))) return fallo(`La referencia ${referencia} ya está registrada en otro pago.`)
    if (claveDia(entrada.fecha) > claveDia(ahora)) return fallo('La fecha del pago no puede ser posterior a hoy.')
    if (claveDia(entrada.fecha) < claveDia(factura.fechaEmision)) return fallo('La fecha del pago no puede ser anterior a la emisión de la factura.')
    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.pago)
    const observacion = entrada.observacion.trim()
    const pago: Pago = {
      codigo: generado.codigo,
      facturaCodigo: factura.codigo,
      fecha: entrada.fecha,
      valor,
      referencia,
      estado: 'registrado',
      ...(observacion ? { observacion } : {}),
      ...(entrada.comprobante ? { comprobante: entrada.comprobante } : {}),
      registradoPor: usuarioCodigo,
    }
    const tipo = valor === disponible && disponible === saldoDeFactura(factura, datos.pagos) ? 'cancelación total' : 'abono'
    const textoComprobante = pago.comprobante ? ` Comprobante: ${pago.comprobante.nombre}.` : ''
    return exito(
      { ...guardar(datos, 'pagos', pago), configuracion: generado.configuracion },
      [{ usuarioCodigo, accion: 'pago', entidad: 'pago', codigoEntidad: pago.codigo, descripcion: `Pago ${referencia} (${tipo}) registrado por ${formatearMoneda(valor)} para ${factura.codigo}; pendiente de validación.${textoComprobante}` }],
      pago,
    )
  }
}

export function cambiarComprobantePago(pagoCodigo: string, comprobante: Evidencia | undefined): Operacion<Pago> {
  return (datos, { usuarioCodigo }) => {
    const pago = obtener(datos, 'pagos', pagoCodigo)
    if (!pago) return fallo(`El pago ${pagoCodigo} no existe.`)
    if (pago.estado === 'validado') return fallo(`El pago ${pago.codigo} ya fue validado; su comprobante no se modifica.`)
    const { comprobante: anterior, ...resto } = pago
    const actualizado: Pago = comprobante ? { ...resto, comprobante } : resto
    const descripcion = comprobante
      ? `Comprobante del pago ${pago.referencia} ${anterior ? `reemplazado: ${anterior.nombre} por ${comprobante.nombre}` : `agregado: ${comprobante.nombre}`}.`
      : `Comprobante del pago ${pago.referencia} eliminado${anterior ? `: ${anterior.nombre}` : ''}.`
    return exito(guardar(datos, 'pagos', actualizado), [{ usuarioCodigo, accion: 'pago', entidad: 'pago', codigoEntidad: pago.codigo, descripcion }], actualizado)
  }
}

export interface ResultadoValidacion {
  pago: Pago
  saldo: number
  cobrada: boolean
}

export function validarPago(pagoCodigo: string): Operacion<ResultadoValidacion> {
  return (datos, { usuarioCodigo, ahora }) => {
    const pago = obtener(datos, 'pagos', pagoCodigo)
    if (!pago) return fallo(`El pago ${pagoCodigo} no existe.`)
    if (pago.estado === 'validado') return fallo(`El pago ${pago.codigo} ya fue validado.`)
    const factura = obtener(datos, 'facturas', pago.facturaCodigo)
    if (!factura) return fallo(`La factura ${pago.facturaCodigo} no existe.`)
    if (pago.valor > saldoDeFactura(factura, datos.pagos)) return fallo('El pago supera el saldo actual de la factura.')
    const validado: Pago = { ...pago, estado: 'validado', validadorCodigo: usuarioCodigo, fechaValidacion: ahora }
    const nuevos = guardar(datos, 'pagos', validado)
    const saldo = saldoDeFactura(factura, nuevos.pagos)
    const cobrada = saldo === 0
    const actividad = [
      { usuarioCodigo, accion: 'validacion_pago' as const, entidad: 'pago' as const, codigoEntidad: pago.codigo, descripcion: `Pago ${pago.referencia} validado; saldo de ${factura.codigo}: ${formatearMoneda(saldo)}.` },
      ...(cobrada ? [{ usuarioCodigo, accion: 'cambio_estado' as const, entidad: 'factura' as const, codigoEntidad: factura.codigo, descripcion: `Factura ${factura.referencia} cobrada con saldo cero.` }] : []),
    ]
    return exito(nuevos, actividad, { pago: validado, saldo, cobrada })
  }
}
