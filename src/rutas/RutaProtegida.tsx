import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import type { Accion } from '@/utilidades/permisos'
import { RUTA_ACCESO, RUTA_INICIO } from '@/rutas/definicionRutas'

export interface EstadoNavegacionAcceso {
  desde?: string
}

export interface EstadoNavegacionSinPermiso {
  sinPermiso?: string
}

interface PropiedadesRutaProtegida {
  children: ReactNode
  acciones?: readonly Accion[]
  titulo?: string
}

export function RutaProtegida({ children, acciones, titulo }: PropiedadesRutaProtegida) {
  const { sesion, puede } = usarAutenticacion()
  const ubicacion = useLocation()

  if (!sesion) {
    const estado: EstadoNavegacionAcceso = { desde: `${ubicacion.pathname}${ubicacion.search}` }
    return <Navigate to={RUTA_ACCESO} replace state={estado} />
  }

  if (acciones && acciones.length > 0 && !acciones.some((accion) => puede(accion))) {
    const estado: EstadoNavegacionSinPermiso = { sinPermiso: titulo ?? ubicacion.pathname }
    return <Navigate to={RUTA_INICIO} replace state={estado} />
  }

  return <>{children}</>
}
