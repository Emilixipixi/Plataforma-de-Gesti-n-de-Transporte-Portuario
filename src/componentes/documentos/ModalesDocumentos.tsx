import { useEffect, useId, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, FilePlus2, FileText, Printer } from 'lucide-react'
import type { DatosGuia, Documento, Evidencia, Viaje } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { Modal } from '@/componentes/modales/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { AreaTexto, CampoTexto } from '@/componentes/formularios/CampoTexto'
import { Selector } from '@/componentes/formularios/Selector'
import { CampoEvidencias } from '@/componentes/viajes/ModalesSeguimiento'
import { VistaGuia } from '@/componentes/documentos/VistaGuia'
import { obtener } from '@/servicios/repositorio'
import { nombreCliente } from '@/servicios/consultas'
import { construirDatosGuia, siguienteNumeroGuia, versionSiguiente } from '@/servicios/documentos'
import { adjuntarDocumento, generarGuia } from '@/servicios/operaciones/documentos'
import { EMPRESA_OPERADORA, ETIQUETAS_TIPO_DOCUMENTO } from '@/utilidades/constantes'
import { esquemaAdjunto, esquemaGuia, type EntradaAdjuntoFormulario, type EntradaGuia } from '@/utilidades/validadores'

export async function descargarGuia(documento: Documento): Promise<void> {
  const { descargarGuiaPdf } = await import('@/servicios/documentosPdf')
  descargarGuiaPdf(documento)
}

export function imprimirGuia(): void {
  window.print()
}

function valoresGuia(datos: ReturnType<typeof usarApp>['datos'], viaje: Viaje): EntradaGuia {
  const base = construirDatosGuia(datos, viaje)
  const limpio = (valor: string | undefined) => (valor === 'Sin asignar' ? '' : (valor ?? ''))
  return {
    remitente: limpio(base.remitente),
    destinatario: limpio(base.destinatario),
    identificacionDestinatario: limpio(base.identificacionDestinatario),
    transportista: limpio(base.transportista),
    chofer: limpio(base.chofer),
    unidad: limpio(base.unidad),
    placa: limpio(base.placa),
    origen: limpio(base.origen),
    destino: limpio(base.destino),
    carga: limpio(base.carga),
    contenedor: limpio(base.contenedor),
    recorrido: limpio(base.recorrido),
    emisor: EMPRESA_OPERADORA,
    receptor: obtener(datos, 'clientes', viaje.clienteCodigo)?.razonSocial ?? '',
  }
}

export function ModalGenerarGuia({ viaje, abierto, onCerrar, onGenerada }: { viaje: Viaje; abierto: boolean; onCerrar: () => void; onGenerada?: (documento: Documento) => void }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const iniciales = useMemo(() => valoresGuia(datos, viaje), [datos, viaje])
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EntradaGuia>({ resolver: zodResolver(esquemaGuia), defaultValues: iniciales })
  const valores = useWatch({ control })

  useEffect(() => {
    if (abierto) reset(iniciales)
  }, [abierto, iniciales, reset])

  const enviar = ({ emisor, receptor, ...guia }: EntradaGuia) => {
    const datosGuia: DatosGuia = guia
    const resultado = ejecutar(generarGuia(viaje.codigo, datosGuia, emisor, receptor))
    if (!resultado.ok) {
      notificar('error', 'No se pudo generar la guía', resultado.error)
      return
    }
    notificar('exito', `Guía ${resultado.valor.numeroReferencial ?? ''} generada`, `Versión ${resultado.valor.version} del viaje ${viaje.codigo}.`)
    onGenerada?.(resultado.valor)
    onCerrar()
  }

  const campo = (nombre: keyof EntradaGuia, etiqueta: string, ancho = false, ayuda?: string) => (
    <CampoTexto etiqueta={etiqueta} requerido={nombre !== 'contenedor'} className={ancho ? 'sm:col-span-2' : ''} error={errors[nombre]?.message} ayuda={ayuda} {...register(nombre)} />
  )

  return (
    <Modal
      abierto={abierto}
      titulo={`Generar guía de remisión · ${viaje.codigo}`}
      descripcion="Los campos se completan con los datos del viaje y pueden ajustarse antes de generar. Cada generación crea una nueva versión."
      onCerrar={onCerrar}
      ancho="grande"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={FileText}>Generar guía</Boton>
        </>
      }
    >
      <div className="grid gap-6">
        <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
          {campo('remitente', 'Remitente')}
          {campo('destinatario', 'Destinatario')}
          {campo('identificacionDestinatario', 'Identificación del destinatario')}
          {campo('transportista', 'Transportista')}
          {campo('chofer', 'Chofer')}
          {campo('unidad', 'Unidad')}
          {campo('placa', 'Placa')}
          {campo('contenedor', 'Contenedor', false, 'Opcional para carga suelta.')}
          {campo('origen', 'Origen')}
          {campo('destino', 'Destino')}
          {campo('carga', 'Carga', true)}
          {campo('recorrido', 'Recorrido', true)}
          {campo('emisor', 'Emisor')}
          {campo('receptor', 'Receptor')}
        </form>
        <div>
          <p className="text-xs font-medium text-texto-secundario mb-2">Vista previa</p>
          <VistaGuia
            borrador
            datos={{ ...iniciales, ...valores } as DatosGuia}
            numero={siguienteNumeroGuia(datos)}
            viajeCodigo={viaje.codigo}
            fecha={new Date().toISOString()}
            version={versionSiguiente(datos, viaje.codigo, 'guia_remision')}
            emisor={valores.emisor ?? ''}
            receptor={valores.receptor ?? ''}
          />
        </div>
      </div>
    </Modal>
  )
}

export function ModalVerGuia({ documento, onCerrar }: { documento: Documento | null; onCerrar: () => void }) {
  const { datos } = usarApp()
  if (!documento?.datosGuia) return null
  const viaje = obtener(datos, 'viajes', documento.viajeCodigo)
  return (
    <Modal
      abierto
      titulo={`Guía ${documento.numeroReferencial ?? documento.codigo}`}
      descripcion={`Viaje ${documento.viajeCodigo}${viaje ? ` · ${nombreCliente(datos, viaje.clienteCodigo)}` : ''} · versión ${documento.version}`}
      onCerrar={onCerrar}
      ancho="grande"
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>
          <Boton variante="secundario" icono={Printer} onClick={imprimirGuia}>Imprimir</Boton>
          <Boton variante="primario" icono={Download} onClick={() => void descargarGuia(documento)}>Descargar PDF</Boton>
        </>
      }
    >
      <VistaGuia
        datos={documento.datosGuia}
        numero={documento.numeroReferencial ?? documento.codigo}
        viajeCodigo={documento.viajeCodigo}
        fecha={documento.fechaGeneracion}
        version={documento.version}
        emisor={documento.emisor}
        receptor={documento.receptor}
      />
    </Modal>
  )
}

const TIPOS_ADJUNTO = ['conocimiento_embarque', 'acta_entrega', 'evidencia', 'otro'] as const

export function ModalAdjuntarDocumento({ abierto, onCerrar, viaje }: { abierto: boolean; onCerrar: () => void; viaje?: Viaje }) {
  const { datos } = usarApp()
  const ejecutar = usarOperacion()
  const { notificar } = usarNotificaciones()
  const idFormulario = useId()
  const [archivos, establecerArchivos] = useState<Evidencia[]>([])
  const [errorArchivo, establecerErrorArchivo] = useState<string | undefined>()
  const viajes = datos.viajes.filter((v) => v.estado !== 'cancelado')
  const iniciales = useMemo<EntradaAdjuntoFormulario>(
    () => ({ viajeCodigo: viaje?.codigo ?? '', tipo: 'acta_entrega', numeroReferencial: '', emisor: EMPRESA_OPERADORA, receptor: viaje ? (obtener(datos, 'clientes', viaje.clienteCodigo)?.razonSocial ?? '') : '', descripcion: '' }),
    [viaje, datos],
  )
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EntradaAdjuntoFormulario>({ resolver: zodResolver(esquemaAdjunto), defaultValues: iniciales })

  useEffect(() => {
    if (!abierto) return
    reset(iniciales)
    establecerArchivos([])
    establecerErrorArchivo(undefined)
  }, [abierto, iniciales, reset])

  const enviar = (entrada: EntradaAdjuntoFormulario) => {
    const archivo = archivos[0]
    if (!archivo) {
      establecerErrorArchivo('Seleccione el archivo ilustrativo.')
      return
    }
    const resultado = ejecutar(adjuntarDocumento({ ...entrada, archivo }))
    if (!resultado.ok) {
      notificar('error', 'No se pudo adjuntar', resultado.error)
      return
    }
    notificar('exito', `Documento adjuntado: ${ETIQUETAS_TIPO_DOCUMENTO[resultado.valor.tipo]}`, `${resultado.valor.codigo} · ${resultado.valor.viajeCodigo}`)
    onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={viaje ? `Adjuntar documento a ${viaje.codigo}` : 'Adjuntar documento'}
      descripcion="Conocimiento de embarque, acta de entrega, evidencias u otros documentos del servicio."
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" type="submit" form={idFormulario} icono={FilePlus2}>Adjuntar</Boton>
        </>
      }
    >
      <form id={idFormulario} noValidate onSubmit={handleSubmit(enviar)} className="grid gap-4 sm:grid-cols-2">
        {viaje ? (
          <CampoTexto etiqueta="Viaje" value={`${viaje.codigo} · ${nombreCliente(datos, viaje.clienteCodigo)}`} readOnly disabled className="sm:col-span-2" />
        ) : (
          <Selector
            etiqueta="Viaje"
            requerido
            className="sm:col-span-2"
            textoTodos="Seleccione el viaje"
            opciones={viajes.map((v) => ({ valor: v.codigo, etiqueta: `${v.codigo} · ${nombreCliente(datos, v.clienteCodigo)}` }))}
            error={errors.viajeCodigo?.message}
            {...register('viajeCodigo', {
              onChange: (e: { target: { value: string } }) => {
                const elegido = obtener(datos, 'viajes', e.target.value)
                if (elegido) setValue('receptor', obtener(datos, 'clientes', elegido.clienteCodigo)?.razonSocial ?? '')
              },
            })}
          />
        )}
        <Selector etiqueta="Tipo de documento" requerido opciones={TIPOS_ADJUNTO.map((t) => ({ valor: t, etiqueta: ETIQUETAS_TIPO_DOCUMENTO[t] }))} error={errors.tipo?.message} {...register('tipo')} />
        <CampoTexto etiqueta="Número referencial" placeholder="Opcional" {...register('numeroReferencial')} />
        <CampoTexto etiqueta="Emisor" requerido error={errors.emisor?.message} {...register('emisor')} />
        <CampoTexto etiqueta="Receptor" requerido error={errors.receptor?.message} {...register('receptor')} />
        <AreaTexto etiqueta="Descripción" requerido rows={2} className="sm:col-span-2" error={errors.descripcion?.message} {...register('descripcion')} />
        <div className="sm:col-span-2">
          <CampoEvidencias evidencias={archivos} onCambiar={(lista) => { establecerArchivos(lista.slice(-1)); establecerErrorArchivo(undefined) }} />
          {errorArchivo && <p className="text-xs text-peligro mt-1">{errorArchivo}</p>}
        </div>
      </form>
      <AvisoDemostrativo className="mt-4">El prototipo registra el nombre y el tipo del archivo; no almacena su contenido.</AvisoDemostrativo>
    </Modal>
  )
}
