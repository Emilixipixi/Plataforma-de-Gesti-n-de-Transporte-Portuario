import type { DatosNuevaActividad } from '@/servicios/actividad'
import { crearCliente } from '@/servicios/operaciones/clientes'
import { guardarViaje } from '@/servicios/operaciones/viajes'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'
import type { EntradaCliente, EntradaViaje } from '@/utilidades/validadores'

export interface ResultadoImportacion {
  codigos: string[]
}

type Pendiente = { tipo: 'clientes'; entradas: readonly EntradaCliente[] } | { tipo: 'viajes'; entradas: readonly EntradaViaje[] }

export function importarRegistros(pendiente: Pendiente, nombreArchivo: string, filasConError: number): Operacion<ResultadoImportacion> {
  return (datos, contexto) => {
    if (pendiente.entradas.length === 0) return fallo('No hay filas válidas para importar.')
    let actual = datos
    const actividad: DatosNuevaActividad[] = []
    const codigos: string[] = []
    for (const entrada of pendiente.entradas) {
      const resultado =
        pendiente.tipo === 'clientes'
          ? crearCliente(entrada as EntradaCliente)(actual, contexto)
          : guardarViaje(undefined, entrada as EntradaViaje)(actual, contexto)
      if (!resultado.ok) return fallo(`Fila no importada: ${resultado.error} No se guardó ningún registro.`)
      actual = resultado.datos
      const valor = resultado.valor
      codigos.push('viaje' in valor ? valor.viaje.codigo : valor.codigo)
      actividad.push(...resultado.actividad.map((a) => ({ ...a, accion: 'importacion' as const, descripcion: `${a.descripcion} Origen: ${nombreArchivo}.` })))
    }
    const etiqueta = pendiente.tipo === 'clientes' ? (codigos.length === 1 ? 'cliente' : 'clientes') : codigos.length === 1 ? 'viaje' : 'viajes'
    actividad.push({
      usuarioCodigo: contexto.usuarioCodigo,
      accion: 'importacion',
      entidad: 'sistema',
      codigoEntidad: nombreArchivo,
      descripcion: `Importación desde Excel: ${codigos.length} ${etiqueta} (${codigos.join(', ')}); ${filasConError} ${filasConError === 1 ? 'fila omitida' : 'filas omitidas'} por errores.`,
    })
    return exito(actual, actividad, { codigos })
  }
}
