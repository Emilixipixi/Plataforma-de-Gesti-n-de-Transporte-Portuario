import type { DatosApp, EstadoViaje, Modalidad, Viaje } from '@/tipos/dominio'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar, nombreTransportista, nombreUsuario } from '@/servicios/consultas'
import type { Celda, Seccion } from '@/servicios/exportacion'
import {
  desvioDeLlegada,
  desvioEnMinutos,
  esViajeAbierto,
  estadoFacturacionServicio,
  estaRetrasado,
  eventosDeViaje,
  llegadaRealDeViaje,
  secuenciaDeHitos,
} from '@/utilidades/calculos'
import {
  ETIQUETAS_ESTADO_INCIDENCIA,
  ETIQUETAS_ESTADO_SERVICIO,
  ETIQUETAS_ESTADO_VIAJE,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODALIDAD_COBRO,
} from '@/utilidades/constantes'
import { claveDia } from '@/utilidades/fechas'
import { formatearDesvio, formatearFechaHora, formatearMoneda, formatearPorcentaje } from '@/utilidades/formateadores'

export type Cumplimiento = 'A tiempo' | 'Retrasado' | 'Sin medir'

export function cumplimientoDeViaje(datos: DatosApp, viaje: Viaje, ahora: Date): Cumplimiento {
  const desvio = desvioDeLlegada(viaje, datos.eventos)
  if (desvio !== null) return desvio > 0 ? 'Retrasado' : 'A tiempo'
  if (esViajeAbierto(viaje) && estaRetrasado(viaje, datos.eventos, ahora)) return 'Retrasado'
  return 'Sin medir'
}

export interface EtapaReporte {
  hito: string
  ubicacion: string
  prevista?: string
  real?: string
  desvio: number | null
  responsable: string
  comentario: string
  registrado: boolean
}

export interface IncidenciaReporte {
  codigo: string
  tipo: string
  fechaHora: string
  ubicacion: string
  descripcion: string
  estado: string
  accionCorrectiva?: string
  fechaResolucion?: string
}

export interface ReporteViaje {
  viaje: Viaje
  cliente: string
  identificacionCliente: string
  modalidad: string
  origen: string
  destino: string
  ruta: string
  transportista: string
  chofer: string
  placa: string
  contenedor: string
  carga: string
  estado: string
  etapas: EtapaReporte[]
  incidencias: IncidenciaReporte[]
  desvioLlegada: number | null
  llegadaReal?: string
  cumplimiento: Cumplimiento
  explicacionRetraso: string
  observaciones: string
  valor: string
  cobro: string
  facturacion: string
}

export function reporteDeViaje(datos: DatosApp, viaje: Viaje, ahora: Date): ReporteViaje {
  const cliente = obtener(datos, 'clientes', viaje.clienteCodigo)
  const chofer = obtener(datos, 'choferes', viaje.choferCodigo)
  const unidad = obtener(datos, 'unidades', viaje.unidadCodigo)
  const eventos = eventosDeViaje(viaje.codigo, datos.eventos)
  const secuencia = secuenciaDeHitos(viaje.modalidad, datos.tiposEvento)
  const codigosSecuencia = new Set(secuencia.map((h) => h.codigo))
  const etapas: EtapaReporte[] = [
    ...secuencia.map((hito) => {
      const evento = eventos.find((e) => e.tipoEventoCodigo === hito.codigo)
      return {
        hito: hito.nombre,
        ubicacion: evento?.ubicacion ?? '',
        ...(evento?.horaPrevista ? { prevista: evento.horaPrevista } : {}),
        ...(evento?.horaReal ? { real: evento.horaReal } : {}),
        desvio: evento ? desvioEnMinutos(evento.horaPrevista, evento.horaReal) : null,
        responsable: evento ? nombreUsuario(datos, evento.responsableCodigo) : '',
        comentario: evento?.comentario ?? '',
        registrado: Boolean(evento),
      }
    }),
    ...eventos
      .filter((e) => !codigosSecuencia.has(e.tipoEventoCodigo))
      .map((e) => ({
        hito: `${obtener(datos, 'tiposEvento', e.tipoEventoCodigo)?.nombre ?? e.tipoEventoCodigo} (adicional)`,
        ubicacion: e.ubicacion,
        ...(e.horaPrevista ? { prevista: e.horaPrevista } : {}),
        ...(e.horaReal ? { real: e.horaReal } : {}),
        desvio: desvioEnMinutos(e.horaPrevista, e.horaReal),
        responsable: nombreUsuario(datos, e.responsableCodigo),
        comentario: e.comentario,
        registrado: true,
      })),
  ]
  const incidencias = datos.incidencias
    .filter((i) => i.viajeCodigo === viaje.codigo)
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
    .map((i) => ({
      codigo: i.codigo,
      tipo: obtener(datos, 'tiposIncidencia', i.tipoIncidenciaCodigo)?.nombre ?? i.tipoIncidenciaCodigo,
      fechaHora: i.fechaHora,
      ubicacion: i.ubicacion,
      descripcion: i.descripcion,
      estado: ETIQUETAS_ESTADO_INCIDENCIA[i.estado],
      ...(i.accionCorrectiva ? { accionCorrectiva: i.accionCorrectiva } : {}),
      ...(i.fechaResolucion ? { fechaResolucion: i.fechaResolucion } : {}),
    }))
  const desvioLlegada = desvioDeLlegada(viaje, datos.eventos)
  const cumplimiento = cumplimientoDeViaje(datos, viaje, ahora)
  const etapasTardias = etapas.filter((e) => e.desvio !== null && e.desvio > 0 && e.comentario)
  const explicacionRetraso =
    cumplimiento === 'Retrasado'
      ? [
          desvioLlegada !== null ? `La llegada comprometida se registró con un desvío de ${formatearDesvio(desvioLlegada)}.` : 'La hora comprometida de llegada fue superada sin registro de llegada.',
          ...incidencias.map((i) => `${i.tipo} (${i.codigo}): ${i.descripcion}`),
          ...etapasTardias.slice(0, 2).map((e) => `${e.hito}: ${e.comentario}`),
        ].join(' ')
      : ''
  const servicio = estadoFacturacionServicio(viaje, datos.facturas)
  const puntos = [...viaje.rutaPuntos].sort((a, b) => a.orden - b.orden)
  return {
    viaje,
    cliente: cliente?.razonSocial ?? viaje.clienteCodigo,
    identificacionCliente: cliente?.identificacion ?? '',
    modalidad: ETIQUETAS_MODALIDAD[viaje.modalidad],
    origen: nombreLugar(datos, viaje.origenCodigo),
    destino: nombreLugar(datos, viaje.destinoCodigo),
    ruta: puntos.map((p) => nombreLugar(datos, p.lugarCodigo)).join(' → '),
    transportista: nombreTransportista(datos, viaje.transportistaCodigo),
    chofer: chofer?.nombre ?? 'Sin asignar',
    placa: unidad?.placa ?? 'Sin asignar',
    contenedor: viaje.carga.contenedor ? `${viaje.carga.contenedor.numero || 'Número pendiente'} (${viaje.carga.contenedor.tipo})` : 'No aplica',
    carga: viaje.carga.descripcion,
    estado: ETIQUETAS_ESTADO_VIAJE[viaje.estado],
    etapas,
    incidencias,
    desvioLlegada,
    ...(llegadaRealDeViaje(viaje, datos.eventos) ? { llegadaReal: llegadaRealDeViaje(viaje, datos.eventos) } : {}),
    cumplimiento,
    explicacionRetraso,
    observaciones: [viaje.observaciones, viaje.observacionCierre && `Cierre: ${viaje.observacionCierre}`].filter(Boolean).join('\n'),
    valor: formatearMoneda(viaje.valorReferencial),
    cobro: ETIQUETAS_MODALIDAD_COBRO[viaje.modalidadCobro],
    facturacion: servicio ? ETIQUETAS_ESTADO_SERVICIO[servicio] : 'No aplica',
  }
}

export function seccionesReporteViaje(reporte: ReporteViaje, interno: boolean): Seccion[] {
  return [
    {
      tipo: 'datos',
      titulo: 'Datos del servicio',
      pares: [
        ['Código de viaje', reporte.viaje.codigo],
        ['Cliente', `${reporte.cliente} (${reporte.identificacionCliente})`],
        ['Modalidad', reporte.modalidad],
        ['Recorrido', reporte.ruta],
        ['Carga', reporte.carga],
        ['Contenedor', reporte.contenedor],
        ['Transportista', reporte.transportista],
        ['Chofer y placa', `${reporte.chofer} · ${reporte.placa}`],
        ['Estado', reporte.estado],
        ['Llegada prevista', formatearFechaHora(reporte.viaje.llegadaPrevista)],
        ['Llegada real', formatearFechaHora(reporte.llegadaReal)],
        ['Desvío', formatearDesvio(reporte.desvioLlegada)],
        ['Cumplimiento del plazo', reporte.cumplimiento],
        ...(interno ? ([['Valor referencial', reporte.valor], ['Modalidad de cobro', reporte.cobro], ['Facturación', reporte.facturacion]] as [string, string][]) : []),
      ],
    },
    {
      tipo: 'tabla',
      titulo: 'Etapas y marcas horarias',
      columnas: ['Hito', 'Ubicación', 'Prevista', 'Real', 'Desvío', ...(interno ? ['Registró'] : [])],
      filas: reporte.etapas.map((e) => [
        e.hito,
        e.ubicacion || (e.registrado ? '' : 'Pendiente'),
        formatearFechaHora(e.prevista),
        e.registrado ? formatearFechaHora(e.real) : 'Pendiente',
        formatearDesvio(e.desvio),
        ...(interno ? [e.responsable] : []),
      ]),
    },
    {
      tipo: 'tabla',
      titulo: 'Novedades e incidencias',
      columnas: ['Código', 'Tipo', 'Fecha', 'Descripción', 'Estado', 'Acción correctiva'],
      filas: reporte.incidencias.map((i) => [i.codigo, i.tipo, formatearFechaHora(i.fechaHora), i.descripcion, i.estado, i.accionCorrectiva ?? '']),
    },
    ...(reporte.explicacionRetraso ? [{ tipo: 'texto' as const, titulo: 'Observación del retraso', texto: reporte.explicacionRetraso }] : []),
    ...(interno && reporte.observaciones ? [{ tipo: 'texto' as const, titulo: 'Observaciones internas', texto: reporte.observaciones }] : []),
  ]
}

export interface FiltrosReporte {
  desde: string
  hasta: string
  cliente: string
  modalidad: string
  transportista: string
  estado: string
}

export function viajesDelReporte(datos: DatosApp, filtros: FiltrosReporte): Viaje[] {
  return datos.viajes.filter((v) => {
    const dia = claveDia(v.salidaPrevista ?? v.fechaCreacion)
    return (
      (!filtros.desde || dia >= filtros.desde) &&
      (!filtros.hasta || dia <= filtros.hasta) &&
      (!filtros.cliente || v.clienteCodigo === filtros.cliente) &&
      (!filtros.modalidad || v.modalidad === (filtros.modalidad as Modalidad)) &&
      (!filtros.transportista || v.transportistaCodigo === filtros.transportista) &&
      (!filtros.estado || v.estado === (filtros.estado as EstadoViaje))
    )
  })
}

export interface FilaAgregada {
  grupo: string
  total: number
  finalizados: number
  enCurso: number
  aTiempo: number
  retrasados: number
  cumplimiento: number | null
  incidencias: number
}

export type CriterioAgrupacion = 'cliente' | 'modalidad' | 'transportista' | 'estado'

export function agregarViajes(datos: DatosApp, viajes: readonly Viaje[], criterio: CriterioAgrupacion, ahora: Date): FilaAgregada[] {
  const grupos = new Map<string, Viaje[]>()
  for (const v of viajes) {
    const clave =
      criterio === 'cliente'
        ? nombreCliente(datos, v.clienteCodigo)
        : criterio === 'modalidad'
          ? ETIQUETAS_MODALIDAD[v.modalidad]
          : criterio === 'transportista'
            ? nombreTransportista(datos, v.transportistaCodigo)
            : ETIQUETAS_ESTADO_VIAJE[v.estado]
    grupos.set(clave, [...(grupos.get(clave) ?? []), v])
  }
  return Array.from(grupos.entries())
    .map(([grupo, lista]) => {
      const cumplimientos = lista.map((v) => cumplimientoDeViaje(datos, v, ahora))
      const aTiempo = cumplimientos.filter((c) => c === 'A tiempo').length
      const retrasados = cumplimientos.filter((c) => c === 'Retrasado').length
      return {
        grupo,
        total: lista.length,
        finalizados: lista.filter((v) => v.estado === 'finalizado').length,
        enCurso: lista.filter((v) => v.estado === 'en_ejecucion' || v.estado === 'entregado_pendiente_devolucion').length,
        aTiempo,
        retrasados,
        cumplimiento: aTiempo + retrasados === 0 ? null : (aTiempo / (aTiempo + retrasados)) * 100,
        incidencias: datos.incidencias.filter((i) => lista.some((v) => v.codigo === i.viajeCodigo)).length,
      }
    })
    .sort((a, b) => b.total - a.total || a.grupo.localeCompare(b.grupo))
}

export const COLUMNAS_AGREGADO = ['Grupo', 'Viajes', 'Finalizados', 'En curso', 'A tiempo', 'Retrasados', 'Cumplimiento', 'Incidencias']

export function filaAgregadaACeldas(f: FilaAgregada): Celda[] {
  return [f.grupo, f.total, f.finalizados, f.enCurso, f.aTiempo, f.retrasados, formatearPorcentaje(f.cumplimiento), f.incidencias]
}

export interface FilaDetalleViaje {
  viaje: Viaje
  celdas: Celda[]
}

export function columnasDetalle(interno: boolean): string[] {
  return ['Viaje', 'Cliente', 'Modalidad', 'Origen', 'Destino', 'Transportista', 'Salida prevista', 'Llegada prevista', 'Llegada real', 'Desvío', 'Estado', 'Cumplimiento', 'Incidencias', ...(interno ? ['Valor referencial', 'Facturación'] : [])]
}

export function detalleDeViajes(datos: DatosApp, viajes: readonly Viaje[], ahora: Date, interno: boolean): FilaDetalleViaje[] {
  return [...viajes]
    .sort((a, b) => (a.salidaPrevista ?? a.fechaCreacion).localeCompare(b.salidaPrevista ?? b.fechaCreacion))
    .map((v) => {
      const servicio = estadoFacturacionServicio(v, datos.facturas)
      return {
        viaje: v,
        celdas: [
          v.codigo,
          nombreCliente(datos, v.clienteCodigo),
          ETIQUETAS_MODALIDAD[v.modalidad],
          nombreLugar(datos, v.origenCodigo),
          nombreLugar(datos, v.destinoCodigo),
          nombreTransportista(datos, v.transportistaCodigo),
          formatearFechaHora(v.salidaPrevista),
          formatearFechaHora(v.llegadaPrevista),
          formatearFechaHora(llegadaRealDeViaje(v, datos.eventos)),
          formatearDesvio(desvioDeLlegada(v, datos.eventos)),
          ETIQUETAS_ESTADO_VIAJE[v.estado],
          cumplimientoDeViaje(datos, v, ahora),
          datos.incidencias.filter((i) => i.viajeCodigo === v.codigo).length,
          ...(interno ? [v.valorReferencial, servicio ? ETIQUETAS_ESTADO_SERVICIO[servicio] : 'No aplica'] : []),
        ],
      }
    })
}

export interface ResumenCliente {
  servicios: number
  realizados: number
  enRuta: number
  programados: number
  aTiempo: number
  retrasados: number
  cumplimiento: number | null
  incidencias: number
  incidenciasAbiertas: number
  cancelados: number
}

export function resumenDeClientePeriodo(datos: DatosApp, viajes: readonly Viaje[], ahora: Date): ResumenCliente {
  const cumplimientos = viajes.map((v) => cumplimientoDeViaje(datos, v, ahora))
  const aTiempo = cumplimientos.filter((c) => c === 'A tiempo').length
  const retrasados = cumplimientos.filter((c) => c === 'Retrasado').length
  const incidencias = datos.incidencias.filter((i) => viajes.some((v) => v.codigo === i.viajeCodigo))
  return {
    servicios: viajes.filter((v) => v.estado !== 'cancelado').length,
    realizados: viajes.filter((v) => v.estado === 'finalizado').length,
    enRuta: viajes.filter((v) => v.estado === 'en_ejecucion' || v.estado === 'entregado_pendiente_devolucion').length,
    programados: viajes.filter((v) => v.estado === 'programado' || v.estado === 'solicitado').length,
    aTiempo,
    retrasados,
    cumplimiento: aTiempo + retrasados === 0 ? null : (aTiempo / (aTiempo + retrasados)) * 100,
    incidencias: incidencias.length,
    incidenciasAbiertas: incidencias.filter((i) => i.estado === 'abierta').length,
    cancelados: viajes.filter((v) => v.estado === 'cancelado').length,
  }
}
