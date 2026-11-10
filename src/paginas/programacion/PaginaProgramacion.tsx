import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, TriangleAlert, UserPlus } from 'lucide-react'
import { ESTADOS_VIAJE, MODALIDADES, type EstadoViaje, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado, type ParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { Insignia } from '@/componentes/comunes/Insignia'
import { InsigniasViaje } from '@/componentes/comunes/InsigniasViaje'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { Selector } from '@/componentes/formularios/Selector'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar, nombreTransportista } from '@/servicios/consultas'
import { esViajeAbierto, hayAdvertenciaSolapamiento, tieneAsignacionCompleta, tieneIncidenciaAbierta } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_CORTA, LOCALE, opcionesDe, TONOS_ESTADO_VIAJE, type Tono } from '@/utilidades/constantes'
import { claveDia, esClaveValida, fechaDesdeClave, inicioDeMes, inicioDeSemana, sumarDiasAClave, sumarMesesAClave } from '@/utilidades/fechas'
import { formatearFecha, formatearHora } from '@/utilidades/formateadores'

const ESTADOS_PROGRAMABLES: readonly EstadoViaje[] = ['solicitado', 'programado', 'en_ejecucion', 'entregado_pendiente_devolucion']
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAXIMO_POR_DIA = 3
const PARAMETROS_DE_VISTA = ['vista', 'modo', 'fecha'] as const

const CLASES_CHIP: Record<Tono, string> = {
  exito: 'bg-exito-fondo text-exito border-exito/20',
  pendiente: 'bg-pendiente-fondo text-pendiente border-pendiente/20',
  peligro: 'bg-peligro-fondo text-peligro border-peligro/20',
  info: 'bg-info-fondo text-info border-info/20',
  neutro: 'bg-fondo text-texto-secundario border-borde',
}

const formatoMes = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatoDiaCorto = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function ChipViaje({ viaje, alerta, detallado = false }: { viaje: Viaje; alerta: boolean; detallado?: boolean }) {
  const { datos } = usarApp()
  return (
    <Link
      to={`/viajes/${viaje.codigo}`}
      title={`${viaje.codigo} · ${nombreCliente(datos, viaje.clienteCodigo)} · ${ETIQUETAS_ESTADO_VIAJE[viaje.estado]}`}
      className={`block rounded border px-1.5 py-1 text-xs leading-tight hover:brightness-95 ${CLASES_CHIP[TONOS_ESTADO_VIAJE[viaje.estado]]} ${alerta ? 'border-l-2 border-l-peligro' : ''}`}
    >
      <span className="flex items-center gap-1">
        <span className="tabular-nums">{formatearHora(viaje.salidaPrevista)}</span>
        <span className="font-mono font-semibold">{viaje.codigo}</span>
        {alerta && <TriangleAlert className="size-3 text-peligro shrink-0" aria-label="Con alerta" />}
      </span>
      {detallado && (
        <>
          <span className="block truncate text-texto">{nombreCliente(datos, viaje.clienteCodigo)}</span>
          <span className="block truncate">
            {obtener(datos, 'choferes', viaje.choferCodigo)?.nombre ?? 'Sin chofer'} · {obtener(datos, 'unidades', viaje.unidadCodigo)?.placa ?? 'Sin unidad'}
          </span>
        </>
      )}
    </Link>
  )
}

function Calendario({ viajes, alerta }: { viajes: Viaje[]; alerta: (v: Viaje) => boolean }) {
  const [parametros, establecerParametros] = useSearchParams()
  const hoy = claveDia(new Date())
  const modo = parametros.get('modo') === 'semana' ? 'semana' : 'mes'
  const fechaParametro = parametros.get('fecha')
  const ancla = esClaveValida(fechaParametro) ? fechaParametro : hoy

  const actualizar = (cambios: Record<string, string | null>) =>
    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor === null) nuevos.delete(clave)
          else nuevos.set(clave, valor)
        }
        return nuevos
      },
      { replace: true },
    )

  const porDia = useMemo(() => {
    const mapa = new Map<string, Viaje[]>()
    for (const v of viajes) {
      if (!v.salidaPrevista) continue
      const dia = claveDia(v.salidaPrevista)
      mapa.set(dia, [...(mapa.get(dia) ?? []), v])
    }
    for (const lista of mapa.values()) lista.sort((a, b) => (a.salidaPrevista ?? '').localeCompare(b.salidaPrevista ?? ''))
    return mapa
  }, [viajes])

  const inicio = modo === 'mes' ? inicioDeSemana(inicioDeMes(ancla)) : inicioDeSemana(ancla)
  const mesActual = ancla.slice(0, 7)
  const ultimoDelMes = sumarDiasAClave(sumarMesesAClave(ancla, 1), -1)
  const totalDias = modo === 'mes' ? Math.ceil((Math.round((fechaDesdeClave(ultimoDelMes).getTime() - fechaDesdeClave(inicio).getTime()) / 86400000) + 1) / 7) * 7 : 7
  const dias = Array.from({ length: totalDias }, (_, i) => sumarDiasAClave(inicio, i))
  const titulo =
    modo === 'mes'
      ? capitalizar(formatoMes.format(fechaDesdeClave(ancla)))
      : `Semana del ${formatoDiaCorto.format(fechaDesdeClave(inicio))} al ${formatoDiaCorto.format(fechaDesdeClave(sumarDiasAClave(inicio, 6)))}`
  const mover = (direccion: number) => actualizar({ fecha: modo === 'mes' ? sumarMesesAClave(ancla, direccion) : sumarDiasAClave(ancla, 7 * direccion) })

  return (
    <Panel sinRelleno>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-borde">
        <h2 className="text-sm font-semibold text-texto mr-auto">{titulo}</h2>
        <div className="flex rounded-md border border-borde overflow-hidden" role="group" aria-label="Modo del calendario">
          {(['mes', 'semana'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modo === m} onClick={() => actualizar({ modo: m === 'mes' ? null : m })} className={`px-3 h-8 text-xs font-medium ${modo === m ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
              {m === 'mes' ? 'Mensual' : 'Semanal'}
            </button>
          ))}
        </div>
        <Boton tamano="pequeno" variante="secundario" icono={ChevronLeft} onClick={() => mover(-1)} aria-label="Anterior">Anterior</Boton>
        <Boton tamano="pequeno" variante="secundario" onClick={() => actualizar({ fecha: null })}>Hoy</Boton>
        <Boton tamano="pequeno" variante="secundario" onClick={() => mover(1)} aria-label="Siguiente">
          Siguiente
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Boton>
      </div>
      {modo === 'mes' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 border-b border-borde bg-fondo">
              {DIAS_SEMANA.map((d) => <div key={d} className="px-2 py-1.5 text-xs font-medium text-texto-secundario">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {dias.map((dia) => {
                const lista = porDia.get(dia) ?? []
                const fueraDeMes = dia.slice(0, 7) !== mesActual
                return (
                  <div key={dia} className={`min-h-28 border-b border-r border-borde p-1.5 ${fueraDeMes ? 'bg-fondo/60' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`grid place-items-center size-6 rounded-full text-xs tabular-nums ${dia === hoy ? 'bg-primario text-sobre-primario font-semibold' : fueraDeMes ? 'text-texto-secundario/60' : 'text-texto-secundario'}`}>{Number(dia.slice(8))}</span>
                      {lista.length > 0 && <span className="text-[10px] text-texto-secundario">{lista.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {lista.slice(0, MAXIMO_POR_DIA).map((v) => <ChipViaje key={v.codigo} viaje={v} alerta={alerta(v)} />)}
                      {lista.length > MAXIMO_POR_DIA && (
                        <button type="button" onClick={() => actualizar({ modo: 'semana', fecha: dia })} className="text-[11px] text-info hover:underline">
                          {lista.length - MAXIMO_POR_DIA} más
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-borde">
          {dias.map((dia, i) => {
            const lista = porDia.get(dia) ?? []
            return (
              <div key={dia} className="p-2 min-h-24 md:min-h-80">
                <p className={`text-xs mb-2 ${dia === hoy ? 'font-semibold text-texto' : 'text-texto-secundario'}`}>
                  {DIAS_SEMANA[i]} {formatoDiaCorto.format(fechaDesdeClave(dia))}
                  {dia === hoy && <Insignia tono="info" className="ml-1">Hoy</Insignia>}
                </p>
                <div className="space-y-1.5">
                  {lista.length === 0 ? <p className="text-xs text-texto-secundario/70">Sin viajes</p> : lista.map((v) => <ChipViaje key={v.codigo} viaje={v} alerta={alerta(v)} detallado />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-2 px-4 py-2.5 border-t border-borde text-xs text-texto-secundario">
        {ESTADOS_VIAJE.map((estado) => (
          <span key={estado} className={`rounded border px-1.5 py-0.5 ${CLASES_CHIP[TONOS_ESTADO_VIAJE[estado]]}`}>{ETIQUETAS_ESTADO_VIAJE[estado]}</span>
        ))}
        <span className="inline-flex items-center gap-1"><TriangleAlert className="size-3 text-peligro" aria-hidden="true" />Incidencia o solapamiento</span>
        <span>Ubicado por la fecha de salida prevista.</span>
      </div>
    </Panel>
  )
}

function ListaProgramacion({ viajes, listado, alerta, solapado }: { viajes: Viaje[]; listado: ParametrosListado; alerta: (v: Viaje) => boolean; solapado: (v: Viaje) => boolean }) {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <span className="font-mono font-semibold whitespace-nowrap">{v.codigo}</span> },
    {
      clave: 'fecha',
      titulo: 'Salida',
      valorOrden: (v) => v.salidaPrevista,
      celda: (v) =>
        v.salidaPrevista ? (
          <span className="block leading-tight whitespace-nowrap">
            <span className="block">{formatearFecha(v.salidaPrevista)}</span>
            <span className="block text-xs text-texto-secundario tabular-nums">{formatearHora(v.salidaPrevista)}</span>
          </span>
        ) : (
          <span className="whitespace-nowrap">Sin fecha</span>
        ),
    },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      valorOrden: (v) => nombreCliente(datos, v.clienteCodigo),
      celda: (v) => (
        <span className="block leading-tight">
          <span className="block">{nombreCliente(datos, v.clienteCodigo)}</span>
          <span className="block text-xs text-texto-secundario lg:hidden">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}</span>
        </span>
      ),
    },
    { clave: 'modalidad', titulo: 'Modalidad', visibleDesde: 'lg', valorOrden: (v) => v.modalidad, celda: (v) => ETIQUETAS_MODALIDAD_CORTA[v.modalidad] },
    {
      clave: 'recursos',
      titulo: 'Asignación',
      visibleDesde: 'md',
      valorOrden: (v) => nombreTransportista(datos, v.transportistaCodigo),
      celda: (v) => (
        <span className="block leading-tight">
          <span className="block">{nombreTransportista(datos, v.transportistaCodigo)}</span>
          <span className="block text-xs text-texto-secundario">
            {obtener(datos, 'choferes', v.choferCodigo)?.nombre ?? 'Sin chofer'} · {obtener(datos, 'unidades', v.unidadCodigo)?.placa ?? 'Sin unidad'}
          </span>
        </span>
      ),
    },
    {
      clave: 'ruta',
      titulo: 'Origen y destino',
      visibleDesde: 'xl',
      celda: (v) => (
        <span className="block leading-tight text-sm">
          <span className="block">{nombreLugar(datos, v.origenCodigo)}</span>
          <span className="block text-xs text-texto-secundario">a {nombreLugar(datos, v.destinoCodigo)}</span>
        </span>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      valorOrden: (v) => ESTADOS_VIAJE.indexOf(v.estado),
      celda: (v) => (
        <span className="flex flex-wrap gap-1">
          <InsigniasViaje viaje={v} />
          {solapado(v) && <Insignia tono="pendiente" icono={TriangleAlert}>Solapamiento</Insignia>}
        </span>
      ),
    },
  ]
  return (
    <Tabla
      etiqueta="Programación de viajes"
      columnas={columnas}
      filas={viajes}
      claveFila={(v) => v.codigo}
      listado={listado}
      onFila={(v) => navegar(`/viajes/${v.codigo}`)}
      resaltarFila={alerta}
      tituloVacio="Sin viajes programados"
      descripcionVacio="No hay viajes que coincidan con los filtros."
    />
  )
}

function PendientesAsignacion({ viajes }: { viajes: Viaje[] }) {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  return (
    <Panel titulo="Pendientes de asignación" descripcion="Viajes abiertos sin transportista, chofer, unidad u horarios completos." sinRelleno>
      {viajes.length === 0 ? (
        <EstadoVacio titulo="Todo asignado" descripcion="No hay viajes pendientes de asignación." />
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-1 -mb-px">
          {viajes.map((v) => {
            const faltan = [
              !v.transportistaCodigo && 'transportista',
              !v.choferCodigo && 'chofer',
              !v.unidadCodigo && 'unidad',
              !v.salidaPrevista && 'salida',
              !v.llegadaPrevista && 'llegada',
            ].filter(Boolean)
            return (
              <li key={v.codigo} className="px-4 py-3 border-b border-borde min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/viajes/${v.codigo}`} className="font-mono text-sm font-semibold hover:underline underline-offset-2">{v.codigo}</Link>
                  <span className="text-xs text-texto-secundario">{ETIQUETAS_MODALIDAD_CORTA[v.modalidad]}</span>
                  {puede('viajes.escribir') && (
                    <Link to={`/viajes/${v.codigo}/editar`} className="ml-auto inline-flex items-center gap-1 rounded-md border border-borde px-2 h-7 text-xs font-medium text-texto hover:bg-fondo">
                      <UserPlus className="size-3.5" aria-hidden="true" />
                      Asignar
                    </Link>
                  )}
                </div>
                <p className="text-sm text-texto mt-0.5 truncate">{nombreCliente(datos, v.clienteCodigo)}</p>
                <p className="text-xs text-texto-secundario">
                  {v.salidaPrevista ? `Requerido ${formatearFecha(v.salidaPrevista)} ${formatearHora(v.salidaPrevista)}` : 'Sin fecha'} · Falta: {faltan.join(', ')}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export default function PaginaProgramacion() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', conservar: PARAMETROS_DE_VISTA })
  const [parametros, establecerParametros] = useSearchParams()
  const vista = parametros.get('vista') === 'calendario' ? 'calendario' : 'lista'

  const cliente = listado.filtro('cliente')
  const modalidad = listado.filtro('modalidad')
  const transportista = listado.filtro('transportista')
  const estado = listado.filtro('estado')

  const solapados = useMemo(() => new Set(datos.viajes.filter((v) => hayAdvertenciaSolapamiento(v, datos.viajes).length > 0 && esViajeAbierto(v)).map((v) => v.codigo)), [datos.viajes])
  const solapado = (v: Viaje) => solapados.has(v.codigo)
  const alerta = (v: Viaje) => solapado(v) || tieneIncidenciaAbierta(v.codigo, datos.incidencias)

  const filtrados = datos.viajes.filter(
    (v) =>
      (estado === 'todos' || (estado ? v.estado === estado : ESTADOS_PROGRAMABLES.includes(v.estado))) &&
      (!cliente || v.clienteCodigo === cliente) &&
      (!modalidad || v.modalidad === modalidad) &&
      (!transportista || v.transportistaCodigo === transportista) &&
      coincideTexto(listado.busqueda, [v.codigo, nombreCliente(datos, v.clienteCodigo), obtener(datos, 'unidades', v.unidadCodigo)?.placa, obtener(datos, 'choferes', v.choferCodigo)?.nombre]),
  )
  const pendientes = datos.viajes
    .filter((v) => esViajeAbierto(v) && !tieneAsignacionCompleta(v))
    .sort((a, b) => (a.salidaPrevista ?? '9').localeCompare(b.salidaPrevista ?? '9'))

  const cambiarVista = (nueva: 'lista' | 'calendario') =>
    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (nueva === 'lista') nuevos.delete('vista')
        else nuevos.set('vista', nueva)
        return nuevos
      },
      { replace: true },
    )

  return (
    <>
      <EncabezadoPagina
        titulo="Programación"
        descripcion="Viajes por fecha de salida prevista con su asignación de recursos. Los solapamientos se advierten sin bloquear."
        acciones={
          <>
            <div className="flex rounded-md border border-borde overflow-hidden" role="group" aria-label="Vista">
              {([['lista', List, 'Lista'], ['calendario', CalendarDays, 'Calendario']] as const).map(([valor, Icono, texto]) => (
                <button key={valor} type="button" aria-pressed={vista === valor} onClick={() => cambiarVista(valor)} className={`inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium ${vista === valor ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto-secundario hover:bg-fondo'}`}>
                  <Icono className="size-4" aria-hidden="true" />
                  {texto}
                </button>
              ))}
            </div>
            {puede('viajes.escribir') && <Boton variante="primario" icono={Plus} onClick={() => navegar('/viajes/nuevo')}>Nuevo viaje</Boton>}
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_auto] xl:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Viaje, cliente, chofer o placa" className="sm:col-span-2 xl:col-span-1" />
        <Selector etiqueta="Estado" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={[{ valor: '', etiqueta: 'Por ejecutar o en curso' }, { valor: 'todos', etiqueta: 'Todos los estados' }, ...opcionesDe(ETIQUETAS_ESTADO_VIAJE, ESTADOS_VIAJE)]} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Modalidad" textoTodos="Todas" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <Selector etiqueta="Transportista" textoTodos="Todos" value={transportista} onChange={(e) => listado.establecerFiltro('transportista', e.target.value)} opciones={datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden xl:block" />}
      </div>
      <div className="grid gap-5 min-[1800px]:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          {vista === 'lista' ? <ListaProgramacion viajes={filtrados} listado={listado} alerta={alerta} solapado={solapado} /> : <Calendario viajes={filtrados} alerta={alerta} />}
        </div>
        <PendientesAsignacion viajes={pendientes} />
      </div>
    </>
  )
}
