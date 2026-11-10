import { Link } from 'react-router-dom'
import { Menu, Settings } from 'lucide-react'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { BusquedaGlobal } from '@/componentes/maquetacion/BusquedaGlobal'
import { PanelNotificaciones } from '@/componentes/maquetacion/PanelNotificaciones'
import { MenuPerfil } from '@/componentes/maquetacion/MenuPerfil'
import { Logo } from '@/componentes/maquetacion/Logo'

export function Encabezado({ onAbrirMenu, menuAbierto }: { onAbrirMenu: () => void; menuAbierto: boolean }) {
  const { puede } = usarAutenticacion()
  return (
    <header className="sticky top-0 z-20 h-14 bg-barra border-b border-barra-borde flex items-center gap-2 sm:gap-3 px-3 sm:px-5">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-controls="barra-lateral"
        aria-expanded={menuAbierto}
        className="lg:hidden grid place-items-center size-9 rounded-md text-barra-texto hover:bg-barra-hover hover:text-sobre-primario"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <div className="lg:hidden hidden sm:block">
        <Logo compacto />
      </div>
      {puede('viajes.ver') && (
        <div className="flex-1 min-w-0 flex">
          <BusquedaGlobal />
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">
        <PanelNotificaciones />
        {puede('configuracion.ver') && (
          <Link to="/configuracion" aria-label="Configuración" title="Configuración" className="grid place-items-center size-9 rounded-md text-barra-texto hover:bg-barra-hover hover:text-sobre-primario">
            <Settings className="size-4.5" aria-hidden="true" />
          </Link>
        )}
        <MenuPerfil />
      </div>
    </header>
  )
}
