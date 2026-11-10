import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'
import { ModalConfirmacion } from '@/componentes/modales/ModalConfirmacion'
import { formatearFechaHora } from '@/utilidades/formateadores'
import type { ColeccionDatos } from '@/tipos/dominio'

const RESUMEN: readonly { coleccion: ColeccionDatos; etiqueta: string }[] = [
  { coleccion: 'clientes', etiqueta: 'Clientes' },
  { coleccion: 'solicitudes', etiqueta: 'Solicitudes' },
  { coleccion: 'viajes', etiqueta: 'Viajes' },
  { coleccion: 'eventos', etiqueta: 'Eventos' },
  { coleccion: 'incidencias', etiqueta: 'Incidencias' },
  { coleccion: 'documentos', etiqueta: 'Documentos' },
  { coleccion: 'facturas', etiqueta: 'Facturas' },
  { coleccion: 'pagos', etiqueta: 'Pagos' },
  { coleccion: 'transportistas', etiqueta: 'Transportistas' },
  { coleccion: 'choferes', etiqueta: 'Choferes' },
  { coleccion: 'unidades', etiqueta: 'Unidades' },
  { coleccion: 'lugares', etiqueta: 'Lugares' },
  { coleccion: 'actividad', etiqueta: 'Registros de actividad' },
]

export default function PaginaConfiguracion() {
  const { datos, restablecer } = usarApp()
  const { usuario, puede } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const [confirmando, establecerConfirmando] = useState(false)

  const confirmar = () => {
    restablecer(usuario?.codigo)
    establecerConfirmando(false)
    notificar('exito', 'Datos demostrativos restablecidos', 'Se regeneró el conjunto inicial con la fecha vigente.')
  }

  return (
    <>
      <EncabezadoPagina titulo="Configuración" descripcion="Parámetros del prototipo y mantenimiento de los datos demostrativos." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          titulo="Datos demostrativos"
          descripcion={`Generados el ${formatearFechaHora(datos.configuracion.fechaBaseDemostracion)}. Las fechas son relativas a ese momento.`}
          acciones={
            <Boton
              variante="peligro"
              icono={RefreshCw}
              onClick={() => establecerConfirmando(true)}
              motivoDeshabilitado={puede('configuracion.restablecer') ? undefined : 'Solo Operaciones puede restablecer los datos.'}
            >
              Restablecer datos demostrativos
            </Boton>
          }
        >
          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {RESUMEN.map(({ coleccion, etiqueta }) => (
              <div key={coleccion} className="rounded-md border border-borde bg-fondo px-3 py-2">
                <dt className="text-xs text-texto-secundario">{etiqueta}</dt>
                <dd className="text-lg font-semibold text-texto">{datos[coleccion].length}</dd>
              </div>
            ))}
          </dl>
          <AvisoDemostrativo className="mt-4">
            Los cambios realizados durante la demostración se guardan en este navegador y se conservan al recargar. Restablezca los datos antes de cada presentación para que los escenarios de fechas (servicios del día, vencidos y próximos a vencer) coincidan con la fecha actual.
          </AvisoDemostrativo>
        </Panel>
        <Panel titulo="Parámetros" descripcion="Valores vigentes del prototipo.">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-texto-secundario">Alerta de vencimiento</dt>
              <dd className="font-medium text-texto">{datos.configuracion.diasAlertaVencimiento} días antes</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-secundario">Versión del esquema</dt>
              <dd className="font-medium text-texto">{datos.configuracion.versionEsquema}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-secundario">Moneda y formato</dt>
              <dd className="font-medium text-texto">USD · dd/mm/aaaa</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-texto-secundario">La edición de parámetros se incorpora en la Fase 7.</p>
        </Panel>
      </div>
      <ModalConfirmacion
        abierto={confirmando}
        titulo="Restablecer datos demostrativos"
        mensaje="Se eliminarán todos los cambios realizados en este navegador y se regenerará el conjunto inicial con la fecha actual. Esta acción no se puede deshacer."
        textoConfirmar="Restablecer"
        peligroso
        onConfirmar={confirmar}
        onCancelar={() => establecerConfirmando(false)}
      />
    </>
  )
}
