import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Banknote, CircleDollarSign, Clock, Wallet } from 'lucide-react'
import type { Pago } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniaEstadoFactura, InsigniaEstadoPago, InsigniaModalidadCobro } from '@/componentes/comunes/Insignia'
import { ModalRegistrarPago, ModalValidarPago } from '@/componentes/contabilidad/ModalesContabilidad'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { nombreUsuario } from '@/servicios/consultas'
import { descripcionServicio, resumenFactura, textoVencimiento } from '@/servicios/contabilidad'
import { redondear } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD_CORTA } from '@/utilidades/constantes'
import { formatearFecha, formatearFechaHora, formatearMoneda } from '@/utilidades/formateadores'

function BarraCobro({ valor, validado, porValidar }: { valor: number; validado: number; porValidar: number }) {
  const ancho = (parte: number) => `${valor > 0 ? Math.min(100, (parte / valor) * 100) : 0}%`
  const porcentaje = valor > 0 ? Math.round((validado / valor) * 100) : 0
  return (
    <figure aria-label="Avance de cobro">
      <div className="flex h-3 rounded-full overflow-hidden bg-fondo border border-borde" role="img" aria-label={`Cobrado ${porcentaje} %`}>
        <div className="h-full bg-exito" style={{ width: ancho(validado) }} />
        <div className="h-full bg-pendiente/60" style={{ width: ancho(porValidar) }} />
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-secundario">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-exito" aria-hidden="true" />Validado {porcentaje} %</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-pendiente/60" aria-hidden="true" />Por validar</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-fondo border border-borde" aria-hidden="true" />Saldo sin pagos</span>
      </figcaption>
    </figure>
  )
}

export default function PaginaDetalleFactura() {
  const { codigo } = useParams()
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const volver = usarVolver('/contabilidad/facturas')
  const ahora = useMemo(() => new Date(), [])
  const [pagando, establecerPagando] = useState(false)
  const [validando, establecerValidando] = useState<Pago | null>(null)
  const factura = obtener(datos, 'facturas', codigo)
  if (!factura) return <PaginaNoEncontrada />

  const resumen = resumenFactura(datos, factura, ahora)
  const viajes = factura.viajeCodigos.map((c) => obtener(datos, 'viajes', c)).filter((v) => v !== undefined)
  const valorReferencial = redondear(viajes.reduce((s, v) => s + v.valorReferencial, 0))
  const diferencia = redondear(factura.valor - valorReferencial)
  const puedeRegistrar = puede('pagos.registrar') && resumen.disponibleParaPago > 0
  const motivoSinPago = resumen.saldo === 0 ? 'La factura está cobrada.' : resumen.disponibleParaPago === 0 ? 'El saldo restante ya está cubierto por pagos por validar.' : undefined

  return (
    <>
      <EncabezadoPagina
        titulo={`Factura ${factura.codigo}`}
        etiqueta={<InsigniaEstadoFactura estado={resumen.estado} proximaAVencer={resumen.proximaAVencer} />}
        descripcion={`${factura.referencia} · ${resumen.clienteNombre}`}
        acciones={
          <>
            <Boton icono={ArrowLeft} onClick={volver}>Volver</Boton>
            {puede('pagos.registrar') && (
              <Boton variante="primario" icono={Banknote} motivoDeshabilitado={puedeRegistrar ? undefined : motivoSinPago} onClick={() => establecerPagando(true)}>
                Registrar pago
              </Boton>
            )}
          </>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Valor facturado" valor={formatearMoneda(factura.valor)} icono={CircleDollarSign} tono="info" />
        <TarjetaIndicador titulo="Pagos validados" valor={formatearMoneda(resumen.validado)} icono={BadgeCheck} tono="exito" />
        <TarjetaIndicador titulo="Por validar" valor={formatearMoneda(resumen.porValidar)} icono={Clock} tono={resumen.porValidar > 0 ? 'pendiente' : 'neutro'} />
        <TarjetaIndicador titulo="Saldo" valor={formatearMoneda(resumen.saldo)} detalle={textoVencimiento(resumen)} icono={Wallet} tono={resumen.estado === 'vencida' ? 'peligro' : resumen.saldo > 0 ? 'pendiente' : 'exito'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel titulo="Datos de la factura">
          <ListaDatos
            datos={[
              { etiqueta: 'Referencia', valor: <span className="font-mono">{factura.referencia}</span> },
              { etiqueta: 'Cliente', valor: <Link to={`/clientes/${factura.clienteCodigo}`} className="text-info hover:underline underline-offset-2">{resumen.clienteNombre}</Link> },
              { etiqueta: 'Modalidad de cobro', valor: <InsigniaModalidadCobro modalidad={factura.modalidadCobro} /> },
              { etiqueta: 'Anticipo', valor: 'No requerido' },
              { etiqueta: 'Emisión', valor: formatearFecha(factura.fechaEmision) },
              { etiqueta: 'Vencimiento', valor: <span className={resumen.estado === 'vencida' ? 'text-peligro' : undefined}>{formatearFecha(factura.fechaVencimiento)} · {textoVencimiento(resumen)}</span> },
              { etiqueta: 'Registrada por', valor: nombreUsuario(datos, factura.creadoPor) },
            ]}
          />
          <div className="mt-5">
            <BarraCobro valor={factura.valor} validado={resumen.validado} porValidar={resumen.porValidar} />
          </div>
        </Panel>

        <Panel titulo="Servicios agrupados" descripcion={`${viajes.length} ${viajes.length === 1 ? 'viaje' : 'viajes'} del mismo cliente.`} sinRelleno>
          <ul className="divide-y divide-borde">
            {viajes.map((v) => (
              <li key={v.codigo}>
                <Link to={`/viajes/${v.codigo}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-fondo">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-semibold">{v.codigo}</span>
                      <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}</span>
                    </span>
                    <span className="block text-xs text-texto-secundario truncate">{descripcionServicio(datos, v)}</span>
                    <span className="block text-xs text-texto-secundario">Cerrado {formatearFecha(v.cierreReal)}</span>
                  </span>
                  <span className="text-sm tabular-nums shrink-0">{formatearMoneda(v.valorReferencial)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-borde px-4 py-2.5 text-sm">
            <span className="text-texto-secundario">Valor referencial de los servicios</span>
            <span className="tabular-nums font-medium">{formatearMoneda(valorReferencial)}</span>
          </div>
          {diferencia !== 0 && <p className="px-4 pb-3 text-xs text-texto-secundario">El valor facturado difiere en {formatearMoneda(diferencia)} del valor referencial registrado en los viajes.</p>}
        </Panel>

        <Panel
          titulo="Pagos y abonos"
          descripcion="Solo los pagos validados reducen el saldo. La factura pasa a cobrada cuando el saldo llega a cero."
          className="xl:col-span-2"
          sinRelleno
        >
          {resumen.pagos.length === 0 ? (
            <p className="px-4 py-6 text-sm text-texto-secundario text-center">Sin pagos registrados.</p>
          ) : (
            <ul className="divide-y divide-borde">
              {resumen.pagos.map((p) => (
                <li key={p.codigo} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono font-semibold">{p.codigo}</span>
                      <span className="text-texto-secundario">{p.referencia}</span>
                      <InsigniaEstadoPago estado={p.estado} />
                    </span>
                    <span className="block text-xs text-texto-secundario">
                      Pago del {formatearFecha(p.fecha)}
                      {p.registradoPor ? ` · registrado por ${nombreUsuario(datos, p.registradoPor)}` : ''}
                      {p.estado === 'validado' && p.validadorCodigo ? ` · validado por ${nombreUsuario(datos, p.validadorCodigo)}${p.fechaValidacion ? ` el ${formatearFechaHora(p.fechaValidacion)}` : ''}` : ''}
                    </span>
                    {p.observacion && <span className="block text-xs text-texto-secundario">{p.observacion}</span>}
                  </span>
                  <span className="text-sm tabular-nums font-medium">{formatearMoneda(p.valor)}</span>
                  {p.estado === 'registrado' && puede('pagos.validar') && (
                    <Boton tamano="pequeno" icono={BadgeCheck} onClick={() => establecerValidando(p)}>Validar</Boton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AvisoDemostrativo className="mt-5">
        Registro demostrativo de una factura emitida en el sistema contable. El prototipo no emite comprobantes electrónicos; la consulta de cartera desde Contífico es una integración futura.
      </AvisoDemostrativo>

      <ModalRegistrarPago abierto={pagando} facturaInicial={factura.codigo} onCerrar={() => establecerPagando(false)} />
      <ModalValidarPago pago={validando} onCerrar={() => establecerValidando(null)} />
    </>
  )
}
