# PORTFLOW — Informe de validación final (Fase 8)

Fecha de ejecución: 10/11/2026. Compilación de producción (`npm run build`) servida con `vite preview` y recorrida con un navegador automatizado (Chromium) sobre datos demostrativos recién restablecidos en cada prueba.

Resultado: **todos los recorridos y criterios se cumplen; sin errores de consola en ninguna prueba.** `tsc --noEmit` y `npm run build` sin errores.

## Recorridos de demostración

| ID | Recorrido | Evidencia | Resultado |
|---|---|---|---|
| F-01 | Importación contenedorizada | Cliente nuevo CLI-007 → solicitud SOL-011 → aceptación y conversión a IMP-012 → asignación (Programado) → salida, llegada, descarga, entrega (Entregado / pendiente devolución), devolución → cierre. Historial: solicitado > programado > en ejecución > pendiente devolución > finalizado; ruta origen, destino, devolución | Correcto |
| F-02 | Importación de carga suelta | SOL-012 → IMP-013 → cuatro hitos sin devolución → cierre. Historial sin estado de pendiente de devolución | Correcto |
| F-03 | Exportación | EXP-001: entrega en puerto y cierre; ruta con paso por planta | Correcto |
| F-04 | Incidencias y retraso | IMP-004: finalización bloqueada por falta de entrega; aviso por incidencia abierta; cierre solo con observación documentada; IMP-002 con retraso de +1 h 15 min explicado en el reporte | Correcto |
| F-05 | Reporte para cliente | Semana actual de CLI-002 con servicios, en ruta, entregas a tiempo y cumplimiento; versión compartible sin valores; PDF descargado | Correcto |
| F-06 | Guía de remisión | GR-DEMO-0010, versión 2 de IMP-005: campos precargados, validación de placa, vista previa, PDF con la leyenda demostrativa | Correcto |
| F-07 | Facturación y crédito | IMP-003 cerrado por Operaciones aparece por facturar junto a IMP-008 → FAC-005 por $1,230.00 → abono de $500 validado (saldo $730) → cancelación validada → Cobrado | Correcto |
| F-08 | Consolidación desde Excel | Muestra de viajes descargada y cargada → vista previa → mapeo automático → validación (3 válidas, 3 con errores señalados) → IMP-012, IMP-013 y EXP-004 en Viajes y Programación | Correcto |

## Criterios de aceptación

| ID | Criterio | Evidencia | Resultado |
|---|---|---|---|
| CA-01 | Volver sin perder contexto | Dashboard → viajes en ejecución → detalle → Volver conserva `?estado=en_ejecucion`; listado filtrado y ordenado se conserva al volver | Cumple |
| CA-02 | Viajes simultáneos de un cliente | CLI-002 con EXP-001, IMP-003 e IMP-008 independientes; cliente nuevo con IMP-012 e IMP-013 | Cumple |
| CA-03 | Contenedorizada exige devolución | IMP-012 queda en Entregado / pendiente devolución hasta registrar la devolución | Cumple |
| CA-04 | Suelta sin devolución; exportación en puerto | IMP-013 cierra tras la entrega; EXP-001 cierra con la entrega en puerto | Cumple |
| CA-05 | Estado y eventos con hora y responsable | Cada evento registra hora real y responsable, actualiza el estado y la línea de tiempo | Cumple |
| CA-06 | Incidencia en ficha y reportes | INC-001 de IMP-002 en la pestaña Incidencias y en la explicación de retraso del reporte | Cumple |
| CA-07 | Indicador a tiempo o retrasado | Calculado contra el compromiso; coincide en dashboard, detalle y reportes | Cumple |
| CA-08 | Guía del mismo viaje, vista previa y descarga | GR-DEMO-0010 prellenada desde IMP-005, vista previa y PDF | Cumple |
| CA-09 | Reporte semanal coherente | Indicadores de CLI-002 coinciden con sus viajes de la semana | Cumple |
| CA-10 | Filtros que cambian cifras | Dashboard, reportes, solicitudes, programación e incidencias; filtros en la URL | Cumple |
| CA-11 | Contabilidad restringida | Contabilidad redirigida al intentar editar viajes, importar, ver actividad o configuración; Operaciones redirigida desde cartera | Cumple |
| CA-12 | Finalizados por facturar y agrupables | IMP-012 e IMP-013 aparecen en la bandeja contable al cerrarse | Cumple |
| CA-13 | Abono parcial y saldo cero | Saldo baja solo al validar; con saldo cero la factura pasa a Cobrado | Cumple |
| CA-14 | Sin anticipo obligatorio | Viajes programados y ejecutados con cobro contra factura o a crédito | Cumple |
| CA-15 | Integraciones futuras | Contífico y Tracklink con estado Pendiente de integración y Sin sincronizar; botones deshabilitados | Cumple |
| CA-16 | Importación con mapeo y vista previa | Vista previa, mapeo editable, bloqueo si falta un campo obligatorio, errores por fila | Cumple |
| CA-17 | Navegación adaptable | 35 pantallas de ambos perfiles sin desplazamiento horizontal a 390 px (teléfono), 820 px (tableta) y 1280 px (escritorio); menú lateral desplegable en teléfono | Cumple |

## Validaciones de reglas y errores

- Formularios: campos obligatorios, RUC o cédula, correo, placa ABC-1234, contenedor de 4 letras y 7 dígitos, fechas coherentes, motivo obligatorio para cambios de programación.
- Contabilidad: referencia de factura y de pago única, pago mayor al saldo rechazado, máximo dos decimales, alerta de vencimiento entre 1 y 30 días.
- Importación: archivo que no es Excel rechazado; correo inválido, identificación repetida, razón social faltante, contenedor mal escrito, cliente inexistente y llegada anterior a la salida señalados por fila.
- Actividad: cada acción (creación, conversión, asignación, eventos, cierre, factura, pagos, validaciones, importación, cambio de parámetros) queda registrada con usuario, fecha y hora.

## Revisión de convenciones

Sin emojis, sin comentarios en línea, sin colores escritos a mano en componentes, sin `any`, sin acceso a `localStorage` fuera de `servicios/`, códigos IMP-xxx y EXP-xxx en todas las vistas.

## Correcciones de la fase

- Resumen de Reportes operativos desbordaba horizontalmente a 820 px: la cuadrícula ahora fija una columna en anchos medianos.

## Observaciones para la presentación

- Restablecer los datos demostrativos antes de presentar para que las fechas coincidan con el día.
- Dependencia xlsx 0.18.5 con avisos de seguridad conocidos, aceptada para el prototipo local (ver README).
