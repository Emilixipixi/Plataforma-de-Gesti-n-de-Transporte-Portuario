import type { DatosApp, Modalidad, ModalidadCobro } from '@/tipos/dominio'
import { normalizarTexto } from '@/servicios/repositorio'
import { claveDia, sumarDiasAClave } from '@/utilidades/fechas'
import { esquemaCliente, esquemaViaje, type EntradaCliente, type EntradaViaje } from '@/utilidades/validadores'

export const TIPOS_IMPORTACION = ['clientes', 'viajes'] as const
export type TipoImportacion = (typeof TIPOS_IMPORTACION)[number]

export const ETIQUETAS_TIPO_IMPORTACION: Record<TipoImportacion, string> = {
  clientes: 'Clientes',
  viajes: 'Viajes',
}

export interface CampoImportacion {
  clave: string
  etiqueta: string
  requerido: boolean
  sinonimos: readonly string[]
  ayuda?: string
}

export const CAMPOS_IMPORTACION: Record<TipoImportacion, readonly CampoImportacion[]> = {
  clientes: [
    { clave: 'razonSocial', etiqueta: 'Razón social', requerido: true, sinonimos: ['razon social', 'nombre', 'cliente', 'empresa'] },
    { clave: 'identificacion', etiqueta: 'Identificación (RUC o cédula)', requerido: true, sinonimos: ['identificacion', 'ruc', 'cedula'] },
    { clave: 'contacto', etiqueta: 'Contacto', requerido: true, sinonimos: ['contacto', 'persona'] },
    { clave: 'correo', etiqueta: 'Correo', requerido: true, sinonimos: ['correo', 'email', 'mail'] },
    { clave: 'telefono', etiqueta: 'Teléfono', requerido: true, sinonimos: ['telefono', 'celular', 'movil'] },
  ],
  viajes: [
    { clave: 'cliente', etiqueta: 'Cliente', requerido: true, sinonimos: ['cliente', 'razon social', 'ruc'], ayuda: 'Código, RUC o razón social de un cliente activo.' },
    { clave: 'modalidad', etiqueta: 'Modalidad', requerido: true, sinonimos: ['modalidad', 'tipo de operacion', 'operacion'], ayuda: 'Importación contenedorizada, importación suelta o exportación.' },
    { clave: 'descripcion', etiqueta: 'Descripción de la carga', requerido: true, sinonimos: ['descripcion', 'mercancia', 'carga'] },
    { clave: 'categoria', etiqueta: 'Tipo de carga', requerido: true, sinonimos: ['categoria', 'tipo de carga'] },
    { clave: 'contenedorTipo', etiqueta: 'Tipo de contenedor', requerido: false, sinonimos: ['tipo contenedor', 'tipo de contenedor'] },
    { clave: 'contenedorNumero', etiqueta: 'Número de contenedor', requerido: false, sinonimos: ['contenedor', 'n contenedor', 'numero de contenedor'] },
    { clave: 'origen', etiqueta: 'Origen', requerido: true, sinonimos: ['origen', 'puerto'] },
    { clave: 'parada', etiqueta: 'Parada o punto de carga', requerido: false, sinonimos: ['parada', 'punto intermedio', 'punto de carga'] },
    { clave: 'destino', etiqueta: 'Destino', requerido: true, sinonimos: ['destino'] },
    { clave: 'devolucion', etiqueta: 'Depósito de devolución', requerido: false, sinonimos: ['devolucion', 'deposito'] },
    { clave: 'salida', etiqueta: 'Salida prevista', requerido: false, sinonimos: ['salida', 'fecha salida'], ayuda: 'dd/mm/aaaa hh:mm' },
    { clave: 'llegada', etiqueta: 'Llegada prevista', requerido: false, sinonimos: ['llegada', 'fecha llegada'], ayuda: 'dd/mm/aaaa hh:mm' },
    { clave: 'cobro', etiqueta: 'Modalidad de cobro', requerido: false, sinonimos: ['cobro', 'forma de pago', 'pago'], ayuda: 'Contra factura o a crédito; si se omite, a crédito.' },
    { clave: 'valor', etiqueta: 'Valor referencial', requerido: true, sinonimos: ['valor', 'tarifa', 'precio', 'monto'] },
  ],
}

export interface HojaLeida {
  nombreArchivo: string
  encabezados: string[]
  filas: string[][]
}

export type Mapeo = Record<string, number>

export interface FilaValidada<T> {
  numero: number
  valores: Record<string, string>
  entrada?: T
  errores: string[]
}

const dosDigitos = (n: number) => String(n).padStart(2, '0')

function textoDeCelda(celda: unknown): string {
  if (celda instanceof Date) {
    return `${dosDigitos(celda.getDate())}/${dosDigitos(celda.getMonth() + 1)}/${celda.getFullYear()} ${dosDigitos(celda.getHours())}:${dosDigitos(celda.getMinutes())}`
  }
  if (celda === null || celda === undefined) return ''
  return String(celda).trim()
}

export async function leerArchivoExcel(contenido: ArrayBuffer, nombreArchivo: string): Promise<HojaLeida> {
  const { read, utils } = await import('xlsx')
  const libro = read(contenido, { type: 'array', cellDates: true })
  const nombreHoja = libro.SheetNames[0]
  const hoja = nombreHoja ? libro.Sheets[nombreHoja] : undefined
  if (!hoja) throw new Error('El archivo no contiene hojas.')
  const matriz = utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: '' })
  const [cabecera, ...resto] = matriz
  const encabezados = (cabecera ?? []).map(textoDeCelda)
  if (encabezados.filter(Boolean).length === 0) throw new Error('La primera fila debe contener los nombres de las columnas.')
  const filas = resto.map((fila) => encabezados.map((_, i) => textoDeCelda(fila[i]))).filter((fila) => fila.some(Boolean))
  return { nombreArchivo, encabezados, filas }
}

export function mapeoAutomatico(tipo: TipoImportacion, encabezados: readonly string[]): Mapeo {
  const normalizados = encabezados.map((e) => normalizarTexto(e).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim())
  const usados = new Set<number>()
  const mapeo: Mapeo = {}
  const campos = [...CAMPOS_IMPORTACION[tipo]].sort((a, b) => Math.max(...b.sinonimos.map((s) => s.length)) - Math.max(...a.sinonimos.map((s) => s.length)))
  for (const campo of campos) {
    const exacto = normalizados.findIndex((e, i) => !usados.has(i) && campo.sinonimos.includes(e))
    const parcial = exacto >= 0 ? exacto : normalizados.findIndex((e, i) => !usados.has(i) && campo.sinonimos.some((s) => e.includes(s)))
    mapeo[campo.clave] = parcial
    if (parcial >= 0) usados.add(parcial)
  }
  return mapeo
}

function valoresDeFila(tipo: TipoImportacion, fila: readonly string[], mapeo: Mapeo): Record<string, string> {
  return Object.fromEntries(CAMPOS_IMPORTACION[tipo].map((c) => [c.clave, (mapeo[c.clave] ?? -1) >= 0 ? (fila[mapeo[c.clave] ?? -1] ?? '').trim() : '']))
}

function faltantes(tipo: TipoImportacion, valores: Record<string, string>): string[] {
  return CAMPOS_IMPORTACION[tipo].filter((c) => c.requerido && !valores[c.clave]).map((c) => `Falta ${c.etiqueta.toLowerCase()}.`)
}

function erroresZod(issues: readonly { path: readonly PropertyKey[]; message: string }[], etiquetas: Record<string, string>): string[] {
  return issues.map((i) => {
    const campo = etiquetas[String(i.path[0] ?? '')]
    return campo ? `${campo}: ${i.message}` : i.message
  })
}

export function validarClientes(datos: DatosApp, hoja: HojaLeida, mapeo: Mapeo): FilaValidada<EntradaCliente>[] {
  const vistas = new Set(datos.clientes.map((c) => c.identificacion))
  const etiquetas = Object.fromEntries(CAMPOS_IMPORTACION.clientes.map((c) => [c.clave, c.etiqueta]))
  return hoja.filas.map((fila, i) => {
    const valores = valoresDeFila('clientes', fila, mapeo)
    const errores = faltantes('clientes', valores)
    if (errores.length > 0) return { numero: i + 2, valores, errores }
    const resultado = esquemaCliente.safeParse({ ...valores, estado: 'activo' })
    if (!resultado.success) return { numero: i + 2, valores, errores: erroresZod(resultado.error.issues, etiquetas) }
    if (vistas.has(resultado.data.identificacion)) return { numero: i + 2, valores, errores: ['La identificación ya existe en los clientes o en otra fila del archivo.'] }
    vistas.add(resultado.data.identificacion)
    return { numero: i + 2, valores, entrada: resultado.data, errores: [] }
  })
}

function aFechaLocal(texto: string): string | null {
  if (!texto) return ''
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(texto)
  if (local) {
    const [, d, m, a, h = '8', min = '00'] = local
    return `${a}-${dosDigitos(Number(m))}-${dosDigitos(Number(d))}T${dosDigitos(Number(h))}:${min}`
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?$/.exec(texto)
  if (iso) {
    const [, a, m, d, h = '8', min = '00'] = iso
    return `${a}-${m}-${d}T${dosDigitos(Number(h))}:${min}`
  }
  return null
}

function aModalidad(texto: string): Modalidad | null {
  const t = normalizarTexto(texto)
  if (t.includes('export')) return 'exportacion'
  if (t.includes('suelta')) return 'importacion_suelta'
  if (t.includes('contenedor') || t.includes('import')) return 'importacion_contenedorizada'
  return null
}

function aCobro(texto: string): ModalidadCobro | null {
  const t = normalizarTexto(texto)
  if (!t || t.includes('credito')) return 'credito'
  if (t.includes('contra') || t.includes('factura') || t.includes('contado')) return 'contra_factura'
  return null
}

function aNumero(texto: string): number {
  const limpio = texto.replace(/[$\s]/g, '')
  const normal = /,\d{1,2}$/.test(limpio) ? limpio.replace(/\./g, '').replace(',', '.') : limpio.replace(/,/g, '')
  return limpio === '' ? Number.NaN : Number(normal)
}

export function validarViajes(datos: DatosApp, hoja: HojaLeida, mapeo: Mapeo): FilaValidada<EntradaViaje>[] {
  const etiquetas: Record<string, string> = {
    clienteCodigo: 'Cliente',
    modalidad: 'Modalidad',
    categoriaCargaCodigo: 'Tipo de carga',
    descripcionCarga: 'Descripción de la carga',
    contenedorTipo: 'Tipo de contenedor',
    contenedorNumero: 'Número de contenedor',
    origenCodigo: 'Origen',
    paradas: 'Parada',
    destinoCodigo: 'Destino',
    devolucionCodigo: 'Depósito de devolución',
    salidaPrevista: 'Salida prevista',
    llegadaPrevista: 'Llegada prevista',
    valorReferencial: 'Valor referencial',
  }
  const buscarCliente = (t: string) => {
    const n = normalizarTexto(t)
    return datos.clientes.find((c) => c.estado === 'activo' && (normalizarTexto(c.codigo) === n || c.identificacion === t.trim() || normalizarTexto(c.razonSocial) === n))
  }
  const buscarLugar = (t: string) => {
    const n = normalizarTexto(t)
    return datos.lugares.find((l) => l.estado === 'activo' && (normalizarTexto(l.codigo) === n || normalizarTexto(l.nombre) === n))
  }
  const buscarCategoria = (t: string) => datos.tiposCarga.find((c) => c.estado === 'activo' && (normalizarTexto(c.nombre) === normalizarTexto(t) || normalizarTexto(c.codigo) === normalizarTexto(t)))

  return hoja.filas.map((fila, i) => {
    const valores = valoresDeFila('viajes', fila, mapeo)
    const errores = faltantes('viajes', valores)
    const cliente = valores.cliente ? buscarCliente(valores.cliente) : undefined
    if (valores.cliente && !cliente) errores.push(`Cliente "${valores.cliente}" no encontrado o inactivo.`)
    const modalidad = valores.modalidad ? aModalidad(valores.modalidad) : null
    if (valores.modalidad && !modalidad) errores.push(`Modalidad "${valores.modalidad}" no reconocida.`)
    const categoria = valores.categoria ? buscarCategoria(valores.categoria) : undefined
    if (valores.categoria && !categoria) errores.push(`Tipo de carga "${valores.categoria}" no existe en el catálogo.`)
    const lugar = (clave: 'origen' | 'destino' | 'parada' | 'devolucion', etiqueta: string) => {
      if (!valores[clave]) return ''
      const encontrado = buscarLugar(valores[clave] ?? '')
      if (!encontrado) errores.push(`${etiqueta} "${valores[clave]}" no existe en el catálogo de lugares.`)
      return encontrado?.codigo ?? ''
    }
    const origen = lugar('origen', 'Origen')
    const destino = lugar('destino', 'Destino')
    const parada = lugar('parada', 'Parada')
    const devolucion = lugar('devolucion', 'Depósito')
    const salida = aFechaLocal(valores.salida ?? '')
    const llegada = aFechaLocal(valores.llegada ?? '')
    if (salida === null) errores.push('Salida prevista: use el formato dd/mm/aaaa hh:mm.')
    if (llegada === null) errores.push('Llegada prevista: use el formato dd/mm/aaaa hh:mm.')
    const cobro = aCobro(valores.cobro ?? '')
    if (!cobro) errores.push(`Modalidad de cobro "${valores.cobro}" no reconocida.`)
    const valor = aNumero(valores.valor ?? '')
    if (valores.valor && Number.isNaN(valor)) errores.push('Valor referencial: ingrese un número.')
    if (errores.length > 0 || !cliente || !modalidad || !cobro) return { numero: i + 2, valores, errores }

    const resultado = esquemaViaje.safeParse({
      clienteCodigo: cliente.codigo,
      modalidad,
      categoriaCargaCodigo: categoria?.codigo ?? '',
      descripcionCarga: valores.descripcion ?? '',
      observacionesCarga: '',
      contenedorTipo: modalidad === 'importacion_suelta' ? '' : (valores.contenedorTipo ?? ''),
      contenedorNumero: modalidad === 'importacion_suelta' ? '' : (valores.contenedorNumero ?? ''),
      origenCodigo: origen,
      paradas: parada ? [{ lugarCodigo: parada }] : [],
      destinoCodigo: destino,
      devolucionCodigo: modalidad === 'importacion_contenedorizada' ? devolucion : '',
      transportistaCodigo: '',
      choferCodigo: '',
      unidadCodigo: '',
      salidaPrevista: salida ?? '',
      llegadaPrevista: llegada ?? '',
      cierrePrevisto: '',
      modalidadCobro: cobro,
      valorReferencial: valor,
      observaciones: `Importado desde ${hoja.nombreArchivo}, fila ${i + 2}.`,
      motivoAjuste: '',
    })
    if (!resultado.success) return { numero: i + 2, valores, errores: erroresZod(resultado.error.issues, etiquetas) }
    return { numero: i + 2, valores, entrada: resultado.data, errores: [] }
  })
}

function fechaMuestra(hoy: string, dias: number, hora: number): string {
  const [a, m, d] = sumarDiasAClave(hoy, dias).split('-')
  return `${d}/${m}/${a} ${dosDigitos(hora)}:00`
}

export function hojaDeMuestra(tipo: TipoImportacion, datos: DatosApp, ahora: Date): { encabezados: string[]; filas: string[][] } {
  if (tipo === 'clientes') {
    const existente = datos.clientes[0]?.identificacion ?? '0990000000001'
    return {
      encabezados: ['Nombre o razón social', 'RUC / Cédula', 'Persona de contacto', 'Email', 'Teléfono', 'Ciudad'],
      filas: [
        ['Exportadora Bananera El Oro S.A.', '0791234567001', 'Andrea Paredes', 'logistica@bananeraeloro-demo.ec', '07 293 4410', 'Machala'],
        ['Ferretería Industrial Guayas Cía. Ltda.', '0990876543001', 'Mario Cevallos', 'compras@ferreguayas-demo.ec', '04 260 1188', 'Guayaquil'],
        ['Alimentos del Valle S.A.', '1790876543001', 'Gabriela Andrade', 'importaciones@alimentosvalle-demo.ec', '02 245 7781', 'Quito'],
        ['Textiles Andinos S.A.', '1790765432001', 'Fernando Ruiz', 'correo-sin-arroba.demo.ec', '02 298 3300', 'Quito'],
        ['Cliente con RUC repetido S.A.', existente, 'Laura Méndez', 'laura@repetido-demo.ec', '04 222 1100', 'Guayaquil'],
        ['', '0990765432001', 'Pablo Ortiz', 'pablo@sinnombre-demo.ec', '04 211 9090', 'Durán'],
        ['Camaronera Santa Elena S.A.', '0990654321001', 'Diana Suárez', 'operaciones@camaronera-demo.ec', '04 278 6612', 'Santa Elena'],
      ],
    }
  }
  const hoy = claveDia(ahora)
  const cliente = (codigo: string) => datos.clientes.find((c) => c.codigo === codigo)?.razonSocial ?? codigo
  const lugar = (codigo: string) => datos.lugares.find((l) => l.codigo === codigo)?.nombre ?? codigo
  return {
    encabezados: ['Cliente', 'Tipo de operación', 'Mercancía', 'Categoría', 'Tipo contenedor', 'N° contenedor', 'Puerto / origen', 'Punto intermedio', 'Destino', 'Depósito devolución', 'Fecha salida', 'Fecha llegada', 'Forma de pago', 'Tarifa USD'],
    filas: [
      [cliente('CLI-001'), 'Importación contenedorizada', 'Repuestos industriales', 'Carga general', "40' High Cube", 'MSCU7654321', lugar('LUG-001'), '', lugar('LUG-005'), lugar('LUG-003'), fechaMuestra(hoy, 3, 8), fechaMuestra(hoy, 3, 12), 'A crédito', '690'],
      [datos.clientes.find((c) => c.codigo === 'CLI-003')?.identificacion ?? 'CLI-003', 'Importación suelta', 'Bobinas de acero', 'Materiales de construcción', '', '', lugar('LUG-001'), '', lugar('LUG-008'), '', fechaMuestra(hoy, 4, 6), fechaMuestra(hoy, 4, 16), 'Contra factura', '1,180.00'],
      ['CLI-002', 'Exportación', 'Banano en cajas', 'Productos agrícolas', "40' Reefer", 'SEGU1122334', lugar('LUG-003'), lugar('LUG-007'), lugar('LUG-002'), '', fechaMuestra(hoy, 5, 7), fechaMuestra(hoy, 5, 15), 'Crédito', '910'],
      [cliente('CLI-004'), 'Importación contenedorizada', 'Electrodomésticos', 'Productos de consumo masivo', "20' Dry", 'ABC123', lugar('LUG-001'), '', lugar('LUG-009'), lugar('LUG-004'), fechaMuestra(hoy, 6, 9), fechaMuestra(hoy, 6, 13), 'A crédito', '520'],
      ['Comercial Inexistente S.A.', 'Importación suelta', 'Cajas de cerámica', 'Materiales de construcción', '', '', lugar('LUG-001'), '', lugar('LUG-006'), '', fechaMuestra(hoy, 6, 7), fechaMuestra(hoy, 6, 18), 'Contra factura', '840'],
      [cliente('CLI-006'), 'Importación suelta', 'Perfiles metálicos', 'Materiales de construcción', '', '', lugar('LUG-002'), '', lugar('LUG-011'), '', fechaMuestra(hoy, 7, 14), fechaMuestra(hoy, 7, 9), 'A crédito', '760'],
    ],
  }
}

export async function descargarMuestra(tipo: TipoImportacion, datos: DatosApp, ahora: Date): Promise<void> {
  const { utils, writeFile } = await import('xlsx')
  const { encabezados, filas } = hojaDeMuestra(tipo, datos, ahora)
  const libro = utils.book_new()
  const hoja = utils.aoa_to_sheet([encabezados, ...filas])
  hoja['!cols'] = encabezados.map((e) => ({ wch: Math.max(14, e.length + 4) }))
  utils.book_append_sheet(libro, hoja, ETIQUETAS_TIPO_IMPORTACION[tipo])
  writeFile(libro, `importacion_${tipo}_demo.xlsx`)
}

export function hojaLeidaDeMuestra(tipo: TipoImportacion, datos: DatosApp, ahora: Date): HojaLeida {
  return { nombreArchivo: `importacion_${tipo}_demo.xlsx`, ...hojaDeMuestra(tipo, datos, ahora) }
}
