import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Check, Eye, Plus } from 'lucide-react'
import { ESTADOS_SOLICITUD, MODALIDADES, type EstadoSolicitud, type Solicitud } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { InsigniaEstadoSolicitud } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { coincideTexto } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar } from '@/servicios/consultas'
import { aceptarSolicitud, convertirSolicitud, rechazarSolicitud } from '@/servicios/operaciones/solicitudes'
import { ETIQUETAS_ESTADO_SOLICITUD, ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_CORTA, opcionesDe } from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearFecha, formatearHora, formatearMoneda } from '@/utilidades/formateadores'
import { ModalConversionSolicitud, ModalDetalleSolicitud, ModalRechazoSolicitud } from '@/paginas/solicitudes/ModalesSolicitud'

export default function PaginaSolicitudes() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'creacion', direccionPredeterminada: 'desc' })
  const [detalle, establecerDetalle] = useState<string | null>(null)
  const [rechazo, establecerRechazo] = useState<Solicitud | null>(null)
  const [conversion, establecerConversion] = useState<Solicitud | null>(null)
  const puedeEscribir = puede('solicitudes.escribir')

  const cliente = listado.filtro('cliente')
  const modalidad = listado.filtro('modalidad')
  const estado = listado.filtro('estado')
  const desde = listado.filtro('desde')
  const hasta = listado.filtro('hasta')

  const coincideSinEstado = (s: Solicitud) =>
    (!cliente || s.clienteCodigo === cliente) &&
    (!modalidad || s.modalidad === modalidad) &&
    (!desde || claveDia(s.fechaRequerida) >= desde) &&
    (!hasta || claveDia(s.fechaRequerida) <= hasta) &&
    coincideTexto(listado.busqueda, [s.codigo, s.viajeCodigo, nombreCliente(datos, s.clienteCodigo), s.descripcionCarga])

  const base = datos.solicitudes.filter(coincideSinEstado)
  const filas = base.filter((s) => !estado || s.estado === estado)
  const conteo = (e: EstadoSolicitud) => base.filter((s) => s.estado === e).length
  const solicitudDetalle = datos.solicitudes.find((s) => s.codigo === detalle) ?? null

  const aceptar = (s: Solicitud) => {
    const resultado = ejecutar(aceptarSolicitud(s.codigo))
    if (resultado.ok) notificar('exito', `Solicitud ${s.codigo} aceptada`, 'Ya puede convertirse en viaje.')
    else notificar('error', 'No se pudo aceptar', resultado.error)
  }

  const rechazar = (motivo: string) => {
    if (!rechazo) return
    const resultado = ejecutar(rechazarSolicitud(rechazo.codigo, motivo))
    if (resultado.ok) notificar('exito', `Solicitud ${rechazo.codigo} rechazada`)
    else notificar('error', 'No se pudo rechazar', resultado.error)
    establecerRechazo(null)
  }

  const convertir = () => {
    if (!conversion) return
    const resultado = ejecutar(convertirSolicitud(conversion.codigo))
    if (resultado.ok) notificar('exito', resultado.mensaje ?? 'Viaje creado', 'Asigne recursos y horarios desde el formulario del viaje.')
    else notificar('error', 'No se pudo convertir', resultado.error)
    establecerConversion(null)
  }

  const columnas: Columna<Solicitud>[] = [
    {
      clave: 'creacion',
      titulo: 'Solicitud',
      valorOrden: (s) => s.fechaCreacion,
      celda: (s) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block font-mono font-semibold">{s.codigo}</span>
          <span className="block text-xs text-texto-secundario">{formatearFecha(s.fechaCreacion)}</span>
        </span>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Cliente y carga',
      valorOrden: (s) => nombreCliente(datos, s.clienteCodigo),
      celda: (s) => (
        <span className="block leading-tight">
          <span className="block">{nombreCliente(datos, s.clienteCodigo)}</span>
          <span className="block text-xs text-texto-secundario">{s.descripcionCarga}</span>
          <span className="block text-xs text-texto-secundario md:hidden">{ETIQUETAS_MODALIDAD_CORTA[s.modalidad]}</span>
        </span>
      ),
    },
    { clave: 'modalidad', titulo: 'Tipo', valorOrden: (s) => ETIQUETAS_MODALIDAD[s.modalidad], celda: (s) => ETIQUETAS_MODALIDAD_CORTA[s.modalidad], visibleDesde: 'md' },
    {
      clave: 'ruta',
      titulo: 'Origen y destino',
      visibleDesde: 'xl',
      celda: (s) => (
        <span className="block leading-tight text-sm">
          <span className="block">{nombreLugar(datos, s.origenCodigo)}</span>
          <span className="block text-xs text-texto-secundario">a {nombreLugar(datos, s.destinoCodigo)}</span>
        </span>
      ),
    },
    {
      clave: 'fecha',
      titulo: 'Requerida',
      valorOrden: (s) => s.fechaRequerida,
      celda: (s) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block">{formatearFecha(s.fechaRequerida)}</span>
          <span className="block text-xs text-texto-secundario tabular-nums">{formatearHora(s.fechaRequerida)}</span>
        </span>
      ),
    },
    {
      clave: 'valor',
      titulo: 'Valor aprox.',
      alinear: 'derecha',
      visibleDesde: 'md',
      valorOrden: (s) => s.valorAproximado,
      celda: (s) => (s.valorAproximado !== undefined ? <span className="tabular-nums whitespace-nowrap">{formatearMoneda(s.valorAproximado)}</span> : <span className="text-texto-secundario">Sin valor</span>),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      valorOrden: (s) => ESTADOS_SOLICITUD.indexOf(s.estado),
      celda: (s) => (
        <span className="flex flex-col items-start gap-1">
          <InsigniaEstadoSolicitud estado={s.estado} />
          {s.viajeCodigo && (
            <Link to={`/viajes/${s.viajeCodigo}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-info whitespace-nowrap hover:underline underline-offset-2">{s.viajeCodigo}</Link>
          )}
        </span>
      ),
    },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Solicitudes"
        descripcion="Requerimientos de transporte recibidos. Una solicitud aceptada se convierte en viaje sin volver a digitar sus datos."
        acciones={puedeEscribir && <Boton variante="primario" icono={Plus} onClick={() => navegar('/solicitudes/nueva')}>Nueva solicitud</Boton>}
      />
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar por estado">
        <Boton tamano="pequeno" variante={estado ? 'secundario' : 'primario'} onClick={() => listado.establecerFiltro('estado', '')}>
          Todas ({base.length})
        </Boton>
        {ESTADOS_SOLICITUD.map((e) => (
          <Boton key={e} tamano="pequeno" variante={estado === e ? 'primario' : 'secundario'} onClick={() => listado.establecerFiltro('estado', estado === e ? '' : e)}>
            {ETIQUETAS_ESTADO_SOLICITUD[e]} ({conteo(e)})
          </Boton>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] xl:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Buscar por código, cliente o carga" className="sm:col-span-2 xl:col-span-1" />
        <Selector etiqueta="Cliente" textoTodos="Todos los clientes" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        <Selector etiqueta="Tipo de operación" textoTodos="Todos" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} />
        <CampoTexto etiqueta="Requerida desde" type="date" value={desde} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden xl:block" />}
      </div>
      <Tabla
        etiqueta="Bandeja de solicitudes"
        columnas={columnas}
        filas={filas}
        claveFila={(s) => s.codigo}
        listado={listado}
        onFila={(s) => establecerDetalle(s.codigo)}
        acciones={(s) => (
          <span className="inline-flex gap-0.5">
            <BotonIcono icono={Eye} etiqueta={`Ver ${s.codigo}`} onClick={() => establecerDetalle(s.codigo)} />
            {puedeEscribir && s.estado === 'recibida' && <BotonIcono icono={Check} etiqueta={`Aceptar ${s.codigo}`} onClick={() => aceptar(s)} />}
            {puedeEscribir && s.estado === 'aceptada' && <BotonIcono icono={ArrowRightLeft} etiqueta={`Convertir ${s.codigo} en viaje`} onClick={() => establecerConversion(s)} />}
          </span>
        )}
      />
      <ModalDetalleSolicitud
        solicitud={solicitudDetalle}
        puedeEscribir={puedeEscribir}
        onCerrar={() => establecerDetalle(null)}
        onEditar={(s) => navegar(`/solicitudes/${s.codigo}/editar`)}
        onAceptar={(s) => aceptar(s)}
        onRechazar={(s) => { establecerDetalle(null); establecerRechazo(s) }}
        onConvertir={(s) => { establecerDetalle(null); establecerConversion(s) }}
      />
      <ModalRechazoSolicitud solicitud={rechazo} onCancelar={() => establecerRechazo(null)} onConfirmar={rechazar} />
      <ModalConversionSolicitud solicitud={conversion} onCancelar={() => establecerConversion(null)} onConfirmar={convertir} />
    </>
  )
}
