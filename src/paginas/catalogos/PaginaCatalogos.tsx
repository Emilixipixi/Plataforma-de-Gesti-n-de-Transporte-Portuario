import { useEffect, useRef, type ComponentType } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
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

function opcionesTransportistas(datos: DatosApp) {
  return datos.transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))
}

function CatalogoTransportistas() {
  const { datos } = usarApp()
  return (
    <PanelCatalogo
      coleccion="transportistas"
      titulo="Transportistas"
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
    <Panel titulo="Secuencia de hitos por modalidad" descripcion="Define el orden del seguimiento y el hito requerido para el cierre (RN-03, RN-04, RN-05)." className="mb-5">
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
  return (
    <PanelCatalogo
      coleccion="tiposEvento"
      titulo="Tipos de evento e hitos"
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
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav ref={navegacion} aria-label="Catálogos" className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-1 px-1 pb-1 lg:pb-0">
          {CATALOGOS.map((c) => {
            const lista = datos[COLECCION_POR_CLAVE[c.clave]]
            return (
              <NavLink
                key={c.clave}
                to={`/catalogos/${c.clave}`}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap ${isActive ? 'bg-superficie border border-borde text-texto font-medium' : 'text-texto-secundario hover:bg-superficie hover:text-texto border border-transparent'}`
                }
              >
                {c.titulo}
                <span className="text-xs tabular-nums text-texto-secundario">{lista.length}</span>
              </NavLink>
            )
          })}
          <Link to="/clientes" className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap text-texto-secundario hover:bg-superficie hover:text-texto border border-transparent">
            Clientes
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
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
