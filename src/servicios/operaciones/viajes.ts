import type { AjusteProgramacion, CambioEstado, DatosApp, EstadoViaje, PuntoRuta, Viaje } from '@/tipos/dominio'
import type { DatosNuevaActividad } from '@/servicios/actividad'
import { guardar, obtener } from '@/servicios/repositorio'
import { hayAdvertenciaSolapamiento, siguienteCodigo, tieneAsignacionCompleta, type Solapamiento } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD, prefijoDeViaje, TIPO_CARGA_POR_MODALIDAD } from '@/utilidades/constantes'
import { desdeValorFechaHoraLocal, formatearFechaHora } from '@/utilidades/formateadores'
import type { EntradaViaje } from '@/utilidades/validadores'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

export interface ResultadoGuardarViaje {
  viaje: Viaje
  solapamientos: Solapamiento[]
  ajustes: number
}

const SIN_ASIGNAR = 'Sin asignar'

function rutaDesdeEntrada(entrada: EntradaViaje): PuntoRuta[] {
  const puntos: Omit<PuntoRuta, 'orden'>[] = [
    { lugarCodigo: entrada.origenCodigo, funcion: 'origen' },
    ...entrada.paradas.map((p) => ({ lugarCodigo: p.lugarCodigo, funcion: 'parada' as const })),
    { lugarCodigo: entrada.destinoCodigo, funcion: 'destino' },
    ...(entrada.modalidad === 'importacion_contenedorizada' && entrada.devolucionCodigo
      ? [{ lugarCodigo: entrada.devolucionCodigo, funcion: 'devolucion' as const }]
      : []),
  ]
  return puntos.map((p, i) => ({ ...p, orden: i + 1 }))
}

function sinIndefinidos<T extends object>(objeto: T): T {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined)) as T
}

function camposProgramables(datos: DatosApp, viaje: Viaje): Record<string, string> {
  const nombreLugar = (codigo: string) => obtener(datos, 'lugares', codigo)?.nombre ?? codigo
  return {
    Transportista: obtener(datos, 'transportistas', viaje.transportistaCodigo)?.razonSocial ?? SIN_ASIGNAR,
    Chofer: obtener(datos, 'choferes', viaje.choferCodigo)?.nombre ?? SIN_ASIGNAR,
    Unidad: obtener(datos, 'unidades', viaje.unidadCodigo)?.placa ?? SIN_ASIGNAR,
    'Salida prevista': viaje.salidaPrevista ? formatearFechaHora(viaje.salidaPrevista) : SIN_ASIGNAR,
    'Llegada prevista': viaje.llegadaPrevista ? formatearFechaHora(viaje.llegadaPrevista) : SIN_ASIGNAR,
    'Cierre previsto': viaje.cierrePrevisto ? formatearFechaHora(viaje.cierrePrevisto) : SIN_ASIGNAR,
    'Ruta de puntos': viaje.rutaPuntos.map((p) => nombreLugar(p.lugarCodigo)).join(' → '),
  }
}

export function cambiosDeProgramacion(datos: DatosApp, anterior: Viaje, nuevo: Viaje): { campo: string; valorAnterior: string; valorNuevo: string }[] {
  const antes = camposProgramables(datos, anterior)
  const despues = camposProgramables(datos, nuevo)
  return Object.keys(antes)
    .filter((campo) => antes[campo] !== despues[campo])
    .map((campo) => ({ campo, valorAnterior: antes[campo] ?? '', valorNuevo: despues[campo] ?? '' }))
}

export function requiereMotivoDeAjuste(estado: EstadoViaje): boolean {
  return estado !== 'solicitado'
}

function construirViaje(entrada: EntradaViaje, base: Pick<Viaje, 'codigo' | 'estado' | 'historialEstados' | 'ajustesProgramacion' | 'creadoPor' | 'fechaCreacion'> & Partial<Viaje>): Viaje {
  const contenedor =
    entrada.modalidad !== 'importacion_suelta' && entrada.contenedorTipo
      ? { tipo: entrada.contenedorTipo, numero: entrada.contenedorNumero }
      : undefined
  const ruta = rutaDesdeEntrada(entrada)
  return sinIndefinidos<Viaje>({
    ...base,
    clienteCodigo: entrada.clienteCodigo,
    modalidad: entrada.modalidad,
    carga: sinIndefinidos({
      tipo: TIPO_CARGA_POR_MODALIDAD[entrada.modalidad],
      categoriaCodigo: entrada.categoriaCargaCodigo || undefined,
      descripcion: entrada.descripcionCarga.trim(),
      observaciones: entrada.observacionesCarga.trim(),
      contenedor,
    }),
    origenCodigo: entrada.origenCodigo,
    destinoCodigo: entrada.destinoCodigo,
    rutaPuntos: ruta,
    transportistaCodigo: entrada.transportistaCodigo || undefined,
    choferCodigo: entrada.choferCodigo || undefined,
    unidadCodigo: entrada.unidadCodigo || undefined,
    salidaPrevista: desdeValorFechaHoraLocal(entrada.salidaPrevista),
    llegadaPrevista: desdeValorFechaHoraLocal(entrada.llegadaPrevista),
    cierrePrevisto: desdeValorFechaHoraLocal(entrada.cierrePrevisto),
    modalidadCobro: entrada.modalidadCobro,
    valorReferencial: Math.round(entrada.valorReferencial * 100) / 100,
    observaciones: entrada.observaciones.trim(),
  })
}

function validarRecursos(datos: DatosApp, entrada: EntradaViaje): string | null {
  const chofer = obtener(datos, 'choferes', entrada.choferCodigo || undefined)
  const unidad = obtener(datos, 'unidades', entrada.unidadCodigo || undefined)
  if (chofer && chofer.transportistaCodigo !== entrada.transportistaCodigo) return 'El chofer no pertenece al transportista seleccionado.'
  if (unidad && unidad.transportistaCodigo !== entrada.transportistaCodigo) return 'La unidad no pertenece al transportista seleccionado.'
  const cliente = obtener(datos, 'clientes', entrada.clienteCodigo)
  if (!cliente) return 'El cliente seleccionado no existe.'
  return null
}

function estadoSegunAsignacion(viaje: Viaje): EstadoViaje {
  if (viaje.estado === 'solicitado' && tieneAsignacionCompleta(viaje)) return 'programado'
  if (viaje.estado === 'programado' && !tieneAsignacionCompleta(viaje)) return 'solicitado'
  return viaje.estado
}

export function guardarViaje(codigo: string | undefined, entrada: EntradaViaje): Operacion<ResultadoGuardarViaje> {
  return (datos, { usuarioCodigo, ahora }) => {
    const errorRecursos = validarRecursos(datos, entrada)
    if (errorRecursos) return fallo(errorRecursos)
    const actividad: DatosNuevaActividad[] = []
    const cliente = obtener(datos, 'clientes', entrada.clienteCodigo)

    if (!codigo) {
      if (cliente?.estado !== 'activo') return fallo('El cliente está inactivo.')
      const generado = siguienteCodigo(datos.configuracion, prefijoDeViaje(entrada.modalidad))
      const borrador = construirViaje(entrada, {
        codigo: generado.codigo,
        estado: 'solicitado',
        historialEstados: [{ fecha: ahora, estadoAnterior: null, estadoNuevo: 'solicitado', usuarioCodigo, motivo: 'Creación directa del viaje' }],
        ajustesProgramacion: [],
        creadoPor: usuarioCodigo,
        fechaCreacion: ahora,
      })
      const estado = estadoSegunAsignacion(borrador)
      const viaje: Viaje =
        estado === borrador.estado
          ? borrador
          : { ...borrador, estado, historialEstados: [...borrador.historialEstados, { fecha: ahora, estadoAnterior: 'solicitado', estadoNuevo: estado, usuarioCodigo, motivo: 'Asignación de transportista, chofer, unidad y horarios' }] }
      actividad.push({ usuarioCodigo, accion: 'creacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Viaje de ${ETIQUETAS_MODALIDAD[viaje.modalidad].toLowerCase()} creado para ${cliente.razonSocial}.` })
      if (estado === 'programado') actividad.push({ usuarioCodigo, accion: 'asignacion', entidad: 'viaje', codigoEntidad: viaje.codigo, descripcion: `Asignados chofer ${viaje.choferCodigo ?? ''} y unidad ${viaje.unidadCodigo ?? ''}.` })
      return exito(
        { ...guardar(datos, 'viajes', viaje), configuracion: generado.configuracion },
        actividad,
        { viaje, solapamientos: hayAdvertenciaSolapamiento(viaje, datos.viajes), ajustes: 0 },
      )
    }

    const actual = obtener(datos, 'viajes', codigo)
    if (!actual) return fallo(`El viaje ${codigo} no existe.`)
    if (actual.estado === 'finalizado' || actual.estado === 'cancelado') return fallo('Un viaje finalizado o cancelado no puede editarse.')
    if (prefijoDeViaje(actual.modalidad) !== prefijoDeViaje(entrada.modalidad)) return fallo('No se puede cambiar entre importación y exportación; cree un viaje nuevo.')
    const tieneEventos = datos.eventos.some((e) => e.viajeCodigo === codigo)
    if (tieneEventos && (actual.modalidad !== entrada.modalidad || actual.clienteCodigo !== entrada.clienteCodigo)) {
      return fallo('El viaje ya tiene eventos registrados; el cliente y la modalidad no pueden cambiarse.')
    }

    const editado = construirViaje(entrada, actual)
    const cambios = cambiosDeProgramacion(datos, actual, editado)
    const motivo = entrada.motivoAjuste.trim()
    if (cambios.length > 0 && requiereMotivoDeAjuste(actual.estado) && motivo.length < 5) {
      return fallo('El viaje ya está programado: registre el motivo del cambio de programación.')
    }
    const ajustes: AjusteProgramacion[] =
      cambios.length > 0 && requiereMotivoDeAjuste(actual.estado) ? cambios.map((c) => ({ ...c, fecha: ahora, motivo, usuarioCodigo })) : []
    const estado = estadoSegunAsignacion(editado)
    const cambioEstado: CambioEstado[] =
      estado === actual.estado
        ? []
        : [{ fecha: ahora, estadoAnterior: actual.estado, estadoNuevo: estado, usuarioCodigo, motivo: estado === 'programado' ? 'Asignación de transportista, chofer, unidad y horarios' : 'Asignación incompleta' }]
    const viaje: Viaje = {
      ...editado,
      estado,
      historialEstados: [...actual.historialEstados, ...cambioEstado],
      ajustesProgramacion: [...actual.ajustesProgramacion, ...ajustes],
    }

    actividad.push({ usuarioCodigo, accion: 'edicion', entidad: 'viaje', codigoEntidad: codigo, descripcion: 'Datos del viaje actualizados.' })
    if (ajustes.length > 0) {
      actividad.push({ usuarioCodigo, accion: 'cambio_programacion', entidad: 'viaje', codigoEntidad: codigo, descripcion: `Ajuste de ${ajustes.map((a) => a.campo.toLowerCase()).join(', ')}. Motivo: ${motivo}` })
    }
    if (estado === 'programado' && actual.estado === 'solicitado') {
      actividad.push({ usuarioCodigo, accion: 'asignacion', entidad: 'viaje', codigoEntidad: codigo, descripcion: `Asignados chofer ${viaje.choferCodigo ?? ''} y unidad ${viaje.unidadCodigo ?? ''}.` })
    }
    return exito(guardar(datos, 'viajes', viaje), actividad, { viaje, solapamientos: hayAdvertenciaSolapamiento(viaje, datos.viajes), ajustes: ajustes.length })
  }
}

export function cancelarViaje(codigo: string, motivo: string): Operacion<Viaje> {
  return (datos, { usuarioCodigo, ahora }) => {
    const actual = obtener(datos, 'viajes', codigo)
    if (!actual) return fallo(`El viaje ${codigo} no existe.`)
    if (actual.estado === 'finalizado') return fallo('Un viaje finalizado no puede cancelarse.')
    if (actual.estado === 'cancelado') return fallo('El viaje ya está cancelado.')
    const texto = motivo.trim()
    if (texto.length < 10) return fallo('Documente el motivo de la cancelación.')
    const viaje: Viaje = {
      ...actual,
      estado: 'cancelado',
      motivoCancelacion: texto,
      historialEstados: [...actual.historialEstados, { fecha: ahora, estadoAnterior: actual.estado, estadoNuevo: 'cancelado', usuarioCodigo, motivo: texto }],
    }
    return exito(
      guardar(datos, 'viajes', viaje),
      [{ usuarioCodigo, accion: 'cancelacion', entidad: 'viaje', codigoEntidad: codigo, descripcion: `Viaje cancelado. Motivo: ${texto}` }],
      viaje,
    )
  }
}
