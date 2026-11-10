import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, CalendarClock, Clock, FileSpreadsheet, Plug, RefreshCw, TriangleAlert, Wallet } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { Insignia, InsigniaEstadoFactura } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { Selector } from '@/componentes/formularios/Selector'
import { GraficoBarras } from '@/componentes/graficos/GraficoBarras'
import { ModalRegistrarPago } from '@/componentes/contabilidad/ModalesContabilidad'
import { carteraPorCliente, cumpleFiltroEstado, resumenCartera, resumenesDeFacturas, textoVencimiento, tramoDeAntiguedad, TRAMOS_ANTIGUEDAD, type ResumenFactura } from '@/servicios/contabilidad'
import { ETIQUETAS_ESTADO_FACTURA, ETIQUETA_PROXIMA_A_VENCER } from '@/utilidades/constantes'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

const FILTROS_CARTERA = [
  { valor: 'vencida', etiqueta: ETIQUETAS_ESTADO_FACTURA.vencida },
  { valor: 'proxima', etiqueta: ETIQUETA_PROXIMA_A_VENCER },
  { valor: 'pendiente_parcial', etiqueta: ETIQUETAS_ESTADO_FACTURA.pendiente_parcial },
]

export default function PaginaCartera() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'vencimiento', direccionPredeterminada: 'asc' })
  const ahora = useMemo(() => new Date(), [])
  const [pagando, establecerPagando] = useState<string | null>(null)
  const dias = datos.configuracion.diasAlertaVencimiento

  const resumen = resumenCartera(datos, ahora)
  const clientes = carteraPorCliente(datos, ahora)
  const estado = listado.filtro('estado')
  const cliente = listado.filtro('cliente')
  const tramo = listado.filtro('tramo')
  const abiertas = resumenesDeFacturas(datos, ahora).filter((r) => r.saldo > 0)
  const filas = abiertas.filter((r) => cumpleFiltroEstado(r, estado) && (!cliente || r.factura.clienteCodigo === cliente) && (!tramo || tramoDeAntiguedad(r.diasParaVencer) === tramo))

  const exportar = async () => {
    const { exportarExcel, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    await exportarExcel(nombreArchivoSeguro('cartera_pendiente', 'xlsx'), [
      {
        nombre: 'Facturas con saldo',
        columnas: ['Factura', 'Referencia', 'Cliente', 'Emisión', 'Vencimiento', 'Situación', 'Valor', 'Validado', 'Por validar', 'Saldo', 'Antigüedad'],
        filas: filas.map((r) => [
          r.factura.codigo,
          r.factura.referencia,
          r.clienteNombre,
          formatearFecha(r.factura.fechaEmision),
          formatearFecha(r.factura.fechaVencimiento),
          textoVencimiento(r),
          r.factura.valor,
          r.validado,
          r.porValidar,
          r.saldo,
          TRAMOS_ANTIGUEDAD.find((t) => t.clave === tramoDeAntiguedad(r.diasParaVencer))?.etiqueta ?? '',
        ]),
      },
      {
        nombre: 'Por cliente',
        columnas: ['Cliente', 'Facturas abiertas', 'Saldo', 'Vencido', 'Por validar', 'Próximo vencimiento'],
        filas: clientes.map((c) => [c.clienteNombre, c.facturasAbiertas, c.saldo, c.vencido, c.porValidar, c.proximoVencimiento ? formatearFecha(c.proximoVencimiento) : '']),
      },
    ])
  }

  const columnas: Columna<ResumenFactura>[] = [
    {
      clave: 'codigo',
      titulo: 'Factura',
      valorOrden: (r) => r.factura.codigo,
      celda: (r) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block font-mono font-semibold">{r.factura.codigo}</span>
          <span className="block text-xs text-texto-secundario">{r.factura.referencia}</span>
        </span>
      ),
    },
    { clave: 'cliente', titulo: 'Cliente', visibleDesde: 'md', valorOrden: (r) => r.clienteNombre, celda: (r) => <span className="block max-w-56 truncate">{r.clienteNombre}</span> },
    {
      clave: 'vencimiento',
      titulo: 'Vencimiento',
      valorOrden: (r) => r.factura.fechaVencimiento,
      celda: (r) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block">{formatearFecha(r.factura.fechaVencimiento)}</span>
          <span className={`block text-xs ${r.estado === 'vencida' ? 'text-peligro' : 'text-texto-secundario'}`}>{textoVencimiento(r)}</span>
        </span>
      ),
    },
    { clave: 'porValidar', titulo: 'Por validar', alinear: 'derecha', visibleDesde: 'xl', valorOrden: (r) => r.porValidar, celda: (r) => <span className="tabular-nums text-texto-secundario">{r.porValidar > 0 ? formatearMoneda(r.porValidar) : 'Sin pagos'}</span> },
    { clave: 'saldo', titulo: 'Saldo', alinear: 'derecha', valorOrden: (r) => r.saldo, celda: (r) => <span className="tabular-nums font-medium">{formatearMoneda(r.saldo)}</span> },
    { clave: 'estado', titulo: 'Estado', visibleDesde: 'md', valorOrden: (r) => r.diasParaVencer, celda: (r) => <InsigniaEstadoFactura estado={r.estado} proximaAVencer={r.proximaAVencer} /> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Cartera"
        descripcion="Saldos pendientes, vencimientos y alertas de cobro calculados desde facturas y pagos validados."
        acciones={<Boton icono={FileSpreadsheet} onClick={() => void exportar()} disabled={abiertas.length === 0}>Exportar Excel</Boton>}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Cartera pendiente" valor={formatearMoneda(resumen.carteraPendiente)} detalle={`${resumen.abiertas} ${resumen.abiertas === 1 ? 'factura abierta' : 'facturas abiertas'}`} icono={Wallet} tono="info" />
        <TarjetaIndicador titulo="Vencida" valor={formatearMoneda(resumen.vencida.saldo)} detalle={`${resumen.vencida.cantidad} ${resumen.vencida.cantidad === 1 ? 'factura' : 'facturas'}`} icono={TriangleAlert} tono={resumen.vencida.cantidad > 0 ? 'peligro' : 'neutro'} enlace="/contabilidad/cartera?estado=vencida" />
        <TarjetaIndicador titulo="Próxima a vencer" valor={formatearMoneda(resumen.proxima.saldo)} detalle={`${resumen.proxima.cantidad} en los próximos ${dias} días`} icono={CalendarClock} tono={resumen.proxima.cantidad > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/cartera?estado=proxima" />
        <TarjetaIndicador titulo="Pagos por validar" valor={formatearMoneda(resumen.porValidar.valor)} detalle={`${resumen.porValidar.cantidad} ${resumen.porValidar.cantidad === 1 ? 'pago registrado' : 'pagos registrados'}`} icono={Clock} tono={resumen.porValidar.cantidad > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/pagos?estado=registrado" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] mb-5">
        <Panel titulo="Antigüedad de la cartera" descripcion="Saldo pendiente según días de vencimiento. Clic en una barra para filtrar.">
          <GraficoBarras
            datos={resumen.antiguedad.map((t) => ({ etiqueta: t.corta, valor: t.saldo, detalle: `${t.etiqueta} · ${t.cantidad} ${t.cantidad === 1 ? 'factura' : 'facturas'}`, enlace: `/contabilidad/cartera?tramo=${t.clave}` }))}
            formatoValor={formatearMoneda}
            descripcion="Saldo pendiente por antigüedad"
            color="grafico-1"
          />
        </Panel>
        <Panel titulo="Cartera por cliente" descripcion="Clientes con saldo pendiente." sinRelleno>
          {clientes.length === 0 ? (
            <p className="px-4 py-6 text-sm text-texto-secundario text-center">Sin cartera pendiente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-fondo text-xs text-texto-secundario">
                  <tr>
                    <th scope="col" className="text-left font-medium px-4 py-2">Cliente</th>
                    <th scope="col" className="text-right font-medium px-3 py-2 hidden sm:table-cell">Facturas</th>
                    <th scope="col" className="text-right font-medium px-3 py-2">Saldo</th>
                    <th scope="col" className="text-right font-medium px-3 py-2">Vencido</th>
                    <th scope="col" className="text-left font-medium px-4 py-2 hidden lg:table-cell">Próximo vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {clientes.map((c) => (
                    <tr key={c.clienteCodigo} className="hover:bg-fondo cursor-pointer" onClick={() => listado.establecerFiltro('cliente', c.clienteCodigo)}>
                      <td className="px-4 py-2.5">
                        <button type="button" className="text-left text-info hover:underline underline-offset-2" onClick={(e) => { e.stopPropagation(); listado.establecerFiltro('cliente', c.clienteCodigo) }}>
                          {c.clienteNombre}
                        </button>
                        {c.porValidar > 0 && <span className="block text-xs text-texto-secundario">{formatearMoneda(c.porValidar)} por validar</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">{c.facturasAbiertas}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatearMoneda(c.saldo)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${c.vencido > 0 ? 'text-peligro' : 'text-texto-secundario'}`}>{formatearMoneda(c.vencido)}</td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">{c.proximoVencimiento ? formatearFecha(c.proximoVencimiento) : <span className="text-texto-secundario">Solo vencidas</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <section aria-label="Filtros" className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
        <h2 className="text-base font-semibold text-texto md:mr-auto">Facturas con saldo</h2>
        <Selector etiqueta="Situación" textoTodos="Todas" className="md:w-48" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={FILTROS_CARTERA} />
        <Selector etiqueta="Antigüedad" textoTodos="Todas" className="md:w-44" value={tramo} onChange={(e) => listado.establecerFiltro('tramo', e.target.value)} opciones={TRAMOS_ANTIGUEDAD.map((t) => ({ valor: t.clave, etiqueta: t.etiqueta }))} />
        <Selector etiqueta="Cliente" textoTodos="Todos" className="md:w-64" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={clientes.map((c) => ({ valor: c.clienteCodigo, etiqueta: c.clienteNombre }))} />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
      </section>
      <Tabla
        etiqueta="Facturas con saldo pendiente"
        columnas={columnas}
        filas={filas}
        claveFila={(r) => r.factura.codigo}
        listado={listado}
        onFila={(r) => navegar(`/contabilidad/facturas/${r.factura.codigo}`)}
        resaltarFila={(r) => r.estado === 'vencida'}
        tituloVacio="Sin saldos pendientes"
        descripcionVacio="No hay facturas con saldo para los filtros aplicados."
        acciones={
          puede('pagos.registrar')
            ? (r) => (
                <BotonIcono
                  icono={Banknote}
                  etiqueta={`Registrar pago de ${r.factura.codigo}`}
                  motivoDeshabilitado={r.disponibleParaPago > 0 ? undefined : 'El saldo restante está en pagos por validar'}
                  onClick={(e) => {
                    e.stopPropagation()
                    establecerPagando(r.factura.codigo)
                  }}
                />
              )
            : undefined
        }
      />

      <Panel
        titulo="Consulta de cartera desde Contífico"
        descripcion="Representación de la integración futura con el sistema contable."
        className="mt-5"
        acciones={<Insignia tono="neutro" icono={Plug}>Integración futura</Insignia>}
      >
        <ListaDatos
          columnas={3}
          datos={[
            { etiqueta: 'Estado de sincronización', valor: 'Sin conexión (demostrativo)' },
            { etiqueta: 'Última sincronización', valor: 'No aplica' },
            { etiqueta: 'Fuente de los saldos', valor: 'Facturas y pagos registrados en el prototipo' },
          ]}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Boton icono={RefreshCw} motivoDeshabilitado="La sincronización con Contífico se habilitará en la fase de integración.">Sincronizar cartera</Boton>
          {puede('integraciones.ver') && <Link to="/integraciones" className="text-sm text-info hover:underline underline-offset-2">Ver integraciones previstas</Link>}
        </div>
      </Panel>

      {pagando && <ModalRegistrarPago abierto facturaInicial={pagando} onCerrar={() => establecerPagando(null)} />}
    </>
  )
}
