import type { ReactNode } from 'react'
import { Boton } from '@/componentes/comunes/Boton'
import { Modal } from '@/componentes/modales/Modal'

interface PropiedadesModalConfirmacion {
  abierto: boolean
  titulo: string
  mensaje: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  peligroso?: boolean
  confirmacionDeshabilitada?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  confirmacionDeshabilitada = false,
  onConfirmar,
  onCancelar,
}: PropiedadesModalConfirmacion) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCancelar}
      ancho="pequeno"
      pie={
        <>
          <Boton variante="secundario" onClick={onCancelar}>{textoCancelar}</Boton>
          <Boton variante={peligroso ? 'peligro' : 'primario'} onClick={onConfirmar} disabled={confirmacionDeshabilitada}>
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <div className="text-texto-secundario">{mensaje}</div>
    </Modal>
  )
}
