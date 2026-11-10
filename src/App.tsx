import { ProveedorApp } from '@/contexto/ContextoApp'
import { ProveedorAutenticacion } from '@/contexto/ContextoAutenticacion'
import Enrutador from '@/rutas/Enrutador'

export default function App() {
  return (
    <ProveedorApp>
      <ProveedorAutenticacion>
        <Enrutador />
      </ProveedorAutenticacion>
    </ProveedorApp>
  )
}
