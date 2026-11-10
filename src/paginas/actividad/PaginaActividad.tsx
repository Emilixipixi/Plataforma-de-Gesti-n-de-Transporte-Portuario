import { Link } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'
import { ACCIONES_ACTIVIDAD, ENTIDADES, type Actividad, type DatosApp } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { coincideTexto, obtener } from '@/servicios/repositorio'
import { nombreUsuario } from '@/servicios/consultas'
import { ETIQUETAS_ACCION_ACTIVIDAD, ETIQUETAS_ENTIDAD, opcionesDe } from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearFecha, formatearHora } from '@/utilidades/formateadores'

function rutaDeEntidad(datos: DatosApp, a: Actividad): string | undefined {
  switch (a.entidad) {
    case 'viaje':
      return obtener(datos, 'viajes', a.codigoEntidad) ? `/viajes/${a.codigoEntidad}` : undefined
    case 'cliente':
      return obtener(datos, 'clientes', a.codigoEntidad) ? `/clientes/${a.codigoEntidad}` : undefined
    case 'solicitud':
      return `/solicitudes?q=${a.codigoEntidad}`
    case 'evento': {
      const evento = obtener(datos, 'eventos', a.codigoEntidad)
      return evento ? `/viajes/${evento.viajeCodigo}?pestana=seguimiento` : undefined
    }
    case 'incidencia': {
      const incidencia = obtener(datos, 'incidencias', a.codigoEntidad)
      return incidencia ? `/viajes/${incidencia.viajeCodigo}?pestana=incidencias` : undefined
    }
    case 'documento': {
      const documento = obtener(datos, 'documentos', a.codigoEntidad)
      return documento ? `/viajes/${documento.viajeCodigo}?pestana=documentos` : undefined
    }
    default:
      return undefined
  }
}

export default function PaginaActividad() {
  const { datos } = usarApp()
  const listado = usarParametrosListado({ ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const usuario = listado.filtro('usuario')
  const accion = listado.filtro('accion')
  const entidad = listado.filtro('entidad')
  const desde = listado.filtro('desde')
  const hasta = listado.filtro('hasta')

  const filas = datos.actividad.filter((a) => {
    const dia = claveDia(a.fechaHora)
    return (
      (!usuario || a.usuarioCodigo === usuario) &&
      (!accion || a.accion === accion) &&
      (!entidad || a.entidad === entidad) &&
      (!desde || dia >= desde) &&
      (!hasta || dia <= hasta) &&
      coincideTexto(listado.busqueda, [a.codigoEntidad, a.descripcion, nombreUsuario(datos, a.usuarioCodigo)])
    )
  })

  const exportar = async () => {
    const { exportarExcel, nombreArchivoSeguro } = await import('@/servicios/exportacion')
    await exportarExcel(nombreArchivoSeguro('registro_actividad', 'xlsx'), [
      {
        nombre: 'Actividad',
        columnas: ['Fecha', 'Hora', 'Usuario', 'Acción', 'Entidad', 'Código', 'Descripción'],
        filas: [...filas].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)).map((a) => [formatearFecha(a.fechaHora), formatearHora(a.fechaHora), nombreUsuario(datos, a.usuarioCodigo), ETIQUETAS_ACCION_ACTIVIDAD[a.accion], ETIQUETAS_ENTIDAD[a.entidad], a.codigoEntidad, a.descripcion]),
      },
    ])
  }

  const columnas: Columna<Actividad>[] = [
    {
      clave: 'fecha',
      titulo: 'Fecha y hora',
      valorOrden: (a) => a.fechaHora,
      celda: (a) => (
        <span className="block leading-tight whitespace-nowrap">
          <span className="block">{formatearFecha(a.fechaHora)}</span>
          <span className="block text-xs text-texto-secundario tabular-nums">{formatearHora(a.fechaHora)}</span>
        </span>
      ),
    },
    { clave: 'usuario', titulo: 'Usuario', visibleDesde: 'md', valorOrden: (a) => nombreUsuario(datos, a.usuarioCodigo), celda: (a) => <span className="whitespace-nowrap">{nombreUsuario(datos, a.usuarioCodigo)}</span> },
    { clave: 'accion', titulo: 'Acción', valorOrden: (a) => ETIQUETAS_ACCION_ACTIVIDAD[a.accion], celda: (a) => <Insignia tono={a.accion === 'importacion' ? 'info' : a.accion === 'cancelacion' ? 'peligro' : 'neutro'}>{ETIQUETAS_ACCION_ACTIVIDAD[a.accion]}</Insignia> },
    {
      clave: 'entidad',
      titulo: 'Entidad y código',
      visibleDesde: 'lg',
      valorOrden: (a) => a.codigoEntidad,
      celda: (a) => {
        const ruta = rutaDeEntidad(datos, a)
        return (
          <span className="block leading-tight whitespace-nowrap">
            <span className="block text-xs text-texto-secundario">{ETIQUETAS_ENTIDAD[a.entidad]}</span>
            {ruta ? <Link to={ruta} className="font-mono text-info hover:underline underline-offset-2">{a.codigoEntidad}</Link> : <span className="font-mono">{a.codigoEntidad}</span>}
          </span>
        )
      },
    },
    { clave: 'descripcion', titulo: 'Descripción', celda: (a) => <span className="block min-w-48 max-w-xl">{a.descripcion}</span> },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Actividad"
        descripcion="Historial de acciones registradas por usuario, generado por las operaciones reales del prototipo."
        acciones={<Boton icono={FileSpreadsheet} onClick={() => void exportar()} disabled={filas.length === 0}>Exportar Excel</Boton>}
      />
      <section aria-label="Filtros" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))_auto] 2xl:items-end mb-4">
        <CampoBusqueda valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Código o descripción" />
        <Selector etiqueta="Usuario" textoTodos="Todos" value={usuario} onChange={(e) => listado.establecerFiltro('usuario', e.target.value)} opciones={datos.usuarios.map((u) => ({ valor: u.codigo, etiqueta: u.nombre }))} />
        <Selector etiqueta="Acción" textoTodos="Todas" value={accion} onChange={(e) => listado.establecerFiltro('accion', e.target.value)} opciones={opcionesDe(ETIQUETAS_ACCION_ACTIVIDAD, ACCIONES_ACTIVIDAD)} />
        <Selector etiqueta="Entidad" textoTodos="Todas" value={entidad} onChange={(e) => listado.establecerFiltro('entidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_ENTIDAD, ENTIDADES)} />
        <CampoTexto etiqueta="Desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => listado.establecerFiltro('desde', e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => listado.establecerFiltro('hasta', e.target.value)} />
        {listado.hayFiltros ? <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton> : <span className="hidden 2xl:block" />}
      </section>
      <Tabla etiqueta="Registro de actividad" columnas={columnas} filas={filas} claveFila={(a) => a.codigo} listado={listado} tituloVacio="Sin actividad" descripcionVacio="No hay acciones registradas con los filtros aplicados." />
    </>
  )
}
