import type { Chofer, Cliente, EstadoViaje, Evidencia, Factura, FuncionPuntoRuta, Lugar, Modalidad, ModalidadCobro, Pago, Solicitud, Transportista, Unidad, Viaje } from '@/tipos/dominio'
import { HITOS, SECUENCIA_HITOS, TIPO_CARGA_POR_MODALIDAD, type CodigoHito } from '@/utilidades/constantes'
import type { HitoPlan, PlanIncidencia, PlanViaje, Reloj } from '@/datos/generadorDatos'

const MS_MINUTO = 60_000
const MS_DIA = 24 * 60 * MS_MINUTO
const USUARIO_CONTABLE = 'USR-004'
const OPERADORES = ['USR-001', 'USR-002', 'USR-003'] as const

export const CLIENTES_AMPLIADOS: Cliente[] = [
  { codigo: 'CLI-007', razonSocial: 'Ferretería Industrial El Ancla S.A.', identificacion: '0996789012001', contacto: 'Esteban Murillo', correo: 'compras@elancla-demo.ec', telefono: '04 229 7710', estado: 'activo' },
  { codigo: 'CLI-008', razonSocial: 'Exportadora Camaronera Golfo Azul S.A.', identificacion: '0997890123001', contacto: 'Daniela Franco', correo: 'logistica@golfoazul-demo.ec', telefono: '04 238 1290', estado: 'activo' },
  { codigo: 'CLI-009', razonSocial: 'Cerámicas y Acabados Pichincha Cía. Ltda.', identificacion: '1792345678001', contacto: 'Mauricio Jaramillo', correo: 'importaciones@ceramicaspichincha-demo.ec', telefono: '02 226 4450', estado: 'activo' },
  { codigo: 'CLI-010', razonSocial: 'Alimentos Procesados Santa Elena S.A.', identificacion: '0998901234001', contacto: 'Paola Rivadeneira', correo: 'abastecimiento@santaelena-demo.ec', telefono: '04 294 3380', estado: 'activo' },
  { codigo: 'CLI-011', razonSocial: 'Textiles del Austro S.A.', identificacion: '0190123456001', contacto: 'Juan Pablo Crespo', correo: 'comercioexterior@textilesaustro-demo.ec', telefono: '07 284 1120', estado: 'activo' },
  { codigo: 'CLI-012', razonSocial: 'Floricultura Valle Nevado Cía. Ltda.', identificacion: '1793456789001', contacto: 'Valeria Guzmán', correo: 'exportaciones@vallenevado-demo.ec', telefono: '02 236 5590', estado: 'activo' },
  { codigo: 'CLI-013', razonSocial: 'Química Industrial Pacífico S.A.', identificacion: '0999012345001', contacto: 'Andrés Cevallos', correo: 'operaciones@quimicapacifico-demo.ec', telefono: '04 280 9930', estado: 'activo' },
  { codigo: 'CLI-014', razonSocial: 'Cacaotera Los Ríos S.A.', identificacion: '1290123456001', contacto: 'Gloria Vásquez', correo: 'despachos@cacaoteralosrios-demo.ec', telefono: '05 275 3360', estado: 'activo' },
  { codigo: 'CLI-015', razonSocial: 'Papelera Nacional del Litoral S.A.', identificacion: '0990123456001', contacto: 'Héctor Salinas', correo: 'materiasprimas@papeleralitoral-demo.ec', telefono: '04 259 4470', estado: 'activo' },
  { codigo: 'CLI-016', razonSocial: 'Distribuidora Farmacéutica Andes S.A.', identificacion: '1794567890001', contacto: 'Carolina Peñafiel', correo: 'logistica@farmaandes-demo.ec', telefono: '02 298 6610', estado: 'inactivo' },
]

export const LUGARES_AMPLIADOS: Lugar[] = [
  { codigo: 'LUG-013', nombre: 'Bodega El Ancla', tipo: 'instalacion_cliente', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-014', nombre: 'Empacadora Golfo Azul', tipo: 'planta', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-015', nombre: 'Planta Cerámicas Pichincha', tipo: 'planta', ciudad: 'Quito', estado: 'activo' },
  { codigo: 'LUG-016', nombre: 'Planta Alimentos Santa Elena', tipo: 'planta', ciudad: 'Santa Elena', estado: 'activo' },
  { codigo: 'LUG-017', nombre: 'Planta Textiles del Austro', tipo: 'planta', ciudad: 'Cuenca', estado: 'activo' },
  { codigo: 'LUG-018', nombre: 'Centro de Acopio Valle Nevado', tipo: 'planta', ciudad: 'Cayambe', estado: 'activo' },
  { codigo: 'LUG-019', nombre: 'Planta Química Pacífico', tipo: 'planta', ciudad: 'Durán', estado: 'activo' },
  { codigo: 'LUG-020', nombre: 'Centro de Acopio Los Ríos', tipo: 'planta', ciudad: 'Quevedo', estado: 'activo' },
  { codigo: 'LUG-021', nombre: 'Planta Papelera del Litoral', tipo: 'planta', ciudad: 'Guayaquil', estado: 'activo' },
  { codigo: 'LUG-022', nombre: 'Centro de Distribución Farmacéutica Andes', tipo: 'instalacion_cliente', ciudad: 'Quito', estado: 'activo' },
  { codigo: 'LUG-023', nombre: 'Depósito de Contenedores Posorja', tipo: 'deposito', ciudad: 'Posorja', estado: 'activo' },
]

export const TRANSPORTISTAS_AMPLIADOS: Transportista[] = [
  { codigo: 'TRA-005', razonSocial: 'Cargas Rápidas del Litoral S.A.', contacto: 'Fabián Robles', telefono: '0995 556 677', estado: 'activo' },
  { codigo: 'TRA-006', razonSocial: 'Transportes Andes Carga Cía. Ltda.', contacto: 'Silvia Naranjo', telefono: '0996 667 788', estado: 'activo' },
]

export const CHOFERES_AMPLIADOS: Omit<Chofer, 'disponibilidad'>[] = [
  { codigo: 'CHO-009', nombre: 'Wilson Chávez', identificacion: '0990123456', telefono: '0981 100 209', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'CHO-010', nombre: 'Fausto Intriago', identificacion: '0901234567', telefono: '0981 100 210', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'CHO-011', nombre: 'Ramiro Solórzano', identificacion: '0912340987', telefono: '0981 100 211', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'CHO-012', nombre: 'Gustavo Tapia', identificacion: '1712345678', telefono: '0981 100 212', transportistaCodigo: 'TRA-006', estado: 'activo' },
  { codigo: 'CHO-013', nombre: 'Patricio Guerrero', identificacion: '1723456789', telefono: '0981 100 213', transportistaCodigo: 'TRA-006', estado: 'activo' },
  { codigo: 'CHO-014', nombre: 'Édgar Montenegro', identificacion: '1734567890', telefono: '0981 100 214', transportistaCodigo: 'TRA-006', estado: 'activo' },
]

export const UNIDADES_AMPLIADAS: Omit<Unidad, 'disponibilidad'>[] = [
  { codigo: 'UNI-009', placa: 'GRA-3301', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'UNI-010', placa: 'GRB-4417', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'UNI-011', placa: 'GRC-5823', tipo: 'Camión 15 t', transportistaCodigo: 'TRA-005', estado: 'activo' },
  { codigo: 'UNI-012', placa: 'PCA-6619', tipo: 'Cabezal con chasis portacontenedor', transportistaCodigo: 'TRA-006', estado: 'activo' },
  { codigo: 'UNI-013', placa: 'PCB-7742', tipo: 'Cabezal con plataforma', transportistaCodigo: 'TRA-006', estado: 'activo' },
  { codigo: 'UNI-014', placa: 'PCC-8855', tipo: 'Camión 10 t', transportistaCodigo: 'TRA-006', estado: 'activo' },
]

interface PerfilCliente {
  cliente: string
  planta: string
  modalidades: Modalidad[]
  cargas: [string, string][]
  lejano?: boolean
}

const PERFILES: PerfilCliente[] = [
  { cliente: 'CLI-001', planta: 'LUG-005', modalidades: ['importacion_contenedorizada', 'importacion_suelta'], cargas: [['Repuestos automotrices paletizados', 'TCA-003'], ['Llantas para vehículos pesados', 'TCA-006'], ['Baterías para vehículos livianos', 'TCA-006']] },
  { cliente: 'CLI-002', planta: 'LUG-007', modalidades: ['exportacion', 'importacion_contenedorizada'], cargas: [['Banano en cajas (1.080 cajas)', 'TCA-002'], ['Fertilizantes en sacos', 'TCA-004']] },
  { cliente: 'CLI-003', planta: 'LUG-008', modalidades: ['importacion_suelta', 'importacion_contenedorizada'], cargas: [['Equipos industriales en cajas de madera', 'TCA-003'], ['Motores eléctricos', 'TCA-003']], lejano: true },
  { cliente: 'CLI-004', planta: 'LUG-009', modalidades: ['importacion_suelta', 'exportacion'], cargas: [['Electrodomésticos en cajas', 'TCA-006'], ['Cacao en grano en sacos de yute', 'TCA-004']] },
  { cliente: 'CLI-005', planta: 'LUG-010', modalidades: ['exportacion'], cargas: [['Mango en cajas', 'TCA-002'], ['Piña en cajas', 'TCA-002']] },
  { cliente: 'CLI-006', planta: 'LUG-011', modalidades: ['importacion_contenedorizada'], cargas: [['Planchas de aluminio', 'TCA-005'], ['Bobinas de acero laminado', 'TCA-005']] },
  { cliente: 'CLI-007', planta: 'LUG-013', modalidades: ['importacion_contenedorizada', 'importacion_suelta'], cargas: [['Herramientas manuales en cajas', 'TCA-001'], ['Tubería PVC en atados', 'TCA-005']] },
  { cliente: 'CLI-008', planta: 'LUG-014', modalidades: ['exportacion'], cargas: [['Camarón congelado en cajas (20 t)', 'TCA-002']] },
  { cliente: 'CLI-009', planta: 'LUG-015', modalidades: ['importacion_contenedorizada'], cargas: [['Porcelanato en pallets', 'TCA-005'], ['Grifería y sanitarios', 'TCA-005']], lejano: true },
  { cliente: 'CLI-010', planta: 'LUG-016', modalidades: ['importacion_contenedorizada', 'importacion_suelta'], cargas: [['Trigo a granel en big bags', 'TCA-004'], ['Envases de hojalata', 'TCA-001']] },
  { cliente: 'CLI-011', planta: 'LUG-017', modalidades: ['importacion_contenedorizada'], cargas: [['Hilo de poliéster en conos', 'TCA-001'], ['Telares industriales', 'TCA-003']], lejano: true },
  { cliente: 'CLI-012', planta: 'LUG-018', modalidades: ['exportacion'], cargas: [['Rosas frescas en cajas (480 cajas)', 'TCA-002']], lejano: true },
  { cliente: 'CLI-013', planta: 'LUG-019', modalidades: ['importacion_contenedorizada', 'importacion_suelta'], cargas: [['Resinas en tambores', 'TCA-001'], ['Soda cáustica en sacos', 'TCA-001']] },
  { cliente: 'CLI-014', planta: 'LUG-020', modalidades: ['exportacion'], cargas: [['Cacao fino de aroma en sacos', 'TCA-004']] },
  { cliente: 'CLI-015', planta: 'LUG-021', modalidades: ['importacion_contenedorizada', 'importacion_suelta'], cargas: [['Pulpa de celulosa en fardos', 'TCA-001'], ['Bobinas de papel kraft', 'TCA-001']] },
  { cliente: 'CLI-016', planta: 'LUG-022', modalidades: ['importacion_suelta'], cargas: [['Medicamentos en cajas', 'TCA-006']], lejano: true },
]

const RECURSOS_PASADOS: [string, string, string][] = [
  ['TRA-001', 'CHO-001', 'UNI-001'],
  ['TRA-001', 'CHO-002', 'UNI-002'],
  ['TRA-002', 'CHO-003', 'UNI-003'],
  ['TRA-002', 'CHO-004', 'UNI-004'],
  ['TRA-003', 'CHO-005', 'UNI-005'],
  ['TRA-004', 'CHO-007', 'UNI-007'],
  ['TRA-004', 'CHO-008', 'UNI-008'],
  ['TRA-005', 'CHO-009', 'UNI-009'],
  ['TRA-005', 'CHO-010', 'UNI-010'],
  ['TRA-005', 'CHO-011', 'UNI-011'],
  ['TRA-006', 'CHO-012', 'UNI-012'],
  ['TRA-006', 'CHO-013', 'UNI-013'],
  ['TRA-006', 'CHO-014', 'UNI-014'],
]

const DESFASE_HITOS: Record<Modalidad, readonly number[]> = {
  importacion_contenedorizada: [0, 150, 240, 270, 450, 540],
  importacion_suelta: [0, 150, 210, 270, 420],
  exportacion: [0, 30, 120, 300, 360, 540, 600],
}

const COMENTARIOS: Record<CodigoHito, string[]> = {
  [HITOS.salidaPuerto]: ['Salida de puerto sin novedad.', 'Contenedor retirado de patio.', 'Salida con documentos verificados.'],
  [HITOS.llegadaCliente]: ['Ingreso confirmado por garita.', 'Llegada al cliente.', 'Arribo y registro en portería.'],
  [HITOS.descarga]: ['Descarga con montacargas del cliente.', 'Descarga completa.', 'Descarga manual supervisada.'],
  [HITOS.entrega]: ['Entrega firmada por bodega.', 'Entrega recibida por el supervisor.'],
  [HITOS.entregaConfirmada]: ['Entrega confirmada por recepción.', 'Entrega confirmada sin observaciones.'],
  [HITOS.devolucionContenedor]: ['Contenedor vacío devuelto.', 'Devolución registrada en depósito.'],
  [HITOS.retiroDeposito]: ['Contenedor retirado del depósito.', 'Retiro de contenedor y preenfriado.'],
  [HITOS.salidaACliente]: ['Salida hacia la planta del cliente.'],
  [HITOS.carga]: ['Carga completa y sellada.', 'Carga y sellado verificados.'],
  [HITOS.salidaAPuerto]: ['Salida hacia puerto.'],
  [HITOS.entregaEnPuerto]: ['Contenedor recibido en terminal.', 'Entrega en puerto antes del cierre de recepción.'],
  [HITOS.cierre]: ['Servicio cerrado.', 'Cierre operativo sin novedades.', 'Servicio cerrado dentro del plazo.'],
}

const UBICACIONES_VIA = [
  'Vía Perimetral, km 24',
  'Vía Durán – Tambo, km 12',
  'Autopista Terminal Terrestre – Pascuales',
  'Vía a la Costa, km 18',
  'Vía Guayaquil – El Triunfo, km 60',
  'Ingreso al Puerto de Posorja',
  'Garita del Puerto de Guayaquil',
  'Vía Alóag – Santo Domingo, km 40',
]

const INCIDENCIAS_TIPICAS: [string, string, string][] = [
  ['TIN-001', 'Demora en la fila de ingreso al terminal portuario.', 'Se coordinó con el cliente la nueva hora de llegada.'],
  ['TIN-003', 'Espera prolongada para la descarga por falta de personal en bodega.', 'El cliente asignó una cuadrilla adicional.'],
  ['TIN-002', 'Parada por control vehicular de la Agencia de Tránsito.', 'Documentación revisada; el viaje continuó sin sanción.'],
  ['TIN-006', 'Cambio de ruta por cierre de vía.', 'Se tomó la ruta alterna y se informó al cliente.'],
  ['TIN-007', 'Faltaba la copia del manifiesto de carga.', 'Se envió el documento digital al chofer.'],
  ['TIN-004', 'Neumático averiado en el semirremolque.', 'Cambio de neumático en ruta.'],
  ['TIN-008', 'El cliente reportó dos cajas con daño externo.', 'Se levantó acta de novedad firmada por ambas partes.'],
  ['TIN-005', 'Sello de seguridad con numeración distinta a la documentada.', 'Naviera confirmó el cambio de sello por inspección.'],
]

function crearAleatorio(semilla: number) {
  let estado = semilla >>> 0
  const siguiente = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    numero: siguiente,
    entero: (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1)),
    elegir: <T,>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)] as T,
    probabilidad: (p: number) => siguiente() < p,
  }
}

type Aleatorio = ReturnType<typeof crearAleatorio>

function sumarMinutos(iso: string, minutos: number): string {
  return new Date(new Date(iso).getTime() + minutos * MS_MINUTO).toISOString()
}

function minimo(a: string, b: string): string {
  return a < b ? a : b
}

function lugaresDeHitos(modalidad: Modalidad, ruta: [string, FuncionPuntoRuta][]): string[] {
  const de = (funcion: FuncionPuntoRuta) => ruta.find(([, f]) => f === funcion)?.[0] ?? ruta[0]?.[0] ?? ''
  if (modalidad === 'exportacion') return [de('origen'), de('origen'), de('parada'), de('parada'), de('parada'), de('destino'), de('destino')]
  if (modalidad === 'importacion_contenedorizada') return [de('origen'), de('destino'), de('destino'), de('destino'), de('devolucion'), de('devolucion')]
  return [de('origen'), de('destino'), de('destino'), de('destino'), de('destino')]
}

function retrasoAleatorio(a: Aleatorio): number {
  const p = a.numero()
  if (p < 0.65) return a.entero(-20, 10)
  if (p < 0.88) return a.entero(15, 50)
  return a.entero(60, 150)
}

interface EspecificacionViaje {
  estado: EstadoViaje
  diaSalida?: number
  horasDesdeSalida?: number
  recursos?: [string, string, string]
  modalidad?: Modalidad
}

export interface ResultadoAmpliado {
  planes: PlanViaje[]
  incidencias: PlanIncidencia[]
  indicaciones: Map<string, string>
}

const INDICACIONES = [
  'Coordinar con la garita antes del ingreso.',
  'Recepción de 08:00 a 16:00.',
  'Entregar copia de la guía al jefe de bodega.',
  'Confirmar llegada por teléfono 30 minutos antes.',
  'Cumplir el cierre de recepción de la nave.',
  'Requiere chofer con equipo de protección personal completo.',
]

function especificaciones(): EspecificacionViaje[] {
  const lista: EspecificacionViaje[] = []
  for (let i = 0; i < 40; i++) lista.push({ estado: 'finalizado', diaSalida: -88 + Math.round(i * 2.15) })
  lista.push({ estado: 'en_ejecucion', horasDesdeSalida: 2, recursos: ['TRA-005', 'CHO-009', 'UNI-009'] })
  lista.push({ estado: 'en_ejecucion', horasDesdeSalida: 4, recursos: ['TRA-005', 'CHO-010', 'UNI-010'], modalidad: 'exportacion' })
  lista.push({ estado: 'en_ejecucion', horasDesdeSalida: 3, recursos: ['TRA-006', 'CHO-012', 'UNI-012'] })
  lista.push({ estado: 'en_ejecucion', horasDesdeSalida: 5, recursos: ['TRA-006', 'CHO-013', 'UNI-013'] })
  lista.push({ estado: 'entregado_pendiente_devolucion', diaSalida: -1, recursos: ['TRA-001', 'CHO-001', 'UNI-001'], modalidad: 'importacion_contenedorizada' })
  lista.push({ estado: 'entregado_pendiente_devolucion', diaSalida: -2, recursos: ['TRA-005', 'CHO-011', 'UNI-011'], modalidad: 'importacion_contenedorizada' })
  lista.push({ estado: 'programado', diaSalida: 1, recursos: ['TRA-006', 'CHO-014', 'UNI-014'] })
  lista.push({ estado: 'programado', diaSalida: 2, recursos: ['TRA-005', 'CHO-011', 'UNI-011'] })
  lista.push({ estado: 'programado', diaSalida: 3, recursos: ['TRA-002', 'CHO-003', 'UNI-003'], modalidad: 'exportacion' })
  lista.push({ estado: 'programado', diaSalida: 4, recursos: ['TRA-001', 'CHO-001', 'UNI-001'] })
  lista.push({ estado: 'programado', diaSalida: 5, recursos: ['TRA-005', 'CHO-009', 'UNI-009'] })
  lista.push({ estado: 'programado', diaSalida: 6, recursos: ['TRA-006', 'CHO-012', 'UNI-012'], modalidad: 'exportacion' })
  lista.push({ estado: 'programado', diaSalida: 8, recursos: ['TRA-005', 'CHO-010', 'UNI-010'] })
  lista.push({ estado: 'solicitado', diaSalida: 2 })
  lista.push({ estado: 'solicitado', diaSalida: 4, modalidad: 'exportacion' })
  lista.push({ estado: 'solicitado', diaSalida: 7 })
  lista.push({ estado: 'solicitado', diaSalida: 9 })
  lista.push({ estado: 'cancelado', diaSalida: -30 })
  lista.push({ estado: 'cancelado', diaSalida: -14 })
  lista.push({ estado: 'cancelado', diaSalida: 3 })
  return lista
}

export function planesAmpliados(r: Reloj, primerImp: number, primerExp: number, primeraSolicitud: number): ResultadoAmpliado {
  const a = crearAleatorio(20261110)
  const ahora = r.relativo(0)
  const planes: PlanViaje[] = []
  const incidencias: PlanIncidencia[] = []
  const indicaciones = new Map<string, string>()
  let numeroImp = primerImp
  let numeroExp = primerExp
  let numeroSolicitud = primeraSolicitud
  let numeroContenedor = 1

  especificaciones().forEach((espec, indice) => {
    const activos = PERFILES.filter((p) => p.cliente !== 'CLI-016')
    let perfilFinal = espec.estado === 'finalizado' ? PERFILES[indice % PERFILES.length]! : a.elegir(activos)
    if (espec.modalidad && !perfilFinal.modalidades.includes(espec.modalidad)) {
      const requerida = espec.modalidad
      perfilFinal = a.elegir(activos.filter((p) => p.modalidades.includes(requerida)))
    }
    const modalidadFinal: Modalidad = espec.modalidad ?? a.elegir(perfilFinal.modalidades)
    const [descripcion, categoria] = a.elegir(perfilFinal.cargas)
    const codigoViaje = modalidadFinal === 'exportacion' ? `EXP-${String(numeroExp++).padStart(3, '0')}` : `IMP-${String(numeroImp++).padStart(3, '0')}`

    const puerto = a.probabilidad(0.7) ? 'LUG-001' : 'LUG-002'
    const deposito = a.elegir(['LUG-003', 'LUG-004', 'LUG-023'])
    const ruta: [string, FuncionPuntoRuta][] =
      modalidadFinal === 'exportacion'
        ? [[deposito, 'origen'], [perfilFinal.planta, 'parada'], [puerto, 'destino']]
        : modalidadFinal === 'importacion_contenedorizada'
          ? [[puerto, 'origen'], [perfilFinal.planta, 'destino'], [deposito, 'devolucion']]
          : [[puerto, 'origen'], [perfilFinal.planta, 'destino']]

    const refrigerada = categoria === 'TCA-002'
    const contenedor =
      TIPO_CARGA_POR_MODALIDAD[modalidadFinal] === 'contenedorizada'
        ? { tipo: refrigerada ? "40' Reefer" : a.elegir(["20' Dry", "40' Dry", "40' High Cube"]), numero: `${a.elegir(['MSKU', 'HLXU', 'CMAU', 'PFLU', 'MEDU'])}${2_000_000 + numeroContenedor++ * 7_919}` }
        : undefined

    const factor = perfilFinal.lejano ? 1.8 : 1
    const base = modalidadFinal === 'exportacion' ? a.entero(700, 1100) : modalidadFinal === 'importacion_contenedorizada' ? a.entero(560, 950) : a.entero(340, 700)
    const valorReferencial = Math.round((base * factor) / 10) * 10
    const escala = perfilFinal.lejano ? 2.2 : 1
    const desfases = DESFASE_HITOS[modalidadFinal].map((m) => Math.round(m * escala))

    const salidaPrevista =
      espec.horasDesdeSalida !== undefined ? r.relativo(-espec.horasDesdeSalida) : r.dia(espec.diaSalida ?? 0, a.elegir([5, 6, 7, 8, 9]), a.elegir([0, 15, 30]))
    const indiceLlegada = modalidadFinal === 'exportacion' ? 5 : 1
    const llegadaPrevista = sumarMinutos(salidaPrevista, desfases[indiceLlegada] ?? 0)
    const cierrePrevisto =
      espec.estado === 'entregado_pendiente_devolucion' ? r.dia(a.elegir([0, 1]), 16) : sumarMinutos(salidaPrevista, desfases.at(-1) ?? 0)

    const secuencia = SECUENCIA_HITOS[modalidadFinal]
    const lugares = lugaresDeHitos(modalidadFinal, ruta)
    const limiteHitos =
      espec.estado === 'finalizado'
        ? secuencia.length
        : espec.estado === 'entregado_pendiente_devolucion'
          ? 4
          : espec.estado === 'en_ejecucion'
            ? Math.max(1, Math.min(modalidadFinal === 'exportacion' ? 5 : 3, desfases.filter((m) => m < (espec.horasDesdeSalida ?? 0) * 60 - 20).length))
            : 0

    const hitos: HitoPlan[] = []
    let anterior = ''
    let mayorRetraso = 0
    for (let i = 0; i < limiteHitos; i++) {
      const hito = secuencia[i]!
      const prevista = sumarMinutos(salidaPrevista, desfases[i] ?? 0)
      const retraso = retrasoAleatorio(a)
      mayorRetraso = Math.max(mayorRetraso, retraso)
      let real = sumarMinutos(prevista, retraso)
      if (anterior && real <= anterior) real = sumarMinutos(anterior, 10)
      if (espec.estado !== 'finalizado') real = minimo(real, sumarMinutos(ahora, -5 * (limiteHitos - i)))
      anterior = real
      hitos.push({ hito, prevista, real, lugar: lugares[i] ?? '', responsable: a.elegir(OPERADORES), comentario: a.elegir(COMENTARIOS[hito]) })
    }

    const conSolicitud = espec.estado !== 'cancelado' && a.probabilidad(0.6)
    const solicitudCodigo = conSolicitud ? `SOL-${String(numeroSolicitud++).padStart(3, '0')}` : undefined
    if (solicitudCodigo) indicaciones.set(codigoViaje, a.elegir(INDICACIONES))

    const recursos = espec.recursos ?? (espec.estado === 'solicitado' ? undefined : a.elegir(RECURSOS_PASADOS))
    const plan: PlanViaje = {
      codigo: codigoViaje,
      clienteCodigo: perfilFinal.cliente,
      modalidad: modalidadFinal,
      estado: espec.estado,
      descripcionCarga: descripcion,
      categoriaCarga: categoria,
      ...(refrigerada ? { observacionesCarga: 'Mantener cadena de frío durante todo el recorrido.' } : {}),
      ...(contenedor ? { contenedor } : {}),
      ruta,
      ...(recursos ? { recursos: { transportista: recursos[0], chofer: recursos[1], unidad: recursos[2] } } : {}),
      salidaPrevista,
      llegadaPrevista,
      cierrePrevisto,
      modalidadCobro: a.probabilidad(0.7) ? 'credito' : 'contra_factura',
      valorReferencial,
      observaciones: espec.estado === 'solicitado' ? 'Pendiente de asignar transportista, chofer y unidad.' : a.elegir(['Servicio regular del cliente.', 'Coordinar ingreso con seguridad de planta.', 'Cliente solicita reporte de cada hito.', 'Sin observaciones adicionales.']),
      creadoPor: a.elegir(OPERADORES),
      hitos,
      ...(solicitudCodigo ? { solicitudCodigo } : {}),
      ...(espec.estado === 'cancelado'
        ? { cancelacion: { fecha: minimo(sumarMinutos(salidaPrevista, -18 * 60), sumarMinutos(ahora, -60)), motivo: a.elegir(['La naviera no liberó la carga a tiempo.', 'El cliente postergó la recepción por inventario.', 'Cambio de proveedor de transporte solicitado por el cliente.']), usuario: a.elegir(OPERADORES) } }
        : {}),
    }
    planes.push(plan)

    const conIncidencia = (espec.estado === 'finalizado' && (mayorRetraso >= 60 || a.probabilidad(0.12))) || (espec.estado === 'en_ejecucion' && indice % 2 === 0)
    if (conIncidencia && hitos.length > 0) {
      const [tipo, descripcionIncidencia, accion] = a.elegir(INCIDENCIAS_TIPICAS)
      const primero = hitos[0]!.real!
      const fechaHora = espec.estado === 'finalizado' ? sumarMinutos(primero, a.entero(30, 90)) : minimo(sumarMinutos(primero, 40), sumarMinutos(ahora, -15))
      const evidencias: Evidencia[] = a.probabilidad(0.7) ? [{ nombre: `novedad_${codigoViaje}.jpg`, tipo: 'image/jpeg', fecha: sumarMinutos(fechaHora, 5) }] : []
      incidencias.push({
        viajeCodigo: codigoViaje,
        tipo,
        fechaHora,
        ubicacion: a.elegir(UBICACIONES_VIA),
        descripcion: descripcionIncidencia,
        responsable: hitos[0]!.responsable,
        evidencias,
        ...(espec.estado === 'finalizado' ? { resolucion: { accion, fecha: sumarMinutos(fechaHora, a.entero(40, 180)) } } : {}),
      })
    }
  })

  return { planes, incidencias, indicaciones }
}

export function solicitudesPendientesAmpliadas(r: Reloj, primerNumero: number): Solicitud[] {
  const a = crearAleatorio(77)
  const datos: [string, Modalidad, string, string, string, number, Solicitud['estado'], string?][] = [
    ['CLI-007', 'importacion_contenedorizada', 'Clavos y alambre galvanizado', 'TCA-005', 'LUG-013', 3, 'recibida'],
    ['CLI-009', 'importacion_contenedorizada', 'Porcelanato en pallets (22 pallets)', 'TCA-005', 'LUG-015', 6, 'recibida'],
    ['CLI-012', 'exportacion', 'Rosas frescas en cajas (520 cajas)', 'TCA-002', 'LUG-018', 2, 'recibida'],
    ['CLI-013', 'importacion_suelta', 'Resinas en tambores (40 tambores)', 'TCA-001', 'LUG-019', 5, 'recibida'],
    ['CLI-014', 'exportacion', 'Cacao fino de aroma en sacos', 'TCA-004', 'LUG-020', 8, 'aceptada'],
    ['CLI-010', 'importacion_suelta', 'Envases de hojalata paletizados', 'TCA-001', 'LUG-016', 7, 'aceptada'],
    ['CLI-008', 'exportacion', 'Camarón congelado en cajas', 'TCA-002', 'LUG-014', -3, 'rechazada', 'No había contenedor refrigerado disponible en la fecha solicitada.'],
    ['CLI-015', 'importacion_contenedorizada', 'Bobinas de papel kraft', 'TCA-001', 'LUG-021', -1, 'rechazada', 'El cliente no envió la documentación de liberación de la carga.'],
  ]
  return datos.map(([cliente, modalidad, descripcion, categoria, planta, dia, estado, motivo], i) => {
    const puerto = a.probabilidad(0.7) ? 'LUG-001' : 'LUG-002'
    const deposito = a.elegir(['LUG-003', 'LUG-004'])
    const solicitud: Solicitud = {
      codigo: `SOL-${String(primerNumero + i).padStart(3, '0')}`,
      clienteCodigo: cliente,
      modalidad,
      tipoCarga: TIPO_CARGA_POR_MODALIDAD[modalidad],
      categoriaCargaCodigo: categoria,
      descripcionCarga: descripcion,
      origenCodigo: modalidad === 'exportacion' ? deposito : puerto,
      destinoCodigo: modalidad === 'exportacion' ? puerto : planta,
      fechaRequerida: r.dia(dia, a.elegir([6, 7, 8])),
      indicacionesCliente: a.elegir(INDICACIONES),
      valorAproximado: Math.round(a.entero(modalidad === 'importacion_suelta' ? 380 : 650, modalidad === 'importacion_suelta' ? 900 : 1500) / 10) * 10,
      observaciones: estado === 'recibida' ? 'Pendiente de revisión por Operaciones.' : estado === 'aceptada' ? 'Aceptada; lista para convertir en viaje.' : 'Cliente informado por correo.',
      estado,
      fechaCreacion: r.dia(Math.min(dia, 0) - a.entero(1, 3), a.entero(8, 16), a.elegir([0, 20, 40])),
      creadoPor: a.elegir(OPERADORES),
    }
    if (motivo) solicitud.motivoRechazo = motivo
    return solicitud
  })
}

export function facturacionAmpliada(viajes: readonly Viaje[], r: Reloj, primeraFactura: number, primerPago: number, excluir: ReadonlySet<string>): { facturas: Factura[]; pagos: Pago[] } {
  const a = crearAleatorio(4242)
  const ahora = r.relativo(0)
  const limiteSinFacturar = r.dia(-11, 0)
  const candidatos = viajes
    .filter((v) => v.estado === 'finalizado' && v.cierreReal && !excluir.has(v.codigo))
    .sort((x, y) => (x.cierreReal ?? '').localeCompare(y.cierreReal ?? ''))
  const facturables = candidatos.filter((v) => (v.cierreReal ?? '') < limiteSinFacturar)

  const grupos: Viaje[][] = []
  const porCliente = new Map<string, Viaje[]>()
  for (const v of facturables) porCliente.set(v.clienteCodigo, [...(porCliente.get(v.clienteCodigo) ?? []), v])
  for (const lista of porCliente.values()) {
    let i = 0
    while (i < lista.length) {
      const tamano = Math.min(lista.length - i, a.elegir([1, 1, 2, 2, 3]))
      grupos.push(lista.slice(i, i + tamano))
      i += tamano
    }
  }
  grupos.sort((x, y) => (x.at(-1)?.cierreReal ?? '').localeCompare(y.at(-1)?.cierreReal ?? ''))

  const facturas: Factura[] = []
  const pagos: Pago[] = []
  let numeroPago = primerPago
  const redondear = (n: number) => Math.round(n * 100) / 100

  const agregarPago = (factura: Factura, fecha: string, valor: number, validado: boolean) => {
    const prefijo = a.elegir(['TRF', 'TRF', 'DEP', 'CHQ'])
    const referencia = `${prefijo}-DEMO-${90000 + numeroPago * 37}`
    const esImagen = a.probabilidad(0.4)
    const comprobante: Evidencia = { nombre: `comprobante_${referencia}.${esImagen ? 'jpg' : 'pdf'}`, tipo: esImagen ? 'image/jpeg' : 'application/pdf', fecha }
    const fechaValidacion = minimo(sumarMinutos(fecha, a.entero(120, 2880)), sumarMinutos(ahora, -30))
    pagos.push({
      codigo: `PAG-${String(numeroPago++).padStart(3, '0')}`,
      facturaCodigo: factura.codigo,
      fecha,
      valor: redondear(valor),
      referencia,
      estado: validado ? 'validado' : 'registrado',
      comprobante,
      registradoPor: USUARIO_CONTABLE,
      ...(validado ? { validadorCodigo: USUARIO_CONTABLE, fechaValidacion } : {}),
    })
  }

  grupos.forEach((grupo, i) => {
    const ultimo = grupo.at(-1)!
    const emision = r.sumarDias(ultimo.cierreReal!, a.entero(1, 4))
    if (emision > ahora) return
    const modalidadCobro: ModalidadCobro = grupo[0]!.modalidadCobro
    const dias = modalidadCobro === 'credito' ? a.elegir([30, 30, 45]) : 15
    const factura: Factura = {
      codigo: `FAC-${String(primeraFactura + i).padStart(3, '0')}`,
      clienteCodigo: ultimo.clienteCodigo,
      viajeCodigos: grupo.map((v) => v.codigo),
      referencia: `001-002-${String(4500 + (primeraFactura + i) * 3).padStart(9, '0')}`,
      fechaEmision: emision,
      fechaVencimiento: r.sumarDias(emision, dias),
      valor: redondear(grupo.reduce((s, v) => s + v.valorReferencial, 0)),
      modalidadCobro,
      creadoPor: USUARIO_CONTABLE,
    }
    facturas.push(factura)

    const edadDias = (new Date(ahora).getTime() - new Date(emision).getTime()) / MS_DIA
    const p = a.numero()
    const escenario = edadDias > 45 ? (p < 0.85 ? 'cobrada' : 'parcial') : edadDias > 20 ? (p < 0.5 ? 'cobrada' : p < 0.75 ? 'parcial' : 'por_validar') : p < 0.4 ? 'sin_pago' : p < 0.75 ? 'por_validar' : 'parcial'
    const fechaPago = (minDias: number) => minimo(r.sumarDias(emision, Math.min(minDias, Math.max(1, Math.floor(edadDias) - 1))), sumarMinutos(ahora, -120))
    if (escenario === 'cobrada') {
      if (a.probabilidad(0.5)) {
        agregarPago(factura, fechaPago(a.entero(5, dias)), factura.valor, true)
      } else {
        const primero = redondear(factura.valor * a.elegir([0.4, 0.5, 0.6]))
        agregarPago(factura, fechaPago(a.entero(3, 12)), primero, true)
        agregarPago(factura, fechaPago(a.entero(13, dias + 5)), factura.valor - primero, true)
      }
    } else if (escenario === 'parcial') {
      agregarPago(factura, fechaPago(a.entero(4, 15)), factura.valor * a.elegir([0.3, 0.4, 0.5]), true)
    } else if (escenario === 'por_validar') {
      agregarPago(factura, fechaPago(a.entero(2, 10)), a.probabilidad(0.5) ? factura.valor : factura.valor * 0.5, false)
    }
  })

  return { facturas, pagos }
}
