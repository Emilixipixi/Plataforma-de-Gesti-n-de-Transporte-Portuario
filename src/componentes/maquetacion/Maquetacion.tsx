import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarraLateral } from '@/componentes/maquetacion/BarraLateral'
import { Encabezado } from '@/componentes/maquetacion/Encabezado'
import { Migas } from '@/componentes/maquetacion/Migas'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import type { EstadoNavegacionSinPermiso } from '@/rutas/RutaProtegida'
import { explicacionSinPermiso } from '@/utilidades/permisos'

export default function Maquetacion() {
  const [menuAbierto, establecerMenuAbierto] = useState(false)
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const { perfil } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const estado = ubicacion.state as EstadoNavegacionSinPermiso | null

  useEffect(() => {
    if (!estado?.sinPermiso) return
    notificar('advertencia', `Sin acceso a ${estado.sinPermiso}`, explicacionSinPermiso(perfil))
    navegar(`${ubicacion.pathname}${ubicacion.search}`, { replace: true, state: null })
  }, [estado, perfil, notificar, navegar, ubicacion.pathname, ubicacion.search])

  useEffect(() => {
    establecerMenuAbierto(false)
  }, [ubicacion.pathname])

  return (
    <div className="min-h-screen">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:bg-superficie focus:text-texto focus:px-3 focus:py-2 focus:rounded-md">
        Saltar al contenido
      </a>
      <BarraLateral abiertaEnMovil={menuAbierto} onCerrar={() => establecerMenuAbierto(false)} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Encabezado onAbrirMenu={() => establecerMenuAbierto(true)} menuAbierto={menuAbierto} />
        <main id="contenido" className="flex-1 px-4 py-5 sm:px-6 lg:px-8 max-w-[1600px] w-full">
          <Migas />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
