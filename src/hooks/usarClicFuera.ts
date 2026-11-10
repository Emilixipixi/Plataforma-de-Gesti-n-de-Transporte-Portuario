import { useEffect, type RefObject } from 'react'

export function usarClicFuera(referencia: RefObject<HTMLElement | null>, activo: boolean, alSalir: () => void): void {
  useEffect(() => {
    if (!activo) return
    const alPulsar = (evento: MouseEvent | TouchEvent) => {
      if (referencia.current && evento.target instanceof Node && !referencia.current.contains(evento.target)) alSalir()
    }
    const alTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alSalir()
    }
    document.addEventListener('mousedown', alPulsar)
    document.addEventListener('touchstart', alPulsar)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', alPulsar)
      document.removeEventListener('touchstart', alPulsar)
      document.removeEventListener('keydown', alTecla)
    }
  }, [referencia, activo, alSalir])
}
