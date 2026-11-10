import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Banknote, CalendarClock, CircleDollarSign, Clock, FileCheck2, Receipt, TriangleAlert, Wallet } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { InsigniaEstadoFactura } from '@/componentes/comunes/Insignia'
import { Selector } from '@/componentes/formularios/Selector'
import { GraficoBarras } from '@/componentes/graficos/GraficoBarras'
import { ModalRegistrarPago, ModalValidarPago } from '@/componentes/contabilidad/ModalesContabilidad'
import type { Pago } from '@/tipos/dominio'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente } from '@/servicios/consultas'
import { carteraPorCliente, movimientoDelPeriodo, resumenCartera, resumenesDeFacturas, serviciosPorFacturar, textoVencimiento } from '@/servicios/contabilidad'
import { claveDia, diferenciaDias, inicioDeMes, isoDesdeClave, sumarDiasAClave, sumarMesesAClave } from '@/utilidades/fechas'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function nombreMes(clave: string): string {
  return `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(0, 4)}`
}

function ListaPanel<T>({ elementos, vacio, render, clave }: { elementos: readonly T[]; vacio: string; render: (e: T) => ReactNode; clave: (e: T) => string }) {
  if (elementos.length === 0) return <p className="px-4 py-6 text-sm text-texto-secundario text-center">{vacio}</p>
  return <ul className="divide-y divide-borde">{elementos.map((e) => <li key={clave(e)}>{render(e)}</li>)}</ul>
}

function EnlaceVer({ a, texto = 'Ver todo' }: { a: string; texto?: string }) {
  return (
    <Link to={a} className="text-xs text-info hover:underline inline-flex items-center gap-1">
      {texto}
      <ArrowRight className="size-3" aria-hidden="true" />
    </Link>
  )
}

export default function DashboardContable() {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const listado = usarParametrosListado()
  const ahora = useMemo(() => new Date(), [])
  const [pagando, establecerPagando] = useState(false)
  const [validando, establecerValidando] = useState<Pago | null>(null)
  const hoy = claveDia(ahora)

  const periodo = listado.filtro('periodo') === 'anterior' ? 'anterior' : 'actual'
  const inicio = periodo === 'anterior' ? sumarMesesAClave(hoy, -1) : inicioDeMes(hoy)
  const fin = periodo === 'anterior' ? sumarDiasAClave(inicioDeMes(hoy), -1) : hoy
  const movimiento = movimientoDelPeriodo(datos, inicio, fin)
  const cartera = resumenCartera(datos, ahora)
  const clientes = carteraPorCliente(datos, ahora)
  const pendientes = serviciosPorFacturar(datos)
  const alertas = resumenesDeFacturas(datos, ahora)
    .filter((r) => r.estado === 'vencida' || r.proximaAVencer)
    .sort((a, b) => a.diasParaVencer - b.diasParaVencer)
  const porValidar = datos.pagos.filter((p) => p.estado === 'registrado').sort((a, b) => a.fecha.localeCompare(b.fecha))
  const recaudo = movimiento.facturado > 0 ? Math.round((movimiento.cobrado / movimiento.facturado) * 100) : null

  return (
    <>
      <EncabezadoPagina titulo="Dashboard contable" descripcion="Servicios por facturar, facturación, cartera y pagos calculados desde los registros del prototipo." />

      <div className="flex flex-wrap gap-2 mb-5" aria-label="Acciones rápidas">
        <Boton icono={FileCheck2} onClick={() => navegar('/contabilidad/por-facturar')}>Facturar servicios</Boton>
        <Boton icono={Banknote} onClick={() => establecerPagando(true)}>Registrar pago</Boton>
        <Boton icono={Wallet} onClick={() => navegar('/contabilidad/cartera')}>Revisar cartera</Boton>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
        <Selector
          etiqueta="Periodo de facturación y cobro"
          className="sm:w-64"
          value={periodo}
          onChange={(e) => listado.establecerFiltro('periodo', e.target.value === 'actual' ? '' : e.target.value)}
          opciones={[
            { valor: 'actual', etiqueta: `Mes en curso (${nombreMes(hoy)})` },
            { valor: 'anterior', etiqueta: `Mes anterior (${nombreMes(sumarMesesAClave(hoy, -1))})` },
          ]}
        />
        <p className="text-xs text-texto-secundario sm:pb-2">
          Facturado y cobrado corresponden al periodo del {formatearFecha(isoDesdeClave(inicio))} al {formatearFecha(isoDesdeClave(fin))}. Los demás indicadores muestran la situación actual.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Por facturar" valor={formatearMoneda(cartera.porFacturar.valor)} detalle={`${cartera.porFacturar.cantidad} ${cartera.porFacturar.cantidad === 1 ? 'servicio finalizado' : 'servicios finalizados'}`} icono={Receipt} tono={cartera.porFacturar.cantidad > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/por-facturar" />
        <TarjetaIndicador titulo="Facturado" valor={formatearMoneda(movimiento.facturado)} detalle={`${movimiento.facturas} ${movimiento.facturas === 1 ? 'factura' : 'facturas'} en el periodo`} icono={CircleDollarSign} tono="info" enlace="/contabilidad/facturas" />
        <TarjetaIndicador titulo="Cobrado" valor={formatearMoneda(movimiento.cobrado)} detalle={`${movimiento.pagos} ${movimiento.pagos === 1 ? 'pago validado' : 'pagos validados'}${recaudo !== null ? ` · ${recaudo} % de lo facturado` : ''}`} icono={BadgeCheck} tono="exito" enlace="/contabilidad/pagos?estado=validado" />
        <TarjetaIndicador titulo="Cartera pendiente" valor={formatearMoneda(cartera.carteraPendiente)} detalle={`${cartera.abiertas} ${cartera.abiertas === 1 ? 'factura abierta' : 'facturas abiertas'}`} icono={Wallet} tono="info" enlace="/contabilidad/cartera" />
        <TarjetaIndicador titulo="Cartera vencida" valor={formatearMoneda(cartera.vencida.saldo)} detalle={`${cartera.vencida.cantidad} ${cartera.vencida.cantidad === 1 ? 'factura' : 'facturas'}`} icono={TriangleAlert} tono={cartera.vencida.cantidad > 0 ? 'peligro' : 'neutro'} enlace="/contabilidad/cartera?estado=vencida" />
        <TarjetaIndicador titulo="Próxima a vencer" valor={formatearMoneda(cartera.proxima.saldo)} detalle={`${cartera.proxima.cantidad} ${cartera.proxima.cantidad === 1 ? 'factura' : 'facturas'} en ${datos.configuracion.diasAlertaVencimiento} días`} icono={CalendarClock} tono={cartera.proxima.cantidad > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/cartera?estado=proxima" />
        <TarjetaIndicador titulo="Pagos por validar" valor={formatearMoneda(cartera.porValidar.valor)} detalle={`${cartera.porValidar.cantidad} ${cartera.porValidar.cantidad === 1 ? 'pago' : 'pagos'}`} icono={Clock} tono={cartera.porValidar.cantidad > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/pagos?estado=registrado" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        <Panel titulo="Antigüedad de la cartera" descripcion="Saldo pendiente según días de vencimiento.">
          <GraficoBarras
            datos={cartera.antiguedad.map((t) => ({ etiqueta: t.corta, valor: t.saldo, detalle: `${t.etiqueta} · ${t.cantidad} ${t.cantidad === 1 ? 'factura' : 'facturas'}`, enlace: `/contabilidad/cartera?tramo=${t.clave}` }))}
            formatoValor={formatearMoneda}
            descripcion="Saldo pendiente por antigüedad"
          />
        </Panel>
        <Panel titulo="Saldo por cliente" descripcion="Clientes con cartera pendiente.">
          {clientes.length === 0 ? (
            <p className="py-6 text-sm text-texto-secundario text-center">Sin cartera pendiente.</p>
          ) : (
            <GraficoBarras
              datos={clientes.map((c) => ({ etiqueta: c.clienteNombre.length > 26 ? `${c.clienteNombre.slice(0, 25)}…` : c.clienteNombre, valor: c.saldo, detalle: c.vencido > 0 ? `Vencido ${formatearMoneda(c.vencido)}` : 'Sin saldo vencido', enlace: `/contabilidad/cartera?cliente=${c.clienteCodigo}` }))}
              orientacion="horizontal"
              anchoEtiquetas={200}
              formatoValor={formatearMoneda}
              color="grafico-3"
              descripcion="Saldo pendiente por cliente"
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        <Panel titulo="Alertas de vencimiento" descripcion="Facturas vencidas o próximas a vencer." sinRelleno acciones={<EnlaceVer a="/contabilidad/cartera" />}>
          <ListaPanel
            elementos={alertas}
            clave={(r) => r.factura.codigo}
            vacio="Sin facturas vencidas ni próximas a vencer."
            render={(r) => (
              <Link to={`/contabilidad/facturas/${r.factura.codigo}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-fondo">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-semibold">{r.factura.codigo}</span>
                    <InsigniaEstadoFactura estado={r.estado} proximaAVencer={r.proximaAVencer} />
                  </span>
                  <span className="block text-xs text-texto-secundario truncate">{r.clienteNombre} · {textoVencimiento(r)}</span>
                </span>
                <span className="text-sm tabular-nums shrink-0">{formatearMoneda(r.saldo)}</span>
              </Link>
            )}
          />
        </Panel>
        <Panel titulo="Pagos por validar" descripcion="Registrados pendientes de verificación." sinRelleno acciones={<EnlaceVer a="/contabilidad/pagos?estado=registrado" />}>
          <ListaPanel
            elementos={porValidar}
            clave={(p) => p.codigo}
            vacio="No hay pagos pendientes de validación."
            render={(p) => (
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-semibold">{p.codigo}</span>
                    <Link to={`/contabilidad/facturas/${p.facturaCodigo}`} className="font-mono text-xs text-info hover:underline">{p.facturaCodigo}</Link>
                  </span>
                  <span className="block text-xs text-texto-secundario truncate">{nombreCliente(datos, obtener(datos, 'facturas', p.facturaCodigo)?.clienteCodigo)} · {p.referencia} · {formatearFecha(p.fecha)}</span>
                </span>
                <span className="text-sm tabular-nums shrink-0">{formatearMoneda(p.valor)}</span>
                <Boton tamano="pequeno" icono={BadgeCheck} onClick={() => establecerValidando(p)}>Validar</Boton>
              </div>
            )}
          />
        </Panel>
        <Panel titulo="Servicios por facturar" descripcion="Finalizados más antiguos primero." sinRelleno acciones={<EnlaceVer a="/contabilidad/por-facturar" />}>
          <ListaPanel
            elementos={pendientes.slice(0, 6)}
            clave={(v) => v.codigo}
            vacio="Todos los servicios finalizados están facturados."
            render={(v) => {
              const dias = v.cierreReal ? diferenciaDias(v.cierreReal, ahora) : null
              return (
                <Link to={`/viajes/${v.codigo}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-fondo">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm font-semibold">{v.codigo}</span>
                    <span className="block text-xs text-texto-secundario truncate">{nombreCliente(datos, v.clienteCodigo)}{dias !== null ? ` · cerrado hace ${dias} ${dias === 1 ? 'día' : 'días'}` : ''}</span>
                  </span>
                  <span className="text-sm tabular-nums shrink-0">{formatearMoneda(v.valorReferencial)}</span>
                </Link>
              )
            }}
          />
        </Panel>
      </div>

      <ModalRegistrarPago abierto={pagando} onCerrar={() => establecerPagando(false)} />
      <ModalValidarPago pago={validando} onCerrar={() => establecerValidando(null)} />
    </>
  )
}
