import { Anchor } from 'lucide-react'
import { NOMBRE_DESCRIPTIVO, NOMBRE_SISTEMA, SUBTITULO_SISTEMA } from '@/utilidades/constantes'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-barra text-sobre-primario h-14 flex items-center gap-3 px-6">
        <Anchor className="size-5 text-acento" aria-hidden="true" />
        <span className="font-semibold tracking-wide">{NOMBRE_SISTEMA}</span>
        <span className="text-barra-texto-tenue text-sm hidden sm:inline">{NOMBRE_DESCRIPTIVO}</span>
      </header>
      <main className="flex-1 grid place-items-center p-6">
        <section className="bg-superficie border border-borde rounded-lg p-8 max-w-lg w-full">
          <h1 className="text-xl font-semibold text-texto">{NOMBRE_DESCRIPTIVO}</h1>
          <p className="text-texto-secundario text-sm mt-1">{SUBTITULO_SISTEMA}</p>
          <p className="mt-4 text-sm bg-info-fondo text-info rounded-md px-3 py-2">
            Base técnica en construcción. La pantalla de acceso se incorpora en el paso 4 de la Fase 1.
          </p>
          <button
            type="button"
            className="mt-6 bg-primario text-sobre-primario hover:bg-barra-hover rounded-md px-4 py-2 text-sm font-medium"
          >
            Botón principal de referencia
          </button>
        </section>
      </main>
    </div>
  )
}
