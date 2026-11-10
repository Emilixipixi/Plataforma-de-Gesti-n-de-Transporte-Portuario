import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardList, Pencil, Plus, Power, PowerOff, Receipt, TriangleAlert, Truck } from 'lucide-react'
import type { Documento, Solicitud, Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { Pestanas, type Pestana } from '@/componentes/comunes/Pestanas'
import { TarjetaIndicador } from '@/componentes/comunes/TarjetaIndicador'
import {
  InsigniaConIncidencia,
  InsigniaEstadoCatalogo,
  InsigniaEstadoServicio,
  InsigniaEstadoSolicitud,
  InsigniaEstadoViaje,
  InsigniaRetrasado,
} from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { ModalConfirmacion } from '@/componentes/modales/ModalConfirmacion'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { documentosDeCliente, nombreLugar, resumenCliente, solicitudesDeCliente, viajesDeCliente } from '@/servicios/consultas'
import { cambiarEstadoCliente } from '@/servicios/operaciones/clientes'
import { esViajeAbierto, estadoFacturacionServicio, estaRetrasado, tieneIncidenciaAbierta } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD, ETIQUETAS_MODALIDAD_COBRO, ETIQUETAS_TIPO_DOCUMENTO } from '@/utilidades/constantes'
import { formatearFecha, formatearFechaHora, formatearMoneda, formatearPorcentaje } from '@/utilidades/formateadores'

function TablaViajes({ viajes }: { viajes: Viaje[] }) {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ prefijo: 'via', ordenPredeterminado: 'salida', direccionPredeterminada: 'desc' })
  const ahora = useMemo(() => new Date(), [])
  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <span className="font-mono font-semibold whitespace-nowrap">{v.codigo}</span> },
    { clave: 'modalidad', titulo: 'Modalidad', valorOrden: (v) => ETIQUETAS_MODALIDAD[v.modalidad], celda: (v) => ETIQUETAS_MODALIDAD[v.modalidad], ocultarEnMovil: true },
    { clave: 'ruta', titulo: 'Origen y destino', ocultarEnMovil: true, celda: (v) => <span className="text-texto-secundario">{nombreLugar(datos, v.origenCodigo)} → {nombreLugar(datos, v.destinoCodigo)}</span> },
    { clave: 'salida', titulo: 'Salida prevista', valorOrden: (v) => v.salidaPrevista, celda: (v) => <span className="whitespace-nowrap">{formatearFechaHora(v.salidaPrevista)}</span> },
    {
      clave: 'estado',
      titulo: 'Estado',
      celda: (v) => (
        <span className="flex flex-wrap gap-1">
          <InsigniaEstadoViaje estado={v.estado} />
          {tieneIncidenciaAbierta(v.codigo, datos.incidencias) && <InsigniaConIncidencia />}
          {esViajeAbierto(v) && estaRetrasado(v, datos.eventos, ahora) && <InsigniaRetrasado />}
        </span>
      ),
    },
  ]
  return (
    <Tabla
      etiqueta="Viajes del cliente"
      columnas={columnas}
      filas={viajes}
      claveFila={(v) => v.codigo}
      listado={listado}
      onFila={(v) => navegar(`/viajes/${v.codigo}`)}
      tituloVacio="Sin viajes"
      descripcionVacio="El cliente todavía no tiene viajes registrados."
    />
  )
}

function TablaServicios({ viajes }: { viajes: Viaje[] }) {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ prefijo: 'ser', ordenPredeterminado: 'cierre', direccionPredeterminada: 'desc' })
  const finalizados = viajes.filter((v) => v.estado === 'finalizado')
  const columnas: Columna<Viaje>[] = [
    { clave: 'codigo', titulo: 'Viaje', valorOrden: (v) => v.codigo, celda: (v) => <span className="font-mono font-semibold whitespace-nowrap">{v.codigo}</span> },
    { clave: 'modalidad', titulo: 'Servicio', valorOrden: (v) => ETIQUETAS_MODALIDAD[v.modalidad], celda: (v) => ETIQUETAS_MODALIDAD[v.modalidad] },
    { clave: 'cierre', titulo: 'Finalización', valorOrden: (v) => v.cierreReal, celda: (v) => formatearFecha(v.cierreReal), ocultarEnMovil: true },
    { clave: 'cobro', titulo: 'Cobro', valorOrden: (v) => v.modalidadCobro, celda: (v) => ETIQUETAS_MODALIDAD_COBRO[v.modalidadCobro], ocultarEnMovil: true },
    { clave: 'valor', titulo: 'Valor', alinear: 'derecha', valorOrden: (v) => v.valorReferencial, celda: (v) => formatearMoneda(v.valorReferencial) },
    {
      clave: 'facturacion',
      titulo: 'Facturación',
      celda: (v) => {
        const estado = estadoFacturacionServicio(v, datos.facturas)
        return estado ? <InsigniaEstadoServicio estado={estado} /> : null
      },
    },
  ]
  return (
    <Tabla
      etiqueta="Servicios finalizados"
      columnas={columnas}
      filas={finalizados}
      claveFila={(v) => v.codigo}
      listado={listado}
      onFila={(v) => navegar(`/viajes/${v.codigo}`)}
      tituloVacio="Sin servicios finalizados"
      descripcionVacio="Los viajes finalizados del cliente aparecerán aquí con su estado de facturación."
    />
  )
}

function TablaSolicitudes({ solicitudes }: { solicitudes: Solicitud[] }) {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ prefijo: 'sol', ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const columnas: Columna<Solicitud>[] = [
    { clave: 'codigo', titulo: 'Solicitud', valorOrden: (s) => s.codigo, celda: (s) => <span className="font-mono font-semibold whitespace-nowrap">{s.codigo}</span> },
    { clave: 'modalidad', titulo: 'Tipo', valorOrden: (s) => ETIQUETAS_MODALIDAD[s.modalidad], celda: (s) => ETIQUETAS_MODALIDAD[s.modalidad], ocultarEnMovil: true },
    { clave: 'ruta', titulo: 'Origen y destino', ocultarEnMovil: true, celda: (s) => <span className="text-texto-secundario">{nombreLugar(datos, s.origenCodigo)} → {nombreLugar(datos, s.destinoCodigo)}</span> },
    { clave: 'fecha', titulo: 'Fecha requerida', valorOrden: (s) => s.fechaRequerida, celda: (s) => formatearFecha(s.fechaRequerida) },
    { clave: 'estado', titulo: 'Estado', valorOrden: (s) => s.estado, celda: (s) => <InsigniaEstadoSolicitud estado={s.estado} /> },
    { clave: 'viaje', titulo: 'Viaje', celda: (s) => (s.viajeCodigo ? <span className="font-mono">{s.viajeCodigo}</span> : <span className="text-texto-secundario">Sin viaje</span>) },
  ]
  return (
    <Tabla
      etiqueta="Solicitudes del cliente"
      columnas={columnas}
      filas={solicitudes}
      claveFila={(s) => s.codigo}
      listado={listado}
      onFila={(s) => navegar(`/solicitudes?q=${s.codigo}`)}
      tituloVacio="Sin solicitudes"
      descripcionVacio="El cliente todavía no tiene solicitudes registradas."
    />
  )
}

function TablaDocumentos({ documentos }: { documentos: Documento[] }) {
  const listado = usarParametrosListado({ prefijo: 'doc', ordenPredeterminado: 'fecha', direccionPredeterminada: 'desc' })
  const navegar = useNavigate()
  const columnas: Columna<Documento>[] = [
    { clave: 'codigo', titulo: 'Documento', valorOrden: (d) => d.codigo, celda: (d) => <span className="font-mono font-semibold whitespace-nowrap">{d.codigo}</span> },
    { clave: 'tipo', titulo: 'Tipo', valorOrden: (d) => ETIQUETAS_TIPO_DOCUMENTO[d.tipo], celda: (d) => ETIQUETAS_TIPO_DOCUMENTO[d.tipo] },
    { clave: 'viaje', titulo: 'Viaje', valorOrden: (d) => d.viajeCodigo, celda: (d) => <span className="font-mono">{d.viajeCodigo}</span> },
    { clave: 'archivo', titulo: 'Archivo', ocultarEnMovil: true, celda: (d) => <span className="text-texto-secundario break-all">{d.nombreArchivo}</span> },
    { clave: 'fecha', titulo: 'Fecha', valorOrden: (d) => d.fechaGeneracion, celda: (d) => formatearFecha(d.fechaGeneracion) },
  ]
  return (
    <Tabla
      etiqueta="Documentos del cliente"
      columnas={columnas}
      filas={documentos}
      claveFila={(d) => d.codigo}
      listado={listado}
      onFila={(d) => navegar(`/viajes/${d.viajeCodigo}`)}
      tituloVacio="Sin documentos"
      descripcionVacio="Las guías y documentos de los viajes del cliente aparecerán aquí."
    />
  )
}

export default function PaginaFichaCliente() {
  const { codigo } = useParams()
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const volver = usarVolver('/clientes')
  const [confirmando, establecerConfirmando] = useState(false)
  const cliente = obtener(datos, 'clientes', codigo)
  if (!cliente) return <PaginaNoEncontrada />

  const resumen = resumenCliente(datos, cliente.codigo)
  const viajes = viajesDeCliente(datos, cliente.codigo)
  const solicitudes = solicitudesDeCliente(datos, cliente.codigo)
  const documentos = documentosDeCliente(datos, cliente.codigo)
  const puedeEscribir = puede('clientes.escribir')
  const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo'

  const cambiarEstado = () => {
    const resultado = ejecutar(cambiarEstadoCliente(cliente.codigo, nuevoEstado))
    if (resultado.ok) notificar('exito', nuevoEstado === 'activo' ? 'Cliente activado' : 'Cliente desactivado', cliente.razonSocial)
    else notificar('error', 'No se pudo cambiar el estado', resultado.error)
    establecerConfirmando(false)
  }

  const pestanas: Pestana[] = [
    {
      clave: 'general',
      titulo: 'Información general',
      contenido: () => (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel titulo="Datos del cliente">
            <ListaDatos
              datos={[
                { etiqueta: 'Código', valor: <span className="font-mono">{cliente.codigo}</span> },
                { etiqueta: 'Identificación', valor: cliente.identificacion },
                { etiqueta: 'Razón social', valor: cliente.razonSocial, ancho: 'completo' },
                { etiqueta: 'Contacto', valor: cliente.contacto },
                { etiqueta: 'Teléfono', valor: cliente.telefono },
                { etiqueta: 'Correo', valor: cliente.correo, ancho: 'completo' },
                { etiqueta: 'Estado', valor: <InsigniaEstadoCatalogo estado={cliente.estado} /> },
              ]}
            />
          </Panel>
          <Panel titulo="Resumen de operaciones" descripcion="Calculado con los viajes registrados del cliente.">
            <ListaDatos
              datos={[
                { etiqueta: 'Viajes registrados', valor: resumen.viajesTotales },
                { etiqueta: 'Viajes abiertos', valor: resumen.viajesAbiertos },
                { etiqueta: 'Finalizados', valor: resumen.finalizados },
                { etiqueta: 'Cancelados', valor: resumen.cancelados },
                { etiqueta: 'Con incidencia abierta', valor: resumen.conIncidencia },
                { etiqueta: 'Entregas a tiempo', valor: formatearPorcentaje(resumen.cumplimiento) },
                { etiqueta: 'Valor de servicios finalizados', valor: formatearMoneda(resumen.valorServicios) },
                { etiqueta: 'Servicios por facturar', valor: resumen.porFacturar },
              ]}
            />
          </Panel>
        </div>
      ),
    },
    ...(puede('solicitudes.ver')
      ? [{ clave: 'solicitudes', titulo: 'Solicitudes', contador: solicitudes.length, contenido: () => <TablaSolicitudes solicitudes={solicitudes} /> }]
      : []),
    { clave: 'viajes', titulo: 'Viajes', contador: viajes.length, contenido: () => <TablaViajes viajes={viajes} /> },
    { clave: 'servicios', titulo: 'Servicios', contador: resumen.finalizados, contenido: () => <TablaServicios viajes={viajes} /> },
    ...(puede('documentos.ver')
      ? [{ clave: 'documentos', titulo: 'Documentos', contador: documentos.length, contenido: () => <TablaDocumentos documentos={documentos} /> }]
      : []),
  ]

  return (
    <>
      <EncabezadoPagina
        titulo={cliente.razonSocial}
        descripcion={`${cliente.codigo} · ${cliente.identificacion} · ${cliente.contacto}`}
        etiqueta={<InsigniaEstadoCatalogo estado={cliente.estado} />}
        acciones={
          <>
            <Boton variante="fantasma" icono={ArrowLeft} onClick={volver}>Volver</Boton>
            {puede('solicitudes.escribir') && cliente.estado === 'activo' && (
              <Boton variante="secundario" icono={Plus} onClick={() => navegar(`/solicitudes/nueva?cliente=${cliente.codigo}`)}>Nueva solicitud</Boton>
            )}
            {puedeEscribir && (
              <>
                <Boton variante="secundario" icono={nuevoEstado === 'activo' ? Power : PowerOff} onClick={() => establecerConfirmando(true)}>
                  {nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'}
                </Boton>
                <Boton variante="primario" icono={Pencil} onClick={() => navegar(`/clientes/${cliente.codigo}/editar`)}>Editar</Boton>
              </>
            )}
          </>
        }
      />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-5">
        <TarjetaIndicador titulo="Viajes abiertos" valor={resumen.viajesAbiertos} detalle={`${resumen.viajesTotales} registrados`} icono={Truck} tono="info" />
        <TarjetaIndicador titulo="Con incidencia" valor={resumen.conIncidencia} detalle="Incidencias sin resolver" icono={TriangleAlert} tono={resumen.conIncidencia > 0 ? 'peligro' : 'neutro'} />
        <TarjetaIndicador titulo="Entregas a tiempo" valor={formatearPorcentaje(resumen.cumplimiento)} detalle="Sobre entregas con compromiso" icono={CheckCircle2} tono="exito" />
        {puede('solicitudes.ver') ? (
          <TarjetaIndicador titulo="Solicitudes pendientes" valor={resumen.solicitudesPendientes} detalle="Recibidas o aceptadas" icono={ClipboardList} tono="pendiente" />
        ) : (
          <TarjetaIndicador titulo="Por facturar" valor={resumen.porFacturar} detalle="Servicios finalizados" icono={Receipt} tono="pendiente" />
        )}
      </div>
      <Pestanas pestanas={pestanas} />
      <ModalConfirmacion
        abierto={confirmando}
        titulo={nuevoEstado === 'activo' ? 'Activar cliente' : 'Desactivar cliente'}
        mensaje={
          nuevoEstado === 'activo'
            ? `${cliente.razonSocial} volverá a estar disponible para nuevas solicitudes y viajes.`
            : `${cliente.razonSocial} dejará de aparecer en los formularios de nuevas solicitudes y viajes. Sus operaciones e historial se conservan.`
        }
        textoConfirmar={nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'}
        peligroso={nuevoEstado === 'inactivo'}
        onConfirmar={cambiarEstado}
        onCancelar={() => establecerConfirmando(false)}
      />
    </>
  )
}
