import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, Download, FileSpreadsheet, FileUp, RotateCcw, Upload } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { Selector } from '@/componentes/formularios/Selector'
import {
  CAMPOS_IMPORTACION,
  descargarMuestra,
  ETIQUETAS_TIPO_IMPORTACION,
  hojaLeidaDeMuestra,
  leerArchivoExcel,
  mapeoAutomatico,
  TIPOS_IMPORTACION,
  validarClientes,
  validarViajes,
  type FilaValidada,
  type HojaLeida,
  type Mapeo,
  type TipoImportacion,
} from '@/servicios/importacion'
import { importarRegistros } from '@/servicios/operaciones/importacion'
import type { EntradaCliente, EntradaViaje } from '@/utilidades/validadores'

const PASOS = ['Archivo', 'Vista previa', 'Mapeo', 'Validación', 'Resultado'] as const
const FILAS_VISTA_PREVIA = 8

function Pasos({ actual }: { actual: number }) {
  return (
    <ol className="flex flex-wrap gap-2 mb-5" aria-label="Pasos de la importación">
      {PASOS.map((paso, i) => {
        const estado = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente'
        return (
          <li
            key={paso}
            aria-current={estado === 'actual' ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${estado === 'actual' ? 'border-primario bg-primario text-sobre-primario' : estado === 'hecho' ? 'border-exito/40 bg-exito-fondo text-exito' : 'border-borde bg-superficie text-texto-secundario'}`}
          >
            <span className="tabular-nums text-xs">{i + 1}</span>
            {paso}
          </li>
        )
      })}
    </ol>
  )
}

export default function PaginaImportacion() {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const entradaArchivo = useRef<HTMLInputElement>(null)
  const ahora = useMemo(() => new Date(), [])
  const [tipo, establecerTipo] = useState<TipoImportacion>('viajes')
  const [paso, establecerPaso] = useState(0)
  const [hoja, establecerHoja] = useState<HojaLeida | null>(null)
  const [mapeo, establecerMapeo] = useState<Mapeo>({})
  const [errorArchivo, establecerErrorArchivo] = useState<string | null>(null)
  const [soloErrores, establecerSoloErrores] = useState(false)
  const [importados, establecerImportados] = useState<string[]>([])

  const campos = CAMPOS_IMPORTACION[tipo]
  const validadas: FilaValidada<EntradaCliente | EntradaViaje>[] = useMemo(() => {
    if (!hoja || paso < 3) return []
    return tipo === 'clientes' ? validarClientes(datos, hoja, mapeo) : validarViajes(datos, hoja, mapeo)
  }, [hoja, mapeo, tipo, datos, paso])
  const validas = validadas.filter((f) => f.entrada)
  const conError = validadas.length - validas.length
  const faltanRequeridos = campos.filter((c) => c.requerido && (mapeo[c.clave] ?? -1) < 0)

  const cargarHoja = (nueva: HojaLeida) => {
    establecerHoja(nueva)
    establecerMapeo(mapeoAutomatico(tipo, nueva.encabezados))
    establecerErrorArchivo(null)
    establecerPaso(1)
  }

  const alSeleccionar = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!/\.(xlsx|xls|csv)$/i.test(archivo.name)) {
      establecerErrorArchivo('Seleccione un archivo de Excel (.xlsx, .xls) o CSV.')
      return
    }
    try {
      cargarHoja(await leerArchivoExcel(await archivo.arrayBuffer(), archivo.name))
    } catch (error) {
      establecerErrorArchivo(error instanceof Error ? error.message : 'No se pudo leer el archivo.')
    }
  }

  const reiniciar = () => {
    establecerPaso(0)
    establecerHoja(null)
    establecerMapeo({})
    establecerImportados([])
    establecerSoloErrores(false)
  }

  const confirmar = () => {
    if (!hoja) return
    const pendiente =
      tipo === 'clientes'
        ? { tipo: 'clientes' as const, entradas: validas.map((f) => f.entrada as EntradaCliente) }
        : { tipo: 'viajes' as const, entradas: validas.map((f) => f.entrada as EntradaViaje) }
    const resultado = ejecutar(importarRegistros(pendiente, hoja.nombreArchivo, conError))
    if (!resultado.ok) {
      notificar('error', 'No se pudo importar', resultado.error)
      return
    }
    establecerImportados(resultado.valor.codigos)
    notificar('exito', `Importación completada: ${resultado.valor.codigos.length} ${ETIQUETAS_TIPO_IMPORTACION[tipo].toLowerCase()}`, resultado.valor.codigos.join(', '))
    establecerPaso(4)
  }

  const nombreColumna = (indice: number | undefined) => (indice !== undefined && indice >= 0 ? hoja?.encabezados[indice] : undefined)
  const filasVisibles = soloErrores ? validadas.filter((f) => !f.entrada) : validadas
  const rutaListado = tipo === 'clientes' ? '/clientes' : '/viajes'

  return (
    <>
      <EncabezadoPagina titulo="Importar Excel" descripcion="Carga inicial de clientes o viajes desde una hoja de cálculo, con mapeo de columnas, vista previa y validación." />
      <Pasos actual={paso} />

      {paso === 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Panel titulo="1. Seleccione el tipo de datos y el archivo" descripcion="La primera fila del archivo debe contener los nombres de las columnas.">
            <div className="grid gap-4">
              <Selector
                etiqueta="Datos a importar"
                className="sm:w-72"
                value={tipo}
                onChange={(e) => establecerTipo(e.target.value as TipoImportacion)}
                opciones={TIPOS_IMPORTACION.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TIPO_IMPORTACION[t] }))}
              />
              <input ref={entradaArchivo} type="file" accept=".xlsx,.xls,.csv" className="sr-only" aria-label="Archivo de Excel" onChange={(e) => void alSeleccionar(e)} />
              <button
                type="button"
                onClick={() => entradaArchivo.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-borde bg-fondo px-4 py-8 text-center hover:border-texto-secundario/50"
              >
                <Upload className="size-6 text-texto-secundario" aria-hidden="true" />
                <span className="text-sm font-medium text-texto">Seleccionar archivo de Excel</span>
                <span className="text-xs text-texto-secundario">Formatos .xlsx, .xls o .csv</span>
              </button>
              {errorArchivo && <p className="text-sm text-peligro">{errorArchivo}</p>}
              <div className="flex flex-wrap gap-2">
                <Boton variante="primario" icono={FileSpreadsheet} onClick={() => cargarHoja(hojaLeidaDeMuestra(tipo, datos, ahora))}>Usar archivo de muestra</Boton>
                <Boton icono={Download} onClick={() => void descargarMuestra(tipo, datos, ahora)}>Descargar muestra</Boton>
              </div>
            </div>
          </Panel>
          <Panel titulo="Columnas esperadas" descripcion={`Campos de ${ETIQUETAS_TIPO_IMPORTACION[tipo].toLowerCase()}. Los nombres del archivo pueden ser distintos: se asignan en el paso de mapeo.`}>
            <ul className="space-y-2 text-sm">
              {campos.map((c) => (
                <li key={c.clave} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="text-texto">{c.etiqueta}</span>
                    {c.ayuda && <span className="block text-xs text-texto-secundario">{c.ayuda}</span>}
                  </span>
                  {c.requerido ? <Insignia tono="info">Obligatorio</Insignia> : <Insignia>Opcional</Insignia>}
                </li>
              ))}
            </ul>
            <AvisoDemostrativo className="mt-4">El archivo de muestra incluye filas con errores intencionales para mostrar la validación. Sus fechas se calculan desde hoy.</AvisoDemostrativo>
          </Panel>
        </div>
      )}

      {paso === 1 && hoja && (
        <Panel
          titulo="2. Vista previa e identificación de columnas"
          descripcion={`${hoja.nombreArchivo} · ${hoja.filas.length} ${hoja.filas.length === 1 ? 'fila' : 'filas'} de datos · ${hoja.encabezados.length} columnas. Se muestran las primeras ${Math.min(FILAS_VISTA_PREVIA, hoja.filas.length)}.`}
          sinRelleno
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-fondo text-xs text-texto-secundario">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Fila</th>
                  {hoja.encabezados.map((e, i) => {
                    const campo = campos.find((c) => mapeo[c.clave] === i)
                    return (
                      <th key={i} scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap align-bottom">
                        <span className="block text-texto">{e || `Columna ${i + 1}`}</span>
                        {campo ? <span className="block text-info font-normal">{campo.etiqueta}</span> : <span className="block font-normal">Sin asignar</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {hoja.filas.slice(0, FILAS_VISTA_PREVIA).map((fila, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 tabular-nums text-texto-secundario">{i + 2}</td>
                    {fila.map((celda, j) => (
                      <td key={j} className="px-3 py-2 whitespace-nowrap">{celda || <span className="text-texto-secundario">Vacío</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-borde px-4 py-3">
            <Boton icono={ArrowLeft} onClick={reiniciar}>Cambiar archivo</Boton>
            <Boton variante="primario" icono={ArrowRight} onClick={() => establecerPaso(2)}>Continuar al mapeo</Boton>
          </div>
        </Panel>
      )}

      {paso === 2 && hoja && (
        <Panel titulo="3. Mapeo de columnas" descripcion="Relacione cada campo del sistema con una columna del archivo. Se propone una asignación según los nombres de las columnas.">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {campos.map((c) => {
              const indice = mapeo[c.clave] ?? -1
              const ejemplo = indice >= 0 ? hoja.filas.find((f) => f[indice])?.[indice] : undefined
              return (
                <Selector
                  key={c.clave}
                  etiqueta={c.etiqueta}
                  requerido={c.requerido}
                  textoTodos="No importar"
                  value={indice >= 0 ? String(indice) : ''}
                  onChange={(e) => establecerMapeo((m) => ({ ...m, [c.clave]: e.target.value === '' ? -1 : Number(e.target.value) }))}
                  opciones={hoja.encabezados.map((e, i) => ({ valor: String(i), etiqueta: e || `Columna ${i + 1}` }))}
                  error={c.requerido && indice < 0 ? 'Asigne una columna.' : undefined}
                  ayuda={ejemplo ? `Ejemplo: ${ejemplo}` : c.ayuda}
                />
              )
            })}
          </div>
          {hoja.encabezados.some((_, i) => !Object.values(mapeo).includes(i)) && (
            <p className="mt-4 text-xs text-texto-secundario">
              Columnas sin usar: {hoja.encabezados.filter((_, i) => !Object.values(mapeo).includes(i)).map((e, i) => e || `Columna ${i + 1}`).join(', ')}.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <Boton icono={ArrowLeft} onClick={() => establecerPaso(1)}>Vista previa</Boton>
            <Boton
              variante="primario"
              icono={ArrowRight}
              motivoDeshabilitado={faltanRequeridos.length > 0 ? `Asigne: ${faltanRequeridos.map((c) => c.etiqueta).join(', ')}.` : undefined}
              onClick={() => establecerPaso(3)}
            >
              Validar datos
            </Boton>
          </div>
        </Panel>
      )}

      {paso === 3 && hoja && (
        <Panel
          titulo="4. Validación"
          descripcion="Las filas con errores se omiten al confirmar. Corrija el archivo y vuelva a cargarlo si necesita incluirlas."
          sinRelleno
          acciones={
            <label className="inline-flex items-center gap-2 text-sm text-texto-secundario">
              <input type="checkbox" className="size-4 accent-primario" checked={soloErrores} onChange={(e) => establecerSoloErrores(e.target.checked)} />
              Solo filas con errores
            </label>
          }
        >
          <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-borde text-sm">
            <Insignia tono="exito" icono={CircleCheck}>{validas.length} {validas.length === 1 ? 'fila válida' : 'filas válidas'}</Insignia>
            <Insignia tono={conError > 0 ? 'peligro' : 'neutro'} icono={CircleAlert}>{conError} con errores</Insignia>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-fondo text-xs text-texto-secundario">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Fila</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Estado</th>
                  {campos.filter((c) => (mapeo[c.clave] ?? -1) >= 0).map((c) => (
                    <th key={c.clave} scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {c.etiqueta}
                      <span className="block font-normal">{nombreColumna(mapeo[c.clave])}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {filasVisibles.map((f) => (
                  <tr key={f.numero} className={f.entrada ? '' : 'bg-peligro-fondo/60'}>
                    <td className="px-3 py-2 tabular-nums text-texto-secundario align-top">{f.numero}</td>
                    <td className="px-3 py-2 align-top min-w-56">
                      {f.entrada ? (
                        <Insignia tono="exito" icono={CircleCheck}>Válida</Insignia>
                      ) : (
                        <ul className="space-y-1">
                          {f.errores.map((e) => (
                            <li key={e} className="flex items-start gap-1.5 text-xs text-peligro">
                              <CircleAlert className="size-3.5 mt-px shrink-0" aria-hidden="true" />
                              {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    {campos.filter((c) => (mapeo[c.clave] ?? -1) >= 0).map((c) => (
                      <td key={c.clave} className="px-3 py-2 whitespace-nowrap align-top">{f.valores[c.clave] || <span className="text-texto-secundario">Vacío</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-borde px-4 py-3">
            <Boton icono={ArrowLeft} onClick={() => establecerPaso(2)}>Mapeo</Boton>
            <Boton variante="primario" icono={FileUp} motivoDeshabilitado={validas.length === 0 ? 'No hay filas válidas para importar.' : undefined} onClick={confirmar}>
              Confirmar e importar {validas.length} {validas.length === 1 ? 'fila' : 'filas'}
            </Boton>
          </div>
        </Panel>
      )}

      {paso === 4 && (
        <Panel titulo="5. Resultado" descripcion={`${importados.length} ${ETIQUETAS_TIPO_IMPORTACION[tipo].toLowerCase()} importados desde ${hoja?.nombreArchivo ?? 'el archivo'}; ${conError} ${conError === 1 ? 'fila omitida' : 'filas omitidas'}.`}>
          <ul className="flex flex-wrap gap-2 mb-4">
            {importados.map((c) => (
              <li key={c}>
                <Link to={`${rutaListado}/${c}`} className="inline-flex rounded-md border border-borde px-2.5 py-1 font-mono text-sm text-info hover:bg-fondo">{c}</Link>
              </li>
            ))}
          </ul>
          {tipo === 'viajes' && <p className="text-sm text-texto-secundario mb-4">Los viajes quedan en estado Solicitado, sin transportista, chofer ni unidad: aparecen en Programación como pendientes de asignación.</p>}
          <div className="flex flex-wrap gap-2">
            <Link to={tipo === 'viajes' ? '/viajes?estado=solicitado' : '/clientes'} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md text-sm font-medium bg-primario text-sobre-primario hover:bg-barra-hover">
              Ver en {ETIQUETAS_TIPO_IMPORTACION[tipo].toLowerCase()}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Boton icono={RotateCcw} onClick={reiniciar}>Nueva importación</Boton>
          </div>
        </Panel>
      )}
    </>
  )
}
