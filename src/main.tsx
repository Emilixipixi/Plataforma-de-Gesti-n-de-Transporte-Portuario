import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/estilos/tema.css'
import App from '@/App'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No se encontró el elemento raíz de la aplicación.')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
