import type { ComponentType, ReactNode } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type {
  EstadoCatalogo,
  EstadoFactura,
  EstadoIncidencia,
  EstadoPago,
  EstadoServicio,
  EstadoSolicitud,
  EstadoViaje,
  Modalidad,
  ModalidadCobro,
} from '@/tipos/dominio'
import {
  ETIQUETA_CON_INCIDENCIA,
  ETIQUETA_PROXIMA_A_VENCER,
  ETIQUETA_RETRASADO,
  ETIQUETAS_ESTADO_CATALOGO,
  ETIQUETAS_ESTADO_FACTURA,
  ETIQUETAS_ESTADO_INCIDENCIA,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_ESTADO_SERVICIO,
  ETIQUETAS_ESTADO_SOLICITUD,
  ETIQUETAS_ESTADO_VIAJE,
  ETIQUETAS_MODALIDAD,
  ETIQUETAS_MODALIDAD_COBRO,
  TONOS_ESTADO_CATALOGO,
  TONOS_ESTADO_FACTURA,
  TONOS_ESTADO_INCIDENCIA,
  TONOS_ESTADO_PAGO,
  TONOS_ESTADO_SERVICIO,
  TONOS_ESTADO_SOLICITUD,
  TONOS_ESTADO_VIAJE,
  type Tono,
} from '@/utilidades/constantes'

const CLASES_TONO: Record<Tono, string> = {
  exito: 'bg-exito-fondo text-exito border-exito/20',
  pendiente: 'bg-pendiente-fondo text-pendiente border-pendiente/20',
  peligro: 'bg-peligro-fondo text-peligro border-peligro/20',
  info: 'bg-info-fondo text-info border-info/20',
  neutro: 'bg-fondo text-texto-secundario border-borde',
}

interface PropiedadesInsignia {
  tono?: Tono
  icono?: ComponentType<LucideProps>
  children: ReactNode
  className?: string
}

export function Insignia({ tono = 'neutro', icono: Icono, children, className = '' }: PropiedadesInsignia) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${CLASES_TONO[tono]} ${className}`}>
      {Icono && <Icono className="size-3" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function InsigniaEstadoViaje({ estado }: { estado: EstadoViaje }) {
  return <Insignia tono={TONOS_ESTADO_VIAJE[estado]}>{ETIQUETAS_ESTADO_VIAJE[estado]}</Insignia>
}

export function InsigniaConIncidencia() {
  return <Insignia tono="peligro" icono={AlertTriangle}>{ETIQUETA_CON_INCIDENCIA}</Insignia>
}

export function InsigniaRetrasado() {
  return <Insignia tono="peligro" icono={Clock}>{ETIQUETA_RETRASADO}</Insignia>
}

export function InsigniaEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  return <Insignia tono={TONOS_ESTADO_SOLICITUD[estado]}>{ETIQUETAS_ESTADO_SOLICITUD[estado]}</Insignia>
}

export function InsigniaEstadoIncidencia({ estado }: { estado: EstadoIncidencia }) {
  return <Insignia tono={TONOS_ESTADO_INCIDENCIA[estado]}>{ETIQUETAS_ESTADO_INCIDENCIA[estado]}</Insignia>
}

export function InsigniaEstadoPago({ estado }: { estado: EstadoPago }) {
  return <Insignia tono={TONOS_ESTADO_PAGO[estado]}>{ETIQUETAS_ESTADO_PAGO[estado]}</Insignia>
}

export function InsigniaEstadoServicio({ estado }: { estado: EstadoServicio }) {
  return <Insignia tono={TONOS_ESTADO_SERVICIO[estado]}>{ETIQUETAS_ESTADO_SERVICIO[estado]}</Insignia>
}

export function InsigniaEstadoFactura({ estado, proximaAVencer = false }: { estado: EstadoFactura; proximaAVencer?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Insignia tono={TONOS_ESTADO_FACTURA[estado]}>{ETIQUETAS_ESTADO_FACTURA[estado]}</Insignia>
      {proximaAVencer && <Insignia tono="pendiente" icono={Clock}>{ETIQUETA_PROXIMA_A_VENCER}</Insignia>}
    </span>
  )
}

export function InsigniaEstadoCatalogo({ estado }: { estado: EstadoCatalogo }) {
  return <Insignia tono={TONOS_ESTADO_CATALOGO[estado]}>{ETIQUETAS_ESTADO_CATALOGO[estado]}</Insignia>
}

export function InsigniaModalidad({ modalidad }: { modalidad: Modalidad }) {
  return <Insignia tono="neutro">{ETIQUETAS_MODALIDAD[modalidad]}</Insignia>
}

export function InsigniaModalidadCobro({ modalidad }: { modalidad: ModalidadCobro }) {
  return <Insignia tono="neutro">{ETIQUETAS_MODALIDAD_COBRO[modalidad]}</Insignia>
}
