import { LogOut } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { RUTAS } from '@/rutas/definicionRutas'
import type { EstadoNavegacionSinPermiso } from '@/rutas/RutaProtegida'
import { ETIQUETAS_PERFIL, NOMBRE_SISTEMA } from '@/utilidades/constantes'
import { explicacionSinPermiso } from '@/utilidades/permisos'

export default function Maquetacion() {
  const { usuario, perfil, usuariosDelPerfil, cambiarUsuario, cerrarSesion, puede } = usarAutenticacion()
  const ubicacion = useLocation()
  const estado = ubicacion.state as EstadoNavegacionSinPermiso | null
  const visibles = RUTAS.filter((r) => !r.padre && (!r.ruta.includes(':') || r.ruta === '/catalogos/:catalogo') && r.acciones.some((a) => puede(a)))

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-barra text-sobre-primario min-h-14 flex flex-wrap items-center gap-3 px-4 py-2">
        <span className="font-semibold tracking-wide text-acento">{NOMBRE_SISTEMA}</span>
        <span className="text-barra-texto-tenue text-sm">{perfil ? ETIQUETAS_PERFIL[perfil] : ''}</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="selector-usuario">Usuario activo</label>
          <select id="selector-usuario" value={usuario?.codigo ?? ''} onChange={(e) => cambiarUsuario(e.target.value)} className="bg-barra-hover text-barra-texto border border-barra-borde rounded-md text-sm px-2 py-1">
            {usuariosDelPerfil.map((u) => (
              <option key={u.codigo} value={u.codigo}>{u.nombre}</option>
            ))}
          </select>
          <button type="button" onClick={cerrarSesion} className="flex items-center gap-1 text-sm text-barra-texto hover:text-sobre-primario px-2 py-1">
            <LogOut className="size-4" aria-hidden="true" />
            Salir
          </button>
        </div>
      </header>
      <nav className="bg-superficie border-b border-borde px-4 py-2 flex flex-wrap gap-1" aria-label="Navegación provisional">
        {visibles.map((r) => (
          <NavLink key={r.ruta} to={r.ruta === '/catalogos/:catalogo' ? '/catalogos' : r.ruta} className={({ isActive }) => `text-sm rounded-md px-2 py-1 ${isActive ? 'bg-acento-suave text-texto font-medium' : 'text-texto-secundario hover:bg-fondo'}`}>
            {r.titulo}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-4 sm:p-6">
        {estado?.sinPermiso && (
          <p role="alert" className="mb-4 text-sm bg-pendiente-fondo text-pendiente rounded-md px-3 py-2">
            No tiene acceso a {estado.sinPermiso}. {explicacionSinPermiso(perfil)}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  )
}
