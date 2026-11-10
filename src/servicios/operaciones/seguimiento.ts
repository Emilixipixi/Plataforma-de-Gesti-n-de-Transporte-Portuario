import type { CambioEstado, DatosApp, Evento, Evidencia, Incidencia, Viaje } from '@/tipos/dominio'
import type { DatosNuevaActividad } from '@/servicios/actividad'
import { guardar, obtener } from '@/servicios/repositorio'
import {
  esHitoDeInicio,
  estadoSiguienteTrasEvento,
  hitoDeCompromiso,
  hitosRegistrados,
  puedeFinalizar,
  siguienteHito,
  siguienteCodigo,
} from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_VIAJE, HITOS, PREFIJOS, SECUENCIA_HITOS, type CodigoHito } from '@/utilidades/constantes'
import { desdeValorFechaHoraLocal } from '@/utilidades/formateadores'
import type { EntradaEvento, EntradaFinalizacion, EntradaIncidencia, EntradaResolucion } from '@/utilidades/validadores'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000

function esFuturo(iso: string, ahora: string): boolean {
  return new Date(iso).getTime() > new Date(ahora).getTime() + TOLERANCIA_FUTURO_MS
}

function nombreTipoEvento(datos: DatosApp, codigo: string): string {
  return obtener(datos, 'tiposEvento', codigo)?.nombre ?? codigo
}

function actualizarDisponibilidad(datos: DatosApp, viaje: Viaje, enServicio: boolean): DatosApp {
  let resultado = datos
  const chofer = obtener(datos, 'choferes', viaje.choferCodigo)
  if (chofer && chofer.disponibilidad !== 'no_disponible') resultado = guardar(resultado, 'choferes', { ...chofer, disponibilidad: enServicio ? 'en_servicio' : 'disponible' })
  const unidad = obtener(datos, 'unidades', viaje.unidadCodigo)
  if (unidad && unidad.disponibilidad !== 'mantenimiento') resultado = guardar(resultado, 'unidades', { ...unidad, disponibilidad: enServicio ? 'en_servicio' : 'disponible' })
  return resultado
}

export function horaPrevistaSugerida(viaje: Viaje, tipoEventoCodigo: string): string | undefined {
  if (esHitoDeInicio(viaje, tipoEventoCodigo)) return viaje.salidaPrevista
  if (tipoEventoCodigo === hitoDeCompromiso(viaje.modalidad)) return viaje.llegadaPrevista
  if (tipoEventoCodigo === HITOS.cierre) return viaje.cierrePrevisto
  return undefined
}

export function tiposEventoDisponibles(datos: DatosApp, viaje: Viaje) {
  const registrados = hitosRegistrados(viaje, datos.eventos)
  const secuencia = SECUENCIA_HITOS[viaje.modalidad] as readonly string[]
  const proximo = siguienteHito(viaje, datos.eventos)
  return datos.tiposEvento
    .filter((t) => t.estado === 'activo' && t.modalidades.includes(viaje.modalidad) && t.codigo !== HITOS.cierre)
    .filter((t) => !secuencia.includes(t.codigo) || (!registrados.has(t.codigo) && t.codigo === proximo))
}

export function registrarEvento(viajeCodigo: string, entrada: EntradaEvento, evidencias: Evidencia[]): Operacion<Evento> {
  return (datos, { usuarioCodigo, ahora }) => {
    const viaje = obtener(datos, 'viajes', viajeCodigo)
    if (!viaje) return fallo(`El viaje ${viajeCodigo} no existe.`)
    if (viaje.estado === 'cancelado' || viaje.estado === 'finalizado') return fallo(`El viaje está ${ETIQUETAS_ESTADO_VIAJE[viaje.estado].toLowerCase()}; no admite nuevos eventos.`)
    if (viaje.estado === 'solicitado') return fallo('Complete la asignación del viaje antes de registrar hitos.')
    const tipo = obtener(datos, 'tiposEvento', entrada.tipoEventoCodigo)
    if (!tipo || !tipo.modalidades.includes(viaje.modalidad)) return fallo('El tipo de evento no corresponde a la modalidad del viaje.')
    if (tipo.codigo === HITOS.cierre) return fallo('El cierre se registra con la acción Finalizar viaje.')
    const secuencia = SECUENCIA_HITOS[viaje.modalidad] as readonly string[]
    if (secuencia.includes(tipo.codigo)) {
      if (hitosRegistrados(viaje, datos.eventos).has(tipo.codigo)) return fallo(`El hito ${tipo.nombre} ya fue registrado.`)
      const proximo = siguienteHito(viaje, datos.eventos)
      if (proximo && proximo !== tipo.codigo) return fallo(`Registre primero el hito ${nombreTipoEvento(datos, proximo)}.`)
    }
    const horaReal = desdeValorFechaHoraLocal(entrada.horaReal)
    if (!horaReal) return fallo('La hora real no es válida.')
    if (esFuturo(horaReal, ahora)) return fallo('La hora real no puede estar en el futuro.')
    const horaPrevista = desdeValorFechaHoraLocal(entrada.horaPrevista) ?? horaPrevistaSugerida(viaje, tipo.codigo)

    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.evento)
    const evento: Evento = {
      codigo: generado.codigo,
      viajeCodigo,
      tipoEventoCodigo: tipo.codigo,
      ubicacion: entrada.ubicacion.trim(),
      ...(horaPrevista ? { horaPrevista } : {}),
      horaReal,
      responsableCodigo: usuarioCodigo,
      comentario: entrada.comentario.trim(),
      evidencias,
    }

    const estadoNuevo = estadoSiguienteTrasEvento(viaje, tipo.codigo)
    const cambio: CambioEstado[] = estadoNuevo ? [{ fecha: horaReal, estadoAnterior: viaje.estado, estadoNuevo, usuarioCodigo, motivo: `Hito: ${tipo.nombre}` }] : []
    const viajeActualizado: Viaje = {
      ...viaje,
      estado: estadoNuevo ?? viaje.estado,
      ...(esHitoDeInicio(viaje, tipo.codigo) ? { salidaReal: horaReal } : {}),
      ...(tipo.codigo === hitoDeCompromiso(viaje.modalidad) ? { llegadaReal: horaReal } : {}),
      historialEstados: [...viaje.historialEstados, ...cambio],
    }

    let nuevos = guardar(guardar({ ...datos, configuracion: generado.configuracion }, 'eventos', evento), 'viajes', viajeActualizado)
    if (estadoNuevo === 'en_ejecucion') nuevos = actualizarDisponibilidad(nuevos, viajeActualizado, true)
    const actividad: DatosNuevaActividad[] = [
      { usuarioCodigo, accion: 'evento', entidad: 'evento', codigoEntidad: evento.codigo, descripcion: `${tipo.nombre} registrado en ${viajeCodigo}.` },
    ]
    if (estadoNuevo) actividad.push({ usuarioCodigo, accion: 'cambio_estado', entidad: 'viaje', codigoEntidad: viajeCodigo, descripcion: `Estado: ${ETIQUETAS_ESTADO_VIAJE[viaje.estado]} a ${ETIQUETAS_ESTADO_VIAJE[estadoNuevo]}.` })
    return exito(nuevos, actividad, evento, estadoNuevo ? `El viaje pasó a ${ETIQUETAS_ESTADO_VIAJE[estadoNuevo]}.` : undefined)
  }
}

export function registrarIncidencia(entrada: EntradaIncidencia, evidencias: Evidencia[]): Operacion<Incidencia> {
  return (datos, { usuarioCodigo, ahora }) => {
    const viaje = obtener(datos, 'viajes', entrada.viajeCodigo)
    if (!viaje) return fallo('El viaje seleccionado no existe.')
    if (viaje.estado === 'cancelado' || viaje.estado === 'finalizado') return fallo('Solo se registran incidencias en viajes abiertos.')
    const tipo = obtener(datos, 'tiposIncidencia', entrada.tipoIncidenciaCodigo)
    if (!tipo) return fallo('El tipo de incidencia no existe.')
    const fechaHora = desdeValorFechaHoraLocal(entrada.fechaHora)
    if (!fechaHora) return fallo('La fecha y hora no son válidas.')
    if (esFuturo(fechaHora, ahora)) return fallo('La incidencia no puede tener fecha futura.')
    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.incidencia)
    const incidencia: Incidencia = {
      codigo: generado.codigo,
      viajeCodigo: viaje.codigo,
      tipoIncidenciaCodigo: tipo.codigo,
      fechaHora,
      ubicacion: entrada.ubicacion.trim(),
      descripcion: entrada.descripcion.trim(),
      responsableCodigo: usuarioCodigo,
      evidencias,
      estado: 'abierta',
    }
    return exito(
      { ...guardar(datos, 'incidencias', incidencia), configuracion: generado.configuracion },
      [{ usuarioCodigo, accion: 'incidencia', entidad: 'incidencia', codigoEntidad: incidencia.codigo, descripcion: `${tipo.nombre} registrada en ${viaje.codigo}: ${incidencia.descripcion}` }],
      incidencia,
    )
  }
}

export function resolverIncidencia(codigo: string, entrada: EntradaResolucion): Operacion<Incidencia> {
  return (datos, { usuarioCodigo, ahora }) => {
    const actual = obtener(datos, 'incidencias', codigo)
    if (!actual) return fallo(`La incidencia ${codigo} no existe.`)
    if (actual.estado === 'resuelta') return fallo('La incidencia ya está resuelta.')
    const fechaResolucion = desdeValorFechaHoraLocal(entrada.fechaResolucion)
    if (!fechaResolucion) return fallo('La fecha de resolución no es válida.')
    if (fechaResolucion < actual.fechaHora) return fallo('La resolución no puede ser anterior a la incidencia.')
    if (esFuturo(fechaResolucion, ahora)) return fallo('La fecha de resolución no puede estar en el futuro.')
    const incidencia: Incidencia = { ...actual, estado: 'resuelta', accionCorrectiva: entrada.accionCorrectiva.trim(), fechaResolucion }
    return exito(
      guardar(datos, 'incidencias', incidencia),
      [{ usuarioCodigo, accion: 'resolucion_incidencia', entidad: 'incidencia', codigoEntidad: codigo, descripcion: `Incidencia de ${actual.viajeCodigo} resuelta: ${incidencia.accionCorrectiva}` }],
      incidencia,
    )
  }
}

export function finalizarViaje(viajeCodigo: string, entrada: EntradaFinalizacion): Operacion<Viaje> {
  return (datos, { usuarioCodigo, ahora }) => {
    const viaje = obtener(datos, 'viajes', viajeCodigo)
    if (!viaje) return fallo(`El viaje ${viajeCodigo} no existe.`)
    const evaluacion = puedeFinalizar(viaje, datos.eventos, datos.incidencias, entrada.observacionCierre)
    if (!evaluacion.permitido) return fallo(evaluacion.motivos.join(' '))
    const horaCierre = desdeValorFechaHoraLocal(entrada.horaCierre)
    if (!horaCierre) return fallo('La hora de cierre no es válida.')
    if (esFuturo(horaCierre, ahora)) return fallo('La hora de cierre no puede estar en el futuro.')
    const ultimo = datos.eventos.filter((e) => e.viajeCodigo === viajeCodigo && e.horaReal).map((e) => e.horaReal ?? '').sort().at(-1)
    if (ultimo && horaCierre < ultimo) return fallo('El cierre no puede ser anterior al último hito registrado.')

    const generado = siguienteCodigo(datos.configuracion, PREFIJOS.evento)
    const hitoCierre: CodigoHito = HITOS.cierre
    const evento: Evento = {
      codigo: generado.codigo,
      viajeCodigo,
      tipoEventoCodigo: hitoCierre,
      ubicacion: obtener(datos, 'lugares', [...viaje.rutaPuntos].sort((a, b) => b.orden - a.orden)[0]?.lugarCodigo)?.nombre ?? '',
      ...(viaje.cierrePrevisto ? { horaPrevista: viaje.cierrePrevisto } : {}),
      horaReal: horaCierre,
      responsableCodigo: usuarioCodigo,
      comentario: entrada.observacionCierre.trim() || 'Cierre del servicio.',
      evidencias: [],
    }
    const observacion = entrada.observacionCierre.trim()
    const viajeFinal: Viaje = {
      ...viaje,
      estado: 'finalizado',
      cierreReal: horaCierre,
      ...(observacion ? { observacionCierre: observacion } : {}),
      historialEstados: [
        ...viaje.historialEstados,
        { fecha: horaCierre, estadoAnterior: viaje.estado, estadoNuevo: 'finalizado', usuarioCodigo, motivo: evaluacion.requiereObservacion ? `Cierre con incidencia documentada: ${observacion}` : 'Último hito requerido cumplido' },
      ],
    }
    const nuevos = actualizarDisponibilidad(
      guardar(guardar({ ...datos, configuracion: generado.configuracion }, 'eventos', evento), 'viajes', viajeFinal),
      viajeFinal,
      false,
    )
    return exito(
      nuevos,
      [{ usuarioCodigo, accion: 'finalizacion', entidad: 'viaje', codigoEntidad: viajeCodigo, descripcion: `Viaje finalizado${evaluacion.requiereObservacion ? ' con observación por incidencia abierta' : ''}. Queda disponible para facturación.` }],
      viajeFinal,
    )
  }
}
