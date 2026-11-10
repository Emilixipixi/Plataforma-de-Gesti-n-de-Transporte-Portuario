import { useId, useState, type ComponentType, type ReactNode } from 'react'
import { Lock, Pencil, Plus, Power, PowerOff, Save } from 'lucide-react'
import { ESTADOS_CATALOGO, type EstadoCatalogo } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { InsigniaEstadoCatalogo } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { Modal } from '@/componentes/modales/Modal'
import { ModalConfirmacion } from '@/componentes/modales/ModalConfirmacion'
import { coincideTexto, type EntidadDe } from '@/servicios/repositorio'
import { cambiarEstadoEnCatalogo, guardarEnCatalogo, type ColeccionCatalogo, type ValoresCatalogo } from '@/servicios/operaciones/catalogos'
import { ETIQUETAS_ESTADO_CATALOGO, opcionesDe, type Opcion } from '@/utilidades/constantes'

export interface PropiedadesFormularioCatalogo<C extends ColeccionCatalogo> {
  idFormulario: string
  inicial?: EntidadDe<C>
  onEnviar: (valores: ValoresCatalogo<C>) => void
}

export interface FiltroCatalogo<T> {
  clave: string
  etiqueta: string
  opciones: Opcion<string>[]
  coincide: (elemento: T, valor: string) => boolean
}

interface PropiedadesPanelCatalogo<C extends ColeccionCatalogo> {
  coleccion: C
  titulo: string
  singular: string
  femenino?: boolean
  descripcion: string
  columnas: Columna<EntidadDe<C>>[]
  textoBusqueda: (elemento: EntidadDe<C>) => readonly (string | undefined)[]
  nombre: (elemento: EntidadDe<C>) => string
  Formulario: ComponentType<PropiedadesFormularioCatalogo<C>>
  filtros?: FiltroCatalogo<EntidadDe<C>>[]
  bloqueoDesactivar?: (elemento: EntidadDe<C>) => string | undefined
  avisoDesactivar?: (elemento: EntidadDe<C>) => string | undefined
  nota?: ReactNode
}

type EstadoModal<T> = { modo: 'crear' } | { modo: 'editar'; elemento: T } | null

export function PanelCatalogo<C extends ColeccionCatalogo>({
  coleccion,
  titulo,
  singular,
  femenino = false,
  descripcion,
  columnas,
  textoBusqueda,
  nombre,
  Formulario,
  filtros = [],
  bloqueoDesactivar,
  avisoDesactivar,
  nota,
}: PropiedadesPanelCatalogo<C>) {
  const { datos } = usarApp()
  const { puede } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const listado = usarParametrosListado({ ordenPredeterminado: 'codigo' })
  const idFormulario = useId()
  const [modal, establecerModal] = useState<EstadoModal<EntidadDe<C>>>(null)
  const [cambioEstado, establecerCambioEstado] = useState<{ elemento: EntidadDe<C>; estado: EstadoCatalogo } | null>(null)
  const puedeEscribir = puede('catalogos.escribir')

  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  const estado = listado.filtro('estado')
  const filas = lista.filter(
    (e) =>
      (!estado || e.estado === estado) &&
      filtros.every((f) => {
        const valor = listado.filtro(f.clave)
        return !valor || f.coincide(e, valor)
      }) &&
      coincideTexto(listado.busqueda, [e.codigo, ...textoBusqueda(e)]),
  )
  const mayuscula = `${singular.charAt(0).toUpperCase()}${singular.slice(1)}`
  const g = (masculino: string) => (femenino ? masculino.replace(/o$/, 'a') : masculino)

  const enviar = (valores: ValoresCatalogo<C>) => {
    if (!modal) return
    const codigo = modal.modo === 'editar' ? modal.elemento.codigo : undefined
    const nombreVisible = 'razonSocial' in valores ? String(valores.razonSocial) : 'placa' in valores ? String(valores.placa) : 'nombre' in valores ? String(valores.nombre) : ''
    const resultado = ejecutar(guardarEnCatalogo(coleccion, codigo, valores, singular, nombreVisible, femenino))
    if (!resultado.ok) {
      notificar('error', 'No se pudo guardar', resultado.error)
      return
    }
    notificar('exito', codigo ? `${mayuscula} ${g('actualizado')}` : `${mayuscula} ${g('registrado')}`, `${resultado.valor.codigo} · ${nombreVisible}`)
    establecerModal(null)
  }

  const confirmarEstado = () => {
    if (!cambioEstado) return
    const resultado = ejecutar(cambiarEstadoEnCatalogo(coleccion, cambioEstado.elemento.codigo, cambioEstado.estado, nombre(cambioEstado.elemento)))
    if (resultado.ok) notificar('exito', `${mayuscula} ${g(cambioEstado.estado === 'activo' ? 'activado' : 'desactivado')}`, nombre(cambioEstado.elemento))
    else notificar('error', 'No se pudo cambiar el estado', resultado.error)
    establecerCambioEstado(null)
  }

  const columnasCompletas: Columna<EntidadDe<C>>[] = [
    { clave: 'codigo', titulo: 'Código', valorOrden: (e) => e.codigo, celda: (e) => <span className="font-mono font-semibold whitespace-nowrap">{e.codigo}</span> },
    ...columnas,
    { clave: 'estado', titulo: 'Estado', valorOrden: (e) => e.estado, celda: (e) => <InsigniaEstadoCatalogo estado={e.estado} /> },
  ]

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
          <p className="text-sm text-texto-secundario mt-0.5">{descripcion}</p>
        </div>
        {puedeEscribir && (
          <Boton variante="primario" icono={Plus} onClick={() => establecerModal({ modo: 'crear' })} className="shrink-0">
            {g('Nuevo')} {singular}
          </Boton>
        )}
      </div>
      {nota}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 mb-4">
        <CampoBusqueda className="md:w-80" valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador={`Buscar ${titulo.toLowerCase()}`} />
        {filtros.map((f) => (
          <Selector key={f.clave} etiqueta={f.etiqueta} textoTodos="Todos" value={listado.filtro(f.clave)} onChange={(e) => listado.establecerFiltro(f.clave, e.target.value)} opciones={f.opciones} className="md:w-56" />
        ))}
        <Selector etiqueta="Estado" textoTodos="Todos" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_CATALOGO, ESTADOS_CATALOGO)} className="md:w-40" />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
      </div>
      <Tabla
        etiqueta={titulo}
        columnas={columnasCompletas}
        filas={filas}
        claveFila={(e) => e.codigo}
        listado={listado}
        acciones={
          puedeEscribir
            ? (e) => {
                const bloqueo = bloqueoDesactivar?.(e)
                return (
                  <span className="inline-flex gap-0.5">
                    <BotonIcono icono={Pencil} etiqueta={`Editar ${nombre(e)}`} onClick={() => establecerModal({ modo: 'editar', elemento: e })} />
                    {bloqueo && e.estado === 'activo' ? (
                      <BotonIcono icono={Lock} etiqueta={bloqueo} motivoDeshabilitado={bloqueo} />
                    ) : (
                      <BotonIcono
                        icono={e.estado === 'activo' ? PowerOff : Power}
                        etiqueta={`${e.estado === 'activo' ? 'Desactivar' : 'Activar'} ${nombre(e)}`}
                        onClick={() => establecerCambioEstado({ elemento: e, estado: e.estado === 'activo' ? 'inactivo' : 'activo' })}
                      />
                    )}
                  </span>
                )
              }
            : undefined
        }
      />
      <Modal
        abierto={modal !== null}
        titulo={modal?.modo === 'editar' ? `Editar ${singular} ${modal.elemento.codigo}` : `${g('Nuevo')} ${singular}`}
        descripcion={modal?.modo === 'editar' ? 'Los cambios quedan registrados en la actividad.' : 'El código se asigna automáticamente al guardar.'}
        onCerrar={() => establecerModal(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => establecerModal(null)}>Cancelar</Boton>
            <Boton variante="primario" type="submit" form={idFormulario} icono={Save}>Guardar</Boton>
          </>
        }
      >
        {modal && (
          <Formulario
            key={modal.modo === 'editar' ? modal.elemento.codigo : 'nuevo'}
            idFormulario={idFormulario}
            inicial={modal.modo === 'editar' ? modal.elemento : undefined}
            onEnviar={enviar}
          />
        )}
      </Modal>
      <ModalConfirmacion
        abierto={cambioEstado !== null}
        titulo={`${cambioEstado?.estado === 'activo' ? 'Activar' : 'Desactivar'} ${singular}`}
        mensaje={
          cambioEstado?.estado === 'activo' ? (
            `${cambioEstado ? nombre(cambioEstado.elemento) : ''} volverá a estar disponible en los formularios.`
          ) : (
            <>
              <p>{cambioEstado ? nombre(cambioEstado.elemento) : ''} dejará de ofrecerse en los formularios. Los registros existentes que lo usan se conservan.</p>
              {cambioEstado && avisoDesactivar?.(cambioEstado.elemento) && (
                <p className="mt-2 rounded-md bg-pendiente-fondo text-pendiente px-3 py-2">{avisoDesactivar(cambioEstado.elemento)}</p>
              )}
            </>
          )
        }
        textoConfirmar={cambioEstado?.estado === 'activo' ? 'Activar' : 'Desactivar'}
        peligroso={cambioEstado?.estado === 'inactivo'}
        onConfirmar={confirmarEstado}
        onCancelar={() => establecerCambioEstado(null)}
      />
    </section>
  )
}
