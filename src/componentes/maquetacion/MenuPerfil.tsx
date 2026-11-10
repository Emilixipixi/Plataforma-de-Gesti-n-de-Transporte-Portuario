import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, LogOut, UserRound } from 'lucide-react'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarClicFuera } from '@/hooks/usarClicFuera'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { ETIQUETAS_PERFIL } from '@/utilidades/constantes'
import { RUTA_ACCESO } from '@/rutas/definicionRutas'

export function MenuPerfil() {
  const { usuario, perfil, usuariosDelPerfil, cambiarUsuario, cerrarSesion } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const navegar = useNavigate()
  const [abierto, establecerAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const cerrar = useCallback(() => establecerAbierto(false), [])
  usarClicFuera(contenedor, abierto, cerrar)

  if (!usuario || !perfil) return null

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => establecerAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md pl-1.5 pr-2 h-9 text-barra-texto hover:bg-barra-hover hover:text-sobre-primario"
      >
        <span className="grid place-items-center size-7 rounded-full bg-barra-hover border border-barra-borde">
          <UserRound className="size-4" aria-hidden="true" />
        </span>
        <span className="hidden md:block text-left leading-tight">
          <span className="block text-sm text-sobre-primario">{usuario.nombre}</span>
          <span className="block text-[11px] text-barra-texto-tenue">{ETIQUETAS_PERFIL[perfil]}</span>
        </span>
        <ChevronDown className="size-4 hidden md:block" aria-hidden="true" />
      </button>
      {abierto && (
        <div role="menu" className="absolute right-0 mt-2 w-64 z-50 bg-superficie border border-borde rounded-md shadow-lg py-1">
          <div className="px-3 py-2 border-b border-borde">
            <p className="text-sm font-medium text-texto">{usuario.nombre}</p>
            <p className="text-xs text-texto-secundario">{usuario.codigo} · {ETIQUETAS_PERFIL[perfil]}</p>
          </div>
          {usuariosDelPerfil.length > 1 && (
            <div className="py-1 border-b border-borde">
              <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-texto-secundario">Usuario activo</p>
              {usuariosDelPerfil.map((u) => (
                <button
                  key={u.codigo}
                  type="button"
                  role="menuitemradio"
                  aria-checked={u.codigo === usuario.codigo}
                  onClick={() => {
                    if (u.codigo !== usuario.codigo) {
                      cambiarUsuario(u.codigo)
                      notificar('info', 'Usuario cambiado', `Las acciones se registrarán a nombre de ${u.nombre}.`)
                    }
                    cerrar()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-texto hover:bg-fondo text-left"
                >
                  <Check className={`size-4 ${u.codigo === usuario.codigo ? 'text-texto' : 'invisible'}`} aria-hidden="true" />
                  {u.nombre}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              cerrarSesion()
              navegar(RUTA_ACCESO, { replace: true })
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-peligro hover:bg-peligro-fondo text-left"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Salir y cambiar de perfil
          </button>
        </div>
      )}
    </div>
  )
}
