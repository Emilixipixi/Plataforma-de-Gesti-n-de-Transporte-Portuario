import { Save } from 'lucide-react'
import { Boton } from '@/componentes/comunes/Boton'

interface PropiedadesPieFormulario {
  onCancelar: () => void
  textoGuardar?: string
  enviando?: boolean
}

export function PieFormulario({ onCancelar, textoGuardar = 'Guardar', enviando = false }: PropiedadesPieFormulario) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-2 border-t border-borde">
      <Boton variante="secundario" onClick={onCancelar}>Cancelar</Boton>
      <Boton variante="primario" type="submit" icono={Save} disabled={enviando}>{textoGuardar}</Boton>
    </div>
  )
}

export function NotaCamposRequeridos() {
  return (
    <p className="text-xs text-texto-secundario mb-4">
      Los campos marcados con <span className="text-peligro">*</span> son obligatorios.
    </p>
  )
}
