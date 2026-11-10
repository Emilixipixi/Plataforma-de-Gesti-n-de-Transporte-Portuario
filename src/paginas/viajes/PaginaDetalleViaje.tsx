import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Ban, CalendarClock, CheckCircle2, CircleCheckBig, Clock, Download, Eye, FileArchive, FilePlus2, FileText, Flag, MapPin, Paperclip, Pencil, Plus, TriangleAlert, Truck, UserRound } from 'lucide-react'
import type { Documento, Incidencia, Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton } from '@/componentes/comunes/Boton'
import { Panel } from '@/componentes/comunes/Panel'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { Pestanas, type Pestana } from '@/componentes/comunes/Pestanas'
import { EstadoVacio } from '@/componentes/comunes/EstadoVacio'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { Insignia, InsigniaEstadoIncidencia, InsigniaEstadoServicio, InsigniaEstadoViaje } from '@/componentes/comunes/Insignia'
import { InsigniasViaje } from '@/componentes/comunes/InsigniasViaje'
import { AreaTexto } from '@/componentes/formularios/CampoTexto'
import { Modal } from '@/componentes/modales/Modal'
import { LineaTiempo } from '@/componentes/viajes/LineaTiempo'
import { ModalEvento, ModalFinalizar, ModalIncidencia, ModalResolucion } from '@/componentes/viajes/ModalesSeguimiento'
import { descargarGuia, ModalAdjuntarDocumento, ModalGenerarGuia, ModalVerGuia } from '@/componentes/documentos/ModalesDocumentos'
import { ReporteViaje } from '@/componentes/reportes/ReporteViaje'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar, nombreTransportista, nombreUsuario } from '@/servicios/consultas'
import { cancelarViaje } from '@/servicios/operaciones/viajes'
import {
  desvioDeLlegada,
  estadoFacturacionServicio,
  facturaDeViaje,
  hayAdvertenciaSolapamiento,
  llegadaRealDeViaje,
  ultimoEvento,
} from '@/utilidades/calculos'
import {
  ETIQUETAS_ESTADO_VIAJE,
  ETIQUETAS_FUNCION_PUNTO_RUTA,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODALIDAD_COBRO,
  ETIQUETAS_TIPO_CARGA,
  ETIQUETAS_TIPO_DOCUMENTO,
} from '@/utilidades/constantes'
import { formatearDesvio, formatearFechaHora, formatearMoneda } from '@/utilidades/formateadores'
import { esquemaCancelacion, type EntradaCancelacion } from '@/utilidades/validadores'

function TarjetaResumen({ icono: Icono, titulo, children }: { icono: typeof Clock; titulo: string; children: ReactNode }) {
  return (
    <div className="bg-superficie border border-borde rounded-lg px-4 py-3 min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-texto-secundario">
        <Icono className="size-3.5" aria-hidden="true" />
        {titulo}
      </p>
      <div className="mt-1 text-sm text-texto">{children}</div>
    </div>
  )
}

function ModalCancelacion({ viaje, abierto, onCerrar }: { viaje: Viaje; abierto: boolean; onCerrar: () => void }) {
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntradaCancelacion>({ resolver: zodResolver(esquemaCancelacion), defaultValues: { motivo: '' } })
  const cerrar = () => {
    reset()
    onCerrar()
  }
  const confirmar = ({ motivo }: EntradaCancelacion) => {
    const resultado = ejecutar(cancelarViaje(viaje.codigo, motivo))
    if (resultado.ok) notificar('exito', `Viaje ${viaje.codigo} cancelado`, 'El motivo quedó en el historial de estados.')
    else notificar('error', 'No se pudo cancelar', resultado.error)
    cerrar()
  }
  return (
    <Modal
      abierto={abierto}
      titulo={`Cancelar viaje ${viaje.codigo}`}
      descripcion="Un viaje cancelado no se elimina: conserva su historial y deja de contar como operación activa."
      onCerrar={cerrar}
      ancho="pequeno"
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar}>Volver</Boton>
          <Boton variante="peligro" type="submit" form="formulario-cancelacion">Cancelar viaje</Boton>
        </>
      }
    >
      <form id="formulario-cancelacion" noValidate onSubmit={handleSubmit(confirmar)}>
        <AreaTexto etiqueta="Motivo de la cancelación" requerido rows={4} error={errors.motivo?.message} {...register('motivo')} />
      </form>
    </Modal>
  )
}

export default function PaginaDetalleViaje() {
  const { codigo } = useParams()
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const navegar = useNavigate()
  const volver = usarVolver('/viajes')
  const [cancelando, establecerCancelando] = useState(false)
  const [modal, establecerModal] = useState<'evento' | 'incidencia' | 'finalizar' | 'guia' | 'adjuntar' | null>(null)
  const [guiaVisible, establecerGuiaVisible] = useState<Documento | null>(null)
  const [resolviendo, establecerResolviendo] = useState<Incidencia | null>(null)
  const viaje = obtener(datos, 'viajes', codigo)
  if (!viaje) return <PaginaNoEncontrada />

  const completo = puede('viajes.verCompleto')
  const cliente = obtener(datos, 'clientes', viaje.clienteCodigo)
  const chofer = obtener(datos, 'choferes', viaje.choferCodigo)
  const unidad = obtener(datos, 'unidades', viaje.unidadCodigo)
  const categoria = obtener(datos, 'tiposCarga', viaje.carga.categoriaCodigo)
  const ultimo = ultimoEvento(viaje.codigo, datos.eventos)
  const tipoUltimo = ultimo ? obtener(datos, 'tiposEvento', ultimo.tipoEventoCodigo)?.nombre : undefined
  const desvio = desvioDeLlegada(viaje, datos.eventos)
  const llegadaReal = llegadaRealDeViaje(viaje, datos.eventos)
  const incidencias = datos.incidencias.filter((i) => i.viajeCodigo === viaje.codigo).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
  const documentos = datos.documentos.filter((d) => d.viajeCodigo === viaje.codigo).sort((a, b) => b.fechaGeneracion.localeCompare(a.fechaGeneracion))
  const solapamientos = viaje.estado === 'programado' || viaje.estado === 'en_ejecucion' ? hayAdvertenciaSolapamiento(viaje, datos.viajes) : []
  const servicio = estadoFacturacionServicio(viaje, datos.facturas)
  const factura = facturaDeViaje(viaje.codigo, datos.facturas)
  const editable = puede('viajes.escribir') && viaje.estado !== 'finalizado' && viaje.estado !== 'cancelado'
  const cancelable = puede('viajes.cancelar') && viaje.estado !== 'finalizado' && viaje.estado !== 'cancelado'
  const abierto = viaje.estado !== 'finalizado' && viaje.estado !== 'cancelado'
  const puedeSeguir = puede('seguimiento.escribir') && abierto
  const puedeIncidencias = puede('incidencias.escribir') && abierto
  const puedeCerrar = puede('viajes.cerrar') && abierto && viaje.estado !== 'solicitado' && viaje.estado !== 'programado'
  const puedeDocumentar = puede('documentos.escribir') && viaje.estado !== 'cancelado'
  const puedeGuia = puedeDocumentar && viaje.estado !== 'solicitado'
  const descargarPaquete = async () => {
    const { descargarPaqueteDocumental } = await import('@/servicios/documentosPdf')
    descargarPaqueteDocumental(datos, viaje, new Date())
  }
  const botonesSeguimiento = (
    <div className="flex flex-wrap gap-2">
      {puedeSeguir && (
        <Boton variante="primario" icono={Plus} onClick={() => establecerModal('evento')} motivoDeshabilitado={viaje.estado === 'solicitado' ? 'Complete la asignación del viaje antes de registrar hitos.' : undefined}>
          Registrar evento
        </Boton>
      )}
      {puedeIncidencias && <Boton variante="secundario" icono={TriangleAlert} onClick={() => establecerModal('incidencia')}>Registrar incidencia</Boton>}
      {puedeCerrar && <Boton variante="secundario" icono={Flag} onClick={() => establecerModal('finalizar')}>Finalizar viaje</Boton>}
    </div>
  )
  const esExportacion = viaje.modalidad === 'exportacion'
  const etiquetaLlegada = esExportacion ? 'Entrega en puerto' : 'Llegada a cliente o planta'

  const datosCobro = [
    { etiqueta: 'Modalidad de cobro', valor: ETIQUETAS_MODALIDAD_COBRO[viaje.modalidadCobro] },
    { etiqueta: 'Valor referencial', valor: formatearMoneda(viaje.valorReferencial) },
    { etiqueta: 'Anticipo', valor: 'No requerido' },
    { etiqueta: 'Facturación', valor: servicio ? <InsigniaEstadoServicio estado={servicio} /> : 'Disponible al finalizar' },
    ...(factura
      ? [
          {
            etiqueta: 'Factura',
            valor: puede('facturacion.ver') ? (
              <Link to={`/contabilidad/facturas/${factura.codigo}`} className="font-mono text-info hover:underline underline-offset-2">{factura.codigo} · {factura.referencia}</Link>
            ) : (
              <span className="font-mono">{factura.codigo} · {factura.referencia}</span>
            ),
          },
        ]
      : []),
  ]

  const resumen = (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel titulo="Carga">
        <ListaDatos
          datos={[
            { etiqueta: 'Tipo', valor: `${ETIQUETAS_TIPO_CARGA[viaje.carga.tipo]}${categoria ? ` · ${categoria.nombre}` : ''}` },
            { etiqueta: 'Contenedor', valor: viaje.carga.contenedor ? `${viaje.carga.contenedor.numero || 'Número pendiente'} (${viaje.carga.contenedor.tipo})` : 'No aplica' },
            { etiqueta: 'Descripción', valor: viaje.carga.descripcion, ancho: 'completo' },
            ...(viaje.carga.observaciones ? [{ etiqueta: 'Observaciones de la carga', valor: viaje.carga.observaciones, ancho: 'completo' as const }] : []),
          ]}
        />
      </Panel>
      <Panel titulo="Ruta de puntos operativos" descripcion="Secuencia operativa conocida; sin optimización de rutas.">
        <ol className="space-y-2">
          {[...viaje.rutaPuntos].sort((a, b) => a.orden - b.orden).map((punto) => (
            <li key={punto.orden} className="flex items-center gap-3 text-sm">
              <span className="grid place-items-center size-6 rounded-full bg-fondo border border-borde text-xs tabular-nums text-texto-secundario shrink-0">{punto.orden}</span>
              <span className="flex-1 min-w-0 text-texto">{nombreLugar(datos, punto.lugarCodigo)}</span>
              <Insignia tono={punto.funcion === 'devolucion' ? 'info' : 'neutro'}>{ETIQUETAS_FUNCION_PUNTO_RUTA[punto.funcion]}</Insignia>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel titulo="Asignación">
        <ListaDatos
          datos={[
            { etiqueta: 'Transportista', valor: nombreTransportista(datos, viaje.transportistaCodigo) },
            { etiqueta: 'Chofer', valor: chofer ? `${chofer.nombre} · ${chofer.telefono}` : 'Sin asignar' },
            { etiqueta: 'Unidad', valor: unidad ? `${unidad.placa} · ${unidad.tipo}` : 'Sin asignar' },
          ]}
        />
        {solapamientos.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-pendiente-fondo text-pendiente px-3 py-2 text-sm">
            <TriangleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            Posible solapamiento con {Array.from(new Set(solapamientos.map((s) => s.viajeCodigo))).join(', ')} ({Array.from(new Set(solapamientos.map((s) => s.recurso))).join(' y ')}).
          </p>
        )}
      </Panel>
      <Panel titulo="Compromisos y horas reales" descripcion="El retraso se determina contra el compromiso registrado en el viaje.">
        <ListaDatos
          datos={[
            { etiqueta: 'Salida prevista', valor: formatearFechaHora(viaje.salidaPrevista) },
            { etiqueta: 'Salida real', valor: formatearFechaHora(viaje.salidaReal) },
            { etiqueta: `${etiquetaLlegada} prevista`, valor: formatearFechaHora(viaje.llegadaPrevista) },
            { etiqueta: `${etiquetaLlegada} real`, valor: formatearFechaHora(llegadaReal) },
            { etiqueta: 'Cierre previsto', valor: formatearFechaHora(viaje.cierrePrevisto) },
            { etiqueta: 'Cierre real', valor: formatearFechaHora(viaje.cierreReal) },
          ]}
        />
      </Panel>
      <Panel titulo="Cobro">
        <ListaDatos datos={datosCobro} />
      </Panel>
      <Panel titulo="Observaciones">
        <ListaDatos
          columnas={1}
          datos={[
            { etiqueta: 'Observaciones del viaje', valor: <span className="whitespace-pre-line">{viaje.observaciones || 'Sin observaciones'}</span> },
            ...(viaje.observacionCierre ? [{ etiqueta: 'Observación de cierre', valor: viaje.observacionCierre }] : []),
            ...(viaje.motivoCancelacion ? [{ etiqueta: 'Motivo de cancelación', valor: viaje.motivoCancelacion }] : []),
            {
              etiqueta: 'Solicitud de origen',
              valor: viaje.solicitudCodigo ? <Link to={`/solicitudes?q=${viaje.solicitudCodigo}`} className="font-mono text-info hover:underline underline-offset-2">{viaje.solicitudCodigo}</Link> : 'Creado directamente',
            },
          ]}
        />
      </Panel>
    </div>
  )

  const pestanas: Pestana[] = completo
    ? [
        { clave: 'resumen', titulo: 'Resumen', contenido: () => resumen },
        {
          clave: 'seguimiento',
          titulo: 'Seguimiento',
          contador: datos.eventos.filter((e) => e.viajeCodigo === viaje.codigo).length,
          contenido: () => (
            <Panel titulo={`Línea de tiempo · ${ETIQUETAS_MODALIDAD[viaje.modalidad]}`} descripcion="Hitos registrados manualmente por Operaciones con hora real y responsable. No es rastreo GPS." acciones={abierto ? botonesSeguimiento : undefined}>
              <LineaTiempo viaje={viaje} />
            </Panel>
          ),
        },
        {
          clave: 'incidencias',
          titulo: 'Incidencias',
          contador: incidencias.length,
          contenido: () =>
            incidencias.length === 0 ? (
              <div className="bg-superficie border border-borde rounded-lg">
                <EstadoVacio titulo="Sin incidencias" descripcion="Este viaje no tiene incidencias registradas." accion={puedeIncidencias ? <Boton icono={TriangleAlert} onClick={() => establecerModal('incidencia')}>Registrar incidencia</Boton> : undefined} />
              </div>
            ) : (
              <div className="space-y-3">
                {puedeIncidencias && <div className="flex justify-end"><Boton icono={TriangleAlert} onClick={() => establecerModal('incidencia')}>Registrar incidencia</Boton></div>}
                {incidencias.map((incidencia) => (
                  <Panel key={incidencia.codigo}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{incidencia.codigo}</span>
                      <Insignia>{obtener(datos, 'tiposIncidencia', incidencia.tipoIncidenciaCodigo)?.nombre ?? incidencia.tipoIncidenciaCodigo}</Insignia>
                      <InsigniaEstadoIncidencia estado={incidencia.estado} />
                      <span className="text-xs text-texto-secundario ml-auto">{formatearFechaHora(incidencia.fechaHora)}</span>
                      {incidencia.estado === 'abierta' && puede('incidencias.escribir') && (
                        <Boton tamano="pequeno" variante="primario" icono={CheckCircle2} onClick={() => establecerResolviendo(incidencia)}>Resolver</Boton>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-texto">{incidencia.descripcion}</p>
                    <p className="mt-1 text-xs text-texto-secundario">{incidencia.ubicacion} · Registró {nombreUsuario(datos, incidencia.responsableCodigo)}</p>
                    {incidencia.evidencias.map((ev) => (
                      <p key={ev.nombre} className="mt-1 inline-flex items-center gap-1 text-xs text-texto-secundario"><Paperclip className="size-3.5" aria-hidden="true" />{ev.nombre}</p>
                    ))}
                    {incidencia.accionCorrectiva && (
                      <p className="mt-2 rounded-md bg-exito-fondo text-exito px-3 py-2 text-sm">
                        Acción correctiva: {incidencia.accionCorrectiva} ({formatearFechaHora(incidencia.fechaResolucion)})
                      </p>
                    )}
                  </Panel>
                ))}
              </div>
            ),
        },
        {
          clave: 'documentos',
          titulo: 'Documentos',
          contador: documentos.length,
          contenido: () => (
            <Panel
              titulo="Documentos del viaje"
              descripcion="Guías de remisión con su histórico de versiones y otros documentos del servicio."
              sinRelleno
              acciones={
                <div className="flex flex-wrap gap-2">
                  {puedeGuia && <Boton tamano="pequeno" variante="primario" icono={FileText} onClick={() => establecerModal('guia')}>Generar guía</Boton>}
                  {puedeDocumentar && <Boton tamano="pequeno" icono={FilePlus2} onClick={() => establecerModal('adjuntar')}>Adjuntar</Boton>}
                  {puede('documentos.ver') && <Boton tamano="pequeno" icono={FileArchive} onClick={() => void descargarPaquete()}>Paquete documental</Boton>}
                </div>
              }
            >
              {documentos.length === 0 ? (
                <EstadoVacio titulo="Sin documentos" descripcion={viaje.estado === 'solicitado' ? 'Asigne recursos al viaje para generar su guía de remisión.' : 'Genere la guía de remisión o adjunte documentos del servicio.'} />
              ) : (
                <ul className="divide-y divide-borde">
                  {documentos.map((d) => (
                    <li key={d.codigo} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                      <FileText className="size-4 text-texto-secundario shrink-0" aria-hidden="true" />
                      <span className="font-mono font-semibold">{d.codigo}</span>
                      <span className="text-texto">{ETIQUETAS_TIPO_DOCUMENTO[d.tipo]}</span>
                      {d.numeroReferencial && <span className="text-texto-secundario">{d.numeroReferencial}</span>}
                      <span className="text-texto-secundario break-all">{d.nombreArchivo}</span>
                      <span className="ml-auto text-xs text-texto-secundario">v{d.version} · {formatearFechaHora(d.fechaGeneracion)}</span>
                      {d.datosGuia && (
                        <span className="inline-flex gap-1">
                          <Boton tamano="pequeno" variante="fantasma" icono={Eye} onClick={() => establecerGuiaVisible(d)}>Ver</Boton>
                          <Boton tamano="pequeno" variante="fantasma" icono={Download} onClick={() => void descargarGuia(d)}>PDF</Boton>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ),
        },
        {
          clave: 'reportes',
          titulo: 'Reportes',
          contenido: () => <ReporteViaje viaje={viaje} />,
        },
        {
          clave: 'administrativa',
          titulo: 'Información administrativa',
          contenido: () => (
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel titulo="Historial de estados" descripcion="Cada cambio de estado queda registrado para trazabilidad." sinRelleno>
                <ol className="divide-y divide-borde">
                  {[...viaje.historialEstados].reverse().map((cambio) => (
                    <li key={`${cambio.fecha}-${cambio.estadoNuevo}`} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {cambio.estadoAnterior && <><InsigniaEstadoViaje estado={cambio.estadoAnterior} /><span className="text-texto-secundario">a</span></>}
                        <InsigniaEstadoViaje estado={cambio.estadoNuevo} />
                        <span className="ml-auto text-xs text-texto-secundario">{formatearFechaHora(cambio.fecha)}</span>
                      </div>
                      <p className="mt-1 text-xs text-texto-secundario">{nombreUsuario(datos, cambio.usuarioCodigo)}{cambio.motivo ? ` · ${cambio.motivo}` : ''}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel titulo="Ajustes de programación" descripcion="Cambios con motivo y fecha registrados después de programar el viaje." sinRelleno>
                {viaje.ajustesProgramacion.length === 0 ? (
                  <EstadoVacio icono={CalendarClock} titulo="Sin ajustes" descripcion="La programación no ha sido modificada." />
                ) : (
                  <ol className="divide-y divide-borde">
                    {[...viaje.ajustesProgramacion].reverse().map((ajuste, i) => (
                      <li key={`${ajuste.fecha}-${ajuste.campo}-${i}`} className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-texto">{ajuste.campo}</span>
                          <span className="ml-auto text-xs text-texto-secundario">{formatearFechaHora(ajuste.fecha)}</span>
                        </div>
                        <p className="mt-1 text-texto-secundario"><span className="line-through">{ajuste.valorAnterior}</span> → <span className="text-texto">{ajuste.valorNuevo}</span></p>
                        <p className="mt-1 text-xs text-texto-secundario">{nombreUsuario(datos, ajuste.usuarioCodigo)} · {ajuste.motivo}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel titulo="Registro">
                <ListaDatos
                  datos={[
                    { etiqueta: 'Creado por', valor: nombreUsuario(datos, viaje.creadoPor) },
                    { etiqueta: 'Fecha de creación', valor: formatearFechaHora(viaje.fechaCreacion) },
                    { etiqueta: 'Estado actual', valor: ETIQUETAS_ESTADO_VIAJE[viaje.estado] },
                  ]}
                />
              </Panel>
            </div>
          ),
        },
      ]
    : [
        {
          clave: 'resumen',
          titulo: 'Consulta contable',
          contenido: () => (
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel titulo="Datos mínimos del viaje">
                <ListaDatos
                  datos={[
                    { etiqueta: 'Cliente', valor: cliente?.razonSocial ?? viaje.clienteCodigo, ancho: 'completo' },
                    { etiqueta: 'Identificación', valor: cliente?.identificacion ?? '' },
                    { etiqueta: 'Modalidad', valor: ETIQUETAS_MODALIDAD[viaje.modalidad] },
                    { etiqueta: 'Origen', valor: nombreLugar(datos, viaje.origenCodigo) },
                    { etiqueta: 'Destino', valor: nombreLugar(datos, viaje.destinoCodigo) },
                    { etiqueta: 'Salida prevista', valor: formatearFechaHora(viaje.salidaPrevista) },
                    { etiqueta: 'Cierre real', valor: formatearFechaHora(viaje.cierreReal) },
                  ]}
                />
              </Panel>
              <Panel titulo="Cobro">
                <ListaDatos datos={datosCobro} />
              </Panel>
              <AvisoDemostrativo className="xl:col-span-2">Contabilidad consulta datos mínimos del viaje y del cliente; no modifica la planificación ni la bitácora.</AvisoDemostrativo>
            </div>
          ),
        },
      ]

  return (
    <>
      <EncabezadoPagina
        titulo={`Viaje ${viaje.codigo}`}
        descripcion={`${ETIQUETAS_MODALIDAD[viaje.modalidad]} · ${nombreCliente(datos, viaje.clienteCodigo)}`}
        etiqueta={<InsigniasViaje viaje={viaje} />}
        acciones={
          <>
            <Boton variante="fantasma" icono={ArrowLeft} onClick={volver}>Volver</Boton>
            {puedeSeguir && viaje.estado !== 'solicitado' && <Boton variante="secundario" icono={Plus} onClick={() => establecerModal('evento')}>Registrar evento</Boton>}
            {puedeIncidencias && <Boton variante="secundario" icono={TriangleAlert} onClick={() => establecerModal('incidencia')}>Incidencia</Boton>}
            {puedeCerrar && <Boton variante="secundario" icono={CircleCheckBig} onClick={() => establecerModal('finalizar')}>Finalizar</Boton>}
            {puedeGuia && <Boton variante="secundario" icono={FileText} onClick={() => establecerModal('guia')}>Generar guía</Boton>}
            {cancelable && <Boton variante="fantasma" icono={Ban} onClick={() => establecerCancelando(true)}>Cancelar viaje</Boton>}
            {editable && <Boton variante="primario" icono={Pencil} onClick={() => navegar(`/viajes/${viaje.codigo}/editar`)}>Editar</Boton>}
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        <TarjetaResumen icono={MapPin} titulo="Origen y destino">
          <p className="truncate">{nombreLugar(datos, viaje.origenCodigo)}</p>
          <p className="truncate text-texto-secundario">a {nombreLugar(datos, viaje.destinoCodigo)}</p>
        </TarjetaResumen>
        <TarjetaResumen icono={Truck} titulo="Asignación">
          <p className="truncate">{nombreTransportista(datos, viaje.transportistaCodigo)}</p>
          {completo && <p className="truncate text-texto-secundario">{chofer?.nombre ?? 'Sin chofer'} · {unidad?.placa ?? 'Sin unidad'}</p>}
        </TarjetaResumen>
        <TarjetaResumen icono={Clock} titulo={etiquetaLlegada}>
          <p>Prevista {formatearFechaHora(viaje.llegadaPrevista)}</p>
          <p className="text-texto-secundario">
            {llegadaReal ? `Real ${formatearFechaHora(llegadaReal)}` : 'Sin hora real'}
            {desvio !== null && <span className={desvio > 0 ? 'text-peligro' : 'text-exito'}> · {desvio > 0 ? formatearDesvio(desvio) : 'a tiempo'}</span>}
          </p>
        </TarjetaResumen>
        <TarjetaResumen icono={UserRound} titulo="Último evento">
          {ultimo ? (
            <>
              <p className="truncate">{tipoUltimo} · {formatearFechaHora(ultimo.horaReal)}</p>
              <p className="truncate text-texto-secundario">Registró {nombreUsuario(datos, ultimo.responsableCodigo)}</p>
            </>
          ) : (
            <p className="text-texto-secundario">Sin eventos registrados</p>
          )}
        </TarjetaResumen>
      </div>
      {viaje.estado === 'cancelado' && viaje.motivoCancelacion && (
        <p className="mb-5 flex items-start gap-2 rounded-md bg-fondo border border-borde px-3 py-2.5 text-sm text-texto-secundario">
          <Ban className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          Cancelado: {viaje.motivoCancelacion}
        </p>
      )}
      <Pestanas pestanas={pestanas} />
      {cancelable && <ModalCancelacion viaje={viaje} abierto={cancelando} onCerrar={() => establecerCancelando(false)} />}
      {puedeSeguir && <ModalEvento viaje={viaje} abierto={modal === 'evento'} onCerrar={() => establecerModal(null)} />}
      {puedeIncidencias && <ModalIncidencia viaje={viaje} abierto={modal === 'incidencia'} onCerrar={() => establecerModal(null)} />}
      {puedeCerrar && <ModalFinalizar viaje={viaje} abierto={modal === 'finalizar'} onCerrar={() => establecerModal(null)} />}
      <ModalResolucion incidencia={resolviendo} onCerrar={() => establecerResolviendo(null)} />
      {puedeGuia && <ModalGenerarGuia viaje={viaje} abierto={modal === 'guia'} onCerrar={() => establecerModal(null)} onGenerada={establecerGuiaVisible} />}
      {puedeDocumentar && <ModalAdjuntarDocumento viaje={viaje} abierto={modal === 'adjuntar'} onCerrar={() => establecerModal(null)} />}
      <ModalVerGuia documento={guiaVisible} onCerrar={() => establecerGuiaVisible(null)} />
    </>
  )
}
