import { useState, type ComponentType } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Calculator, ClipboardList, FileText, Info, Receipt, Route, Truck, type LucideProps } from 'lucide-react'
import type { Perfil } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { Logo } from '@/componentes/maquetacion/Logo'
import { Boton } from '@/componentes/comunes/Boton'
import { Selector } from '@/componentes/formularios/Selector'
import { NOMBRE_DESCRIPTIVO, SUBTITULO_SISTEMA } from '@/utilidades/constantes'
import { RUTA_INICIO } from '@/rutas/definicionRutas'
import type { EstadoNavegacionAcceso } from '@/rutas/RutaProtegida'

interface DescripcionPerfil {
  perfil: Perfil
  titulo: string
  resumen: string
  accesos: string[]
  icono: ComponentType<LucideProps>
}

const PERFILES_ACCESO: readonly DescripcionPerfil[] = [
  {
    perfil: 'operaciones',
    titulo: 'Operaciones',
    resumen: 'Tres usuarios con permisos equivalentes. Uno de ellos realiza el monitoreo.',
    accesos: ['Clientes, solicitudes y programación', 'Viajes, seguimiento por hitos e incidencias', 'Guías, documentos y reportes', 'Catálogos, importación y actividad'],
    icono: Truck,
  },
  {
    perfil: 'contabilidad',
    titulo: 'Contabilidad',
    resumen: 'Acceso restringido. Consulta datos mínimos del viaje y del cliente.',
    accesos: ['Servicios por facturar y agrupación', 'Facturas y servicios agrupados', 'Cartera, vencimientos y alertas', 'Registro y validación de pagos'],
    icono: Calculator,
  },
]

const ALCANCE: readonly { icono: ComponentType<LucideProps>; texto: string }[] = [
  { icono: ClipboardList, texto: 'Solicitudes y programación de transporte' },
  { icono: Route, texto: 'Seguimiento manual por hitos, retrasos e incidencias' },
  { icono: FileText, texto: 'Guías de remisión y reportes para clientes' },
  { icono: Receipt, texto: 'Facturación, pagos y cartera a crédito' },
]

function TarjetaPerfil({ descripcion, onIngresar }: { descripcion: DescripcionPerfil; onIngresar: (perfil: Perfil, usuarioCodigo: string) => void }) {
  const { datos } = usarApp()
  const usuarios = datos.usuarios.filter((u) => u.perfil === descripcion.perfil && u.estado === 'activo')
  const [usuarioCodigo, establecerUsuario] = useState(usuarios[0]?.codigo ?? '')
  const Icono = descripcion.icono

  return (
    <article className="bg-superficie border border-borde rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-md bg-fondo border border-borde">
          <Icono className="size-5 text-texto" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-texto">{descripcion.titulo}</h2>
          <p className="text-xs text-texto-secundario">{descripcion.resumen}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-texto-secundario flex-1">
        {descripcion.accesos.map((acceso) => (
          <li key={acceso} className="flex gap-2">
            <span className="mt-2 size-1.5 rounded-full bg-texto-secundario shrink-0" aria-hidden="true" />
            {acceso}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-3">
        <Selector
          etiqueta="Usuario demostrativo"
          value={usuarioCodigo}
          onChange={(e) => establecerUsuario(e.target.value)}
          opciones={usuarios.map((u) => ({ valor: u.codigo, etiqueta: `${u.nombre} (${u.codigo})` }))}
        />
        <Boton variante="primario" className="w-full" onClick={() => onIngresar(descripcion.perfil, usuarioCodigo)} disabled={!usuarioCodigo}>
          Ingresar como {descripcion.titulo}
        </Boton>
      </div>
    </article>
  )
}

export default function PaginaAcceso() {
  const { sesion, iniciarSesion } = usarAutenticacion()
  const ubicacion = useLocation()
  const estado = ubicacion.state as EstadoNavegacionAcceso | null

  if (sesion) return <Navigate to={estado?.desde ?? RUTA_INICIO} replace />

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="bg-barra text-barra-texto px-6 py-8 sm:px-10 lg:py-12 flex flex-col">
        <Logo />
        <div className="mt-10 lg:mt-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-sobre-primario leading-tight">{NOMBRE_DESCRIPTIVO}</h1>
          <p className="mt-2 text-sm text-barra-texto-tenue">{SUBTITULO_SISTEMA}</p>
          <ul className="mt-8 space-y-3 hidden sm:block">
            {ALCANCE.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm">
                <Icono className="size-4 text-acento shrink-0" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 lg:mt-auto text-xs text-barra-texto-tenue">
          Prototipo demostrativo con datos ficticios. El rastreo GPS continúa en Tracklink y la contabilidad en Contífico.
        </p>
      </aside>
      <main className="bg-fondo px-4 py-8 sm:px-10 lg:py-12 flex flex-col justify-center">
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold text-texto">Seleccione un perfil</h2>
          <p className="text-sm text-texto-secundario mt-1">El perfil define el menú, las rutas y las acciones disponibles.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PERFILES_ACCESO.map((descripcion) => (
              <TarjetaPerfil key={descripcion.perfil} descripcion={descripcion} onIngresar={iniciarSesion} />
            ))}
          </div>
          <div role="note" className="mt-6 flex items-start gap-2 rounded-md bg-info-fondo text-info px-3 py-2.5 text-sm">
            <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              No hay autenticación real. Cliente y transportista no inician sesión: reciben guías y reportes descargables generados por la plataforma.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
