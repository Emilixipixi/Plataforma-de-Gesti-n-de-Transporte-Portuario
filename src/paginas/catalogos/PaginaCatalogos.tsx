import { useEffect, useRef, type ComponentType } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { ArrowUpRight, Building2, Flag, MapPin, Package, TriangleAlert, Truck, UserRound, Warehouse, type LucideProps } from 'lucide-react'
import {
  DISPONIBILIDADES_CHOFER,
  DISPONIBILIDADES_UNIDAD,
  MODALIDADES,
  TIPOS_LUGAR,
  type DatosApp,
  type Viaje,
} from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Insignia } from '@/componentes/comunes/Insignia'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { Panel } from '@/componentes/comunes/Panel'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { PanelCatalogo } from '@/paginas/catalogos/PanelCatalogo'
import {
  FormularioChofer,
  FormularioLugar,
  FormularioTipoCarga,
  FormularioTipoEvento,
  FormularioTipoIncidencia,
  FormularioTransportista,
  FormularioUnidad,
} from '@/paginas/catalogos/FormulariosCatalogo'
import { nombreTransportista } from '@/servicios/consultas'
import { esViajeAbierto, secuenciaDeHitos } from '@/utilidades/calculos'
import {
  CATALOGOS,
  esHitoDelSistema,
  ETIQUETAS_DISPONIBILIDAD_CHOFER,
  ETIQUETAS_DISPONIBILIDAD_UNIDAD,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODALIDAD_CORTA,
  ETIQUETAS_TIPO_LUGAR,
  opcionesDe,
  TONOS_DISPONIBILIDAD_CHOFER,
  TONOS_DISPONIBILIDAD_UNIDAD,
  type ClaveCatalogo,
} from '@/utilidades/constantes'

function viajesAbiertosCon(datos: DatosApp, condicion: (v: Viaje) => boolean): string[] {
  return datos.viajes.filter((v) => esViajeAbierto(v) && condicion(v)).map((v) => v.codigo)
}

function avisoViajes(codigos: string[]): string | undefined {
  if (codigos.length === 0) return undefined
  return `Está asignado a ${codigos.length === 1 ? 'un viaje abierto' : `${codigos.length} viajes abiertos`} (${codigos.join(', ')}). Esos viajes conservan la asignación.`
}

function Uso({ cantidad, singular, plural }: { cantidad: number; singular: string; plural: string }) {
  return <span className="tabular-nums text-texto-secundario whitespace-nowrap">{cantidad} {cantidad === 1 ? singular : plural}</span>
}

function masUsado(lista: readonly { codigo: string; nombre: string }[], usos: (codigo: string) => number): string {
  const ordenados = [...lista].sort((a, b) => usos(b.codigo) - usos(a.codigo))
  const primero = ordenados[0]
  return primero && usos(primero.codigo) > 0 ? primero.nombre : 'Sin uso'
}

function opcionesTransportistas(datos: DatosApp) {
  return datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))
}

function CatalogoTransportistas() {
  const { datos } = usarApp()
  return (
    <PanelCatalogo
      coleccion="transportistas"
      titulo="Transportistas"
      icono={ICONOS_CATALOGO.transportistas}
      indicadores={[
        { etiqueta: 'Choferes', valor: datos.choferes.length, tono: 'info' },
        { etiqueta: 'Unidades', valor: datos.unidades.length, tono: 'info' },
        { etiqueta: 'Con viajes abiertos', valor: datos.transportistas.filter((t) => viajesAbiertosCon(datos, (v) => v.transportistaCodigo === t.codigo).length > 0).length, tono: 'pendiente' },
      ]}
      singular="transportista"
      descripcion="Empresas de transporte con sus choferes y unidades."
      Formulario={FormularioTransportista}
      nombre={(t) => t.razonSocial}
      textoBusqueda={(t) => [t.razonSocial, t.contacto, t.telefono]}
      avisoDesactivar={(t) => avisoViajes(viajesAbiertosCon(datos, (v) => v.transportistaCodigo === t.codigo))}
      columnas={[
        { clave: 'razonSocial', titulo: 'Razón social', valorOrden: (t) => t.razonSocial, celda: (t) => <span className="font-medium">{t.razonSocial}</span> },
        { clave: 'contacto', titulo: 'Contacto', valorOrden: (t) => t.contacto, ocultarEnMovil: true, celda: (t) => <span className="block leading-tight"><span className="block">{t.contacto}</span><span className="block text-xs text-texto-secundario">{t.telefono}</span></span> },
        { clave: 'choferes', titulo: 'Choferes', alinear: 'centro', valorOrden: (t) => datos.choferes.filter((c) => c.transportistaCodigo === t.codigo).length, celda: (t) => datos.choferes.filter((c) => c.transportistaCodigo === t.codigo).length },
        { clave: 'unidades', titulo: 'Unidades', alinear: 'centro', valorOrden: (t) => datos.unidades.filter((u) => u.transportistaCodigo === t.codigo).length, celda: (t) => datos.unidades.filter((u) => u.transportistaCodigo === t.codigo).length },
        { clave: 'abiertos', titulo: 'Viajes abiertos', alinear: 'centro', ocultarEnMovil: true, valorOrden: (t) => viajesAbiertosCon(datos, (v) => v.transportistaCodigo === t.codigo).length, celda: (t) => viajesAbiertosCon(datos, (v) => v.transportistaCodigo === t.codigo).length },
      ]}
    />
  )
}

function CatalogoChoferes() {
  const { datos } = usarApp()
  return (
    <PanelCatalogo
      coleccion="choferes"
      titulo="Choferes"
      icono={ICONOS_CATALOGO.choferes}
      indicadores={DISPONIBILIDADES_CHOFER.map((d) => ({ etiqueta: ETIQUETAS_DISPONIBILIDAD_CHOFER[d], valor: datos.choferes.filter((c) => c.disponibilidad === d).length, tono: TONOS_DISPONIBILIDAD_CHOFER[d] }))}
      singular="chofer"
      descripcion="La disponibilidad es ilustrativa; el aviso de solapamiento se calcula con la programación de los viajes."
      Formulario={FormularioChofer}
      nombre={(c) => c.nombre}
      textoBusqueda={(c) => [c.nombre, c.identificacion, c.telefono, nombreTransportista(datos, c.transportistaCodigo)]}
      avisoDesactivar={(c) => avisoViajes(viajesAbiertosCon(datos, (v) => v.choferCodigo === c.codigo))}
      filtros={[
        { clave: 'transportista', etiqueta: 'Transportista', opciones: opcionesTransportistas(datos), coincide: (c, valor) => c.transportistaCodigo === valor },
        { clave: 'disponibilidad', etiqueta: 'Disponibilidad', opciones: opcionesDe(ETIQUETAS_DISPONIBILIDAD_CHOFER, DISPONIBILIDADES_CHOFER), coincide: (c, valor) => c.disponibilidad === valor },
      ]}
      columnas={[
        { clave: 'nombre', titulo: 'Nombre', valorOrden: (c) => c.nombre, celda: (c) => <span className="font-medium">{c.nombre}</span> },
        { clave: 'identificacion', titulo: 'Cédula', valorOrden: (c) => c.identificacion, ocultarEnMovil: true, celda: (c) => <span className="tabular-nums">{c.identificacion}</span> },
        { clave: 'telefono', titulo: 'Teléfono', visibleDesde: 'lg', celda: (c) => <span className="whitespace-nowrap">{c.telefono}</span> },
        { clave: 'transportista', titulo: 'Transportista', valorOrden: (c) => nombreTransportista(datos, c.transportistaCodigo), ocultarEnMovil: true, celda: (c) => nombreTransportista(datos, c.transportistaCodigo) },
        { clave: 'disponibilidad', titulo: 'Disponibilidad', valorOrden: (c) => c.disponibilidad, celda: (c) => <Insignia tono={TONOS_DISPONIBILIDAD_CHOFER[c.disponibilidad]}>{ETIQUETAS_DISPONIBILIDAD_CHOFER[c.disponibilidad]}</Insignia> },
      ]}
    />
  )
}

function CatalogoUnidades() {
  const { datos } = usarApp()
  return (
    <PanelCatalogo
      coleccion="unidades"
      titulo="Unidades"
      icono={ICONOS_CATALOGO.unidades}
      indicadores={DISPONIBILIDADES_UNIDAD.map((d) => ({ etiqueta: ETIQUETAS_DISPONIBILIDAD_UNIDAD[d], valor: datos.unidades.filter((u) => u.disponibilidad === d).length, tono: TONOS_DISPONIBILIDAD_UNIDAD[d] }))}
      singular="unidad"
      femenino
      descripcion="Vehículos por transportista. La placa se usa en la búsqueda global y en la guía de remisión."
      Formulario={FormularioUnidad}
      nombre={(u) => u.placa}
      textoBusqueda={(u) => [u.placa, u.tipo, nombreTransportista(datos, u.transportistaCodigo)]}
      avisoDesactivar={(u) => avisoViajes(viajesAbiertosCon(datos, (v) => v.unidadCodigo === u.codigo))}
      filtros={[
        { clave: 'transportista', etiqueta: 'Transportista', opciones: opcionesTransportistas(datos), coincide: (u, valor) => u.transportistaCodigo === valor },
        { clave: 'disponibilidad', etiqueta: 'Disponibilidad', opciones: opcionesDe(ETIQUETAS_DISPONIBILIDAD_UNIDAD, DISPONIBILIDADES_UNIDAD), coincide: (u, valor) => u.disponibilidad === valor },
      ]}
      columnas={[
        { clave: 'placa', titulo: 'Placa', valorOrden: (u) => u.placa, celda: (u) => <span className="font-mono font-medium whitespace-nowrap">{u.placa}</span> },
        { clave: 'tipo', titulo: 'Tipo', valorOrden: (u) => u.tipo, celda: (u) => u.tipo },
        { clave: 'transportista', titulo: 'Transportista', valorOrden: (u) => nombreTransportista(datos, u.transportistaCodigo), ocultarEnMovil: true, celda: (u) => nombreTransportista(datos, u.transportistaCodigo) },
        { clave: 'disponibilidad', titulo: 'Disponibilidad', valorOrden: (u) => u.disponibilidad, celda: (u) => <Insignia tono={TONOS_DISPONIBILIDAD_UNIDAD[u.disponibilidad]}>{ETIQUETAS_DISPONIBILIDAD_UNIDAD[u.disponibilidad]}</Insignia> },
      ]}
    />
  )
}

function CatalogoLugares() {
  const { datos } = usarApp()
  const usos = (codigo: string) => datos.viajes.filter((v) => v.rutaPuntos.some((p) => p.lugarCodigo === codigo)).length
  return (
    <PanelCatalogo
      coleccion="lugares"
      titulo="Lugares"
      icono={ICONOS_CATALOGO.lugares}
      indicadores={TIPOS_LUGAR.map((t) => ({ etiqueta: ETIQUETAS_TIPO_LUGAR[t], valor: datos.lugares.filter((l) => l.tipo === t).length, tono: 'info' as const })).filter((i) => i.valor > 0).slice(0, 3)}
      singular="lugar"
      descripcion="Puertos, depósitos, plantas e instalaciones de clientes que forman la ruta de puntos operativos."
      Formulario={FormularioLugar}
      nombre={(l) => l.nombre}
      textoBusqueda={(l) => [l.nombre, l.ciudad, ETIQUETAS_TIPO_LUGAR[l.tipo]]}
      avisoDesactivar={(l) => avisoViajes(viajesAbiertosCon(datos, (v) => v.rutaPuntos.some((p) => p.lugarCodigo === l.codigo)))}
      filtros={[{ clave: 'tipo', etiqueta: 'Tipo de lugar', opciones: opcionesDe(ETIQUETAS_TIPO_LUGAR, TIPOS_LUGAR), coincide: (l, valor) => l.tipo === valor }]}
      columnas={[
        { clave: 'nombre', titulo: 'Nombre', valorOrden: (l) => l.nombre, celda: (l) => <span className="font-medium">{l.nombre}</span> },
        { clave: 'tipo', titulo: 'Tipo', valorOrden: (l) => ETIQUETAS_TIPO_LUGAR[l.tipo], celda: (l) => ETIQUETAS_TIPO_LUGAR[l.tipo] },
        { clave: 'ciudad', titulo: 'Ciudad', valorOrden: (l) => l.ciudad, ocultarEnMovil: true, celda: (l) => l.ciudad },
        { clave: 'uso', titulo: 'Uso', valorOrden: (l) => usos(l.codigo), ocultarEnMovil: true, celda: (l) => <Uso cantidad={usos(l.codigo)} singular="viaje" plural="viajes" /> },
      ]}
    />
  )
}

function CatalogoTiposCarga() {
  const { datos } = usarApp()
  const usos = (codigo: string) => datos.viajes.filter((v) => v.carga.categoriaCodigo === codigo).length + datos.solicitudes.filter((s) => s.categoriaCargaCodigo === codigo && !s.viajeCodigo).length
  return (
    <PanelCatalogo
      coleccion="tiposCarga"
      titulo="Tipos de carga"
      icono={ICONOS_CATALOGO['tipos-carga']}
      indicadores={[
        { etiqueta: 'Viajes clasificados', valor: datos.viajes.filter((v) => v.carga.categoriaCodigo).length, tono: 'info' },
        { etiqueta: 'Más utilizado', valor: masUsado(datos.tiposCarga, usos) },
      ]}
      singular="tipo de carga"
      descripcion="Clasificación de la mercadería que alimenta los formularios de solicitud y viaje."
      Formulario={FormularioTipoCarga}
      nombre={(t) => t.nombre}
      textoBusqueda={(t) => [t.nombre]}
      columnas={[
        { clave: 'nombre', titulo: 'Nombre', valorOrden: (t) => t.nombre, celda: (t) => <span className="font-medium">{t.nombre}</span> },
        { clave: 'uso', titulo: 'Uso', valorOrden: (t) => usos(t.codigo), celda: (t) => <Uso cantidad={usos(t.codigo)} singular="registro" plural="registros" /> },
      ]}
    />
  )
}

function SecuenciasPorModalidad() {
  const { datos } = usarApp()
  return (
    <Panel titulo="Secuencia de hitos por modalidad" descripcion="Define el orden del seguimiento y el hito requerido para el cierre (RN-03, RN-04, RN-05).">
      <div className="grid gap-4 lg:grid-cols-3">
        {MODALIDADES.map((modalidad) => (
          <div key={modalidad}>
            <p className="text-sm font-medium text-texto mb-2">{ETIQUETAS_MODALIDAD[modalidad]}</p>
            <ol className="space-y-1.5">
              {secuenciaDeHitos(modalidad, datos.tiposEvento).map((hito, indice) => (
                <li key={hito.codigo} className="flex items-center gap-2 text-sm">
                  <span className="grid place-items-center size-5 rounded-full bg-fondo border border-borde text-[11px] tabular-nums text-texto-secundario shrink-0">{indice + 1}</span>
                  <span className="text-texto">{hito.nombre}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function CatalogoTiposEvento() {
  const { datos } = usarApp()
  return (
    <PanelCatalogo
      coleccion="tiposEvento"
      titulo="Tipos de evento e hitos"
      icono={ICONOS_CATALOGO['tipos-evento']}
      indicadores={[
        { etiqueta: 'Hitos del sistema', valor: datos.tiposEvento.filter((t) => esHitoDelSistema(t.codigo)).length, tono: 'info' },
        { etiqueta: 'Eventos adicionales', valor: datos.tiposEvento.filter((t) => !esHitoDelSistema(t.codigo)).length },
        { etiqueta: 'Eventos registrados', valor: datos.eventos.length, tono: 'info' },
      ]}
      singular="tipo de evento"
      descripcion="Hitos predefinidos por modalidad y eventos adicionales que pueden registrarse en la línea de tiempo."
      Formulario={FormularioTipoEvento}
      nombre={(t) => t.nombre}
      textoBusqueda={(t) => [t.nombre, ...t.modalidades.map((m) => ETIQUETAS_MODALIDAD[m])]}
      bloqueoDesactivar={(t) => (esHitoDelSistema(t.codigo) ? 'Hito del sistema: no puede desactivarse' : undefined)}
      nota={<SecuenciasPorModalidad />}
      filtros={[{ clave: 'modalidad', etiqueta: 'Modalidad', opciones: opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES), coincide: (t, valor) => t.modalidades.some((m) => m === valor) }]}
      columnas={[
        { clave: 'nombre', titulo: 'Nombre', valorOrden: (t) => t.nombre, celda: (t) => <span className="font-medium">{t.nombre}</span> },
        { clave: 'clase', titulo: 'Clase', valorOrden: (t) => (esHitoDelSistema(t.codigo) ? 0 : 1), celda: (t) => (esHitoDelSistema(t.codigo) ? <Insignia tono="info">Hito del sistema</Insignia> : <Insignia tono="neutro">Evento adicional</Insignia>) },
        { clave: 'modalidades', titulo: 'Modalidades', ocultarEnMovil: true, celda: (t) => <span className="flex flex-wrap gap-1">{t.modalidades.map((m) => <Insignia key={m}>{ETIQUETAS_MODALIDAD_CORTA[m]}</Insignia>)}</span> },
      ]}
    />
  )
}

function CatalogoTiposIncidencia() {
  const { datos } = usarApp()
  const usos = (codigo: string) => datos.incidencias.filter((i) => i.tipoIncidenciaCodigo === codigo).length
  return (
    <PanelCatalogo
      coleccion="tiposIncidencia"
      titulo="Tipos de incidencia"
      icono={ICONOS_CATALOGO['tipos-incidencia']}
      indicadores={[
        { etiqueta: 'Incidencias registradas', valor: datos.incidencias.length, tono: 'info' },
        { etiqueta: 'Abiertas', valor: datos.incidencias.filter((i) => i.estado === 'abierta').length, tono: 'peligro' },
        { etiqueta: 'Más frecuente', valor: masUsado(datos.tiposIncidencia, usos) },
      ]}
      singular="tipo de incidencia"
      descripcion="Categorías para registrar paradas, esperas, demoras, problemas y cambios de ruta."
      Formulario={FormularioTipoIncidencia}
      nombre={(t) => t.nombre}
      textoBusqueda={(t) => [t.nombre]}
      columnas={[
        { clave: 'nombre', titulo: 'Nombre', valorOrden: (t) => t.nombre, celda: (t) => <span className="font-medium">{t.nombre}</span> },
        { clave: 'uso', titulo: 'Incidencias registradas', valorOrden: (t) => usos(t.codigo), celda: (t) => <Uso cantidad={usos(t.codigo)} singular="incidencia" plural="incidencias" /> },
      ]}
    />
  )
}

const PANELES: Record<ClaveCatalogo, ComponentType> = {
  transportistas: CatalogoTransportistas,
  choferes: CatalogoChoferes,
  unidades: CatalogoUnidades,
  lugares: CatalogoLugares,
  'tipos-carga': CatalogoTiposCarga,
  'tipos-evento': CatalogoTiposEvento,
  'tipos-incidencia': CatalogoTiposIncidencia,
}

const ICONOS_CATALOGO: Record<ClaveCatalogo, ComponentType<LucideProps>> = {
  transportistas: Warehouse,
  choferes: UserRound,
  unidades: Truck,
  lugares: MapPin,
  'tipos-carga': Package,
  'tipos-evento': Flag,
  'tipos-incidencia': TriangleAlert,
}

const GRUPOS_CATALOGO: { titulo: string; claves: ClaveCatalogo[] }[] = [
  { titulo: 'Recursos de transporte', claves: ['transportistas', 'choferes', 'unidades'] },
  { titulo: 'Operación', claves: ['lugares', 'tipos-carga', 'tipos-evento', 'tipos-incidencia'] },
]

const COLECCION_POR_CLAVE = {
  transportistas: 'transportistas',
  choferes: 'choferes',
  unidades: 'unidades',
  lugares: 'lugares',
  'tipos-carga': 'tiposCarga',
  'tipos-evento': 'tiposEvento',
  'tipos-incidencia': 'tiposIncidencia',
} as const satisfies Record<ClaveCatalogo, keyof DatosApp>

function esClaveCatalogo(valor: string | undefined): valor is ClaveCatalogo {
  return CATALOGOS.some((c) => c.clave === valor)
}

export default function PaginaCatalogos() {
  const { catalogo } = useParams()
  const { datos } = usarApp()
  const navegacion = useRef<HTMLElement>(null)

  useEffect(() => {
    navegacion.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [catalogo])

  if (!esClaveCatalogo(catalogo)) return <PaginaNoEncontrada />
  const PanelActivo = PANELES[catalogo]

  return (
    <>
      <EncabezadoPagina titulo="Catálogos" descripcion="Listas maestras que alimentan los formularios de solicitudes, viajes, seguimiento e incidencias." />
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)] items-start">
        <nav ref={navegacion} aria-label="Catálogos" className="bg-superficie border border-borde rounded-lg p-2 lg:sticky lg:top-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-x-2 gap-y-3">
            {GRUPOS_CATALOGO.map((grupo) => (
              <div key={grupo.titulo} className="col-span-2 sm:col-span-3 lg:col-span-1">
                <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-texto-secundario">{grupo.titulo}</p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                  {grupo.claves.map((clave) => {
                    const c = CATALOGOS.find((x) => x.clave === clave)
                    if (!c) return null
                    const Icono = ICONOS_CATALOGO[clave]
                    const lista = datos[COLECCION_POR_CLAVE[clave]]
                    return (
                      <li key={clave}>
                        <NavLink
                          to={`/catalogos/${clave}`}
                          className={({ isActive }) =>
                            `relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${isActive ? 'bg-fondo text-texto font-medium' : 'text-texto-secundario hover:bg-fondo hover:text-texto'}`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-acento" aria-hidden="true" />}
                              <Icono className={`size-4 shrink-0 ${isActive ? 'text-texto' : ''}`} aria-hidden="true" />
                              <span className="flex-1 min-w-0 truncate">{c.titulo}</span>
                              <span className="text-xs tabular-nums rounded bg-superficie border border-borde px-1.5 text-texto-secundario">{lista.length}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 border-t border-borde pt-2">
              <Link to="/clientes" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-texto-secundario hover:bg-fondo hover:text-texto">
                <Building2 className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">Clientes</span>
                <span className="text-xs tabular-nums">{datos.clientes.length}</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </nav>
        <div className="min-w-0">
          <PanelActivo key={catalogo} />
          {catalogo === 'tipos-incidencia' && (
            <AvisoDemostrativo className="mt-4">Los tipos iniciales corresponden a los definidos en P-10: demora, parada, espera, problema mecánico, problema operativo, cambio de ruta, documentación, entrega y otro.</AvisoDemostrativo>
          )}
        </div>
      </div>
    </>
  )
}
