import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

export function AvisoDemostrativo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div role="note" className={`flex items-start gap-2 rounded-md bg-info-fondo text-info px-3 py-2 text-sm ${className}`}>
      <Info className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
