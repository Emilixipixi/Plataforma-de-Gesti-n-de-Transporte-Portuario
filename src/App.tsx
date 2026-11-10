import { ProveedorApp } from '@/contexto/ContextoApp'
import { ProveedorAutenticacion } from '@/contexto/ContextoAutenticacion'
import { ProveedorNotificaciones } from '@/contexto/ContextoNotificaciones'
import Enrutador from '@/rutas/Enrutador'

export default function App() {
  return (
    <ProveedorApp>
      <ProveedorAutenticacion>
        <ProveedorNotificaciones>
          <Enrutador />
        </ProveedorNotificaciones>
      </ProveedorAutenticacion>
    </ProveedorApp>
  )
}
