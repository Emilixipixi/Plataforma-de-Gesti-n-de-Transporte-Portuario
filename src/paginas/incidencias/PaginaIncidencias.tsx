import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Paperclip, TriangleAlert } from 'lucide-react'
import { ESTADOS_INCIDENCIA, type Incidencia } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Insignia, InsigniaEstadoIncidencia } from '@/componentes/comunes/Insignia'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { ModalIncidencia, ModalResolucion } from '@/componentes/viajes/ModalesSeguimiento'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreUsuario } from '@/servicios/consultas'
import { ETIQUETAS_ESTADO_INCIDENCIA, opcionesDe } from '@/utilidades/constantes'
import { minutosEntre } from '@/utilidades/fechas'
import { formatearDuracion, formatearFechaHora } from '@/utilidades/formateadores'

export default function PaginaIncidencias() {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const [parametros, establecerParametros] = useSearchParams()
  const [registrando, establecerRegistrando] = useState(false)
  const [resolviendo, establecerResolviendo] = useState<Incidencia | null>(null)
  const puedeEscribir = puede('incidencias.escribir')

  useEffect(() => {
    if (parametros.get('registrar') !== '1') return
    if (puedeEscribir) establecerRegistrando(true)
    establecerParametros((actuales) => {
      const nuevos = new URLSearchParams(actuales)
      nuevos.delete('registrar')
      return nuevos
    }, { replace: true })
  }, [parametros, establecerParametros, puedeEscribir])

  const estado = listado.filtro('estado')
  const tipo = listado.filtro('tipo')
  const cliente = listado.filtro('cliente')
  const clienteDe = (i: Incidencia) => obtener(datos, 'viajes', i.viajeCodigo)?.clienteCodigo ?? ''
  const nombreTipo = (i: Incidencia) => obtener(datos, 'tiposIncidencia', i.tipoIncidenciaCodigo)?.nombre ?? i.tipoIncidenciaCodigo
  const filas = datos.incidencias.filter(
    (i) =>
      (!estado || i.estado === estado) &&
      (!tipo || i.tipoIncidenciaCodigo === tipo) &&
      (!cliente || clienteDe(i) === cliente) &&
      coincideTexto(listado.busqueda, [i.codigo, i.viajeCodigo, i.descripcion, i.ubicacion, nombreCliente(datos, clienteDe(i))]),
  )
  const abiertas = datos.incidencias.filter((i) => i.estado === 'abierta').length
  const resueltas = datos.incidencias.filter((i) => i.estado === 'resuelta' && i.fechaResolucion)
  const promedio = resueltas.length ? Math.round(resueltas.reduce((s, i) => s + minutosEntre(i.fechaHora, i.fechaResolucion ?? i.fechaHora), 0) / resueltas.length) : null

  const columnas: Columna<Incidencia>[] = [
    { clave: 'codigo', titulo: 'Código', valorOrden: (i) => i.codigo, celda: (i) => <span className="font-mono font-semibold whitespace-nowrap">{i.codigo}</span> },
    {
      clave: 'viaje',
      titulo: 'Viaje',
      valorOrden: (i) => i.viajeCodigo,
      celda: (i) => (
        <span className="block leading-tight">
          <Link to={`/viajes/${i.viajeCodigo}?pestana=incidencias`} onClick={(e) => e.stopPropagation()} className="font-mono text-info hover:underline underline-offset-2">{i.viajeCodigo}</Link>
          <span className="block text-xs text-texto-secundario truncate max-w-48">{nombreCliente(datos, clienteDe(i))}</span>
        </span>
      ),
    },
    { clave: 'tipo', titulo: 'Tipo', valorOrden: nombreTipo, celda: (i) => <Insignia>{nombreTipo(i)}</Insignia> },
    {
      clave: 'descripcion',
      titulo: 'Descripción',
      visibleDesde: 'lg',
      celda: (i) => (
        <span className="block leading-tight max-w-96">
          <span className="block line-clamp-2">{i.descripcion}</span>
          <span className="block text-xs text-texto-secundario">{i.ubicacion} · {nombreUsuario(datos, i.responsableCodigo)}{i.evidencias.length > 0 && <> · <Paperclip className="inline size-3" aria-label="Con evidencia" /> {i.evidencias.length}</>}</span>
          {i.accionCorrectiva && <span className="block text-xs text-exito mt-0.5">Acción: {i.accionCorrectiva}</span>}
        </span>
      ),
    },
    { clave: 'fecha', titulo: 'Fecha', valorOrden: (i) => i.fechaHora, celda: (i) => <span className="whitespace-nowrap">{formatearFechaHora(i.fechaHora)}</span> },
    { clave: 'estado', titulo: 'Estado', valorOrden: (i) => i.estado, celda: (i) => <InsigniaEstadoIncidencia estado={i.estado} /> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Incidencias"
        descripcion="Paradas, esperas, demoras, problemas y cambios de ruta. Se cierran con acción correctiva y fecha de resolución."
        acciones={puedeEscribir && <Boton variante="primario" icono={TriangleAlert} onClick={() => establecerRegistrando(true)}>Registrar incidencia</Boton>}
      />
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <TarjetaIndicador titulo="Abiertas" valor={abiertas} detalle="Sin acción correctiva" icono={TriangleAlert} tono={abiertas > 0 ? 'peligro' : 'neutro'} />
        <TarjetaIndicador titulo="Resueltas" valor={resueltas.length} detalle="Con acción y fecha de resolución" icono={CheckCircle2} tono="exito" />
        <TarjetaIndicador titulo="Tiempo medio de resolución" valor={promedio === null ? 'Sin datos' : formatearDuracion(promedio)} detalle="Desde el registro hasta la resolución" icono={Clock} tono="info" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Código, viaje, cliente o descripción" className="sm:col-span-2 lg:col-span-1" />
        <Selector etiqueta="Estado" textoTodos="Todos" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_INCIDENCIA, ESTADOS_INCIDENCIA)} />
        <Selector etiqueta="Tipo" textoTodos="Todos" value={tipo} onChange={(e) => listado.establecerFiltro('tipo', e.target.value)} opciones={datos.tiposIncidencia.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))} />
        <Selector etiqueta="Cliente" textoTodos="Todos" value={cliente} onChange={(e) => listado.establecerFiltro('cliente', e.target.value)} opciones={datos.clientes.map((c) => ({ valor: c.codigo, etiqueta: c.razonSocial }))} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden lg:block" />}
      </div>
      <Tabla
        etiqueta="Incidencias"
        columnas={columnas}
        filas={filas}
        claveFila={(i) => i.codigo}
        listado={listado}
        resaltarFila={(i) => i.estado === 'abierta'}
        acciones={
          puedeEscribir
            ? (i) => (i.estado === 'abierta' ? <Boton tamano="pequeno" icono={CheckCircle2} onClick={() => establecerResolviendo(i)}>Resolver</Boton> : <span className="text-xs text-texto-secundario whitespace-nowrap">{formatearFechaHora(i.fechaResolucion)}</span>)
            : undefined
        }
        tituloVacio="Sin incidencias"
      />
      {puedeEscribir && <ModalIncidencia abierto={registrando} onCerrar={() => establecerRegistrando(false)} />}
      <ModalResolucion incidencia={resolviendo} onCerrar={() => establecerResolviendo(null)} />
    </>
  )
}
