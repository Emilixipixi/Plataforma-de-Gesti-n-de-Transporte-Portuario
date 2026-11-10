import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { SECCIONES_MENU, TITULOS_MENU } from '@/componentes/maquetacion/menu'
import { Logo } from '@/componentes/maquetacion/Logo'
import { ETIQUETAS_PERFIL } from '@/utilidades/constantes'

interface PropiedadesBarraLateral {
  abiertaEnMovil: boolean
  onCerrar: () => void
}

export function BarraLateral({ abiertaEnMovil, onCerrar }: PropiedadesBarraLateral) {
  const { puede, perfil } = usarAutenticacion()
  const { pathname } = useLocation()

  const secciones = SECCIONES_MENU.map((seccion) => ({
    ...seccion,
    elementos: seccion.elementos.filter((e) => e.definicion.acciones.some((accion) => puede(accion))),
  })).filter((seccion) => seccion.elementos.length > 0)

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-barra/60 lg:hidden ${abiertaEnMovil ? 'block' : 'hidden'}`} onClick={onCerrar} aria-hidden="true" />
      <aside
        id="barra-lateral"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-barra flex flex-col transition-transform duration-200 lg:translate-x-0 ${abiertaEnMovil ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menú principal"
      >
        <div className="h-14 flex items-center justify-between gap-2 px-4 border-b border-barra-borde">
          <Logo />
          <button type="button" onClick={onCerrar} className="lg:hidden text-barra-texto hover:text-sobre-primario p-1 rounded" aria-label="Cerrar menú">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="desplazamiento-oscuro flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {secciones.map((seccion) => (
            <div key={seccion.titulo}>
              <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-barra-texto-tenue">{seccion.titulo}</p>
              <ul className="space-y-0.5">
                {seccion.elementos.map(({ definicion, enlace, icono: Icono, prefijoActivo }) => {
                  const activo = pathname === prefijoActivo || pathname.startsWith(`${prefijoActivo}/`)
                  return (
                    <li key={definicion.ruta}>
                      <NavLink
                        to={enlace}
                        onClick={onCerrar}
                        aria-current={activo ? 'page' : undefined}
                        className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          activo ? 'bg-barra-hover text-sobre-primario font-medium' : 'text-barra-texto hover:bg-barra-hover hover:text-sobre-primario'
                        }`}
                      >
                        {activo && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-acento" aria-hidden="true" />}
                        <Icono className={`size-4 shrink-0 ${activo ? 'text-acento' : ''}`} aria-hidden="true" />
                        {TITULOS_MENU[definicion.ruta] ?? definicion.titulo}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-barra-borde text-xs text-barra-texto-tenue">
          <p>Perfil: <span className="text-barra-texto">{perfil ? ETIQUETAS_PERFIL[perfil] : ''}</span></p>
          <p className="mt-0.5">Prototipo demostrativo</p>
        </div>
      </aside>
    </>
  )
}
