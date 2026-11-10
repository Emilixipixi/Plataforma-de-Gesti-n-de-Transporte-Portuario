import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniaConIncidencia, InsigniaEstadoViaje, InsigniaRetrasado } from '@/componentes/comunes/Insignia'
import { Boton } from '@/componentes/comunes/Boton'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { coincideTexto } from '@/servicios/repositorio'
import { ESTADOS_VIAJE, MODALIDADES, type Viaje } from '@/tipos/dominio'
import { ETIQUETAS_ESTADO_VIAJE, ETIQUETAS_MODALIDAD, opcionesDe } from '@/utilidades/constantes'
import { esViajeAbierto, estaRetrasado, tieneIncidenciaAbierta } from '@/utilidades/calculos'
import { formatearFechaHora, formatearMoneda } from '@/utilidades/formateadores'

export default function PaginaDashboard() {
  const { datos } = usarApp()
  const { perfil } = usarAutenticacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'salida', direccionPredeterminada: 'desc' })
  const ahora = useMemo(() => new Date(), [])

  const nombreCliente = (codigo: string) => datos.clientes.find((c) => c.codigo === codigo)?.razonSocial ?? codigo
  const estado = listado.filtro('estado')
  const modalidad = listado.filtro('modalidad')

  const filas = datos.viajes.filter(
    (v) =>
      (!estado || v.estado === estado) &&
      (!modalidad || v.modalidad === modalidad) &&
      coincideTexto(listado.busqueda, [v.codigo, nombreCliente(v.clienteCodigo), v.carga.contenedor?.numero]),
  )

  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <span className="font-mono font-semibold whitespace-nowrap">{v.codigo}</span> },
    { clave: 'cliente', titulo: 'Cliente', valorOrden: (v) => nombreCliente(v.clienteCodigo), celda: (v) => nombreCliente(v.clienteCodigo) },
    { clave: 'modalidad', titulo: 'Modalidad', valorOrden: (v) => ETIQUETAS_MODALIDAD[v.modalidad], celda: (v) => ETIQUETAS_MODALIDAD[v.modalidad], ocultarEnMovil: true },
    {
      clave: 'estado',
      titulo: 'Estado',
      valorOrden: (v) => ESTADOS_VIAJE.indexOf(v.estado),
      celda: (v) => (
        <span className="flex flex-wrap gap-1">
          <InsigniaEstadoViaje estado={v.estado} />
          {tieneIncidenciaAbierta(v.codigo, datos.incidencias) && <InsigniaConIncidencia />}
          {esViajeAbierto(v) && estaRetrasado(v, datos.eventos, ahora) && <InsigniaRetrasado />}
        </span>
      ),
    },
    { clave: 'salida', titulo: 'Salida prevista', valorOrden: (v) => v.salidaPrevista, celda: (v) => formatearFechaHora(v.salidaPrevista), ocultarEnMovil: true },
    { clave: 'valor', titulo: 'Valor', alinear: 'derecha', valorOrden: (v) => v.valorReferencial, celda: (v) => formatearMoneda(v.valorReferencial) },
  ]

  return (
    <>
      <EncabezadoPagina
        titulo="Dashboard"
        descripcion={perfil === 'contabilidad' ? 'Resumen contable del prototipo.' : 'Resumen operativo del prototipo.'}
      />
      <AvisoDemostrativo className="mb-5">
        {perfil === 'contabilidad'
          ? 'Los indicadores contables (por facturar, facturado, cartera pendiente, vencida y próxima a vencer) se incorporan en la Fase 6.'
          : 'Los indicadores, gráficos y paneles del dashboard operativo se incorporan en la Fase 4.'}{' '}
        Mientras tanto se muestran los viajes cargados en los datos demostrativos.
      </AvisoDemostrativo>
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
        <CampoBusqueda className="md:w-80" valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Buscar por código, cliente o contenedor" />
        <Selector etiqueta="Estado" textoTodos="Todos los estados" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_VIAJE, ESTADOS_VIAJE)} className="md:w-60" />
        <Selector etiqueta="Modalidad" textoTodos="Todas las modalidades" value={modalidad} onChange={(e) => listado.establecerFiltro('modalidad', e.target.value)} opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} className="md:w-64" />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
      </div>
      <Tabla
        etiqueta="Viajes cargados"
        columnas={columnas}
        filas={filas}
        claveFila={(v) => v.codigo}
        listado={listado}
        onFila={(v) => navegar(`/viajes/${v.codigo}`)}
        resaltarFila={(v) => tieneIncidenciaAbierta(v.codigo, datos.incidencias)}
      />
    </>
  )
}
