import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, FileCheck2, LayoutList, Receipt, Rows3, Users, Wallet } from 'lucide-react'
import { MODALIDADES, MODALIDADES_COBRO, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { ModalRegistrarFactura } from '@/componentes/contabilidad/ModalesContabilidad'
import { coincideTexto } from '@/servicios/repositorio'
import { nombreCliente } from '@/servicios/consultas'
import { agruparPorCliente, descripcionServicio, serviciosPorFacturar } from '@/servicios/contabilidad'
import { redondear } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_COBRO, ETIQUETAS_MODALIDAD_CORTA, opcionesDe } from '@/utilidades/constantes'
import { diferenciaDias } from '@/utilidades/fechas'
import { formatearFecha, formatearMoneda } from '@/utilidades/formateadores'

interface Facturando {
  clienteCodigo: string
  viajes: string[]
}

function diasDesdeCierre(viaje: Viaje, ahora: Date): number | null {
  return viaje.cierreReal ? diferenciaDias(viaje.cierreReal, ahora) : null
}

function TextoDias({ dias }: { dias: number | null }) {
  if (dias === null) return <span className="text-texto-secundario">Sin cierre</span>
  return <span className="tabular-nums">{dias === 0 ? 'Hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`}</span>
}

export default function PaginaPorFacturar() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'cierre', direccionPredeterminada: 'asc', conservar: ['vista'] })
  const ahora = useMemo(() => new Date(), [])
  const [seleccion, establecerSeleccion] = useState<Record<string, string[]>>({})
  const [facturando, establecerFacturando] = useState<Facturando | null>(null)
  const puedeFacturar = puede('facturas.escribir')

  const vista = listado.filtro('vista') === 'lista' ? 'lista' : 'cliente'
  const cliente = listado.filtro('cliente')
  const modalidad = listado.filtro('modalidad')
  const cobro = listado.filtro('cobro')

  const pendientes = serviciosPorFacturar(datos)
  const filas = pendientes.filter(
    (v) =>
      (!cliente || v.clienteCodigo === cliente) &&
      (!modalidad || v.modalidad === modalidad) &&
      (!cobro || v.modalidadCobro === cobro) &&
      coincideTexto(listado.busqueda, [v.codigo, nombreCliente(datos, v.clienteCodigo), v.carga.contenedor?.numero, v.carga.descripcion]),
  )
  const grupos = agruparPorCliente(datos, filas)
  const total = redondear(filas.reduce((s, v) => s + v.valorReferencial, 0))
  const masAntiguo = filas.map((v) => diasDesdeCierre(v, ahora)).filter((d): d is number => d !== null).sort((a, b) => b - a)[0]
  const enCamino = datos.viajes.filter((v) => v.estado === 'en_ejecucion' || v.estado === 'entregado_pendiente_devolucion')

  const alternar = (clienteCodigo: string, codigo: string) =>
    establecerSeleccion((actual) => {
      const lista = actual[clienteCodigo] ?? []
      return { ...actual, [clienteCodigo]: lista.includes(codigo) ? lista.filter((c) => c !== codigo) : [...lista, codigo] }
    })
  const abrirFactura = (clienteCodigo: string, viajes: string[]) => establecerFacturando({ clienteCodigo, viajes })

  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <Link to={`/viajes/${v.codigo}`} className="font-mono font-semibold text-info hover:underline underline-offset-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>{v.codigo}</Link> },
    { clave: 'cliente', titulo: 'Cliente', visibleDesde: 'md', valorOrden: (v) => nombreCliente(datos, v.clienteCodigo), celda: (v) => <span className="block max-w-64 truncate">{nombreCliente(datos, v.clienteCodigo)}</span> },
    { clave: 'servicio', titulo: 'Servicio', visibleDesde: 'xl', celda: (v) => <span className="block leading-tight"><span className="block">{ETIQUETAS_MODALIDAD[v.modalidad]}</span><span className="block text-xs text-texto-secundario max-w-72 truncate">{descripcionServicio(datos, v)}</span></span> },
    { clave: 'cierre', titulo: 'Cierre', visibleDesde: 'md', valorOrden: (v) => v.cierreReal, celda: (v) => <span className="whitespace-nowrap">{formatearFecha(v.cierreReal)}</span> },
    { clave: 'dias', titulo: 'Antigüedad', visibleDesde: 'md', valorOrden: (v) => diasDesdeCierre(v, ahora) ?? undefined, celda: (v) => <TextoDias dias={diasDesdeCierre(v, ahora)} /> },
    { clave: 'cobro', titulo: 'Cobro', visibleDesde: 'lg', valorOrden: (v) => v.modalidadCobro, celda: (v) => ETIQUETAS_MODALIDAD_COBRO[v.modalidadCobro] },
    { clave: 'valor', titulo: 'Valor registrado', alinear: 'derecha', valorOrden: (v) => v.valorReferencial, celda: (v) => <span className="tabular-nums">{formatearMoneda(v.valorReferencial)}</span> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Servicios por facturar"
        descripcion="Viajes finalizados que aún no figuran en una factura. Agrupe servicios del mismo cliente para registrar una factura."
        acciones={puedeFacturar ? <Boton variante="primario" icono={FileCheck2} onClick={() => abrirFactura(cliente, [])}>Registrar factura</Boton> : undefined}
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Servicios" valor={filas.length} detalle="Finalizados sin factura" icono={Receipt} tono="pendiente" />
        <TarjetaIndicador titulo="Valor por facturar" valor={formatearMoneda(total)} detalle="Suma de valores registrados" icono={Wallet} tono="info" />
        <TarjetaIndicador titulo="Clientes" valor={grupos.length} detalle="Con servicios pendientes" icono={Users} tono="neutro" />
        <TarjetaIndicador titulo="Más antiguo" valor={masAntiguo === undefined ? 'Sin datos' : `${masAntiguo} ${masAntiguo === 1 ? 'día' : 'días'}`} detalle="Desde el cierre del viaje" icono={CalendarClock} tono={masAntiguo !== undefined && masAntiguo > 15 ? 'peligro' : 'neutro'} />
      </div>

      <section aria-label="Filtros" className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
        <CampoBusqueda className="lg:w-72" valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Viaje, cliente o contenedor" />
        <Selector etiqueta="Cliente" textoTodos="Todos" className="lg:w-64" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Modalidad" textoTodos="Todas" className="lg:w-52" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <Selector etiqueta="Cobro" textoTodos="Todos" className="lg:w-44" value={cobro} onChange={(e) => listado.establecerFiltro('cobro', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD_COBRO, MODALIDADES_COBRO)} />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
        <div className="lg:ml-auto inline-flex rounded-md border border-borde bg-superficie p-0.5 self-start lg:self-end" role="group" aria-label="Vista">
          <Boton tamano="pequeno" variante={vista === 'cliente' ? 'primario' : 'fantasma'} icono={Rows3} aria-pressed={vista === 'cliente'} onClick={() => listado.establecerFiltro('vista', '')}>Por cliente</Boton>
          <Boton tamano="pequeno" variante={vista === 'lista' ? 'primario' : 'fantasma'} icono={LayoutList} aria-pressed={vista === 'lista'} onClick={() => listado.establecerFiltro('vista', 'lista')}>Lista</Boton>
        </div>
      </section>

      {vista === 'lista' ? (
        <Tabla
          etiqueta="Servicios por facturar"
          columnas={columnas}
          filas={filas}
          claveFila={(v) => v.codigo}
          listado={listado}
          onFila={(v) => navegar(`/viajes/${v.codigo}`)}
          tituloVacio="Sin servicios por facturar"
          descripcionVacio="Los viajes finalizados aparecerán aquí hasta que se registre su factura."
          acciones={puedeFacturar ? (v) => <Boton tamano="pequeno" icono={FileCheck2} onClick={() => abrirFactura(v.clienteCodigo, [v.codigo])}>Facturar</Boton> : undefined}
        />
      ) : grupos.length === 0 ? (
        <EstadoVacio titulo="Sin servicios por facturar" descripcion="Los viajes finalizados aparecerán aquí hasta que se registre su factura." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {grupos.map((grupo) => {
            const elegidos = (seleccion[grupo.clienteCodigo] ?? []).filter((c) => grupo.viajes.some((v) => v.codigo === c))
            const subtotal = redondear(grupo.viajes.filter((v) => elegidos.includes(v.codigo)).reduce((s, v) => s + v.valorReferencial, 0))
            return (
              <Panel
                key={grupo.clienteCodigo}
                sinRelleno
                titulo={grupo.clienteNombre}
                descripcion={`${grupo.viajes.length} ${grupo.viajes.length === 1 ? 'servicio' : 'servicios'} · ${formatearMoneda(grupo.total)}`}
                acciones={
                  puedeFacturar ? (
                    <Boton
                      tamano="pequeno"
                      variante={elegidos.length > 0 ? 'primario' : 'secundario'}
                      icono={FileCheck2}
                      onClick={() => abrirFactura(grupo.clienteCodigo, elegidos.length > 0 ? elegidos : grupo.viajes.map((v) => v.codigo))}
                    >
                      {elegidos.length > 0 ? `Facturar ${elegidos.length} (${formatearMoneda(subtotal)})` : grupo.viajes.length > 1 ? 'Agrupar todos' : 'Facturar'}
                    </Boton>
                  ) : undefined
                }
              >
                <ul className="divide-y divide-borde">
                  {grupo.viajes.map((v) => {
                    const dias = diasDesdeCierre(v, ahora)
                    return (
                      <li key={v.codigo} className="flex items-start gap-3 px-4 py-2.5">
                        {puedeFacturar && (
                          <input
                            type="checkbox"
                            className="size-4 mt-0.5 accent-primario shrink-0"
                            aria-label={`Seleccionar ${v.codigo}`}
                            checked={elegidos.includes(v.codigo)}
                            onChange={() => alternar(grupo.clienteCodigo, v.codigo)}
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <Link to={`/viajes/${v.codigo}`} className="font-mono font-semibold text-info hover:underline underline-offset-2">{v.codigo}</Link>
                            <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}</span>
                            <Insignia>{ETIQUETAS_MODALIDAD_COBRO[v.modalidadCobro]}</Insignia>
                          </span>
                          <span className="block text-xs text-texto-secundario truncate">{descripcionServicio(datos, v)}</span>
                          <span className="block text-xs text-texto-secundario">Cerrado {formatearFecha(v.cierreReal)} · <TextoDias dias={dias} /></span>
                        </span>
                        <span className="text-sm tabular-nums shrink-0">{formatearMoneda(v.valorReferencial)}</span>
                      </li>
                    )
                  })}
                </ul>
              </Panel>
            )
          })}
        </div>
      )}

      <p className="mt-5 text-xs text-texto-secundario">
        {enCamino.length} {enCamino.length === 1 ? 'viaje en ejecución o pendiente de devolución pasará' : 'viajes en ejecución o pendientes de devolución pasarán'} a esta bandeja cuando Operaciones registre su cierre.
      </p>

      {facturando && (
        <ModalRegistrarFactura
          abierto
          clienteInicial={facturando.clienteCodigo || undefined}
          viajesIniciales={facturando.viajes}
          onCerrar={() => establecerFacturando(null)}
          onRegistrada={(factura) => navegar(`/contabilidad/facturas/${factura.codigo}`)}
        />
      )}
    </>
  )
}
