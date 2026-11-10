import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router-dom'
import Maquetacion from '@/componentes/maquetacion/Maquetacion'
import PaginaAcceso from '@/paginas/acceso/PaginaAcceso'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import PaginaPendiente from '@/paginas/PaginaPendiente'
import { RutaProtegida } from '@/rutas/RutaProtegida'
import { CATALOGO_PREDETERMINADO, RUTA_ACCESO, RUTA_INICIO, RUTAS } from '@/rutas/definicionRutas'

const PAGINAS: Partial<Record<string, ComponentType>> = {}

const rutasInternas: RouteObject[] = RUTAS.map((definicion) => {
  const Pagina = PAGINAS[definicion.ruta] ?? PaginaPendiente
  return {
    path: definicion.ruta.slice(1),
    element: (
      <RutaProtegida acciones={definicion.acciones} titulo={definicion.titulo}>
        <Pagina />
      </RutaProtegida>
    ),
  }
})

const enrutador = createBrowserRouter([
  { path: RUTA_ACCESO, element: <PaginaAcceso /> },
  {
    path: '/',
    element: (
      <RutaProtegida>
        <Maquetacion />
      </RutaProtegida>
    ),
    children: [
      { index: true, element: <Navigate to={RUTA_INICIO} replace /> },
      { path: 'catalogos', element: <Navigate to={`/catalogos/${CATALOGO_PREDETERMINADO}`} replace /> },
      ...rutasInternas,
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
])

export default function Enrutador() {
  return <RouterProvider router={enrutador} />
}
