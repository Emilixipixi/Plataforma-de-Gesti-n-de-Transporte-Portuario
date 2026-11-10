import { Anchor, Calculator, Truck } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Perfil } from '@/tipos/dominio'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { NOMBRE_DESCRIPTIVO, NOMBRE_SISTEMA, SUBTITULO_SISTEMA } from '@/utilidades/constantes'
import { RUTA_INICIO } from '@/rutas/definicionRutas'
import type { EstadoNavegacionAcceso } from '@/rutas/RutaProtegida'

export default function PaginaAcceso() {
  const { sesion, iniciarSesion } = usarAutenticacion()
  const ubicacion = useLocation()
  const estado = ubicacion.state as EstadoNavegacionAcceso | null

  if (sesion) return <Navigate to={estado?.desde ?? RUTA_INICIO} replace />

  const ingresar = (perfil: Perfil) => iniciarSesion(perfil)

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <section className="bg-superficie border border-borde rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-2">
          <Anchor className="size-5 text-texto" aria-hidden="true" />
          <span className="font-semibold tracking-wide">{NOMBRE_SISTEMA}</span>
        </div>
        <h1 className="text-lg font-semibold mt-3">{NOMBRE_DESCRIPTIVO}</h1>
        <p className="text-sm text-texto-secundario">{SUBTITULO_SISTEMA}</p>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={() => ingresar('operaciones')} className="flex items-center justify-center gap-2 bg-primario text-sobre-primario hover:bg-barra-hover rounded-md px-4 py-2.5 text-sm font-medium">
            <Truck className="size-4" aria-hidden="true" />
            Ingresar como Operaciones
          </button>
          <button type="button" onClick={() => ingresar('contabilidad')} className="flex items-center justify-center gap-2 border border-borde hover:bg-fondo rounded-md px-4 py-2.5 text-sm font-medium">
            <Calculator className="size-4" aria-hidden="true" />
            Ingresar como Contabilidad
          </button>
        </div>
        <p className="mt-6 text-xs text-texto-secundario">Prototipo demostrativo. No hay autenticación real ni conexión con sistemas externos.</p>
      </section>
    </main>
  )
}
