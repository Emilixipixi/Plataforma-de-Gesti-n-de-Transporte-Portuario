import type { DatosApp, Viaje } from '@/tipos/dominio'
import { coincideTexto } from '@/servicios/repositorio'

export type TipoCoincidencia = 'codigo' | 'cliente' | 'contenedor' | 'placa'

export const ETIQUETAS_COINCIDENCIA: Record<TipoCoincidencia, string> = {
  codigo: 'Código de viaje',
  cliente: 'Cliente',
  contenedor: 'Contenedor',
  placa: 'Placa',
}

export interface ResultadoBusqueda {
  viaje: Viaje
  tipo: TipoCoincidencia
  detalle: string
  cliente: string
}

export const LONGITUD_MINIMA_BUSQUEDA = 2

export function buscarViajes(datos: DatosApp, consulta: string, limite = 8): ResultadoBusqueda[] {
  const termino = consulta.trim()
  if (termino.length < LONGITUD_MINIMA_BUSQUEDA) return []
  const resultados: ResultadoBusqueda[] = []
  for (const viaje of datos.viajes) {
    const cliente = datos.clientes.find((c) => c.codigo === viaje.clienteCodigo)
    const unidad = datos.unidades.find((u) => u.codigo === viaje.unidadCodigo)
    const nombreCliente = cliente?.razonSocial ?? viaje.clienteCodigo
    const contenedor = viaje.carga.contenedor?.numero
    let resultado: ResultadoBusqueda | null = null
    if (coincideTexto(termino, [viaje.codigo])) resultado = { viaje, tipo: 'codigo', detalle: viaje.codigo, cliente: nombreCliente }
    else if (contenedor && coincideTexto(termino, [contenedor])) resultado = { viaje, tipo: 'contenedor', detalle: contenedor, cliente: nombreCliente }
    else if (unidad && coincideTexto(termino, [unidad.placa])) resultado = { viaje, tipo: 'placa', detalle: unidad.placa, cliente: nombreCliente }
    else if (coincideTexto(termino, [nombreCliente, cliente?.codigo, cliente?.identificacion])) resultado = { viaje, tipo: 'cliente', detalle: nombreCliente, cliente: nombreCliente }
    if (resultado) resultados.push(resultado)
  }
  const prioridad: Record<TipoCoincidencia, number> = { codigo: 0, contenedor: 1, placa: 2, cliente: 3 }
  return resultados
    .sort((a, b) => prioridad[a.tipo] - prioridad[b.tipo] || b.viaje.fechaCreacion.localeCompare(a.viaje.fechaCreacion))
    .slice(0, limite)
}
