import type { EstadoCatalogo, TipoEvento } from '@/tipos/dominio'
import { guardar, obtener, type EntidadDe } from '@/servicios/repositorio'
import { siguienteCodigo } from '@/utilidades/calculos'
import { esHitoDelSistema, PREFIJOS, type Prefijo } from '@/utilidades/constantes'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

export type ColeccionCatalogo = 'transportistas' | 'choferes' | 'unidades' | 'lugares' | 'tiposCarga' | 'tiposEvento' | 'tiposIncidencia'

export type ValoresCatalogo<C extends ColeccionCatalogo> = Omit<EntidadDe<C>, 'codigo' | 'orden'>

export const PREFIJO_CATALOGO: Record<ColeccionCatalogo, Prefijo> = {
  transportistas: PREFIJOS.transportista,
  choferes: PREFIJOS.chofer,
  unidades: PREFIJOS.unidad,
  lugares: PREFIJOS.lugar,
  tiposCarga: PREFIJOS.tipoCarga,
  tiposEvento: PREFIJOS.tipoEvento,
  tiposIncidencia: PREFIJOS.tipoIncidencia,
}

const CAMPO_UNICO: Record<ColeccionCatalogo, { campo: string; mensaje: string }> = {
  transportistas: { campo: 'razonSocial', mensaje: 'Ya existe un transportista con esa razón social.' },
  choferes: { campo: 'identificacion', mensaje: 'Ya existe un chofer con esa cédula.' },
  unidades: { campo: 'placa', mensaje: 'Ya existe una unidad con esa placa.' },
  lugares: { campo: 'nombre', mensaje: 'Ya existe un lugar con ese nombre.' },
  tiposCarga: { campo: 'nombre', mensaje: 'Ya existe un tipo de carga con ese nombre.' },
  tiposEvento: { campo: 'nombre', mensaje: 'Ya existe un tipo de evento con ese nombre.' },
  tiposIncidencia: { campo: 'nombre', mensaje: 'Ya existe un tipo de incidencia con ese nombre.' },
}

function valorDe(entidad: object, campo: string): string {
  const valor: unknown = (entidad as Record<string, unknown>)[campo]
  return typeof valor === 'string' ? valor.trim().toLowerCase() : ''
}

export function valorDuplicado<C extends ColeccionCatalogo>(
  lista: readonly EntidadDe<C>[],
  coleccion: C,
  candidato: object,
  codigoActual?: string,
): string | null {
  const { campo, mensaje } = CAMPO_UNICO[coleccion]
  const buscado = valorDe(candidato, campo)
  return lista.some((e) => e.codigo !== codigoActual && valorDe(e, campo) === buscado) ? mensaje : null
}

export function guardarEnCatalogo<C extends ColeccionCatalogo>(
  coleccion: C,
  codigo: string | undefined,
  valores: ValoresCatalogo<C>,
  singular: string,
  nombreVisible: string,
  femenino = false,
): Operacion<EntidadDe<C>> {
  const g = (masculino: string) => (femenino ? masculino.replace(/o$/, 'a') : masculino)
  return (datos, { usuarioCodigo }) => {
    const lista: readonly EntidadDe<C>[] = datos[coleccion]
    const duplicado = valorDuplicado(lista, coleccion, valores, codigo)
    if (duplicado) return fallo(duplicado)

    if (codigo) {
      const actual = obtener(datos, coleccion, codigo)
      if (!actual) return fallo(`El registro ${codigo} no existe.`)
      let entidad = { ...actual, ...valores, codigo } as EntidadDe<C>
      if (coleccion === 'tiposEvento' && esHitoDelSistema(codigo)) {
        const hito = actual as TipoEvento
        entidad = { ...(entidad as TipoEvento), modalidades: hito.modalidades, orden: hito.orden, estado: hito.estado } as EntidadDe<C>
      }
      return exito(
        guardar(datos, coleccion, entidad),
        [{ usuarioCodigo, accion: 'edicion', entidad: 'catalogo', codigoEntidad: codigo, descripcion: `${singular.charAt(0).toUpperCase()}${singular.slice(1)} ${nombreVisible} ${g('actualizado')}.` }],
        entidad,
      )
    }

    const { codigo: nuevoCodigo, configuracion } = siguienteCodigo(datos.configuracion, PREFIJO_CATALOGO[coleccion])
    const extra = coleccion === 'tiposEvento' ? { orden: Math.max(0, ...datos.tiposEvento.map((t) => t.orden)) + 1 } : {}
    const entidad = { ...valores, ...extra, codigo: nuevoCodigo } as EntidadDe<C>
    return exito(
      { ...guardar(datos, coleccion, entidad), configuracion },
      [{ usuarioCodigo, accion: 'creacion', entidad: 'catalogo', codigoEntidad: nuevoCodigo, descripcion: `${singular.charAt(0).toUpperCase()}${singular.slice(1)} ${nombreVisible} ${g('registrado')} en el catálogo.` }],
      entidad,
    )
  }
}

export function cambiarEstadoEnCatalogo<C extends ColeccionCatalogo>(
  coleccion: C,
  codigo: string,
  estado: EstadoCatalogo,
  nombreVisible: string,
): Operacion<EntidadDe<C>> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, coleccion, codigo)
    if (!actual) return fallo(`El registro ${codigo} no existe.`)
    if (coleccion === 'tiposEvento' && esHitoDelSistema(codigo) && estado === 'inactivo') {
      return fallo('Los hitos del sistema definen el cierre de cada modalidad y no pueden desactivarse.')
    }
    const entidad = { ...actual, estado } as EntidadDe<C>
    return exito(
      guardar(datos, coleccion, entidad),
      [{ usuarioCodigo, accion: estado === 'activo' ? 'activacion' : 'desactivacion', entidad: 'catalogo', codigoEntidad: codigo, descripcion: `${nombreVisible} ${estado === 'activo' ? 'activado' : 'desactivado'}.` }],
      entidad,
    )
  }
}
