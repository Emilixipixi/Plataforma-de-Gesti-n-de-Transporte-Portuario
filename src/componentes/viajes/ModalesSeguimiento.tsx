import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Flag, Paperclip, TriangleAlert, X } from 'lucide-react'
import type { Evidencia, FuncionPuntoRuta, Incidencia, Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { Modal } from '@/componentes/modales/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { Insignia } from '@/componentes/comunes/Insignia'
import { AreaTexto, CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar } from '@/servicios/consultas'
import { finalizarViaje, horaPrevistaSugerida, registrarEvento, registrarIncidencia, resolverIncidencia, tiposEventoDisponibles } from '@/servicios/operaciones/seguimiento'
import { desvioEnMinutos, esViajeAbierto, incidenciasAbiertas, puedeFinalizar } from '@/utilidades/calculos'
import { esHitoDelSistema, HITOS } from '@/utilidades/constantes'
import { aValorFechaHoraLocal, desdeValorFechaHoraLocal, formatearDesvio, formatearFechaHora } from '@/utilidades/formateadores'
import {
  esquemaEvento,
  esquemaFinalizacion,
  esquemaIncidencia,
  esquemaResolucion,
  type EntradaEvento,
  type EntradaFinalizacion,
  type EntradaIncidencia,
  type EntradaResolucion,
} from '@/utilidades/validadores'

const FUNCION_POR_HITO: Partial<Record<string, { importacion: FuncionPuntoRuta; exportacion: FuncionPuntoRuta }>> = {
  [HITOS.salidaPuerto]: { importacion: 'origen', exportacion: 'origen' },
  [HITOS.llegadaCliente]: { importacion: 'destino', exportacion: 'parada' },
  [HITOS.descarga]: { importacion: 'destino', exportacion: 'parada' },
  [HITOS.entrega]: { importacion: 'destino', exportacion: 'destino' },
  [HITOS.entregaConfirmada]: { importacion: 'destino', exportacion: 'destino' },
  [HITOS.devolucionContenedor]: { importacion: 'devolucion', exportacion: 'destino' },
  [HITOS.retiroDeposito]: { importacion: 'origen', exportacion: 'origen' },
  [HITOS.salidaACliente]: { importacion: 'origen', exportacion: 'origen' },
  [HITOS.carga]: { importacion: 'destino', exportacion: 'parada' },
  [HITOS.salidaAPuerto]: { importacion: 'destino', exportacion: 'parada' },
  [HITOS.entregaEnPuerto]: { importacion: 'destino', exportacion: 'destino' },
}

function ubicacionSugerida(datos: ReturnType<typeof usarApp>['datos'], viaje: Viaje, hito: string): string {
  const funciones = FUNCION_POR_HITO[hito]
  if (!funciones) return ''
  const funcion = viaje.modalidad === 'exportacion' ? funciones.exportacion : funciones.importacion
  const punto = viaje.rutaPuntos.find((p) => p.funcion === funcion)
  return punto ? nombreLugar(datos, punto.lugarCodigo) : ''
}

function ahoraLocal(): string {
  return aValorFechaHoraLocal(new Date().toISOString())
}

interface PropiedadesCampoEvidencias {
  evidencias: Evidencia[]
  onCambiar: (lista: Evidencia[]) => void
  etiqueta?: string
  multiple?: boolean
}

export function CampoEvidencias({ evidencias, onCambiar, etiqueta = 'Evidencia (archivo ilustrativo)', multiple = true }: PropiedadesCampoEvidencias) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-texto-secundario">{etiqueta}</label>
      <input
        id={id}
        type="file"
        multiple={multiple}
        accept="image/*,.pdf"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? [])
          const nuevos = archivos.map((a) => ({ nombre: a.name, tipo: a.type || 'archivo', fecha: new Date().toISOString() }))
          if (!multiple) {
            if (nuevos.length > 0) onCambiar(nuevos.slice(0, 1))
          } else onCambiar([...evidencias, ...nuevos.filter((n) => !evidencias.some((ev) => ev.nombre === n.nombre))])
          e.target.value = ''
        }}
        className="text-sm text-texto-secundario file:mr-3 file:rounded-md file:border file:border-borde file:bg-superficie file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-texto hover:file:bg-fondo"
      />
      <p className="text-xs text-texto-secundario">Solo se registran el nombre y el tipo del archivo; el contenido no se almacena en el prototipo.</p>
      {evidencias.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {evidencias.map((ev) => (
            <li key={ev.nombre} className="inline-flex items-center gap-1 rounded-md border border-borde bg-fondo px-2 py-1 text-xs text-texto">
              <Paperclip className="size-3.5 text-texto-secundario" aria-hidden="true" />
              {ev.nombre}
              <button type="button" onClick={() => onCambiar(evidencias.filter((x) => x.nombre !== ev.nombre))} aria-label={`Quitar ${ev.nombre}`} className="text-texto-secundario hover:text-texto">
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ModalEvento({ viaje, abierto, onCerrar }: { viaje: Viaje; abierto: boolean; onCerrar: () => void }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const [evidencias, establecerEvidencias] = useState<Evidencia[]>([])
  const tipos = useMemo(() => tiposEventoDisponibles(datos, viaje), [datos, viaje])
  const inicial = (tipos.find((t) => esHitoDelSistema(t.codigo)) ?? tipos[0])?.codigo ?? ''
  const valoresPara = useCallback(
    (codigoTipo: string): EntradaEvento => ({
      tipoEventoCodigo: codigoTipo,
      ubicacion: codigoTipo ? ubicacionSugerida(datos, viaje, codigoTipo) : '',
      horaPrevista: codigoTipo ? aValorFechaHoraLocal(horaPrevistaSugerida(viaje, codigoTipo)) : '',
      horaReal: ahoraLocal(),
      comentario: '',
    }),
    [datos, viaje],
  )
  const { register, handleSubmit, reset, control, setValue, getValues, formState: { errors } } = useForm<EntradaEvento>({
    resolver: zodResolver(esquemaEvento),
    defaultValues: valoresPara(inicial),
  })
  const horaPrevista = useWatch({ control, name: 'horaPrevista' })
  const horaReal = useWatch({ control, name: 'horaReal' })

  useEffect(() => {
    if (!abierto) return
    reset(valoresPara(inicial))
    establecerEvidencias([])
  }, [abierto, inicial, reset, valoresPara])

  const elegirTipo = (codigoTipo: string) => {
    const sugeridos = valoresPara(codigoTipo)
    setValue('tipoEventoCodigo', codigoTipo)
    setValue('ubicacion', sugeridos.ubicacion || getValues('ubicacion'))
    setValue('horaPrevista', sugeridos.horaPrevista)
  }

  const desvio = desvioEnMinutos(desdeValorFechaHoraLocal(horaPrevista), desdeValorFechaHoraLocal(horaReal))
  const enviar = (entrada: EntradaEvento) => {
    const resultado = ejecutar(registrarEvento(viaje.codigo, entrada, evidencias))
    if (!resultado.ok) {
      notificar('error', 'No se pudo registrar el evento', resultado.error)
      return
    }
    notificar('exito', `Evento registrado: ${obtener(datos, 'tiposEvento', resultado.valor.tipoEventoCodigo)?.nombre ?? ''}`, `${viaje.codigo} · ${formatearFechaHora(resultado.valor.horaReal)}${resultado.mensaje ? `. ${resultado.mensaje}` : ''}`)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={`Registrar evento en ${viaje.codigo}`}
      descripcion="Registro manual del hito con su hora real. El desvío se calcula contra la hora prevista."
      onCerrar={onCerrar}
      ancho="grande"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={CheckCircle2} disabled={tipos.length === 0}>Registrar evento</Boton>
        </>
      }
    >
      {tipos.length === 0 ? (
        <AvisoDemostrativo>No quedan hitos por registrar. Si se cumplió el hito requerido, finalice el viaje.</AvisoDemostrativo>
      ) : (
        <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Hito o evento"
            requerido
            className="sm:col-span-2"
            opciones={tipos.map((t) => ({ valor: t.codigo, etiqueta: esHitoDelSistema(t.codigo) ? `${t.nombre} (siguiente hito)` : `${t.nombre} (evento adicional)` }))}
            error={errors.tipoEventoCodigo?.message}
            ayuda="Los hitos se registran en el orden de la modalidad; los eventos adicionales pueden registrarse en cualquier momento."
            {...register('tipoEventoCodigo', { onChange: (e: { target: { value: string } }) => elegirTipo(e.target.value) })}
          />
          <CampoTexto etiqueta="Ubicación" requerido className="sm:col-span-2" error={errors.ubicacion?.message} {...register('ubicacion')} />
          <CampoTexto etiqueta="Hora prevista" type="datetime-local" error={errors.horaPrevista?.message} ayuda="Compromiso registrado en el viaje cuando existe." {...register('horaPrevista')} />
          <CampoTexto etiqueta="Hora real" requerido type="datetime-local" error={errors.horaReal?.message} {...register('horaReal')} />
          <div className="sm:col-span-2 -mt-1">
            {desvio === null ? (
              <p className="text-xs text-texto-secundario">Sin hora prevista: el desvío no se calcula.</p>
            ) : (
              <Insignia tono={desvio > 0 ? 'peligro' : 'exito'}>{desvio > 0 ? `Retraso ${formatearDesvio(desvio)}` : 'A tiempo'}</Insignia>
            )}
          </div>
          <AreaTexto etiqueta="Comentario" rows={2} className="sm:col-span-2" {...register('comentario')} />
          <div className="sm:col-span-2"><CampoEvidencias evidencias={evidencias} onCambiar={establecerEvidencias} /></div>
        </form>
      )}
    </Modal>
  )
}

interface PropiedadesModalIncidencia {
  abierto: boolean
  onCerrar: () => void
  viaje?: Viaje
}

export function ModalIncidencia({ abierto, onCerrar, viaje }: PropiedadesModalIncidencia) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const [evidencias, establecerEvidencias] = useState<Evidencia[]>([])
  const viajesAbiertos = datos.viajes.filter((v) => esViajeAbierto(v))
  const tipos = datos.tiposIncidencia.filter((t) => t.estado === 'activo')
  const valoresIniciales = useMemo<EntradaIncidencia>(() => ({ viajeCodigo: viaje?.codigo ?? '', tipoIncidenciaCodigo: '', fechaHora: ahoraLocal(), ubicacion: '', descripcion: '' }), [viaje])
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntradaIncidencia>({ resolver: zodResolver(esquemaIncidencia), defaultValues: valoresIniciales })

  useEffect(() => {
    if (!abierto) return
    reset({ ...valoresIniciales, fechaHora: ahoraLocal() })
    establecerEvidencias([])
  }, [abierto, valoresIniciales, reset])

  const enviar = (entrada: EntradaIncidencia) => {
    const resultado = ejecutar(registrarIncidencia(entrada, evidencias))
    if (!resultado.ok) {
      notificar('error', 'No se pudo registrar la incidencia', resultado.error)
      return
    }
    notificar('exito', `Incidencia ${resultado.valor.codigo} registrada`, `El viaje ${resultado.valor.viajeCodigo} muestra la etiqueta Con incidencia.`)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={viaje ? `Registrar incidencia en ${viaje.codigo}` : 'Registrar incidencia'}
      descripcion="Paradas, esperas, demoras, problemas o cambios de ruta. No bloquea el viaje; debe resolverse o documentarse antes del cierre."
      onCerrar={onCerrar}
      ancho="grande"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={TriangleAlert}>Registrar incidencia</Boton>
        </>
      }
    >
      <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
        {viaje ? (
          <CampoTexto etiqueta="Viaje" value={`${viaje.codigo} · ${nombreCliente(datos, viaje.clienteCodigo)}`} readOnly disabled />
        ) : (
          <Selector etiqueta="Viaje" requerido textoTodos="Seleccione un viaje abierto" opciones={viajesAbiertos.map((v) => ({ valor: v.codigo, etiqueta: `${v.codigo} · ${nombreCliente(datos, v.clienteCodigo)}` }))} error={errors.viajeCodigo?.message} {...register('viajeCodigo')} />
        )}
        <Selector etiqueta="Tipo de incidencia" requerido textoTodos="Seleccione" opciones={tipos.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))} error={errors.tipoIncidenciaCodigo?.message} {...register('tipoIncidenciaCodigo')} />
        <CampoTexto etiqueta="Fecha y hora" requerido type="datetime-local" error={errors.fechaHora?.message} {...register('fechaHora')} />
        <CampoTexto etiqueta="Ubicación" requerido placeholder="Ej.: Vía Perimetral, km 12" error={errors.ubicacion?.message} {...register('ubicacion')} />
        <AreaTexto etiqueta="Descripción" requerido rows={3} className="sm:col-span-2" error={errors.descripcion?.message} {...register('descripcion')} />
        <div className="sm:col-span-2"><CampoEvidencias evidencias={evidencias} onCambiar={establecerEvidencias} /></div>
      </form>
    </Modal>
  )
}

export function ModalResolucion({ incidencia, onCerrar }: { incidencia: Incidencia | null; onCerrar: () => void }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntradaResolucion>({ resolver: zodResolver(esquemaResolucion), defaultValues: { accionCorrectiva: '', fechaResolucion: ahoraLocal() } })

  useEffect(() => {
    if (incidencia) reset({ accionCorrectiva: '', fechaResolucion: ahoraLocal() })
  }, [incidencia, reset])

  if (!incidencia) return null
  const enviar = (entrada: EntradaResolucion) => {
    const resultado = ejecutar(resolverIncidencia(incidencia.codigo, entrada))
    if (!resultado.ok) {
      notificar('error', 'No se pudo resolver la incidencia', resultado.error)
      return
    }
    notificar('exito', `Incidencia ${incidencia.codigo} resuelta`, 'La acción correctiva quedó registrada.')
    onCerrar()
  }
  return (
    <Modal
      abierto
      titulo={`Resolver incidencia ${incidencia.codigo}`}
      descripcion={`${obtener(datos, 'tiposIncidencia', incidencia.tipoIncidenciaCodigo)?.nombre ?? ''} en ${incidencia.viajeCodigo} · ${formatearFechaHora(incidencia.fechaHora)}`}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={CheckCircle2}>Marcar como resuelta</Boton>
        </>
      }
    >
      <p className="mb-4 rounded-md bg-fondo border border-borde px-3 py-2 text-sm text-texto">{incidencia.descripcion}</p>
      <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4">
        <AreaTexto etiqueta="Acción correctiva" requerido rows={3} error={errors.accionCorrectiva?.message} {...register('accionCorrectiva')} />
        <CampoTexto etiqueta="Fecha de resolución" requerido type="datetime-local" error={errors.fechaResolucion?.message} {...register('fechaResolucion')} />
      </form>
    </Modal>
  )
}

export function ModalFinalizar({ viaje, abierto, onCerrar }: { viaje: Viaje; abierto: boolean; onCerrar: () => void }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EntradaFinalizacion>({ resolver: zodResolver(esquemaFinalizacion), defaultValues: { horaCierre: ahoraLocal(), observacionCierre: '' } })
  const observacion = useWatch({ control, name: 'observacionCierre' })

  useEffect(() => {
    if (abierto) reset({ horaCierre: ahoraLocal(), observacionCierre: '' })
  }, [abierto, reset])

  const evaluacion = puedeFinalizar(viaje, datos.eventos, datos.incidencias, observacion)
  const abiertas = incidenciasAbiertas(viaje.codigo, datos.incidencias)
  const bloqueos = evaluacion.motivos.filter((m) => !m.startsWith('Hay incidencias abiertas'))

  const enviar = (entrada: EntradaFinalizacion) => {
    const resultado = ejecutar(finalizarViaje(viaje.codigo, entrada))
    if (!resultado.ok) {
      notificar('error', 'No se pudo finalizar', resultado.error)
      return
    }
    notificar('exito', `Viaje ${viaje.codigo} finalizado`, 'El servicio aparece como Por facturar en la bandeja contable.')
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={`Finalizar viaje ${viaje.codigo}`}
      descripcion="El cierre exige el último hito requerido de la modalidad. Una incidencia abierta no bloquea, pero requiere observación documentada."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={Flag} disabled={bloqueos.length > 0}>Finalizar viaje</Boton>
        </>
      }
    >
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm">
          {bloqueos.length === 0 ? <CheckCircle2 className="size-4 text-exito" aria-hidden="true" /> : <TriangleAlert className="size-4 text-peligro" aria-hidden="true" />}
          Hito requerido: <span className="font-medium">{obtener(datos, 'tiposEvento', evaluacion.hitoRequerido)?.nombre}</span>
        </p>
        {bloqueos.length > 0 && (
          <ul className="rounded-md bg-peligro-fondo text-peligro px-3 py-2 text-sm space-y-0.5">
            {bloqueos.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
        {abiertas.length > 0 && (
          <p className="rounded-md bg-pendiente-fondo text-pendiente px-3 py-2 text-sm">
            {abiertas.length === 1 ? 'Hay una incidencia abierta' : `Hay ${abiertas.length} incidencias abiertas`} ({abiertas.map((i) => i.codigo).join(', ')}). Resuélvala o documente la observación de cierre.
          </p>
        )}
        {bloqueos.length === 0 && (
          <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4">
            <CampoTexto etiqueta="Hora de cierre" requerido type="datetime-local" error={errors.horaCierre?.message} ayuda={viaje.cierrePrevisto ? `Cierre previsto: ${formatearFechaHora(viaje.cierrePrevisto)}` : undefined} {...register('horaCierre')} />
            <AreaTexto
              etiqueta="Observación de cierre"
              requerido={abiertas.length > 0}
              rows={3}
              error={abiertas.length > 0 && evaluacion.requiereObservacion && !observacion.trim() ? 'Obligatoria mientras existan incidencias abiertas.' : undefined}
              {...register('observacionCierre')}
            />
          </form>
        )}
      </div>
    </Modal>
  )
}
