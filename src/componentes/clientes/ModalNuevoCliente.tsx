import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { ESTADOS_CATALOGO } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { Modal } from '@/componentes/modales/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { NotaCamposRequeridos } from '@/componentes/formularios/PieFormulario'
import { crearCliente } from '@/servicios/operaciones/clientes'
import { ETIQUETAS_ESTADO_CATALOGO, opcionesDe } from '@/utilidades/constantes'
import { esquemaCliente, identificacionDisponible, MENSAJES, type EntradaCliente } from '@/utilidades/validadores'

const VALORES_INICIALES: EntradaCliente = { razonSocial: '', identificacion: '', contacto: '', correo: '', telefono: '', estado: 'activo' }

interface PropiedadesModalNuevoCliente {
  abierto: boolean
  onCerrar: () => void
}

export function ModalNuevoCliente({ abierto, onCerrar }: PropiedadesModalNuevoCliente) {
  const idFormulario = useId()
  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo cliente"
      descripcion="El código se asigna automáticamente al guardar."
      ancho="grande"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={Save}>Registrar cliente</Boton>
        </>
      }
    >
      {abierto && <FormularioNuevoCliente idFormulario={idFormulario} onGuardado={onCerrar} />}
    </Modal>
  )
}

function FormularioNuevoCliente({ idFormulario, onGuardado }: { idFormulario: string; onGuardado: () => void }) {
  const { datos } = usarApp()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EntradaCliente>({ resolver: zodResolver(esquemaCliente), defaultValues: VALORES_INICIALES })

  const guardar = (valores: EntradaCliente) => {
    if (!identificacionDisponible(valores.identificacion, datos.clientes)) {
      setError('identificacion', { message: MENSAJES.identificacionDuplicada })
      return
    }
    const resultado = ejecutar(crearCliente(valores))
    if (!resultado.ok) {
      notificar('error', 'No se pudo guardar el cliente', resultado.error)
      return
    }
    notificar(resultado.mensaje ? 'info' : 'exito', resultado.mensaje ?? 'Cliente registrado', `${resultado.valor.codigo} · ${resultado.valor.razonSocial}`)
    onGuardado()
  }

  return (
    <form id={idFormulario} onSubmit={handleSubmit(guardar)} noValidate>
      <NotaCamposRequeridos />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Razón social" requerido className="sm:col-span-2" error={errors.razonSocial?.message} {...register('razonSocial')} />
        <CampoTexto etiqueta="Identificación (cédula o RUC)" requerido inputMode="numeric" maxLength={13} error={errors.identificacion?.message} ayuda="10 dígitos para cédula o 13 para RUC." {...register('identificacion')} />
        <Selector etiqueta="Estado" requerido opciones={opcionesDe(ETIQUETAS_ESTADO_CATALOGO, ESTADOS_CATALOGO)} error={errors.estado?.message} {...register('estado')} />
        <CampoTexto etiqueta="Persona de contacto" requerido error={errors.contacto?.message} {...register('contacto')} />
        <CampoTexto etiqueta="Teléfono" requerido type="tel" error={errors.telefono?.message} {...register('telefono')} />
        <CampoTexto etiqueta="Correo electrónico" requerido type="email" className="sm:col-span-2" error={errors.correo?.message} {...register('correo')} />
      </div>
    </form>
  )
}
