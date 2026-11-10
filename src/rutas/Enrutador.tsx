import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import Maquetacion from '@/componentes/maquetacion/Maquetacion'
import PaginaAcceso from '@/paginas/acceso/PaginaAcceso'
import PaginaNoEncontrada from '@/paginas/PaginaNoEncontrada'
import PaginaPendiente from '@/paginas/PaginaPendiente'
import { RutaProtegida } from '@/rutas/RutaProtegida'
import { CATALOGO_PREDETERMINADO, RUTA_ACCESO, RUTA_INICIO, RUTAS } from '@/rutas/definicionRutas'

const PAGINAS: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  '/dashboard': lazy(() => import('@/paginas/dashboard/PaginaDashboard')),
  '/configuracion': lazy(() => import('@/paginas/configuracion/PaginaConfiguracion')),
  '/clientes': lazy(() => import('@/paginas/clientes/PaginaClientes')),
  '/clientes/nuevo': lazy(() => import('@/paginas/clientes/PaginaFormularioCliente')),
  '/clientes/:codigo': lazy(() => import('@/paginas/clientes/PaginaFichaCliente')),
  '/clientes/:codigo/editar': lazy(() => import('@/paginas/clientes/PaginaFormularioCliente')),
  '/solicitudes': lazy(() => import('@/paginas/solicitudes/PaginaSolicitudes')),
  '/solicitudes/nueva': lazy(() => import('@/paginas/solicitudes/PaginaFormularioSolicitud')),
  '/solicitudes/:codigo/editar': lazy(() => import('@/paginas/solicitudes/PaginaFormularioSolicitud')),
  '/catalogos/:catalogo': lazy(() => import('@/paginas/catalogos/PaginaCatalogos')),
  '/seguimiento': lazy(() => import('@/paginas/seguimiento/PaginaSeguimiento')),
  '/incidencias': lazy(() => import('@/paginas/incidencias/PaginaIncidencias')),
  '/documentos': lazy(() => import('@/paginas/documentos/PaginaDocumentos')),
  '/guias': lazy(() => import('@/paginas/documentos/PaginaGuias')),
  '/reportes': lazy(() => import('@/paginas/reportes/PaginaReportes')),
  '/reportes/cliente': lazy(() => import('@/paginas/reportes/PaginaReporteCliente')),
  '/contabilidad/por-facturar': lazy(() => import('@/paginas/contabilidad/PaginaPorFacturar')),
  '/contabilidad/facturas': lazy(() => import('@/paginas/contabilidad/PaginaFacturas')),
  '/contabilidad/facturas/:codigo': lazy(() => import('@/paginas/contabilidad/PaginaDetalleFactura')),
  '/contabilidad/cartera': lazy(() => import('@/paginas/contabilidad/PaginaCartera')),
  '/contabilidad/pagos': lazy(() => import('@/paginas/contabilidad/PaginaPagos')),
  '/importar': lazy(() => import('@/paginas/importacion/PaginaImportacion')),
  '/actividad': lazy(() => import('@/paginas/actividad/PaginaActividad')),
  '/integraciones': lazy(() => import('@/paginas/integraciones/PaginaIntegraciones')),
  '/programacion': lazy(() => import('@/paginas/programacion/PaginaProgramacion')),
  '/viajes': lazy(() => import('@/paginas/viajes/PaginaViajes')),
  '/viajes/:codigo': lazy(() => import('@/paginas/viajes/PaginaDetalleViaje')),
  '/viajes/nuevo': lazy(() => import('@/paginas/viajes/PaginaFormularioViaje')),
  '/viajes/:codigo/editar': lazy(() => import('@/paginas/viajes/PaginaFormularioViaje')),
}

function Cargando() {
  return (
    <div className="flex items-center gap-2 text-sm text-texto-secundario py-10 justify-center" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      Cargando pantalla
    </div>
  )
}

const rutasInternas: RouteObject[] = RUTAS.map((definicion) => {
  const Pagina = PAGINAS[definicion.ruta] ?? PaginaPendiente
  return {
    path: definicion.ruta.slice(1),
    element: (
      <RutaProtegida acciones={definicion.acciones} titulo={definicion.titulo}>
        <Suspense fallback={<Cargando />}>
          <Pagina />
        </Suspense>
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
