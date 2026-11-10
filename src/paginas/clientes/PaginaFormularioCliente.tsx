import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { ESTADOS_CATALOGO } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarVolver } from '@/hooks/usarVolver'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { NotaCamposRequeridos, PieFormulario } from '@/componentes/formularios/PieFormulario'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import { obtener } from '@/servicios/repositorio'
import { crearCliente, editarCliente } from '@/servicios/operaciones/clientes'
import { ETIQUETAS_ESTADO_CATALOGO, opcionesDe } from '@/utilidades/constantes'
import { esquemaCliente, identificacionDisponible, MENSAJES, type EntradaCliente } from '@/utilidades/validadores'

const VALORES_INICIALES: EntradaCliente = { razonSocial: '', identificacion: '', contacto: '', correo: '', telefono: '', estado: 'activo' }

export default function PaginaFormularioCliente() {
  const { codigo } = useParams()
  const { datos } = usarApp()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const existente = obtener(datos, 'clientes', codigo)
  const esEdicion = codigo !== undefined
  const volver = usarVolver(esEdicion ? `/clientes/${codigo}` : '/clientes')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCliente>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: existente
      ? { razonSocial: existente.razonSocial, identificacion: existente.identificacion, contacto: existente.contacto, correo: existente.correo, telefono: existente.telefono, estado: existente.estado }
      : VALORES_INICIALES,
  })

  if (esEdicion && !existente) return <PaginaNoEncontrada />

  const guardar = (valores: EntradaCliente) => {
    if (!identificacionDisponible(valores.identificacion, datos.clientes, codigo)) {
      setError('identificacion', { message: MENSAJES.identificacionDuplicada })
      return
    }
    const resultado = ejecutar(esEdicion && codigo ? editarCliente(codigo, valores) : crearCliente(valores))
    if (!resultado.ok) {
      notificar('error', 'No se pudo guardar el cliente', resultado.error)
      return
    }
    notificar(resultado.mensaje ? 'info' : 'exito', resultado.mensaje ?? (esEdicion ? 'Cliente actualizado' : 'Cliente registrado'), `${resultado.valor.codigo} · ${resultado.valor.razonSocial}`)
    navegar(`/clientes/${resultado.valor.codigo}`, { replace: true })
  }

  return (
    <>
      <EncabezadoPagina
        titulo={esEdicion ? `Editar ${existente?.razonSocial ?? ''}` : 'Nuevo cliente'}
        descripcion={esEdicion ? `Código ${codigo}. El código no se modifica.` : 'El código se asigna automáticamente al guardar.'}
      />
      <Panel className="max-w-3xl">
        <form onSubmit={handleSubmit(guardar)} noValidate>
          <NotaCamposRequeridos />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto etiqueta="Razón social" requerido className="sm:col-span-2" error={errors.razonSocial?.message} {...register('razonSocial')} />
            <CampoTexto etiqueta="Identificación (cédula o RUC)" requerido inputMode="numeric" maxLength={13} error={errors.identificacion?.message} ayuda="10 dígitos para cédula o 13 para RUC." {...register('identificacion')} />
            <Selector etiqueta="Estado" requerido opciones={opcionesDe(ETIQUETAS_ESTADO_CATALOGO, ESTADOS_CATALOGO)} error={errors.estado?.message} {...register('estado')} />
            <CampoTexto etiqueta="Persona de contacto" requerido error={errors.contacto?.message} {...register('contacto')} />
            <CampoTexto etiqueta="Teléfono" requerido type="tel" error={errors.telefono?.message} {...register('telefono')} />
            <CampoTexto etiqueta="Correo electrónico" requerido type="email" className="sm:col-span-2" error={errors.correo?.message} {...register('correo')} />
          </div>
          <PieFormulario onCancelar={volver} textoGuardar={esEdicion ? 'Guardar cambios' : 'Registrar cliente'} enviando={isSubmitting} />
        </form>
      </Panel>
    </>
  )
}
