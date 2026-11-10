import type { ComponentType } from 'react'
import { Calculator, CircleDashed, MapPinned, Plug, RefreshCw, type LucideProps } from 'lucide-react'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Panel } from '@/componentes/comunes/Panel'
import { Boton } from '@/componentes/comunes/Boton'
import { Insignia } from '@/componentes/comunes/Insignia'
import { ListaDatos } from '@/componentes/comunes/ListaDatos'
import { AvisoDemostrativo } from '@/componentes/comunes/AvisoDemostrativo'

interface Integracion {
  nombre: string
  icono: ComponentType<LucideProps>
  descripcion: string
  funcionalidad: readonly string[]
  informacion: readonly string[]
  sincronizacion: string
  nota: string
}

const ESTADO_INTEGRACION = 'Pendiente de integración'

const INTEGRACIONES: readonly Integracion[] = [
  {
    nombre: 'Contífico',
    icono: Calculator,
    descripcion: 'Sistema contable y de facturación de la empresa. Las facturas se emiten allí; el prototipo solo registra sus referencias.',
    funcionalidad: ['Consulta de cartera por cliente', 'Vencimientos y saldos de facturas', 'Referencias contables de facturas y pagos', 'Conciliación con los servicios por facturar'],
    informacion: ['Número y fecha de factura', 'Valor, abonos y saldo', 'Fecha de vencimiento', 'Estado de cobro'],
    sincronizacion: 'Sin sincronizar',
    nota: 'Mientras no exista la integración, Contabilidad registra referencias, pagos y validaciones manualmente en el prototipo.',
  },
  {
    nombre: 'Tracklink',
    icono: MapPinned,
    descripcion: 'Plataforma de rastreo GPS de las unidades. Seguirá siendo el sistema externo de posicionamiento.',
    funcionalidad: ['Consulta del estado del recorrido de una unidad', 'Apoyo a la confirmación de llegadas y salidas', 'Referencia para explicar desvíos y paradas'],
    informacion: ['Placa de la unidad', 'Última hora de reporte', 'Estado del recorrido'],
    sincronizacion: 'Sin sincronizar',
    nota: 'El prototipo no muestra mapas ni posiciones; los hitos se registran manualmente con hora real y responsable.',
  },
]

export default function PaginaIntegraciones() {
  return (
    <>
      <EncabezadoPagina titulo="Integraciones" descripcion="Conexiones previstas con sistemas externos. Ninguna está activa en el prototipo." />
      <AvisoDemostrativo className="mb-5">
        Estas integraciones se presentan como trabajo futuro. El prototipo no se conecta a servicios externos, no almacena credenciales y no muestra datos en vivo.
      </AvisoDemostrativo>
      <div className="grid gap-5 lg:grid-cols-2">
        {INTEGRACIONES.map((integracion) => {
          const Icono = integracion.icono
          return (
            <Panel
              key={integracion.nombre}
              titulo={integracion.nombre}
              descripcion={integracion.descripcion}
              acciones={<Insignia tono="pendiente" icono={CircleDashed}>{ESTADO_INTEGRACION}</Insignia>}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center size-10 rounded-md bg-fondo border border-borde text-texto-secundario">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <ListaDatos
                  datos={[
                    { etiqueta: 'Estado', valor: ESTADO_INTEGRACION },
                    { etiqueta: 'Sincronización', valor: integracion.sincronizacion },
                  ]}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-medium text-texto-secundario mb-1.5">Funcionalidad prevista</h3>
                  <ul className="space-y-1 text-sm list-disc pl-4 marker:text-texto-secundario">
                    {integracion.funcionalidad.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-texto-secundario mb-1.5">Información que podría consultarse</h3>
                  <ul className="space-y-1 text-sm list-disc pl-4 marker:text-texto-secundario">
                    {integracion.informacion.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-texto-secundario">{integracion.nota}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Boton icono={Plug} motivoDeshabilitado="Integración futura: no disponible en el prototipo.">Conectar</Boton>
                <Boton icono={RefreshCw} motivoDeshabilitado="Integración futura: no disponible en el prototipo.">Sincronizar</Boton>
              </div>
            </Panel>
          )
        })}
      </div>
    </>
  )
}
