import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { MODALIDADES, MODALIDADES_COBRO, type Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniaEstadoViaje } from '@/componentes/comunes/Insignia'
import { AreaTexto, CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { NotaCamposRequeridos, PieFormulario } from '@/componentes/formularios/PieFormulario'
import { lugaresDisponibles, opcionesChofer, opcionesLugar, opcionesUnidad } from '@/componentes/formularios/opcionesDominio'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente } from '@/servicios/consultas'
import { guardarViaje, requiereMotivoDeAjuste } from '@/servicios/operaciones/viajes'
import { hayAdvertenciaSolapamiento } from '@/utilidades/calculos'
import {
  ETIQUETAS_ESTADO_VIAJE,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODALIDAD_COBRO,
  ETIQUETAS_TIPO_CARGA,
  opcionesDe,
  prefijoDeViaje,
  TIPO_CARGA_POR_MODALIDAD,
  TIPOS_CONTENEDOR,
} from '@/utilidades/constantes'
import { aValorFechaHoraLocal, desdeValorFechaHoraLocal } from '@/utilidades/formateadores'
import { esquemaViaje, type EntradaViaje } from '@/utilidades/validadores'

const VALORES_INICIALES: EntradaViaje = {
  clienteCodigo: '',
  modalidad: 'importacion_contenedorizada',
  categoriaCargaCodigo: '',
  descripcionCarga: '',
  observacionesCarga: '',
  contenedorTipo: '',
  contenedorNumero: '',
  origenCodigo: '',
  paradas: [],
  destinoCodigo: '',
  devolucionCodigo: '',
  transportistaCodigo: '',
  choferCodigo: '',
  unidadCodigo: '',
  salidaPrevista: '',
  llegadaPrevista: '',
  cierrePrevisto: '',
  modalidadCobro: 'contra_factura',
  valorReferencial: 0,
  observaciones: '',
  motivoAjuste: '',
}

function entradaDesdeViaje(viaje: Viaje): EntradaViaje {
  const punto = (funcion: string) => viaje.rutaPuntos.find((p) => p.funcion === funcion)?.lugarCodigo ?? ''
  return {
    clienteCodigo: viaje.clienteCodigo,
    modalidad: viaje.modalidad,
    categoriaCargaCodigo: viaje.carga.categoriaCodigo ?? '',
    descripcionCarga: viaje.carga.descripcion,
    observacionesCarga: viaje.carga.observaciones,
    contenedorTipo: viaje.carga.contenedor?.tipo ?? '',
    contenedorNumero: viaje.carga.contenedor?.numero ?? '',
    origenCodigo: viaje.origenCodigo,
    paradas: viaje.rutaPuntos.filter((p) => p.funcion === 'parada').sort((a, b) => a.orden - b.orden).map((p) => ({ lugarCodigo: p.lugarCodigo })),
    destinoCodigo: viaje.destinoCodigo,
    devolucionCodigo: punto('devolucion'),
    transportistaCodigo: viaje.transportistaCodigo ?? '',
    choferCodigo: viaje.choferCodigo ?? '',
    unidadCodigo: viaje.unidadCodigo ?? '',
    salidaPrevista: aValorFechaHoraLocal(viaje.salidaPrevista),
    llegadaPrevista: aValorFechaHoraLocal(viaje.llegadaPrevista),
    cierrePrevisto: aValorFechaHoraLocal(viaje.cierrePrevisto),
    modalidadCobro: viaje.modalidadCobro,
    valorReferencial: viaje.valorReferencial,
    observaciones: viaje.observaciones,
    motivoAjuste: '',
  }
}

const CAMPOS_PROGRAMACION = ['transportistaCodigo', 'choferCodigo', 'unidadCodigo', 'salidaPrevista', 'llegadaPrevista', 'cierrePrevisto', 'origenCodigo', 'destinoCodigo', 'devolucionCodigo'] as const

type ValoresParciales = Partial<Omit<EntradaViaje, 'paradas'>> & { paradas?: { lugarCodigo?: string }[] }

function firmaProgramacion(valores: ValoresParciales): string {
  return JSON.stringify([...CAMPOS_PROGRAMACION.map((c) => valores[c] ?? ''), (valores.paradas ?? []).map((p) => p.lugarCodigo)])
}

export default function PaginaFormularioViaje() {
  const { codigo } = useParams()
  const { datos } = usarApp()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const existente = obtener(datos, 'viajes', codigo)
  const esEdicion = codigo !== undefined
  const volver = usarVolver(esEdicion ? `/viajes/${codigo}` : '/viajes')
  const iniciales = useMemo(() => (existente ? entradaDesdeViaje(existente) : VALORES_INICIALES), [existente])
  const tieneEventos = existente ? datos.eventos.some((e) => e.viajeCodigo === existente.codigo) : false

  const { register, handleSubmit, control, setValue, getValues, setError, formState: { errors, isSubmitting } } = useForm<EntradaViaje>({
    resolver: zodResolver(esquemaViaje),
    defaultValues: iniciales,
  })
  const { fields: paradas, append, remove } = useFieldArray({ control, name: 'paradas' })
  const valores = useWatch({ control })
  const modalidad = valores.modalidad ?? 'importacion_contenedorizada'
  const transportista = valores.transportistaCodigo ?? ''

  useEffect(() => {
    const chofer = obtener(datos, 'choferes', getValues('choferCodigo') || undefined)
    const unidad = obtener(datos, 'unidades', getValues('unidadCodigo') || undefined)
    if (chofer && chofer.transportistaCodigo !== transportista) setValue('choferCodigo', '')
    if (unidad && unidad.transportistaCodigo !== transportista) setValue('unidadCodigo', '')
  }, [transportista, datos, getValues, setValue])

  const solapamientos = useMemo(
    () =>
      hayAdvertenciaSolapamiento(
        {
          codigo: codigo ?? '',
          choferCodigo: valores.choferCodigo || undefined,
          unidadCodigo: valores.unidadCodigo || undefined,
          salidaPrevista: desdeValorFechaHoraLocal(valores.salidaPrevista ?? ''),
          llegadaPrevista: desdeValorFechaHoraLocal(valores.llegadaPrevista ?? ''),
          cierrePrevisto: desdeValorFechaHoraLocal(valores.cierrePrevisto ?? ''),
        },
        datos.viajes,
      ),
    [codigo, valores.choferCodigo, valores.unidadCodigo, valores.salidaPrevista, valores.llegadaPrevista, valores.cierrePrevisto, datos.viajes],
  )

  const cambioProgramacion = esEdicion && firmaProgramacion(valores) !== firmaProgramacion(iniciales)
  const pideMotivo = Boolean(existente && requiereMotivoDeAjuste(existente.estado) && cambioProgramacion)

  if (esEdicion && !existente) return <PaginaNoEncontrada />
  if (existente && (existente.estado === 'finalizado' || existente.estado === 'cancelado')) {
    return (
      <>
        <EncabezadoPagina titulo={`Viaje ${existente.codigo}`} />
        <AvisoDemostrativo>El viaje está {ETIQUETAS_ESTADO_VIAJE[existente.estado].toLowerCase()} y ya no puede editarse.</AvisoDemostrativo>
      </>
    )
  }

  const puntosActuales = existente ? existente.rutaPuntos.map((p) => p.lugarCodigo) : []
  const lugares = opcionesLugar(lugaresDisponibles(datos, puntosActuales))
  const depositos = opcionesLugar(lugaresDisponibles(datos, puntosActuales).filter((l) => l.tipo === 'deposito' || puntosActuales.includes(l.codigo)))
  const clientes = datos.clientes.filter((c) => c.estado === 'activo' || c.codigo === existente?.clienteCodigo)
  const categorias = datos.tiposCarga.filter((t) => t.estado === 'activo' || t.codigo === existente?.carga.categoriaCodigo)
  const transportistas = datos.transportistas.filter((t) => t.estado === 'activo' || t.codigo === existente?.transportistaCodigo)
  const choferes = datos.choferes.filter((c) => c.transportistaCodigo === transportista && (c.estado === 'activo' || c.codigo === existente?.choferCodigo))
  const unidades = datos.unidades.filter((u) => u.transportistaCodigo === transportista && (u.estado === 'activo' || u.codigo === existente?.unidadCodigo))
  const modalidadesPermitidas = existente ? MODALIDADES.filter((m) => prefijoDeViaje(m) === prefijoDeViaje(existente.modalidad)) : MODALIDADES
  const esExportacion = modalidad === 'exportacion'
  const usaContenedor = modalidad !== 'importacion_suelta'

  const guardarFormulario = (entrada: EntradaViaje) => {
    if (pideMotivo && entrada.motivoAjuste.trim().length < 5) {
      setError('motivoAjuste', { message: 'Describa el motivo del cambio de programación (mínimo 5 caracteres).' })
      return
    }
    const resultado = ejecutar(guardarViaje(codigo, entrada))
    if (!resultado.ok) {
      notificar('error', 'No se pudo guardar el viaje', resultado.error)
      return
    }
    const { viaje, solapamientos: avisos, ajustes } = resultado.valor
    notificar(
      'exito',
      esEdicion ? `Viaje ${viaje.codigo} actualizado` : `Viaje ${viaje.codigo} creado`,
      `Estado: ${ETIQUETAS_ESTADO_VIAJE[viaje.estado]}.${ajustes > 0 ? ` ${ajustes} ${ajustes === 1 ? 'ajuste registrado' : 'ajustes registrados'} en el historial.` : ''}`,
    )
    if (avisos.length > 0) notificar('advertencia', 'Posible solapamiento', `Recurso compartido con ${Array.from(new Set(avisos.map((a) => a.viajeCodigo))).join(', ')}. Revise la programación.`)
    navegar(`/viajes/${viaje.codigo}`, { replace: true })
  }

  return (
    <>
      <EncabezadoPagina
        titulo={existente ? `Editar viaje ${existente.codigo}` : 'Nuevo viaje'}
        descripcion={
          existente
            ? `${nombreCliente(datos, existente.clienteCodigo)} · ${ETIQUETAS_MODALIDAD[existente.modalidad]}`
            : 'El código IMP o EXP se asigna al guardar según la modalidad. Con transportista, chofer, unidad y horarios completos, el viaje queda Programado.'
        }
        etiqueta={existente && <InsigniaEstadoViaje estado={existente.estado} />}
      />
      {existente?.solicitudCodigo && (
        <AvisoDemostrativo className="mb-4">
          Viaje generado desde la solicitud <Link to={`/solicitudes?q=${existente.solicitudCodigo}`} className="font-medium underline underline-offset-2">{existente.solicitudCodigo}</Link>. Complete la asignación, los horarios y el valor referencial.
        </AvisoDemostrativo>
      )}
      <form onSubmit={handleSubmit(guardarFormulario)} noValidate className="grid gap-5 xl:grid-cols-2 items-start">
        <div className="xl:col-span-2 -mb-4">
          <NotaCamposRequeridos />
        </div>

        <Panel titulo="Cliente y modalidad">
          <div className="grid gap-4 sm:grid-cols-2">
            {tieneEventos ? (
              <CampoTexto etiqueta="Cliente" value={nombreCliente(datos, iniciales.clienteCodigo)} readOnly disabled ayuda="No se modifica: el viaje ya tiene eventos." />
            ) : (
              <Selector etiqueta="Cliente" requerido textoTodos="Seleccione un cliente" opciones={clientes.map((c) => ({ valor: c.codigo, etiqueta: `${c.razonSocial} (${c.codigo})` }))} error={errors.clienteCodigo?.message} {...register('clienteCodigo')} />
            )}
            {tieneEventos ? (
              <CampoTexto etiqueta="Modalidad" value={ETIQUETAS_MODALIDAD[iniciales.modalidad]} readOnly disabled />
            ) : (
              <Selector etiqueta="Modalidad" requerido opciones={opcionesDe(ETIQUETAS_MODALIDAD, modalidadesPermitidas)} error={errors.modalidad?.message} ayuda={existente ? 'Solo puede cambiarse dentro del mismo tipo (importación o exportación).' : undefined} {...register('modalidad')} />
            )}
          </div>
        </Panel>

        <Panel titulo="Carga y contenedor">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto etiqueta="Carga" value={ETIQUETAS_TIPO_CARGA[TIPO_CARGA_POR_MODALIDAD[modalidad]]} readOnly disabled ayuda="Se define según la modalidad." />
            <Selector etiqueta="Tipo de carga" requerido textoTodos="Seleccione" opciones={categorias.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))} error={errors.categoriaCargaCodigo?.message} {...register('categoriaCargaCodigo')} />
            <CampoTexto etiqueta="Descripción de la carga" requerido className="sm:col-span-2" error={errors.descripcionCarga?.message} {...register('descripcionCarga')} />
            {usaContenedor && (
              <>
                <Selector etiqueta="Tipo de contenedor" requerido textoTodos="Seleccione" opciones={TIPOS_CONTENEDOR.map((t) => ({ valor: t, etiqueta: t }))} error={errors.contenedorTipo?.message} {...register('contenedorTipo')} />
                <CampoTexto
                  etiqueta="Número de contenedor"
                  placeholder="PFLU4821935"
                  className="[&_input]:uppercase"
                  maxLength={11}
                  error={errors.contenedorNumero?.message}
                  ayuda={esExportacion ? 'Puede completarse al retirar el contenedor en el depósito.' : '4 letras y 7 dígitos.'}
                  {...register('contenedorNumero')}
                />
              </>
            )}
            <AreaTexto etiqueta="Observaciones de la carga" rows={2} className="sm:col-span-2" {...register('observacionesCarga')} />
          </div>
        </Panel>

        <Panel titulo="Ruta de puntos operativos" descripcion={esExportacion ? 'Retiro de contenedor en depósito, paso por cliente o planta y entrega en puerto.' : modalidad === 'importacion_contenedorizada' ? 'Puerto, cliente o planta y depósito de devolución del contenedor.' : 'Puerto y cliente o planta; sin devolución de contenedor.'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector etiqueta={esExportacion ? 'Origen (depósito de retiro)' : 'Origen'} requerido textoTodos="Seleccione" opciones={lugares} error={errors.origenCodigo?.message} {...register('origenCodigo')} />
            <Selector etiqueta={esExportacion ? 'Destino (puerto de entrega)' : 'Destino (cliente o planta)'} requerido textoTodos="Seleccione" opciones={lugares} error={errors.destinoCodigo?.message} {...register('destinoCodigo')} />
            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs font-medium text-texto-secundario">
                {esExportacion ? 'Paso por cliente o planta' : 'Paradas intermedias'}
                {esExportacion && <span className="text-peligro" aria-hidden="true"> *</span>}
              </p>
              {paradas.map((campo, indice) => (
                <div key={campo.id} className="flex items-end gap-2">
                  <Selector etiqueta={`Parada ${indice + 1}`} ocultarEtiqueta textoTodos="Seleccione" className="flex-1" opciones={lugares} error={errors.paradas?.[indice]?.lugarCodigo?.message} {...register(`paradas.${indice}.lugarCodigo`)} />
                  <BotonIcono icono={Trash2} etiqueta={`Quitar parada ${indice + 1}`} onClick={() => remove(indice)} />
                </div>
              ))}
              {errors.paradas?.message && <p className="text-xs text-peligro">{errors.paradas.message}</p>}
              <Boton tamano="pequeno" icono={Plus} onClick={() => append({ lugarCodigo: '' })}>{esExportacion ? 'Agregar cliente o planta' : 'Agregar parada'}</Boton>
            </div>
            {modalidad === 'importacion_contenedorizada' && (
              <Selector etiqueta="Devolución del contenedor" requerido textoTodos="Seleccione el depósito" opciones={depositos} error={errors.devolucionCodigo?.message} {...register('devolucionCodigo')} />
            )}
          </div>
        </Panel>

        <Panel titulo="Asignación de recursos" descripcion="La disponibilidad es ilustrativa. El solapamiento se calcula con los horarios previstos de otros viajes y no bloquea el guardado.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Selector etiqueta="Transportista" textoTodos="Sin asignar" opciones={transportistas.map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))} error={errors.transportistaCodigo?.message} {...register('transportistaCodigo')} />
            <Selector etiqueta="Chofer" textoTodos={transportista ? 'Sin asignar' : 'Elija transportista'} opciones={opcionesChofer(choferes)} {...register('choferCodigo')} />
            <Selector etiqueta="Unidad" textoTodos={transportista ? 'Sin asignar' : 'Elija transportista'} opciones={opcionesUnidad(unidades)} {...register('unidadCodigo')} />
          </div>
          {solapamientos.length > 0 && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-md bg-pendiente-fondo text-pendiente px-3 py-2.5 text-sm">
              <TriangleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Posible solapamiento de recursos</p>
                <ul className="mt-1 space-y-0.5">
                  {solapamientos.map((s) => (
                    <li key={`${s.viajeCodigo}-${s.recurso}`}>
                      {s.recurso === 'chofer' ? 'El chofer' : 'La unidad'} {s.recurso === 'chofer' ? obtener(datos, 'choferes', s.recursoCodigo)?.nombre : obtener(datos, 'unidades', s.recursoCodigo)?.placa} ya está programado en <span className="font-mono">{s.viajeCodigo}</span> en un horario que se superpone.
                    </li>
                  ))}
                </ul>
                <p className="mt-1">Puede guardar de todas formas; el aviso queda visible en la programación.</p>
              </div>
            </div>
          )}
        </Panel>

        <Panel titulo="Horarios previstos" descripcion="El retraso se calcula contra estos compromisos (hora de Ecuador, 24 h).">
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            <CampoTexto etiqueta="Salida prevista" type="datetime-local" error={errors.salidaPrevista?.message} {...register('salidaPrevista')} />
            <CampoTexto etiqueta={esExportacion ? 'Entrega prevista en puerto' : 'Llegada prevista a cliente o planta'} type="datetime-local" error={errors.llegadaPrevista?.message} {...register('llegadaPrevista')} />
            <CampoTexto etiqueta="Cierre previsto" type="datetime-local" error={errors.cierrePrevisto?.message} {...register('cierrePrevisto')} />
          </div>
        </Panel>

        <Panel titulo="Cobro">
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector etiqueta="Modalidad de cobro" requerido opciones={opcionesDe(ETIQUETAS_MODALIDAD_COBRO, MODALIDADES_COBRO)} ayuda="No se exige anticipo antes de la salida." {...register('modalidadCobro')} />
            <CampoTexto etiqueta="Valor referencial (USD)" requerido type="number" min={0} step="0.01" inputMode="decimal" error={errors.valorReferencial?.message} {...register('valorReferencial', { valueAsNumber: true })} />
          </div>
          <AreaTexto etiqueta="Observaciones del viaje" rows={3} className="mt-4" {...register('observaciones')} />
        </Panel>

        {pideMotivo && (
          <Panel className="xl:col-span-2" titulo="Cambio de programación" descripcion="El viaje ya estaba programado. El motivo y la fecha del ajuste quedan en el historial del viaje y en la actividad.">
            <div className="flex items-start gap-3">
              <CalendarClock className="size-5 text-texto-secundario mt-6 shrink-0" aria-hidden="true" />
              <AreaTexto etiqueta="Motivo del ajuste" requerido rows={2} className="flex-1" error={errors.motivoAjuste?.message} {...register('motivoAjuste')} />
            </div>
          </Panel>
        )}

        <div className="xl:col-span-2">
          <PieFormulario onCancelar={volver} textoGuardar={esEdicion ? 'Guardar cambios' : 'Crear viaje'} enviando={isSubmitting} />
        </div>
      </form>
    </>
  )
}
