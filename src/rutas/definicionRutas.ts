import { matchPath } from 'react-router-dom'
import type { Accion } from '@/utilidades/permisos'

export interface DefinicionRuta {
  ruta: string
  titulo: string
  descripcion: string
  pantalla: string
  acciones: readonly Accion[]
  fase: number
  padre?: string
}

export const RUTA_ACCESO = '/acceso'
export const RUTA_INICIO = '/dashboard'

export const RUTAS: readonly DefinicionRuta[] = [
  { ruta: '/dashboard', titulo: 'Dashboard', descripcion: 'Indicadores operativos o contables según el perfil activo.', pantalla: 'P-02', acciones: ['dashboard.operativo.ver', 'dashboard.contable.ver'], fase: 4 },
  { ruta: '/clientes', titulo: 'Clientes', descripcion: 'Listado, búsqueda y fichas de clientes.', pantalla: 'P-03', acciones: ['clientes.ver'], fase: 2 },
  { ruta: '/clientes/nuevo', titulo: 'Nuevo cliente', descripcion: 'Registro de la ficha de un cliente.', pantalla: 'P-03', acciones: ['clientes.escribir'], fase: 2, padre: '/clientes' },
  { ruta: '/clientes/:codigo', titulo: 'Ficha de cliente', descripcion: 'Información general y operaciones del cliente.', pantalla: 'P-03', acciones: ['clientes.ver'], fase: 2, padre: '/clientes' },
  { ruta: '/clientes/:codigo/editar', titulo: 'Editar cliente', descripcion: 'Edición de la ficha del cliente.', pantalla: 'P-03', acciones: ['clientes.escribir'], fase: 2, padre: '/clientes/:codigo' },
  { ruta: '/solicitudes', titulo: 'Solicitudes', descripcion: 'Bandeja de solicitudes con filtros y conversión a viaje.', pantalla: 'P-05', acciones: ['solicitudes.ver'], fase: 2 },
  { ruta: '/solicitudes/nueva', titulo: 'Nueva solicitud', descripcion: 'Registro de un requerimiento de transporte.', pantalla: 'P-04', acciones: ['solicitudes.escribir'], fase: 2, padre: '/solicitudes' },
  { ruta: '/solicitudes/:codigo/editar', titulo: 'Editar solicitud', descripcion: 'Edición de un requerimiento de transporte.', pantalla: 'P-04', acciones: ['solicitudes.escribir'], fase: 2, padre: '/solicitudes' },
  { ruta: '/viajes', titulo: 'Viajes', descripcion: 'Listado de viajes de importación y exportación.', pantalla: 'P-08', acciones: ['viajes.ver'], fase: 3 },
  { ruta: '/viajes/nuevo', titulo: 'Nuevo viaje', descripcion: 'Creación de un viaje con modalidad, carga y asignación.', pantalla: 'P-07', acciones: ['viajes.escribir'], fase: 3, padre: '/viajes' },
  { ruta: '/viajes/:codigo', titulo: 'Detalle de viaje', descripcion: 'Resumen integral de la operación.', pantalla: 'P-08', acciones: ['viajes.ver'], fase: 3, padre: '/viajes' },
  { ruta: '/viajes/:codigo/editar', titulo: 'Editar viaje', descripcion: 'Edición del viaje y ajustes de programación con motivo.', pantalla: 'P-07', acciones: ['viajes.escribir'], fase: 3, padre: '/viajes/:codigo' },
  { ruta: '/programacion', titulo: 'Programación', descripcion: 'Viajes en lista o calendario y pendientes de asignación.', pantalla: 'P-06', acciones: ['programacion.ver'], fase: 3 },
  { ruta: '/seguimiento', titulo: 'Seguimiento', descripcion: 'Línea de tiempo de hitos por viaje.', pantalla: 'P-09', acciones: ['seguimiento.ver'], fase: 4 },
  { ruta: '/incidencias', titulo: 'Incidencias', descripcion: 'Registro y resolución de incidencias.', pantalla: 'P-10', acciones: ['incidencias.ver'], fase: 4 },
  { ruta: '/documentos', titulo: 'Documentos', descripcion: 'Documentos del servicio y paquete documental.', pantalla: 'P-11', acciones: ['documentos.ver'], fase: 5 },
  { ruta: '/guias', titulo: 'Guías de remisión', descripcion: 'Vista previa, descarga e histórico de guías.', pantalla: 'P-11', acciones: ['documentos.ver'], fase: 5 },
  { ruta: '/reportes', titulo: 'Reportes operativos', descripcion: 'Desempeño con filtros y exportación.', pantalla: 'P-12', acciones: ['reportes.operativos.ver'], fase: 5 },
  { ruta: '/reportes/cliente', titulo: 'Reporte para cliente', descripcion: 'Formato compartible semanal o mensual por cliente.', pantalla: 'P-13', acciones: ['reportes.cliente.ver'], fase: 5, padre: '/reportes' },
  { ruta: '/contabilidad/por-facturar', titulo: 'Por facturar', descripcion: 'Servicios finalizados listos para facturar.', pantalla: 'P-14', acciones: ['facturacion.ver'], fase: 6 },
  { ruta: '/contabilidad/facturas', titulo: 'Facturas', descripcion: 'Facturas registradas y servicios agrupados.', pantalla: 'P-15', acciones: ['facturacion.ver'], fase: 6 },
  { ruta: '/contabilidad/cartera', titulo: 'Cartera', descripcion: 'Vencimientos, saldos y alertas de cartera.', pantalla: 'P-16', acciones: ['cartera.ver'], fase: 6 },
  { ruta: '/contabilidad/pagos', titulo: 'Pagos', descripcion: 'Registro y validación de pagos.', pantalla: 'P-16', acciones: ['pagos.ver'], fase: 6 },
  { ruta: '/catalogos/:catalogo', titulo: 'Catálogos', descripcion: 'Catálogos que alimentan los formularios.', pantalla: 'P-17', acciones: ['catalogos.ver'], fase: 2 },
  { ruta: '/importar', titulo: 'Importar Excel', descripcion: 'Carga demostrativa con mapeo de columnas y validaciones.', pantalla: 'P-18', acciones: ['importacion.usar'], fase: 7 },
  { ruta: '/actividad', titulo: 'Actividad', descripcion: 'Registro de acciones por usuario y operación.', pantalla: 'P-19', acciones: ['actividad.ver'], fase: 7 },
  { ruta: '/integraciones', titulo: 'Integraciones', descripcion: 'Contífico y Tracklink como integraciones futuras.', pantalla: 'P-20', acciones: ['integraciones.ver'], fase: 7 },
  { ruta: '/configuracion', titulo: 'Configuración', descripcion: 'Parámetros del prototipo y restablecimiento de datos.', pantalla: 'Configuración', acciones: ['configuracion.ver'], fase: 7 },
]

export const CATALOGO_PREDETERMINADO = 'transportistas'

export function buscarDefinicion(rutaActual: string): { definicion: DefinicionRuta; parametros: Record<string, string | undefined> } | null {
  const estaticas = RUTAS.filter((r) => !r.ruta.includes(':'))
  const dinamicas = RUTAS.filter((r) => r.ruta.includes(':'))
  for (const definicion of [...estaticas, ...dinamicas]) {
    const coincidencia = matchPath({ path: definicion.ruta, end: true }, rutaActual)
    if (coincidencia) return { definicion, parametros: coincidencia.params }
  }
  return null
}

export interface Miga {
  titulo: string
  ruta: string
}

function completarRuta(ruta: string, parametros: Record<string, string | undefined>): string {
  return ruta.replace(/:([A-Za-z]+)/g, (_, nombre: string) => parametros[nombre] ?? nombre)
}

export function migasDeRuta(rutaActual: string): Miga[] {
  const encontrada = buscarDefinicion(rutaActual)
  if (!encontrada) return []
  const { parametros } = encontrada
  const migas: Miga[] = []
  let actual: DefinicionRuta | undefined = encontrada.definicion
  while (actual) {
    const titulo = actual.ruta.endsWith(':codigo') && parametros.codigo ? parametros.codigo : actual.titulo
    migas.unshift({ titulo, ruta: completarRuta(actual.ruta, parametros) })
    const padre: string | undefined = actual.padre
    actual = padre ? RUTAS.find((r) => r.ruta === padre) : undefined
  }
  return migas
}
