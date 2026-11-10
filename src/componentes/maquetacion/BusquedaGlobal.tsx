import { useMemo, useRef, useState, useCallback, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { usarApp } from '@/hooks/usarApp'
import { usarClicFuera } from '@/hooks/usarClicFuera'
import { buscarViajes, ETIQUETAS_COINCIDENCIA, LONGITUD_MINIMA_BUSQUEDA } from '@/servicios/busqueda'
import { InsigniaEstadoViaje } from '@/componentes/comunes/Insignia'

export function BusquedaGlobal() {
  const { datos } = usarApp()
  const navegar = useNavigate()
  const [consulta, establecerConsulta] = useState('')
  const [abierta, establecerAbierta] = useState(false)
  const [activo, establecerActivo] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)
  const idLista = useId()

  const resultados = useMemo(() => buscarViajes(datos, consulta), [datos, consulta])
  const cerrar = useCallback(() => establecerAbierta(false), [])
  usarClicFuera(contenedor, abierta, cerrar)

  const ir = (codigo: string) => {
    navegar(`/viajes/${codigo}`)
    establecerConsulta('')
    establecerAbierta(false)
  }

  const mostrarLista = abierta && consulta.trim().length >= LONGITUD_MINIMA_BUSQUEDA

  return (
    <div ref={contenedor} className="relative w-full max-w-md">
      <label htmlFor="busqueda-global" className="sr-only">Buscar viaje por código, cliente, contenedor o placa</label>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-barra-texto-tenue" aria-hidden="true" />
      <input
        id="busqueda-global"
        type="search"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={idLista}
        aria-autocomplete="list"
        autoComplete="off"
        value={consulta}
        onChange={(e) => {
          establecerConsulta(e.target.value)
          establecerActivo(0)
          establecerAbierta(true)
        }}
        onFocus={() => establecerAbierta(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            establecerActivo((i) => Math.min(i + 1, resultados.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            establecerActivo((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            const elegido = resultados[activo]
            if (elegido) ir(elegido.viaje.codigo)
          }
        }}
        placeholder="Buscar viaje, cliente, contenedor o placa"
        className="h-9 w-full rounded-md border border-barra-borde bg-barra-hover pl-8 pr-3 text-sm text-sobre-primario placeholder:text-barra-texto-tenue [&::-webkit-search-cancel-button]:hidden"
      />
      {mostrarLista && (
        <div id={idLista} role="listbox" className="absolute left-0 right-0 mt-1 z-50 bg-superficie border border-borde rounded-md shadow-lg overflow-hidden">
          {resultados.length === 0 ? (
            <p className="px-3 py-3 text-sm text-texto-secundario">Sin coincidencias para "{consulta.trim()}".</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {resultados.map((r, indice) => (
                <li key={r.viaje.codigo} role="option" aria-selected={indice === activo}>
                  <button
                    type="button"
                    onMouseEnter={() => establecerActivo(indice)}
                    onClick={() => ir(r.viaje.codigo)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-3 ${indice === activo ? 'bg-fondo' : ''}`}
                  >
                    <span className="font-mono text-sm font-semibold text-texto w-16 shrink-0">{r.viaje.codigo}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-texto truncate">{r.cliente}</span>
                      <span className="block text-xs text-texto-secundario truncate">{ETIQUETAS_COINCIDENCIA[r.tipo]}: {r.detalle}</span>
                    </span>
                    <InsigniaEstadoViaje estado={r.viaje.estado} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
