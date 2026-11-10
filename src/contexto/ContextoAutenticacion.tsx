import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Perfil, Usuario } from '@/tipos/dominio'
import { borrarSesion, guardarSesion, leerSesion, type Sesion } from '@/servicios/almacenamiento'
import { usarApp } from '@/hooks/usarApp'
import { puede as puedePerfil, type Accion } from '@/utilidades/permisos'

export interface ValorContextoAutenticacion {
  sesion: Sesion | null
  usuario: Usuario | null
  perfil: Perfil | null
  usuariosDelPerfil: Usuario[]
  iniciarSesion: (perfil: Perfil) => void
  cambiarUsuario: (usuarioCodigo: string) => void
  cerrarSesion: () => void
  puede: (accion: Accion) => boolean
}

export const ContextoAutenticacion = createContext<ValorContextoAutenticacion | null>(null)

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const { datos } = usarApp()
  const [sesionGuardada, establecerSesion] = useState<Sesion | null>(leerSesion)

  const usuariosActivos = useMemo(() => datos.usuarios.filter((u) => u.estado === 'activo'), [datos.usuarios])

  const usuario = useMemo(() => {
    if (!sesionGuardada) return null
    const encontrado = usuariosActivos.find((u) => u.codigo === sesionGuardada.usuarioCodigo)
    return encontrado && encontrado.perfil === sesionGuardada.perfil ? encontrado : null
  }, [sesionGuardada, usuariosActivos])

  const sesion = usuario && sesionGuardada ? sesionGuardada : null
  const perfil = sesion?.perfil ?? null

  const usuariosDelPerfil = useMemo(
    () => (perfil ? usuariosActivos.filter((u) => u.perfil === perfil) : []),
    [perfil, usuariosActivos],
  )

  const iniciarSesion = useCallback(
    (perfilElegido: Perfil) => {
      const primero = usuariosActivos.find((u) => u.perfil === perfilElegido)
      if (!primero) return
      const nueva: Sesion = { perfil: perfilElegido, usuarioCodigo: primero.codigo }
      guardarSesion(nueva)
      establecerSesion(nueva)
    },
    [usuariosActivos],
  )

  const cambiarUsuario = useCallback(
    (usuarioCodigo: string) => {
      const elegido = usuariosActivos.find((u) => u.codigo === usuarioCodigo)
      if (!elegido || !sesion || elegido.perfil !== sesion.perfil) return
      const nueva: Sesion = { perfil: elegido.perfil, usuarioCodigo: elegido.codigo }
      guardarSesion(nueva)
      establecerSesion(nueva)
    },
    [usuariosActivos, sesion],
  )

  const cerrarSesion = useCallback(() => {
    borrarSesion()
    establecerSesion(null)
  }, [])

  const puede = useCallback((accion: Accion) => puedePerfil(perfil, accion), [perfil])

  const valor = useMemo<ValorContextoAutenticacion>(
    () => ({ sesion, usuario, perfil, usuariosDelPerfil, iniciarSesion, cambiarUsuario, cerrarSesion, puede }),
    [sesion, usuario, perfil, usuariosDelPerfil, iniciarSesion, cambiarUsuario, cerrarSesion, puede],
  )

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>
}
