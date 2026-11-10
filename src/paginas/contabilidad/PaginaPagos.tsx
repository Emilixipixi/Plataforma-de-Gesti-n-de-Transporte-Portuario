import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Banknote, Clock, Paperclip } from 'lucide-react'
import { ESTADOS_PAGO, type Pago } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { InsigniaEstadoPago } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { ModalComprobantePago, ModalRegistrarPago, ModalValidarPago } from '@/componentes/contabilidad/ModalesContabilidad'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreUsuario } from '@/servicios/consultas'
import { redondear } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_PAGO, opcionesDe } from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

export default function PaginaPagos() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const [registrando, establecerRegistrando] = useState(false)
  const [validando, establecerValidando] = useState<Pago | null>(null)
  const [editandoComprobante, establecerEditandoComprobante] = useState<Pago | null>(null)

  const estado = listado.filtro('estado')
  const cliente = listado.filtro('cliente')
  const desde = listado.filtro('desde')
  const hasta = listado.filtro('hasta')
  const clienteDePago = (p: Pago) => obtener(datos, 'facturas', p.facturaCodigo)?.clienteCodigo

  const filas = datos.pagos.filter((p) => {
    const dia = claveDia(p.fecha)
    const factura = obtener(datos, 'facturas', p.facturaCodigo)
    return (
      (!estado || p.estado === estado) &&
      (!cliente || clienteDePago(p) === cliente) &&
      (!desde || dia >= desde) &&
      (!hasta || dia <= hasta) &&
      coincideTexto(listado.busqueda, [p.codigo, p.referencia, p.facturaCodigo, factura?.referencia, nombreCliente(datos, factura?.clienteCodigo)])
    )
  })
  const porValidar = filas.filter((p) => p.estado === 'registrado')
  const validados = filas.filter((p) => p.estado === 'validado')
  const suma = (lista: readonly Pago[]) => redondear(lista.reduce((s, p) => s + p.valor, 0))

  const columnas: Columna<Pago>[] = [
    {
      clave: 'codigo',
      titulo: 'Pago',
      valorOrden: (p) => p.codigo,
      celda: (p) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block font-mono font-semibold">{p.codigo}</span>
          <span className="block text-xs text-texto-secundario">{p.referencia}</span>
          {p.comprobante && (
            <span className="flex items-center gap-1 text-xs text-texto-secundario" title={p.comprobante.nombre}>
              <Paperclip className="size-3 shrink-0" aria-hidden="true" />
              <span className="max-w-40 truncate">{p.comprobante.nombre}</span>
            </span>
          )}
        </span>
      ),
    },
    {
      clave: 'factura',
      titulo: 'Factura',
      valorOrden: (p) => p.facturaCodigo,
      celda: (p) => (
        <span className="block leading-tight">
          <Link to={`/contabilidad/facturas/${p.facturaCodigo}`} onClick={(e) => e.stopPropagation()} className="font-mono text-info hover:underline underline-offset-2">{p.facturaCodigo}</Link>
          <span className="block text-xs text-texto-secundario max-w-56 truncate">{nombreCliente(datos, clienteDePago(p))}</span>
        </span>
      ),
    },
    { clave: 'fecha', titulo: 'Fecha', visibleDesde: 'md', valorOrden: (p) => p.fecha, celda: (p) => <span className="whitespace-nowrap">{formatearFecha(p.fecha)}</span> },
    { clave: 'registro', titulo: 'Registrado por', visibleDesde: 'xl', celda: (p) => (p.registradoPor ? nombreUsuario(datos, p.registradoPor) : 'Sin dato') },
    {
      clave: 'validacion',
      titulo: 'Validación',
      visibleDesde: 'lg',
      celda: (p) => (p.estado === 'validado' ? <span className="block leading-tight"><span className="block">{nombreUsuario(datos, p.validadorCodigo)}</span><span className="block text-xs text-texto-secundario">{formatearFecha(p.fechaValidacion)}</span></span> : <span className="text-texto-secundario">Pendiente</span>),
    },
    { clave: 'valor', titulo: 'Valor', alinear: 'derecha', valorOrden: (p) => p.valor, celda: (p) => <span className="tabular-nums">{formatearMoneda(p.valor)}</span> },
    { clave: 'estado', titulo: 'Estado', visibleDesde: 'md', valorOrden: (p) => p.estado, celda: (p) => <InsigniaEstadoPago estado={p.estado} /> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Pagos"
        descripcion="Registro de abonos, pagos parciales y cancelaciones totales, con validación antes de reducir el saldo."
        acciones={puede('pagos.registrar') ? <Boton variante="primario" icono={Banknote} onClick={() => establecerRegistrando(true)}>Registrar pago</Boton> : undefined}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 mb-5">
        <TarjetaIndicador titulo="Por validar" valor={porValidar.length} detalle={formatearMoneda(suma(porValidar))} icono={Clock} tono={porValidar.length > 0 ? 'pendiente' : 'neutro'} enlace="/contabilidad/pagos?estado=registrado" />
        <TarjetaIndicador titulo="Validados" valor={validados.length} detalle={formatearMoneda(suma(validados))} icono={BadgeCheck} tono="exito" />
        <TarjetaIndicador titulo="Total registrado" valor={formatearMoneda(suma(filas))} detalle="Con los filtros aplicados" icono={Banknote} tono="info" />
      </div>

      <section aria-label="Filtros" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Pago, referencia, factura o cliente" />
        <Selector etiqueta="Estado" textoTodos="Todos" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_PAGO, ESTADOS_PAGO)} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <CampoTexto etiqueta="Desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden lg:block" />}
      </section>

      <Tabla
        etiqueta="Pagos registrados"
        columnas={columnas}
        filas={filas}
        claveFila={(p) => p.codigo}
        listado={listado}
        onFila={(p) => navegar(`/contabilidad/facturas/${p.facturaCodigo}`)}
        resaltarFila={(p) => p.estado === 'registrado'}
        acciones={
          puede('pagos.validar') || puede('pagos.registrar')
            ? (p) =>
                p.estado === 'registrado' ? (
                  <span className="inline-flex items-center gap-1">
                    {puede('pagos.registrar') && (
                      <BotonIcono icono={Paperclip} etiqueta={p.comprobante ? `Cambiar o quitar el comprobante de ${p.codigo}` : `Agregar comprobante a ${p.codigo}`} onClick={() => establecerEditandoComprobante(p)} />
                    )}
                    {puede('pagos.validar') && (
                      <Boton
                        tamano="pequeno"
                        icono={BadgeCheck}
                        onClick={(e) => {
                          e.stopPropagation()
                          establecerValidando(p)
                        }}
                      >
                        Validar
                      </Boton>
                    )}
                  </span>
                ) : null
            : undefined
        }
      />

      <ModalRegistrarPago abierto={registrando} onCerrar={() => establecerRegistrando(false)} />
      <ModalValidarPago pago={validando} onCerrar={() => establecerValidando(null)} />
      <ModalComprobantePago pago={editandoComprobante} onCerrar={() => establecerEditandoComprobante(null)} />
    </>
  )
}
