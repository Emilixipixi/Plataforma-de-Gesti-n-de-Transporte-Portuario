import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Banknote, FileCheck2, Save } from 'lucide-react'
import { MODALIDADES_COBRO, type Evidencia, type Factura, type ModalidadCobro, type Pago } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { Modal } from '@/componentes/modales/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniaEstadoFactura } from '@/componentes/comunes/Insignia'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { AreaTexto, CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { CampoEvidencias } from '@/componentes/viajes/ModalesSeguimiento'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente } from '@/servicios/consultas'
import {
  DIAS_CONTRA_FACTURA_PREDETERMINADOS,
  DIAS_CREDITO_PREDETERMINADOS,
  descripcionServicio,
  resumenFactura,
  serviciosPorFacturar,
  textoVencimiento,
} from '@/servicios/contabilidad'
import { cambiarComprobantePago, registrarFactura, registrarPago, validarPago } from '@/servicios/operaciones/contabilidad'
import { redondear, saldoDeFactura, saldoDisponibleParaPago } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD_COBRO, ETIQUETAS_MODALIDAD_CORTA, opcionesDe } from '@/utilidades/constantes'
import { claveDia, isoDesdeClave, sumarDiasAClave } from '@/utilidades/fechas'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'
import { esquemaFactura, esquemaPago, type EntradaFactura, type EntradaPago } from '@/utilidades/validadores'

const diasPorModalidad = (modalidad: ModalidadCobro) => (modalidad === 'credito' ? DIAS_CREDITO_PREDETERMINADOS : DIAS_CONTRA_FACTURA_PREDETERMINADOS)

interface PropiedadesModalFactura {
  abierto: boolean
  onCerrar: () => void
  clienteInicial?: string
  viajesIniciales?: readonly string[]
  onRegistrada?: (factura: Factura) => void
}

export function ModalRegistrarFactura({ abierto, onCerrar, clienteInicial, viajesIniciales, onRegistrada }: PropiedadesModalFactura) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const pendientes = useMemo(() => serviciosPorFacturar(datos), [datos])
  const clientesConPendientes = useMemo(() => Array.from(new Set(pendientes.map((v) => v.clienteCodigo))), [pendientes])

  const iniciales = useMemo<EntradaFactura>(() => {
    const hoy = claveDia(new Date())
    const viajeCodigos = [...(viajesIniciales ?? [])]
    const primero = obtener(datos, 'viajes', viajeCodigos[0])
    const clienteCodigo = clienteInicial ?? primero?.clienteCodigo ?? ''
    const modalidadCobro = primero?.modalidadCobro ?? 'credito'
    const valor = redondear(viajeCodigos.reduce((s, c) => s + (obtener(datos, 'viajes', c)?.valorReferencial ?? 0), 0))
    return { clienteCodigo, viajeCodigos, referencia: '', fechaEmision: hoy, fechaVencimiento: sumarDiasAClave(hoy, diasPorModalidad(modalidadCobro)), valor, modalidadCobro }
  }, [clienteInicial, viajesIniciales, datos])

  const { register, handleSubmit, reset, setValue, getValues, control, formState: { errors } } = useForm<EntradaFactura>({ resolver: zodResolver(esquemaFactura), defaultValues: iniciales })
  const clienteCodigo = useWatch({ control, name: 'clienteCodigo' })
  const seleccion = useWatch({ control, name: 'viajeCodigos' })
  const valor = useWatch({ control, name: 'valor' })

  useEffect(() => {
    if (abierto) reset(iniciales)
  }, [abierto, iniciales, reset])

  const disponibles = pendientes.filter((v) => v.clienteCodigo === clienteCodigo)
  const valorReferencial = redondear(seleccion.reduce((s, c) => s + (obtener(datos, 'viajes', c)?.valorReferencial ?? 0), 0))
  const diferencia = Number.isFinite(valor) ? redondear(valor - valorReferencial) : 0

  const cambiarSeleccion = (codigos: string[]) => {
    setValue('viajeCodigos', codigos, { shouldValidate: true })
    setValue('valor', redondear(codigos.reduce((s, c) => s + (obtener(datos, 'viajes', c)?.valorReferencial ?? 0), 0)), { shouldValidate: codigos.length > 0 })
    const primero = obtener(datos, 'viajes', codigos[0])
    if (primero && codigos.length === 1) {
      setValue('modalidadCobro', primero.modalidadCobro)
    }
  }

  const alternar = (codigo: string) => cambiarSeleccion(seleccion.includes(codigo) ? seleccion.filter((c) => c !== codigo) : [...seleccion, codigo])

  const recalcularVencimiento = (emision: string, modalidad: ModalidadCobro) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(emision)) setValue('fechaVencimiento', sumarDiasAClave(emision, diasPorModalidad(modalidad)), { shouldValidate: true })
  }

  const enviar = (entrada: EntradaFactura) => {
    const resultado = ejecutar(
      registrarFactura({ ...entrada, fechaEmision: isoDesdeClave(entrada.fechaEmision, 10), fechaVencimiento: isoDesdeClave(entrada.fechaVencimiento, 18) }),
    )
    if (!resultado.ok) {
      notificar('error', 'No se pudo registrar la factura', resultado.error)
      return
    }
    notificar('exito', `Factura ${resultado.valor.codigo} registrada`, `${resultado.valor.referencia} · ${resultado.valor.viajeCodigos.join(', ')} · ${formatearMoneda(resultado.valor.valor)}`)
    onRegistrada?.(resultado.valor)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      ancho="grande"
      titulo="Registrar factura"
      descripcion="Agrupe servicios finalizados del mismo cliente y registre la referencia de la factura emitida."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={FileCheck2}>Registrar factura</Boton>
        </>
      }
    >
      <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Cliente"
          requerido
          className="sm:col-span-2"
          textoTodos="Seleccione el cliente"
          opciones={clientesConPendientes.map((c) => ({ valor: c, etiqueta: `${nombreCliente(datos, c)} (${pendientes.filter((v) => v.clienteCodigo === c).length})` }))}
          error={errors.clienteCodigo?.message}
          ayuda="Solo se listan clientes con servicios por facturar."
          {...register('clienteCodigo', { onChange: () => cambiarSeleccion([]) })}
        />
        <fieldset className="sm:col-span-2">
          <legend className="text-xs font-medium text-texto-secundario mb-1">
            Servicios a agrupar<span className="text-peligro" aria-hidden="true"> *</span>
          </legend>
          {clienteCodigo === '' ? (
            <p className="text-sm text-texto-secundario rounded-md border border-dashed border-borde px-3 py-4 text-center">Seleccione un cliente para ver sus servicios finalizados.</p>
          ) : disponibles.length === 0 ? (
            <p className="text-sm text-texto-secundario rounded-md border border-dashed border-borde px-3 py-4 text-center">El cliente no tiene servicios por facturar.</p>
          ) : (
            <ul className="rounded-md border border-borde divide-y divide-borde max-h-60 overflow-y-auto">
              {disponibles.map((v) => (
                <li key={v.codigo}>
                  <label className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-fondo">
                    <input type="checkbox" className="size-4 mt-0.5 accent-primario" checked={seleccion.includes(v.codigo)} onChange={() => alternar(v.codigo)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-mono font-semibold">{v.codigo}</span>
                        <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]} · {ETIQUETAS_MODALIDAD_COBRO[v.modalidadCobro]}</span>
                      </span>
                      <span className="block text-xs text-texto-secundario truncate">{descripcionServicio(datos, v)} · cerrado {formatearFecha(v.cierreReal)}</span>
                    </span>
                    <span className="text-sm tabular-nums shrink-0">{formatearMoneda(v.valorReferencial)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {errors.viajeCodigos?.message && <p className="text-xs text-peligro mt-1">{errors.viajeCodigos.message}</p>}
          {seleccion.length > 0 && (
            <p className="text-xs text-texto-secundario mt-1">
              {seleccion.length} {seleccion.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'} · valor referencial {formatearMoneda(valorReferencial)}
            </p>
          )}
        </fieldset>
        <CampoTexto etiqueta="Referencia de la factura" requerido placeholder="Ej. 001-002-000004521" error={errors.referencia?.message} ayuda="Número asignado por el sistema contable." {...register('referencia')} />
        <CampoTexto
          etiqueta="Valor facturado (USD)"
          requerido
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          error={errors.valor?.message}
          ayuda={seleccion.length > 0 && diferencia !== 0 ? `Difiere del valor referencial en ${formatearMoneda(diferencia)}.` : 'Sugerido: suma de los valores referenciales.'}
          {...register('valor', { valueAsNumber: true })}
        />
        <Selector
          etiqueta="Modalidad de cobro"
          requerido
          opciones={opcionesDe(ETIQUETAS_MODALIDAD_COBRO, MODALIDADES_COBRO)}
          error={errors.modalidadCobro?.message}
          ayuda="No se exige anticipo para iniciar el viaje."
          {...register('modalidadCobro', { onChange: (e: { target: { value: ModalidadCobro } }) => recalcularVencimiento(getValues('fechaEmision'), e.target.value) })}
        />
        <div className="grid gap-4 grid-cols-2">
          <CampoTexto
            etiqueta="Emisión"
            requerido
            type="date"
            max={claveDia(new Date())}
            error={errors.fechaEmision?.message}
            {...register('fechaEmision', { onChange: (e: { target: { value: string } }) => recalcularVencimiento(e.target.value, getValues('modalidadCobro')) })}
          />
          <CampoTexto etiqueta="Vencimiento" requerido type="date" error={errors.fechaVencimiento?.message} {...register('fechaVencimiento')} />
        </div>
      </form>
      <AvisoDemostrativo className="mt-4">
        El prototipo registra la referencia, la fecha y el valor de una factura ya emitida. No emite comprobantes electrónicos ni se conecta con el SRI o Contífico.
      </AvisoDemostrativo>
    </Modal>
  )
}

interface PropiedadesModalPago {
  abierto: boolean
  onCerrar: () => void
  facturaInicial?: string
  onRegistrado?: (pago: Pago) => void
}

export function ModalRegistrarPago({ abierto, onCerrar, facturaInicial, onRegistrado }: PropiedadesModalPago) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const facturasConSaldo = datos.facturas.filter((f) => saldoDisponibleParaPago(f, datos.pagos) > 0)

  const iniciales = useMemo<EntradaPago>(() => {
    const factura = obtener(datos, 'facturas', facturaInicial)
    return { facturaCodigo: factura?.codigo ?? '', fecha: claveDia(new Date()), valor: factura ? saldoDisponibleParaPago(factura, datos.pagos) : Number.NaN, referencia: '', observacion: '' }
  }, [facturaInicial, datos])

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<EntradaPago>({ resolver: zodResolver(esquemaPago), defaultValues: iniciales })
  const facturaCodigo = useWatch({ control, name: 'facturaCodigo' })
  const valor = useWatch({ control, name: 'valor' })
  const [comprobantes, establecerComprobantes] = useState<Evidencia[]>([])

  useEffect(() => {
    if (!abierto) return
    reset(iniciales)
    establecerComprobantes([])
  }, [abierto, iniciales, reset])

  const factura = obtener(datos, 'facturas', facturaCodigo || undefined)
  const resumen = factura ? resumenFactura(datos, factura, new Date()) : undefined
  const saldoTras = resumen && Number.isFinite(valor) ? redondear(resumen.saldo - resumen.porValidar - valor) : undefined

  const enviar = (entrada: EntradaPago) => {
    const resultado = ejecutar(registrarPago({ ...entrada, fecha: isoDesdeClave(entrada.fecha, 12), comprobante: comprobantes[0] }))
    if (!resultado.ok) {
      notificar('error', 'No se pudo registrar el pago', resultado.error)
      return
    }
    notificar('exito', `Pago ${resultado.valor.codigo} registrado`, `${formatearMoneda(resultado.valor.valor)} para ${resultado.valor.facturaCodigo}. Queda pendiente de validación.`)
    onRegistrado?.(resultado.valor)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Registrar pago"
      descripcion="Abono, pago parcial o cancelación total. El saldo se reduce cuando el pago se valida."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={Banknote}>Registrar pago</Boton>
        </>
      }
    >
      <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Factura"
          requerido
          className="sm:col-span-2"
          textoTodos="Seleccione la factura"
          opciones={facturasConSaldo.map((f) => ({ valor: f.codigo, etiqueta: `${f.codigo} · ${f.referencia} · ${nombreCliente(datos, f.clienteCodigo)}` }))}
          error={errors.facturaCodigo?.message}
          disabled={Boolean(facturaInicial)}
          {...register('facturaCodigo', {
            onChange: (e: { target: { value: string } }) => {
              const elegida = obtener(datos, 'facturas', e.target.value)
              if (elegida) setValue('valor', saldoDisponibleParaPago(elegida, datos.pagos), { shouldValidate: true })
            },
          })}
        />
        {resumen && (
          <div className="sm:col-span-2 rounded-md border border-borde bg-fondo px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-sm font-medium">{resumen.clienteNombre}</span>
              <InsigniaEstadoFactura estado={resumen.estado} proximaAVencer={resumen.proximaAVencer} />
            </div>
            <ListaDatos
              columnas={3}
              datos={[
                { etiqueta: 'Valor facturado', valor: formatearMoneda(resumen.factura.valor) },
                { etiqueta: 'Pagos validados', valor: formatearMoneda(resumen.validado) },
                { etiqueta: 'Por validar', valor: formatearMoneda(resumen.porValidar) },
                { etiqueta: 'Saldo', valor: <span className="font-semibold">{formatearMoneda(resumen.saldo)}</span> },
                { etiqueta: 'Disponible para registrar', valor: formatearMoneda(resumen.disponibleParaPago) },
                { etiqueta: 'Vencimiento', valor: `${formatearFecha(resumen.factura.fechaVencimiento)} · ${textoVencimiento(resumen)}` },
              ]}
            />
          </div>
        )}
        <CampoTexto etiqueta="Fecha del pago" requerido type="date" max={claveDia(new Date())} min={factura ? claveDia(factura.fechaEmision) : undefined} error={errors.fecha?.message} {...register('fecha')} />
        <div className="flex flex-col gap-1">
          <CampoTexto
            etiqueta="Valor (USD)"
            requerido
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            error={errors.valor?.message}
            ayuda={saldoTras !== undefined && saldoTras >= 0 ? (saldoTras === 0 ? 'Cancela el saldo total al validarse.' : `Saldo tras validar: ${formatearMoneda(saldoTras)}.`) : undefined}
            {...register('valor', { valueAsNumber: true })}
          />
          {resumen && resumen.disponibleParaPago > 0 && valor !== resumen.disponibleParaPago && (
            <button type="button" className="self-start text-xs text-info hover:underline underline-offset-2" onClick={() => setValue('valor', resumen.disponibleParaPago, { shouldValidate: true })}>
              Usar saldo disponible ({formatearMoneda(resumen.disponibleParaPago)})
            </button>
          )}
        </div>
        <CampoTexto etiqueta="Referencia" requerido placeholder="Transferencia, depósito o cheque" className="sm:col-span-2" error={errors.referencia?.message} {...register('referencia')} />
        <div className="sm:col-span-2">
          <CampoEvidencias etiqueta="Comprobante de pago (imagen o PDF)" multiple={false} evidencias={comprobantes} onCambiar={establecerComprobantes} />
        </div>
        <AreaTexto etiqueta="Observación" rows={2} className="sm:col-span-2" placeholder="Opcional" {...register('observacion')} />
      </form>
    </Modal>
  )
}

export function ModalComprobantePago({ pago, onCerrar }: { pago: Pago | null; onCerrar: () => void }) {
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const [comprobantes, establecerComprobantes] = useState<Evidencia[]>([])

  useEffect(() => {
    establecerComprobantes(pago?.comprobante ? [pago.comprobante] : [])
  }, [pago])

  const guardarCambio = () => {
    if (!pago) return
    const nuevo = comprobantes[0]
    const resultado = ejecutar(cambiarComprobantePago(pago.codigo, nuevo))
    if (!resultado.ok) {
      notificar('error', 'No se pudo actualizar el comprobante', resultado.error)
      return
    }
    notificar('exito', nuevo ? 'Comprobante actualizado' : 'Comprobante eliminado', `${pago.codigo} · ${nuevo ? nuevo.nombre : pago.referencia}`)
    onCerrar()
  }

  const sinCambios = (comprobantes[0]?.nombre ?? '') === (pago?.comprobante?.nombre ?? '') && (comprobantes[0]?.fecha ?? '') === (pago?.comprobante?.fecha ?? '')

  return (
    <Modal
      abierto={pago !== null}
      titulo={pago ? `Comprobante del pago ${pago.codigo}` : 'Comprobante del pago'}
      descripcion="Quite el archivo incorrecto con la X y seleccione el correcto. Solo se modifica mientras el pago está por validar."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" icono={Save} onClick={guardarCambio} disabled={sinCambios}>Guardar</Boton>
        </>
      }
    >
      {pago && (
        <>
          <p className="mb-3 text-texto-secundario">
            {pago.referencia} · {formatearMoneda(pago.valor)} · {formatearFecha(pago.fecha)}
          </p>
          <CampoEvidencias etiqueta="Comprobante de pago (imagen o PDF)" multiple={false} evidencias={comprobantes} onCambiar={establecerComprobantes} />
        </>
      )}
    </Modal>
  )
}

export function ModalValidarPago({ pago, onCerrar }: { pago: Pago | null; onCerrar: () => void }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const factura = pago ? obtener(datos, 'facturas', pago.facturaCodigo) : undefined
  const saldoActual = factura ? saldoDeFactura(factura, datos.pagos) : 0
  const saldoNuevo = pago ? Math.max(0, redondear(saldoActual - pago.valor)) : 0

  const confirmar = () => {
    if (!pago) return
    const resultado = ejecutar(validarPago(pago.codigo))
    if (!resultado.ok) {
      notificar('error', 'No se pudo validar el pago', resultado.error)
      return
    }
    notificar(
      'exito',
      `Pago ${pago.codigo} validado`,
      resultado.valor.cobrada ? `La factura ${pago.facturaCodigo} queda cobrada con saldo cero.` : `Saldo pendiente de ${pago.facturaCodigo}: ${formatearMoneda(resultado.valor.saldo)}.`,
    )
    onCerrar()
  }

  return (
    <Modal
      abierto={pago !== null}
      ancho="pequeno"
      titulo={pago ? `Validar pago ${pago.codigo}` : 'Validar pago'}
      descripcion="Confirme que el pago fue verificado en la cuenta bancaria."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" icono={BadgeCheck} onClick={confirmar}>Validar pago</Boton>
        </>
      }
    >
      {pago && factura && (
        <>
          <ListaDatos
            datos={[
              { etiqueta: 'Factura', valor: <Link to={`/contabilidad/facturas/${factura.codigo}`} className="font-mono text-info hover:underline">{factura.codigo}</Link> },
              { etiqueta: 'Cliente', valor: nombreCliente(datos, factura.clienteCodigo) },
              { etiqueta: 'Referencia', valor: pago.referencia },
              { etiqueta: 'Comprobante', valor: pago.comprobante ? <span className="break-all">{pago.comprobante.nombre}</span> : 'Sin comprobante' },
              { etiqueta: 'Fecha', valor: formatearFecha(pago.fecha) },
              { etiqueta: 'Valor', valor: formatearMoneda(pago.valor) },
              { etiqueta: 'Registrado', valor: pago.registradoPor ? obtener(datos, 'usuarios', pago.registradoPor)?.nombre ?? pago.registradoPor : 'Sin dato' },
              { etiqueta: 'Saldo actual', valor: formatearMoneda(saldoActual) },
              { etiqueta: 'Saldo tras validar', valor: <span className="font-semibold">{formatearMoneda(saldoNuevo)}</span> },
            ]}
          />
          {saldoNuevo === 0 && <p className="mt-3 rounded-md bg-exito-fondo text-exito px-3 py-2 text-sm">Con esta validación la factura queda en estado Cobrado.</p>}
          {pago.observacion && <p className="mt-3 text-sm text-texto-secundario">{pago.observacion}</p>}
        </>
      )}
    </Modal>
  )
}
