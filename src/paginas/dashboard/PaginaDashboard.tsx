import { lazy, Suspense } from 'react'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'

const DashboardOperativo = lazy(() => import('@/paginas/dashboard/DashboardOperativo'))
const DashboardContable = lazy(() => import('@/paginas/dashboard/DashboardContable'))

export default function PaginaDashboard() {
  const { perfil } = usarAutenticacion()
  return <Suspense fallback={null}>{perfil === 'contabilidad' ? <DashboardContable /> : <DashboardOperativo />}</Suspense>
}
