import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MODALIDADES } from '@/tipos/dominio'
import { opcionesLugar } from '@/componentes/formularios/opcionesDominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { AreaTexto, CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { NotaCamposRequeridos, PieFormulario } from '@/componentes/formularios/PieFormulario'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { crearSolicitud, editarSolicitud } from '@/servicios/operaciones/solicitudes'
import {
  ETIQUETAS_ESTADO_SOLICITUD,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_TIPO_CARGA,
  opcionesDe,
  TIPO_CARGA_POR_MODALIDAD,
} from '@/utilidades/constantes'
import { aValorFechaHoraLocal, desdeValorFechaHoraLocal } from '@/utilidades/formateadores'
import { ESTADOS_SOLICITUD_EDITABLES, esquemaSolicitud, type EntradaSolicitud } from '@/utilidades/validadores'

const ORIGEN_SUGERIDO = { importacion_contenedorizada: 'puerto', importacion_suelta: 'puerto', exportacion: 'deposito' } as const

export default function PaginaFormularioSolicitud() {
  const { codigo } = useParams()
  const [parametros] = useSearchParams()
  const { datos } = usarApp()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const volver = usarVolver('/solicitudes')
  const existente = obtener(datos, 'solicitudes', codigo)
  const esEdicion = codigo !== undefined
  const clienteInicial = parametros.get('cliente') ?? ''

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EntradaSolicitud>({
    resolver: zodResolver(esquemaSolicitud),
    defaultValues:
      existente && (existente.estado === 'recibida' || existente.estado === 'aceptada')
        ? {
            clienteCodigo: existente.clienteCodigo,
            modalidad: existente.modalidad,
            categoriaCargaCodigo: existente.categoriaCargaCodigo ?? '',
            descripcionCarga: existente.descripcionCarga,
            origenCodigo: existente.origenCodigo,
            destinoCodigo: existente.destinoCodigo,
            fechaRequerida: aValorFechaHoraLocal(existente.fechaRequerida),
            indicacionesCliente: existente.indicacionesCliente,
            observaciones: existente.observaciones,
            estado: existente.estado,
          }
        : {
            clienteCodigo: clienteInicial,
            modalidad: 'importacion_contenedorizada',
            categoriaCargaCodigo: '',
            descripcionCarga: '',
            origenCodigo: '',
            destinoCodigo: '',
            fechaRequerida: '',
            indicacionesCliente: '',
            observaciones: '',
            estado: 'recibida',
          },
  })

  const modalidad = useWatch({ control, name: 'modalidad' })
  const lugaresActivos = useMemo(() => datos.lugares.filter((l) => l.estado === 'activo'), [datos.lugares])

  const ultimoSugerido = useRef<string | null>(null)

  useEffect(() => {
    const actual = getValues('origenCodigo')
    if (actual && actual !== ultimoSugerido.current) return
    const sugerido = lugaresActivos.find((l) => l.tipo === ORIGEN_SUGERIDO[modalidad])
    if (!sugerido) return
    ultimoSugerido.current = sugerido.codigo
    setValue('origenCodigo', sugerido.codigo)
  }, [modalidad, lugaresActivos, getValues, setValue])

  if (esEdicion && !existente) return <PaginaNoEncontrada />
  if (existente && existente.estado !== 'recibida' && existente.estado !== 'aceptada') {
    return (
      <>
        <EncabezadoPagina titulo={`Solicitud ${existente.codigo}`} />
        <AvisoDemostrativo>
          Esta solicitud está {ETIQUETAS_ESTADO_SOLICITUD[existente.estado].toLowerCase()} y ya no puede editarse.
        </AvisoDemostrativo>
      </>
    )
  }

  const clientes = datos.clientes.filter((c) => c.estado === 'activo' || c.codigo === existente?.clienteCodigo)
  const categorias = datos.tiposCarga.filter((t) => t.estado === 'activo' || t.codigo === existente?.categoriaCargaCodigo)

  const guardar = (valores: EntradaSolicitud) => {
    const fecha = desdeValorFechaHoraLocal(valores.fechaRequerida)
    if (!esEdicion && fecha && new Date(fecha).getTime() < Date.now() - 60 * 60 * 1000) {
      setError('fechaRequerida', { message: 'La fecha requerida no puede estar en el pasado.' })
      return
    }
    const resultado = ejecutar(esEdicion && codigo ? editarSolicitud(codigo, valores) : crearSolicitud(valores))
    if (!resultado.ok) {
      notificar('error', 'No se pudo guardar la solicitud', resultado.error)
      return
    }
    notificar('exito', esEdicion ? 'Solicitud actualizada' : `Solicitud ${resultado.valor.codigo} registrada`, `Estado: ${ETIQUETAS_ESTADO_SOLICITUD[resultado.valor.estado]}.`)
    navegar(`/solicitudes?q=${resultado.valor.codigo}`, { replace: true })
  }

  return (
    <>
      <EncabezadoPagina
        titulo={esEdicion ? `Editar solicitud ${codigo}` : 'Nueva solicitud'}
        descripcion={esEdicion ? 'Los cambios quedan registrados en la actividad.' : 'Requerimiento de transporte del cliente. El código se asigna al guardar.'}
      />
      <Panel>
        <form onSubmit={handleSubmit(guardar)} noValidate>
          <NotaCamposRequeridos />
          <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <legend className="sr-only">Cliente y operación</legend>
            <Selector etiqueta="Cliente" requerido textoTodos="Seleccione un cliente" className="sm:col-span-2"opciones={clientes.map((c) => ({ valor: c.codigo, etiqueta: `${c.razonSocial} (${c.codigo})` }))} error={errors.clienteCodigo?.message} {...register('clienteCodigo')} />
            <Selector etiqueta="Tipo de operación" requerido opciones={opcionesDe(ETIQUETAS_MODALIDAD, MODALIDADES)} error={errors.modalidad?.message} {...register('modalidad')} />
            <CampoTexto etiqueta="Carga" value={ETIQUETAS_TIPO_CARGA[TIPO_CARGA_POR_MODALIDAD[modalidad]]} disabled ayuda="Se define según el tipo de operación." readOnly />
            <Selector etiqueta="Tipo de carga" requerido textoTodos="Seleccione" opciones={categorias.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))} error={errors.categoriaCargaCodigo?.message} {...register('categoriaCargaCodigo')} />
            <CampoTexto etiqueta="Descripción de la carga" requerido placeholder="Ej.: 20 pallets de repuestos" className="lg:col-span-3" error={errors.descripcionCarga?.message} {...register('descripcionCarga')} />
          </fieldset>
          <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-5 pt-5 border-t border-borde">
            <legend className="sr-only">Recorrido y fecha</legend>
            <Selector etiqueta="Origen" requerido textoTodos="Seleccione el origen" opciones={opcionesLugar(lugaresActivos)} error={errors.origenCodigo?.message} {...register('origenCodigo')} />
            <Selector etiqueta="Destino" requerido textoTodos="Seleccione el destino" opciones={opcionesLugar(lugaresActivos)} error={errors.destinoCodigo?.message} {...register('destinoCodigo')} />
            <CampoTexto etiqueta="Fecha y hora requerida" requerido type="datetime-local" error={errors.fechaRequerida?.message} ayuda="Hora de Ecuador (24 h)." {...register('fechaRequerida')} />
            <Selector etiqueta="Estado" requerido opciones={opcionesDe(ETIQUETAS_ESTADO_SOLICITUD, ESTADOS_SOLICITUD_EDITABLES)} error={errors.estado?.message} {...register('estado')} />
          </fieldset>
          <fieldset className="grid gap-4 sm:grid-cols-2 mt-5 pt-5 border-t border-borde">
            <legend className="sr-only">Notas</legend>
            <AreaTexto etiqueta="Indicaciones del cliente" placeholder="Horarios de recepción, contacto en sitio, requisitos de la carga" error={errors.indicacionesCliente?.message} {...register('indicacionesCliente')} />
            <AreaTexto etiqueta="Observaciones" placeholder="Notas internas de Operaciones" error={errors.observaciones?.message} {...register('observaciones')} />
          </fieldset>
          <PieFormulario onCancelar={volver} textoGuardar={esEdicion ? 'Guardar cambios' : 'Registrar solicitud'} enviando={isSubmitting} />
        </form>
      </Panel>
    </>
  )
}
