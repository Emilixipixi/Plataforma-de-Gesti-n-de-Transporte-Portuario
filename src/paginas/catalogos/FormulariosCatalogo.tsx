import { useForm, type FieldValues, type Path, type UseFormSetError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  DISPONIBILIDADES_CHOFER,
  DISPONIBILIDADES_UNIDAD,
  ESTADOS_CATALOGO,
  MODALIDADES,
  TIPOS_LUGAR,
  type TipoCatalogo,
} from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { valorDuplicado, type ColeccionCatalogo } from '@/servicios/operaciones/catalogos'
import type { EntidadDe } from '@/servicios/repositorio'
import type { PropiedadesFormularioCatalogo } from '@/paginas/catalogos/PanelCatalogo'
import {
  esHitoDelSistema,
  ETIQUETAS_DISPONIBILIDAD_CHOFER,
  ETIQUETAS_DISPONIBILIDAD_UNIDAD,
  ETIQUETAS_ESTADO_CATALOGO,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_TIPO_LUGAR,
  opcionesDe,
  TIPOS_UNIDAD,
} from '@/utilidades/constantes'
import {
  esquemaChofer,
  esquemaLugar,
  esquemaTipoCatalogo,
  esquemaTipoEvento,
  esquemaTransportista,
  esquemaUnidad,
  type EntradaChofer,
  type EntradaLugar,
  type EntradaTipoCatalogo,
  type EntradaTipoEvento,
  type EntradaTransportista,
  type EntradaUnidad,
} from '@/utilidades/validadores'

const opcionesEstado = opcionesDe(ETIQUETAS_ESTADO_CATALOGO, ESTADOS_CATALOGO)

function usarValidacionUnica<C extends ColeccionCatalogo>(coleccion: C, codigoActual: string | undefined) {
  const { datos } = usarApp()
  const lista: readonly EntidadDe<C>[] = datos[coleccion]
  return <T extends FieldValues>(valores: T, campo: Path<T>, establecerError: UseFormSetError<T>): boolean => {
    const mensaje = valorDuplicado(lista, coleccion, valores, codigoActual)
    if (mensaje) establecerError(campo, { message: mensaje })
    return mensaje === null
  }
}

function usarTransportistasDisponibles(actual?: string) {
  const { datos } = usarApp()
  return datos.transportistas
    .filter((t) => t.estado === 'activo' || t.codigo === actual)
    .map((t) => ({ valor: t.codigo, etiqueta: t.razonSocial }))
}

export function FormularioTransportista({ idFormulario, inicial, onEnviar }: PropiedadesFormularioCatalogo<'transportistas'>) {
  const esUnico = usarValidacionUnica('transportistas', inicial?.codigo)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaTransportista>({
    resolver: zodResolver(esquemaTransportista),
    defaultValues: inicial ?? { razonSocial: '', contacto: '', telefono: '', estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'razonSocial', setError) && onEnviar(v))} className="grid gap-4 sm:grid-cols-2">
      <CampoTexto etiqueta="Razón social" requerido className="sm:col-span-2" error={errors.razonSocial?.message} {...register('razonSocial')} />
      <CampoTexto etiqueta="Contacto" requerido error={errors.contacto?.message} {...register('contacto')} />
      <CampoTexto etiqueta="Teléfono" requerido type="tel" error={errors.telefono?.message} {...register('telefono')} />
      <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
    </form>
  )
}

export function FormularioChofer({ idFormulario, inicial, onEnviar }: PropiedadesFormularioCatalogo<'choferes'>) {
  const esUnico = usarValidacionUnica('choferes', inicial?.codigo)
  const transportistas = usarTransportistasDisponibles(inicial?.transportistaCodigo)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaChofer>({
    resolver: zodResolver(esquemaChofer),
    defaultValues: inicial ?? { nombre: '', identificacion: '', telefono: '', transportistaCodigo: '', disponibilidad: 'disponible', estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'identificacion', setError) && onEnviar(v))} className="grid gap-4 sm:grid-cols-2">
      <CampoTexto etiqueta="Nombre completo" requerido className="sm:col-span-2" error={errors.nombre?.message} {...register('nombre')} />
      <CampoTexto etiqueta="Cédula" requerido inputMode="numeric" maxLength={10} error={errors.identificacion?.message} {...register('identificacion')} />
      <CampoTexto etiqueta="Teléfono" requerido type="tel" error={errors.telefono?.message} {...register('telefono')} />
      <Selector etiqueta="Transportista" requerido textoTodos="Seleccione" className="sm:col-span-2" opciones={transportistas} error={errors.transportistaCodigo?.message} {...register('transportistaCodigo')} />
      <Selector etiqueta="Disponibilidad" requerido opciones={opcionesDe(ETIQUETAS_DISPONIBILIDAD_CHOFER, DISPONIBILIDADES_CHOFER)} {...register('disponibilidad')} />
      <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
    </form>
  )
}

export function FormularioUnidad({ idFormulario, inicial, onEnviar }: PropiedadesFormularioCatalogo<'unidades'>) {
  const esUnico = usarValidacionUnica('unidades', inicial?.codigo)
  const transportistas = usarTransportistasDisponibles(inicial?.transportistaCodigo)
  const tipos = Array.from(new Set<string>([...TIPOS_UNIDAD, ...(inicial ? [inicial.tipo] : [])]))
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaUnidad>({
    resolver: zodResolver(esquemaUnidad),
    defaultValues: inicial ?? { placa: '', tipo: '', transportistaCodigo: '', disponibilidad: 'disponible', estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'placa', setError) && onEnviar(v))} className="grid gap-4 sm:grid-cols-2">
      <CampoTexto etiqueta="Placa" requerido placeholder="GBA-1234" className="[&_input]:uppercase" error={errors.placa?.message} {...register('placa')} />
      <Selector etiqueta="Tipo de unidad" requerido textoTodos="Seleccione" opciones={tipos.map((t) => ({ valor: t, etiqueta: t }))} error={errors.tipo?.message} {...register('tipo')} />
      <Selector etiqueta="Transportista" requerido textoTodos="Seleccione" className="sm:col-span-2" opciones={transportistas} error={errors.transportistaCodigo?.message} {...register('transportistaCodigo')} />
      <Selector etiqueta="Disponibilidad" requerido opciones={opcionesDe(ETIQUETAS_DISPONIBILIDAD_UNIDAD, DISPONIBILIDADES_UNIDAD)} {...register('disponibilidad')} />
      <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
    </form>
  )
}

export function FormularioLugar({ idFormulario, inicial, onEnviar }: PropiedadesFormularioCatalogo<'lugares'>) {
  const esUnico = usarValidacionUnica('lugares', inicial?.codigo)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaLugar>({
    resolver: zodResolver(esquemaLugar),
    defaultValues: inicial ?? { nombre: '', tipo: 'planta', ciudad: '', estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'nombre', setError) && onEnviar(v))} className="grid gap-4 sm:grid-cols-2">
      <CampoTexto etiqueta="Nombre" requerido className="sm:col-span-2" error={errors.nombre?.message} {...register('nombre')} />
      <Selector etiqueta="Tipo de lugar" requerido opciones={opcionesDe(ETIQUETAS_TIPO_LUGAR, TIPOS_LUGAR)} {...register('tipo')} />
      <CampoTexto etiqueta="Ciudad" requerido error={errors.ciudad?.message} {...register('ciudad')} />
      <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
    </form>
  )
}

interface PropiedadesTipoSimple {
  coleccion: 'tiposCarga' | 'tiposIncidencia'
  idFormulario: string
  inicial?: TipoCatalogo
  onEnviar: (valores: Omit<TipoCatalogo, 'codigo'>) => void
}

function FormularioTipoSimple({ coleccion, idFormulario, inicial, onEnviar }: PropiedadesTipoSimple) {
  const esUnico = usarValidacionUnica(coleccion, inicial?.codigo)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaTipoCatalogo>({
    resolver: zodResolver(esquemaTipoCatalogo),
    defaultValues: inicial ? { nombre: inicial.nombre, estado: inicial.estado } : { nombre: '', estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'nombre', setError) && onEnviar(v))} className="grid gap-4 sm:grid-cols-2">
      <CampoTexto etiqueta="Nombre" requerido className="sm:col-span-2" error={errors.nombre?.message} {...register('nombre')} />
      <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
    </form>
  )
}

export function FormularioTipoCarga(propiedades: PropiedadesFormularioCatalogo<'tiposCarga'>) {
  return <FormularioTipoSimple coleccion="tiposCarga" {...propiedades} />
}

export function FormularioTipoIncidencia(propiedades: PropiedadesFormularioCatalogo<'tiposIncidencia'>) {
  return <FormularioTipoSimple coleccion="tiposIncidencia" {...propiedades} />
}

export function FormularioTipoEvento({ idFormulario, inicial, onEnviar }: PropiedadesFormularioCatalogo<'tiposEvento'>) {
  const esUnico = usarValidacionUnica('tiposEvento', inicial?.codigo)
  const protegido = inicial ? esHitoDelSistema(inicial.codigo) : false
  const { register, handleSubmit, setError, formState: { errors } } = useForm<EntradaTipoEvento>({
    resolver: zodResolver(esquemaTipoEvento),
    defaultValues: inicial ? { nombre: inicial.nombre, modalidades: inicial.modalidades, estado: inicial.estado } : { nombre: '', modalidades: [], estado: 'activo' },
  })
  return (
    <form id={idFormulario} noValidate onSubmit={handleSubmit((v) => esUnico(v, 'nombre', setError) && onEnviar(v))} className="grid gap-4">
      {protegido && (
        <AvisoDemostrativo>
          Hito del sistema: forma parte de la secuencia que determina el cierre de la modalidad. Solo puede cambiarse su nombre visible.
        </AvisoDemostrativo>
      )}
      <CampoTexto etiqueta="Nombre" requerido error={errors.nombre?.message} {...register('nombre')} />
      {protegido && inicial ? (
        <div className="text-sm">
          <p className="text-xs font-medium text-texto-secundario mb-1">Modalidades donde se usa</p>
          <p className="text-texto">{inicial.modalidades.map((m) => ETIQUETAS_MODALIDAD[m]).join(', ')}</p>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className="text-xs font-medium text-texto-secundario mb-1.5">
              Modalidades donde se usa <span className="text-peligro" aria-hidden="true">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODALIDADES.map((m) => (
                <label key={m} className="flex items-center gap-2 rounded-md border border-borde px-3 py-2 text-sm text-texto">
                  <input type="checkbox" value={m} className="size-4 accent-primario" {...register('modalidades')} />
                  {ETIQUETAS_MODALIDAD[m]}
                </label>
              ))}
            </div>
            {errors.modalidades?.message && <p className="text-xs text-peligro mt-1">{errors.modalidades.message}</p>}
          </fieldset>
          <Selector etiqueta="Estado" requerido opciones={opcionesEstado} {...register('estado')} />
        </>
      )}
    </form>
  )
}
