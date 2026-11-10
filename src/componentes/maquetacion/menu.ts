import type { ComponentType } from 'react'
import {
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderOpen,
  History,
  LayoutDashboard,
  Plug,
  Receipt,
  Route,
  Settings,
  TriangleAlert,
  Truck,
  Wallet,
  type LucideProps,
} from 'lucide-react'
import { CATALOGO_PREDETERMINADO, RUTAS, type DefinicionRuta } from '@/rutas/definicionRutas'

export interface ElementoMenu {
  definicion: DefinicionRuta
  enlace: string
  icono: ComponentType<LucideProps>
  prefijoActivo: string
}

export interface SeccionMenu {
  titulo: string
  elementos: ElementoMenu[]
}

function elemento(ruta: string, icono: ComponentType<LucideProps>, enlace = ruta, prefijoActivo = enlace): ElementoMenu {
  const definicion = RUTAS.find((r) => r.ruta === ruta)
  if (!definicion) throw new Error(`Ruta de menú no definida: ${ruta}`)
  return { definicion, enlace, icono, prefijoActivo }
}

export const SECCIONES_MENU: readonly SeccionMenu[] = [
  { titulo: 'Principal', elementos: [elemento('/dashboard', LayoutDashboard)] },
  {
    titulo: 'Operaciones',
    elementos: [
      elemento('/clientes', Building2),
      elemento('/solicitudes', ClipboardList),
      elemento('/viajes', Truck),
      elemento('/programacion', CalendarDays),
      elemento('/seguimiento', Route),
      elemento('/incidencias', TriangleAlert),
    ],
  },
  {
    titulo: 'Documentación',
    elementos: [elemento('/documentos', FolderOpen), elemento('/guias', FileText), elemento('/reportes', BarChart3)],
  },
  {
    titulo: 'Contabilidad',
    elementos: [
      elemento('/contabilidad/por-facturar', Receipt),
      elemento('/contabilidad/facturas', FileSpreadsheet),
      elemento('/contabilidad/cartera', Wallet),
      elemento('/contabilidad/pagos', Banknote),
    ],
  },
  {
    titulo: 'Administración',
    elementos: [
      elemento('/catalogos/:catalogo', BookOpen, `/catalogos/${CATALOGO_PREDETERMINADO}`, '/catalogos'),
      elemento('/importar', FileUp),
      elemento('/actividad', History),
      elemento('/integraciones', Plug),
      elemento('/configuracion', Settings),
    ],
  },
]

export const TITULOS_MENU: Partial<Record<string, string>> = {
  '/reportes': 'Reportes',
}
