import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightLeft, Check, Pencil, X } from 'lucide-react'
import type { Solicitud } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { Modal } from '@/componentes/modales/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { InsigniaEstadoSolicitud } from '@/componentes/comunes/Insignia'
import { AreaTexto } from '@/componentes/formularios/CampoTexto'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente, nombreLugar, nombreUsuario } from '@/servicios/consultas'
import { siguienteCodigo } from '@/utilidades/calculos'
import { ETIQUETAS_MODALIDAD, ETIQUETAS_TIPO_CARGA, prefijoDeViaje } from '@/utilidades/constantes'
import { formatearFechaHora } from '@/utilidades/formateadores'
import { esquemaMotivo, type EntradaMotivo } from '@/utilidades/validadores'

export function datosDeSolicitud(solicitud: Solicitud, datos: ReturnType<typeof usarApp>['datos']) {
  const categoria = obtener(datos, 'tiposCarga', solicitud.categoriaCargaCodigo)?.nombre
  return [
    { etiqueta: 'Cliente', valor: nombreCliente(datos, solicitud.clienteCodigo), ancho: 'completo' as const },
    { etiqueta: 'Tipo de operación', valor: ETIQUETAS_MODALIDAD[solicitud.modalidad] },
    { etiqueta: 'Tipo de carga', valor: `${ETIQUETAS_TIPO_CARGA[solicitud.tipoCarga]}${categoria ? ` · ${categoria}` : ''}` },
    { etiqueta: 'Descripción de la carga', valor: solicitud.descripcionCarga, ancho: 'completo' as const },
    { etiqueta: 'Origen', valor: nombreLugar(datos, solicitud.origenCodigo) },
    { etiqueta: 'Destino', valor: nombreLugar(datos, solicitud.destinoCodigo) },
    { etiqueta: 'Fecha requerida', valor: formatearFechaHora(solicitud.fechaRequerida) },
  ]
}

interface PropiedadesDetalle {
  solicitud: Solicitud | null
  puedeEscribir: boolean
  onCerrar: () => void
  onEditar: (s: Solicitud) => void
  onAceptar: (s: Solicitud) => void
  onRechazar: (s: Solicitud) => void
  onConvertir: (s: Solicitud) => void
}

export function ModalDetalleSolicitud({ solicitud, puedeEscribir, onCerrar, onEditar, onAceptar, onRechazar, onConvertir }: PropiedadesDetalle) {
  const { datos } = usarApp()
  if (!solicitud) return null
  const editable = solicitud.estado === 'recibida' || solicitud.estado === 'aceptada'
  return (
    <Modal
      abierto
      titulo={`Solicitud ${solicitud.codigo}`}
      descripcion={`Registrada el ${formatearFechaHora(solicitud.fechaCreacion)} por ${nombreUsuario(datos, solicitud.creadoPor)}`}
      onCerrar={onCerrar}
      ancho="grande"
      pie={
        puedeEscribir && editable ? (
          <>
            <Boton variante="fantasma" icono={X} onClick={() => onRechazar(solicitud)}>Rechazar</Boton>
            <Boton variante="secundario" icono={Pencil} onClick={() => onEditar(solicitud)}>Editar</Boton>
            {solicitud.estado === 'recibida' && <Boton variante="primario" icono={Check} onClick={() => onAceptar(solicitud)}>Aceptar</Boton>}
            {solicitud.estado === 'aceptada' && <Boton variante="primario" icono={ArrowRightLeft} onClick={() => onConvertir(solicitud)}>Convertir en viaje</Boton>}
          </>
        ) : (
          <Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>
        )
      }
    >
      <div className="mb-4">
        <InsigniaEstadoSolicitud estado={solicitud.estado} />
      </div>
      <ListaDatos
        datos={[
          ...datosDeSolicitud(solicitud, datos),
          { etiqueta: 'Viaje generado', valor: solicitud.viajeCodigo ? <span className="font-mono">{solicitud.viajeCodigo}</span> : 'Sin viaje' },
          { etiqueta: 'Indicaciones del cliente', valor: solicitud.indicacionesCliente || 'Sin indicaciones', ancho: 'completo' },
          { etiqueta: 'Observaciones', valor: solicitud.observaciones || 'Sin observaciones', ancho: 'completo' },
          ...(solicitud.motivoRechazo ? [{ etiqueta: 'Motivo del rechazo', valor: solicitud.motivoRechazo, ancho: 'completo' as const }] : []),
        ]}
      />
    </Modal>
  )
}

export function ModalRechazoSolicitud({ solicitud, onCancelar, onConfirmar }: { solicitud: Solicitud | null; onCancelar: () => void; onConfirmar: (motivo: string) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntradaMotivo>({ resolver: zodResolver(esquemaMotivo), defaultValues: { motivo: '' } })
  if (!solicitud) return null
  const cerrar = () => {
    reset()
    onCancelar()
  }
  return (
    <Modal
      abierto
      titulo={`Rechazar ${solicitud.codigo}`}
      descripcion="El motivo queda registrado en la solicitud y en la actividad."
      onCerrar={cerrar}
      ancho="pequeno"
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar}>Cancelar</Boton>
          <Boton variante="peligro" type="submit" form="formulario-rechazo">Rechazar solicitud</Boton>
        </>
      }
    >
      <form id="formulario-rechazo" noValidate onSubmit={handleSubmit(({ motivo }) => { onConfirmar(motivo); reset() })}>
        <AreaTexto etiqueta="Motivo del rechazo" requerido rows={4} error={errors.motivo?.message} {...register('motivo')} />
      </form>
    </Modal>
  )
}

export function ModalConversionSolicitud({ solicitud, onCancelar, onConfirmar }: { solicitud: Solicitud | null; onCancelar: () => void; onConfirmar: () => void }) {
  const { datos } = usarApp()
  if (!solicitud) return null
  const codigoPrevisto = siguienteCodigo(datos.configuracion, prefijoDeViaje(solicitud.modalidad)).codigo
  return (
    <Modal
      abierto
      titulo={`Convertir ${solicitud.codigo} en viaje`}
      descripcion={`Se creará el viaje ${codigoPrevisto} con los datos de la solicitud, sin volver a digitarlos.`}
      onCerrar={onCancelar}
      ancho="mediano"
      pie={
        <>
          <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
          <Boton variante="primario" icono={ArrowRightLeft} onClick={onConfirmar}>Crear viaje {codigoPrevisto}</Boton>
        </>
      }
    >
      <ListaDatos datos={datosDeSolicitud(solicitud, datos)} />
      <AvisoDemostrativo className="mt-4">
        El viaje queda en estado Solicitado. La asignación de transportista, chofer, unidad, contenedor, horarios y valor referencial se completa en el formulario del viaje.
      </AvisoDemostrativo>
    </Modal>
  )
}
