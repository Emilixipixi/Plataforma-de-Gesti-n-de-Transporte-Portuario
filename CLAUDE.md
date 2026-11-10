# PORTFLOW — Instrucciones para Claude Code

Prototipo web de Gestión de Transporte Portuario. React + Vite + TypeScript estricto + Tailwind CSS v4.

## Documentos de referencia (leer antes de trabajar)

- `docs/requerimientos.md`: fuente principal de requerimientos.
- `docs/FASE-0_Analisis_y_Arquitectura.md`: arquitectura, tipos, estados, rutas, permisos y datos.
- `docs/TRAZABILIDAD.md`: matriz RF, RN, CA, F y P. Actualizar al cerrar cada fase.
- `PROMPT_MAESTRO_PORTFLOW_v3.md`: instrucciones completas del proyecto y plan de fases.

## Convenciones

- Nombres en español: variables, funciones, tipos, componentes, archivos y mensajes.
- Sin comentarios en línea en el código.
- Sin emojis en ninguna parte; usar iconos de Lucide.
- Colores solo mediante las utilidades del tema (`bg-barra`, `text-acento`, etc.); la mostaza es solo acento, nunca texto sobre fondo claro ni relleno de botones principales.
- Los componentes no acceden a `localStorage`; todo pasa por `servicios/`.
- El código de viaje es `IMP-xxx` o `EXP-xxx`; no existe `VIA-`.

## Modo de trabajo

- Una fase a la vez, en pasos pequeños; confirmar al cerrar cada paso y detenerse al terminar la fase hasta recibir aprobación.
- Cada fase debe terminar con `tsc --noEmit` y `npm run build` sin errores.
- Entregar al cierre de fase: resumen, archivos modificados, requisitos cubiertos, cómo probarlo, limitaciones y siguiente fase.
- No implementar nada fuera del alcance del prototipo (GPS, integraciones reales, facturación electrónica, backend).
