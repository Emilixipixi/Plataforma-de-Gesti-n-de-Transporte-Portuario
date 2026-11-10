import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface PropiedadesBase {
  etiqueta: string
  error?: string
  ayuda?: string
  requerido?: boolean
  className?: string
}

function Etiqueta({ id, etiqueta, requerido }: { id: string; etiqueta: string; requerido?: boolean }) {
  return (
    <label htmlFor={id} className="text-xs font-medium text-texto-secundario">
      {etiqueta}
      {requerido && <span className="text-peligro" aria-hidden="true"> *</span>}
    </label>
  )
}

function Mensajes({ id, error, ayuda }: { id: string; error?: string; ayuda?: string }) {
  if (error) return <p id={`${id}-mensaje`} className="text-xs text-peligro">{error}</p>
  if (ayuda) return <p id={`${id}-mensaje`} className="text-xs text-texto-secundario">{ayuda}</p>
  return null
}

const claseControl = (error?: string) =>
  `w-full rounded-md border bg-superficie px-3 text-sm text-texto placeholder:text-texto-secundario/70 disabled:bg-fondo disabled:text-texto-secundario ${error ? 'border-peligro' : 'border-borde'}`

type PropiedadesCampoTexto = PropiedadesBase & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export const CampoTexto = forwardRef<HTMLInputElement, PropiedadesCampoTexto>(function CampoTexto(
  { etiqueta, error, ayuda, requerido, className = '', id, ...resto },
  referencia,
) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Etiqueta id={idCampo} etiqueta={etiqueta} requerido={requerido} />
      <input
        ref={referencia}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-required={requerido || undefined}
        aria-describedby={error || ayuda ? `${idCampo}-mensaje` : undefined}
        className={`h-9 ${claseControl(error)}`}
        {...resto}
      />
      <Mensajes id={idCampo} error={error} ayuda={ayuda} />
    </div>
  )
})

type PropiedadesAreaTexto = PropiedadesBase & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export const AreaTexto = forwardRef<HTMLTextAreaElement, PropiedadesAreaTexto>(function AreaTexto(
  { etiqueta, error, ayuda, requerido, className = '', id, rows = 3, ...resto },
  referencia,
) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Etiqueta id={idCampo} etiqueta={etiqueta} requerido={requerido} />
      <textarea
        ref={referencia}
        id={idCampo}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-required={requerido || undefined}
        aria-describedby={error || ayuda ? `${idCampo}-mensaje` : undefined}
        className={`py-2 ${claseControl(error)}`}
        {...resto}
      />
      <Mensajes id={idCampo} error={error} ayuda={ayuda} />
    </div>
  )
})
