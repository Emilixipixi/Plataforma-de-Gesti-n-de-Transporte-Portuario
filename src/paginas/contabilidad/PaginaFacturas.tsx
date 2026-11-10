import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, CircleDollarSign, FileCheck2, FileSpreadsheet, Receipt, Wallet } from 'lucide-react'
import { MODALIDADES_COBRO } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { InsigniaEstadoFactura } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { ModalRegistrarFactura, ModalRegistrarPago } from '@/componentes/contabilidad/ModalesContabilidad'
import { coincideTexto } from '@/servicios/repositorio'
import { cumpleFiltroEstado, resumenesDeFacturas, textoVencimiento, type ResumenFactura } from '@/servicios/contabilidad'
import { redondear } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_FACTURA, ETIQUETAS_MODALIDAD_COBRO, ETIQUETA_PROXIMA_A_VENCER, opcionesDe } from '@/utilidades/constantes'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

const FILTROS_ESTADO = [
  { valor: 'pendiente_parcial', etiqueta: ETIQUETAS_ESTADO_FACTURA.pendiente_parcial },
  { valor: 'proxima', etiqueta: ETIQUETA_PROXIMA_A_VENCER },
  { valor: 'vencida', etiqueta: ETIQUETAS_ESTADO_FACTURA.vencida },
  { valor: 'cobrada', etiqueta: ETIQUETAS_ESTADO_FACTURA.cobrada },
  { valor: 'abiertas', etiqueta: 'Con saldo pendiente' },
]

export default function PaginaFacturas() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'emision', direccionPredeterminada: 'desc' })
  const ahora = useMemo(() => new Date(), [])
  const [registrando, establecerRegistrando] = useState(false)
  const [pagando, establecerPagando] = useState<string | null>(null)

  const cliente = listado.filtro('cliente')
  const estado = listado.filtro('estado')
  const cobro = listado.filtro('cobro')

  const filas = resumenesDeFacturas(datos, ahora).filter(
    (r) =>
      (!cliente || r.factura.clienteCodigo === cliente) &&
      (!cobro || r.factura.modalidadCobro === cobro) &&
      cumpleFiltroEstado(r, estado) &&
      coincideTexto(listado.busqueda, [r.factura.codigo, r.factura.referencia, r.clienteNombre, ...r.factura.viajeCodigos]),
  )
  const totales = {
    facturado: redondear(filas.reduce((s, r) => s + r.factura.valor, 0)),
    cobrado: redondear(filas.reduce((s, r) => s + r.validado, 0)),
    saldo: redondear(filas.reduce((s, r) => s + r.saldo, 0)),
  }

  const exportar = async () => {
    const { exportarExcel, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    await exportarExcel(nombreArchivoSeguro('facturas_registradas', 'xlsx'), [
      {
        nombre: 'Facturas',
        columnas: ['Factura', 'Referencia', 'Cliente', 'Viajes', 'Modalidad de cobro', 'Emisión', 'Vencimiento', 'Valor', 'Pagos validados', 'Por validar', 'Saldo', 'Estado'],
        filas: filas.map((r) => [
          r.factura.codigo,
          r.factura.referencia,
          r.clienteNombre,
          r.factura.viajeCodigos.join(', '),
          ETIQUETAS_MODALIDAD_COBRO[r.factura.modalidadCobro],
          formatearFecha(r.factura.fechaEmision),
          formatearFecha(r.factura.fechaVencimiento),
          r.factura.valor,
          r.validado,
          r.porValidar,
          r.saldo,
          `${ETIQUETAS_ESTADO_FACTURA[r.estado]}${r.proximaAVencer ? ` (${ETIQUETA_PROXIMA_A_VENCER.toLowerCase()})` : ''}`,
        ]),
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
      clave: 'viajes',
      titulo: 'Servicios',
      visibleDesde: 'lg',
      celda: (r) => (
        <span className="flex flex-wrap gap-x-2">
          {r.factura.viajeCodigos.map((c) => (
            <Link key={c} to={`/viajes/${c}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-info hover:underline underline-offset-2">{c}</Link>
          ))}
        </span>
      ),
    },
    { clave: 'emision', titulo: 'Emisión', visibleDesde: 'xl', valorOrden: (r) => r.factura.fechaEmision, celda: (r) => formatearFecha(r.factura.fechaEmision) },
    {
      clave: 'vencimiento',
      titulo: 'Vencimiento',
      visibleDesde: 'md',
      valorOrden: (r) => r.factura.fechaVencimiento,
      celda: (r) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block">{formatearFecha(r.factura.fechaVencimiento)}</span>
          <span className={`block text-xs ${r.estado === 'vencida' ? 'text-peligro' : 'text-texto-secundario'}`}>{textoVencimiento(r)}</span>
        </span>
      ),
    },
    { clave: 'valor', titulo: 'Valor', alinear: 'derecha', visibleDesde: 'lg', valorOrden: (r) => r.factura.valor, celda: (r) => <span className="tabular-nums">{formatearMoneda(r.factura.valor)}</span> },
    { clave: 'saldo', titulo: 'Saldo', alinear: 'derecha', valorOrden: (r) => r.saldo, celda: (r) => <span className="tabular-nums font-medium">{formatearMoneda(r.saldo)}</span> },
    { clave: 'estado', titulo: 'Estado', visibleDesde: 'md', valorOrden: (r) => r.estado, celda: (r) => <InsigniaEstadoFactura estado={r.estado} proximaAVencer={r.proximaAVencer} /> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Facturas"
        descripcion="Referencias de facturas emitidas y su asociación con los viajes facturados."
        acciones={
          <>
            <Boton icono={FileSpreadsheet} onClick={() => void exportar()} disabled={filas.length === 0}>Exportar Excel</Boton>
            {puede('facturas.escribir') && <Boton variante="primario" icono={FileCheck2} onClick={() => establecerRegistrando(true)}>Registrar factura</Boton>}
          </>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Facturas" valor={filas.length} detalle="Con los filtros aplicados" icono={Receipt} tono="neutro" />
        <TarjetaIndicador titulo="Facturado" valor={formatearMoneda(totales.facturado)} icono={CircleDollarSign} tono="info" />
        <TarjetaIndicador titulo="Cobrado" valor={formatearMoneda(totales.cobrado)} detalle="Pagos validados" icono={Banknote} tono="exito" />
        <TarjetaIndicador titulo="Saldo pendiente" valor={formatearMoneda(totales.saldo)} icono={Wallet} tono={totales.saldo > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/cartera" />
      </div>

      <section aria-label="Filtros" className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
        <CampoBusqueda className="lg:w-72" valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Factura, referencia, cliente o viaje" />
        <Selector etiqueta="Cliente" textoTodos="Todos" className="lg:w-64" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Estado" textoTodos="Todos" className="lg:w-52" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={FILTROS_ESTADO} />
        <Selector etiqueta="Cobro" textoTodos="Todos" className="lg:w-44" value={cobro} onChange={(e) => listado.establecerFiltro('cobro', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD_COBRO, MODALIDADES_COBRO)} />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
      </section>

      <Tabla
        etiqueta="Facturas registradas"
        columnas={columnas}
        filas={filas}
        claveFila={(r) => r.factura.codigo}
        listado={listado}
        onFila={(r) => navegar(`/contabilidad/facturas/${r.factura.codigo}`)}
        resaltarFila={(r) => r.estado === 'vencida'}
        acciones={
          puede('pagos.registrar')
            ? (r) => (
                <BotonIcono
                  icono={Banknote}
                  etiqueta={`Registrar pago de ${r.factura.codigo}`}
                  motivoDeshabilitado={r.disponibleParaPago > 0 ? undefined : r.saldo === 0 ? 'Factura cobrada' : 'El saldo restante está en pagos por validar'}
                  onClick={(e) => {
                    e.stopPropagation()
                    establecerPagando(r.factura.codigo)
                  }}
                />
              )
            : undefined
        }
      />

      <ModalRegistrarFactura abierto={registrando} onCerrar={() => establecerRegistrando(false)} onRegistrada={(f) => navegar(`/contabilidad/facturas/${f.codigo}`)} />
      {pagando && <ModalRegistrarPago abierto facturaInicial={pagando} onCerrar={() => establecerPagando(null)} />}
    </>
  )
}
