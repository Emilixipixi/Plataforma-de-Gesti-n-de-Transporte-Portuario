import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ESTADOS_VIAJE, MODALIDADES, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { InsigniaConIncidencia, InsigniaEstadoViaje, InsigniaRetrasado } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar, nombreTransportista } from '@/servicios/consultas'
import { esViajeAbierto, estaRetrasado, tieneIncidenciaAbierta } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_CORTA, opcionesDe } from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearFechaHora, formatearMoneda } from '@/utilidades/formateadores'
import { explicacionSinPermiso } from '@/utilidades/permisos'

const ALERTAS = [
  { valor: 'incidencia', etiqueta: 'Con incidencia abierta' },
  { valor: 'retrasado', etiqueta: 'Retrasados' },
  { valor: 'sin_asignacion', etiqueta: 'Sin asignación completa' },
]

export default function PaginaViajes() {
  const { datos } = usarApp()
  const { puede, perfil } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'salida', direccionPredeterminada: 'desc' })
  const ahora = useMemo(() => new Date(), [])
  const completo = puede('viajes.verCompleto')

  const estado = listado.filtro('estado')
  const modalidad = listado.filtro('modalidad')
  const cliente = listado.filtro('cliente')
  const transportista = listado.filtro('transportista')
  const alerta = listado.filtro('alerta')
  const desde = listado.filtro('desde')
  const hasta = listado.filtro('hasta')

  const conIncidencia = (v: Viaje) => tieneIncidenciaAbierta(v.codigo, datos.incidencias)
  const retrasado = (v: Viaje) => esViajeAbierto(v) && estaRetrasado(v, datos.eventos, ahora)
  const sinAsignacion = (v: Viaje) => esViajeAbierto(v) && (!v.transportistaCodigo || !v.choferCodigo || !v.unidadCodigo || !v.salidaPrevista)

  const filas = datos.viajes.filter((v) => {
    const unidad = obtener(datos, 'unidades', v.unidadCodigo)
    const dia = v.salidaPrevista ? claveDia(v.salidaPrevista) : ''
    return (
      (!estado || v.estado === estado) &&
      (!modalidad || v.modalidad === modalidad) &&
      (!cliente || v.clienteCodigo === cliente) &&
      (!transportista || v.transportistaCodigo === transportista) &&
      (!desde || (dia !== '' && dia >= desde)) &&
      (!hasta || (dia !== '' && dia <= hasta)) &&
      (alerta !== 'incidencia' || conIncidencia(v)) &&
      (alerta !== 'retrasado' || retrasado(v)) &&
      (alerta !== 'sin_asignacion' || sinAsignacion(v)) &&
      coincideTexto(listado.busqueda, [v.codigo, nombreCliente(datos, v.clienteCodigo), v.carga.contenedor?.numero, unidad?.placa, v.solicitudCodigo])
    )
  })

  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <span className="font-mono font-semibold whitespace-nowrap">{v.codigo}</span> },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      valorOrden: (v) => nombreCliente(datos, v.clienteCodigo),
      celda: (v) => (
        <span className="block leading-tight">
          <span className="block">{nombreCliente(datos, v.clienteCodigo)}</span>
          <span className="block text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}{v.carga.contenedor?.numero ? ` · ${v.carga.contenedor.numero}` : ''}</span>
        </span>
      ),
    },
    {
      clave: 'ruta',
      titulo: 'Origen y destino',
      visibleDesde: '2xl',
      celda: (v) => (
        <span className="block leading-tight text-sm">
          <span className="block">{nombreLugar(datos, v.origenCodigo)}</span>
          <span className="block text-xs text-texto-secundario">a {nombreLugar(datos, v.destinoCodigo)}</span>
        </span>
      ),
    },
    { clave: 'salida', titulo: 'Salida prevista', valorOrden: (v) => v.salidaPrevista, celda: (v) => <span className="whitespace-nowrap">{v.salidaPrevista ? formatearFechaHora(v.salidaPrevista) : 'Sin programar'}</span> },
    ...(completo
      ? [
          {
            clave: 'asignacion',
            titulo: 'Asignación',
            visibleDesde: 'xl' as const,
            valorOrden: (v: Viaje) => nombreTransportista(datos, v.transportistaCodigo),
            celda: (v: Viaje) =>
              v.transportistaCodigo ? (
                <span className="block leading-tight">
                  <span className="block">{nombreTransportista(datos, v.transportistaCodigo)}</span>
                  <span className="block text-xs text-texto-secundario">
                    {obtener(datos, 'choferes', v.choferCodigo)?.nombre ?? 'Sin chofer'} · {obtener(datos, 'unidades', v.unidadCodigo)?.placa ?? 'Sin unidad'}
                  </span>
                </span>
              ) : (
                <span className="text-texto-secundario">Sin asignar</span>
              ),
          },
        ]
      : []),
    {
      clave: 'estado',
      titulo: 'Estado',
      valorOrden: (v) => ESTADOS_VIAJE.indexOf(v.estado),
      celda: (v) => (
        <span className="flex flex-wrap gap-1">
          <InsigniaEstadoViaje estado={v.estado} />
          {conIncidencia(v) && <InsigniaConIncidencia />}
          {retrasado(v) && <InsigniaRetrasado />}
        </span>
      ),
    },
    { clave: 'valor', titulo: 'Valor', alinear: 'derecha', visibleDesde: 'lg', valorOrden: (v) => v.valorReferencial, celda: (v) => <span className="tabular-nums">{formatearMoneda(v.valorReferencial)}</span> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Viajes"
        descripcion={completo ? 'Importaciones y exportaciones. Cada viaje es la unidad de seguimiento con su código IMP o EXP.' : 'Consulta de viajes con datos mínimos para Contabilidad.'}
        acciones={
          <Boton variante="primario" icono={Plus} onClick={() => navegar('/viajes/nuevo')} motivoDeshabilitado={puede('viajes.escribir') ? undefined : explicacionSinPermiso(perfil)}>
            Nuevo viaje
          </Boton>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Código, cliente, contenedor o placa" className="sm:col-span-2 lg:col-span-1 lg:self-end" />
        <Selector etiqueta="Estado" textoTodos="Todos los estados" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_VIAJE, ESTADOS_VIAJE)} />
        <Selector etiqueta="Modalidad" textoTodos="Todas" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <Selector etiqueta="Cliente" textoTodos="Todos los clientes" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end mb-4">
        {completo && (
          <Selector etiqueta="Transportista" textoTodos="Todos" value={transportista} onChange={(e) => listado.establecerFiltro('transportista', e.target.value)} opciones={datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))} />
        )}
        <Selector etiqueta="Alertas" textoTodos="Sin filtro" value={alerta} onChange={(e) => listado.establecerFiltro('alerta', e.target.value)} opciones={ALERTAS} />
        <CampoTexto etiqueta="Salida desde" type="date" value={desde} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden lg:block" />}
      </div>
      <Tabla
        etiqueta="Viajes"
        columnas={columnas}
        filas={filas}
        claveFila={(v) => v.codigo}
        listado={listado}
        onFila={(v) => navegar(`/viajes/${v.codigo}`)}
        resaltarFila={(v) => conIncidencia(v) || retrasado(v)}
      />
    </>
  )
}
