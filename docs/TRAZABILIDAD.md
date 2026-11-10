# PORTFLOW — Matriz de trazabilidad

Versión final, al cierre de la Fase 8. La columna Fase indica cuándo quedó completo cada elemento. "Demostrativo" significa que la función existe en el prototipo con datos o archivos ilustrativos (sin contenido real ni integración). La evidencia de la validación está en docs/VALIDACION.md.

Valores de estado: Pendiente, Implementado, Parcial, Demostrativo.

## Requerimientos funcionales

| ID | Requerimiento | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| RF-01 | Ficha de cliente | 2 | P-03: PaginaFormularioCliente, PaginaFichaCliente, operaciones/clientes | Implementado |
| RF-02 | Consulta de clientes y operaciones asociadas | 2 | P-03: búsqueda por nombre, código e identificación; ficha con solicitudes, viajes, servicios y documentos | Implementado |
| RF-03 | Requerimiento de transporte por cliente | 2 | P-04: PaginaFormularioSolicitud, operaciones/solicitudes | Implementado |
| RF-04 | Varias solicitudes y viajes abiertos por cliente | 3 | P-03, P-05, P-06 y P-08; cada viaje con código, bitácora y documentos propios | Implementado |
| RF-05 | Fecha requerida, origen, destino, indicaciones | 2 | P-04 | Implementado |
| RF-06 | Convertir solicitud aceptada en operación | 2 | operaciones/solicitudes.convertirSolicitud, ModalConversionSolicitud | Implementado |
| RF-07 | Bandeja de solicitudes con filtros | 2 | P-05: filtros por cliente, fecha, tipo y estado en la URL | Implementado |
| RF-08 | Catálogos de transportistas, choferes y unidades | 2 | P-17: PanelCatalogo, operaciones/catalogos | Implementado |
| RF-09 | Tipo de carga y contenedor | 3 | P-07: carga según modalidad, tipo de carga del catálogo, tipo y número de contenedor validado | Implementado |
| RF-10 | Asignar transportista, chofer, vehículo y ruta | 3 | P-07: recursos filtrados por transportista y ruta de puntos (origen, paradas, destino, devolución); operaciones/viajes.guardarViaje | Implementado |
| RF-11 | Fechas previstas de salida, llegada y cierre | 3 | P-07 con validación de orden de fechas | Implementado |
| RF-12 | Programación en lista o calendario y pendientes de asignación | 3 | P-06: lista, calendario mensual y semanal propio, panel de pendientes de asignación | Implementado |
| RF-13 | Aviso de solapamiento de unidad o chofer | 3 | calculos/hayAdvertenciaSolapamiento: aviso en vivo en P-07, notificación al guardar, marca en P-06 y P-08; no bloquea | Implementado |
| RF-14 | Modificar programación con motivo y fecha | 3 | operaciones/viajes.guardarViaje: motivo obligatorio en viajes programados; ajustes con valor anterior y nuevo en P-08 y Actividad | Implementado |
| RF-15 | Viaje de importación contenedorizada | 3 | P-07 exige depósito de devolución; P-08 | Implementado |
| RF-16 | Viaje de importación de carga suelta | 3 | P-07 sin contenedor ni devolución; P-08 | Implementado |
| RF-17 | Viaje de exportación | 3 | P-07 exige paso por cliente o planta y entrega en puerto; P-08 | Implementado |
| RF-18 | Secuencia de etapas por modalidad | 3 | componentes/viajes/LineaTiempo en P-08 y panel de secuencias en P-17 | Implementado |
| RF-19 | Etapa con ubicación, evento y horas prevista y real | 4 | ModalEvento (P-10) y LineaTiempo (P-09, P-08) | Implementado |
| RF-20 | Distinguir en ejecución, pendiente de devolución y cerrado | 4 | Estados automáticos por hito; insignias en P-02, P-06, P-08, P-09 | Implementado |
| RF-21 | Detalle de operación | 3 | P-08: encabezado, resumen, pestañas Resumen, Seguimiento, Incidencias, Documentos, Reportes e Información administrativa | Implementado |
| RF-22 | Eventos manuales en línea de tiempo | 4 | operaciones/seguimiento.registrarEvento; P-08 y P-09 | Implementado |
| RF-23 | Hitos predefinidos adaptados a la modalidad | 4 | Secuencia por modalidad obligatoria en orden; eventos adicionales del catálogo | Implementado |
| RF-24 | Paradas, esperas, demoras, incidentes y cambios de ruta | 4 | ModalIncidencia con los tipos del catálogo; P-10 | Implementado |
| RF-25 | Evidencias en eventos e incidencias | 4 | CampoEvidencias (nombre y tipo de archivo ilustrativo) | Demostrativo |
| RF-26 | Estado actual, último evento y responsable | 4 | P-08: tarjeta de último evento con responsable | Implementado |
| RF-27 | Hora estimada contra real y desvío | 4 | calculos/desvioEnMinutos; vista previa en el formulario y por hito en la línea de tiempo | Implementado |
| RF-28 | Indicador de entrega a tiempo | 4 | P-08 (tarjeta de llegada), P-09 (desvío por hito), P-02 (cumplimiento) | Implementado |
| RF-29 | Resaltar detenidas, retrasadas o con novedad | 4 | P-02, P-06, P-08, P-09, P-10 y listado de Viajes | Implementado |
| RF-30 | Cerrar incidencias con acción correctiva | 4 | operaciones/seguimiento.resolverIncidencia; ModalResolucion | Implementado |
| RF-31 | Historial de cambios de estado | 4 | P-08, pestaña Información administrativa | Implementado |
| RF-32 | Vista previa de guía de remisión | 5 | VistaGuia y ModalGenerarGuia con vista previa en vivo (P-11, P-08) | Implementado |
| RF-33 | Descarga de guía imprimible | 5 | Impresión con hoja de estilos de impresión y PDF con jsPDF (servicios/documentosPdf) | Demostrativo |
| RF-34 | Guías asociadas al viaje con fecha de generación | 5 | Versiones por viaje con número, fecha y generador; vigente e histórica en /guias y P-08 | Implementado |
| RF-35 | Otros documentos con tipo | 5 | ModalAdjuntarDocumento; /documentos con filtros por tipo y cliente | Demostrativo |
| RF-36 | Paquete documental del viaje | 5 | PDF con índice, reporte compartible y guía vigente (descargarPaqueteDocumental) | Demostrativo |
| RF-37 | Panel con servicios del día, en ruta, entregados, retrasados y pendientes de cierre | 4 | P-02: nueve indicadores calculados | Implementado |
| RF-38 | Filtros de indicadores | 4 | P-02 y P-12: rango de fechas, cliente, modalidad, transportista y estado en la URL | Implementado |
| RF-39 | Reporte por viaje | 5 | ReporteViaje: etapas, marcas horarias, novedades y cumplimiento (P-08 y P-12) | Implementado |
| RF-40 | Reporte semanal y mensual por cliente | 5 | P-13 PaginaReporteCliente con navegación por semana o mes | Implementado |
| RF-41 | Previsto contra efectivo y observaciones de retraso | 5 | Desvío por etapa y observación de retraso generada desde incidencias y comentarios | Implementado |
| RF-42 | Exportación a PDF y Excel | 5 | servicios/exportacion: PDF (jsPDF) y Excel (SheetJS) con los datos filtrados | Demostrativo |
| RF-43 | Vista interna y versión para el cliente | 5 | SelectorVersion en P-08, P-12 y P-13 | Implementado |
| RF-44 | Operaciones finalizadas elegibles para facturar | 6 | servicios/contabilidad.serviciosPorFacturar; P-14, P-02 contable y notificaciones | Implementado |
| RF-45 | Bandeja restringida para Contabilidad | 6 | P-14: cliente, viaje, fecha de cierre, servicio, antigüedad y valor; solo perfil Contabilidad | Implementado |
| RF-46 | Agrupar servicios de un cliente | 6 | P-14 (vista por cliente con selección) y ModalRegistrarFactura; operaciones/registrarFactura rechaza viajes de otro cliente | Implementado |
| RF-47 | Registrar referencia, fecha y valor de factura | 6 | P-15 y detalle de factura; referencia única, sin emisión fiscal | Implementado |
| RF-48 | Contra factura y a crédito, sin anticipo | 6 | Modalidad de cobro en P-07, P-08 y la factura; vencimiento sugerido por modalidad | Implementado |
| RF-49 | Vencimiento, saldo y estado de cartera | 6 | P-15, detalle de factura y P-16 Cartera: saldo, días para vencer, antigüedad y estado calculado | Implementado |
| RF-50 | Abonos, pagos parciales y cancelación total | 6 | P-16 Pagos y detalle de factura; operaciones/registrarPago y validarPago | Implementado |
| RF-51 | Alertas de cartera próxima a vencer o vencida | 6 | Insignias en P-15 y P-16, indicadores del dashboard contable y notificaciones | Implementado |
| RF-52 | Consulta futura de cartera desde Contífico y estado de sincronización | 7 | P-20 Integraciones (pendiente de integración, sin sincronizar) y panel en P-16 Cartera | Demostrativo |
| RF-53 | Catálogos editables | 2 | P-17: listar, buscar, crear, editar, activar y desactivar en 7 catálogos; clientes en P-03 | Implementado |
| RF-54 | Identificador de viaje único en todas las vistas | 1 | calculos/siguienteCodigo, generadorDatos (IMP-xxx / EXP-xxx) | Implementado |
| RF-55 | Búsqueda global por código, cliente, contenedor o placa | 3 | maquetacion/BusquedaGlobal, servicios/busqueda; navega a P-08 | Implementado |
| RF-56 | Importación desde Excel con vista previa | 7 | P-18: archivo o muestra, vista previa, identificación y mapeo de columnas, validación por fila, confirmación y resultado (servicios/importacion, operaciones/importacion) | Implementado |
| RF-57 | Registro de actividad | 7 | servicios/actividad y ContextoApp.aplicar; P-19 con filtros por usuario, acción, entidad y fechas, y exportación a Excel | Implementado |
| RF-58 | Menú diferenciado por perfil | 1 | maquetacion/BarraLateral y menu, utilidades/permisos, rutas/RutaProtegida | Implementado |

## Reglas de negocio

| ID | Regla | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| RN-01 | El viaje es la unidad central | 3 | Viaje vinculado a solicitud y cliente; P-08 concentra carga, ruta, recursos, seguimiento, incidencias y documentos | Implementado |
| RN-02 | Varias operaciones por cliente sin mezclar bitácoras | 3 | Eventos, incidencias y documentos filtrados por viajeCodigo en P-08 | Implementado |
| RN-03 | Contenedorizada se cierra tras la devolución | 4 | calculos/puedeFinalizar y finalizarViaje | Implementado |
| RN-04 | Carga suelta se cierra con la entrega confirmada | 4 | calculos/puedeFinalizar y finalizarViaje | Implementado |
| RN-05 | Exportación se cierra con entrega en puerto | 4 | calculos/puedeFinalizar y finalizarViaje | Implementado |
| RN-06 | Monitoreo manual, sin GPS | 4 | P-09 con aviso explícito; registro manual de hitos; Tracklink en Fase 7 | Implementado |
| RN-07 | Evento con fecha, hora, responsable y detalle, en orden cronológico | 4 | registrarEvento guarda hora real, responsable y comentario; LineaTiempo en orden | Implementado |
| RN-08 | Retraso contra compromiso registrado | 4 | calculos/estaRetrasado y desvioEnMinutos contra horas previstas del viaje | Implementado |
| RN-09 | La incidencia no bloquea el cierre; debe resolverse o documentarse | 4 | ModalFinalizar exige observación con incidencias abiertas | Implementado |
| RN-10 | Contabilidad recibe servicios elegibles y los agrupa por cliente | 6 | P-14 | Implementado |
| RN-11 | Pago contra factura o crédito, sin validar anticipo | 6 | P-07, P-08 y factura: modalidad de cobro y anticipo no requerido | Implementado |
| RN-12 | Pago parcial reduce saldo; cobrado solo con saldo cero | 6 | Solo los pagos validados reducen el saldo; la factura pasa a Cobrado con saldo cero | Implementado |
| RN-13 | Cartera y pagos fuera de reportes compartibles | 5 | La versión para el cliente excluye valores, facturación, cartera, pagos, responsables y observaciones internas | Implementado |
| RN-14 | Mismo código de viaje y cliente en documentos y reportes | 5 | Guía, paquete, reportes y Excel usan el código IMP o EXP y el cliente del viaje | Implementado |
| RN-15 | Guía demostrativa, no tributaria | 5 | Leyenda en la vista previa, la impresión, el PDF y la pantalla de guías | Implementado |

## Criterios de aceptación

| ID | Criterio | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| CA-01 | Navegar del panel a un viaje y volver sin perder contexto | 3 | Filtros, orden, página, vista y pestaña en la URL; botón Volver con el historial | Implementado |
| CA-02 | Cliente con al menos dos viajes simultáneos independientes | 3 | CLI-002 con IMP-003 y EXP-001 abiertos, cada uno con su línea de tiempo en P-08 | Implementado |
| CA-03 | Importación contenedorizada exige devolución | 4 | Secuencia y cierre bloqueado sin devolución | Implementado |
| CA-04 | Carga suelta sin devolución; exportación finaliza en puerto | 4 | Secuencias por modalidad y puedeFinalizar | Implementado |
| CA-05 | Actualizar estado y eventos con hora y responsable | 4 | P-08 y P-09: registro de eventos con cambio de estado automático | Implementado |
| CA-06 | Incidencia en la ficha y en los reportes | 5 | P-08 (pestaña Incidencias) y reportes por viaje, operativos y por cliente | Implementado |
| CA-07 | Indicador a tiempo o retrasado acorde a las fechas | 4 | Desvío por hito y en tarjetas; IMP-001 a tiempo, IMP-002 con retraso | Implementado |
| CA-08 | Guía con datos del mismo viaje, previsualizable y descargable | 5 | P-11 y P-08 | Implementado |
| CA-09 | Reporte semanal coherente con los viajes de muestra | 5 | P-13 calculado desde los viajes del periodo | Implementado |
| CA-10 | Filtros por fecha, cliente y modalidad modifican listados y cifras | 4 | P-02, P-05, P-06, P-10, P-12, P-13 y Viajes | Implementado |
| CA-11 | Contabilidad sin edición logística | 6 | permisos: accede a por facturar, facturas, cartera y pagos; viajes en consulta; Operaciones sin acceso contable | Implementado |
| CA-12 | Viaje finalizado en la bandeja contable y agrupable | 6 | P-14: IMP-003 cerrado por Operaciones se agrupa con IMP-008 | Implementado |
| CA-13 | Abono parcial reduce saldo; saldo cero pasa a cobrado | 6 | Detalle de factura y P-16 | Implementado |
| CA-14 | Viaje sin pago anticipado, contra factura o a crédito | 6 | P-07 y factura con cualquiera de las dos modalidades | Implementado |
| CA-15 | Contífico y Tracklink como integraciones futuras | 7 | P-20: estado Pendiente de integración, sin sincronizar, botones deshabilitados | Implementado |
| CA-16 | Importación desde Excel con mapeo y vista previa | 7 | P-18 | Implementado |
| CA-17 | Navegación adaptativa en escritorio y teléfono | 8 | Menú lateral desplegable, columnas por ancho, sin desplazamiento horizontal en 35 pantallas a 390, 820 y 1280 px | Implementado |

## Recorridos de demostración

| ID | Recorrido | Fase en que queda completo | Pantallas | Estado |
|---|---|---|---|---|
| F-01 | Importación contenedorizada | 4 | P-03 a P-10: cliente, solicitud, programación, asignación con contenedor, hitos, devolución y cierre | Implementado |
| F-02 | Importación de carga suelta | 4 | P-04 a P-10: solicitud, programación, hitos de entrega y cierre sin devolución | Implementado |
| F-03 | Exportación | 4 | P-04 a P-10: retiro de contenedor, paso por cliente o planta, entrega en puerto y cierre | Implementado |
| F-04 | Incidencia y retraso | 5 | P-08 a P-10 y reporte del viaje con la incidencia y la observación de retraso | Implementado |
| F-05 | Reporte para cliente | 5 | P-13: cliente y semana, entregados, en ruta y a tiempo, vista compartible y descarga | Implementado |
| F-06 | Guía de remisión | 5 | P-08 o P-11: completar campos, vista previa, impresión y descarga | Implementado |
| F-07 | Facturación y crédito | 6 | P-14 a P-16: cierre, agrupación, factura, abono, validación y cancelación del saldo | Implementado |
| F-08 | Consolidación desde Excel | 7 | P-18: muestra de viajes, mapeo, vista previa, confirmación; los viajes aparecen en Viajes y Programación | Implementado |

## Pantallas

| ID | Pantalla | Fase | Estado |
|---|---|---|---|
| P-01 | Acceso y selección de perfil | 1 | Implementado |
| P-02 | Dashboard operativo y contable | 6 | Implementado |
| P-03 | Clientes | 2 | Implementado |
| P-04 | Nueva solicitud | 2 | Implementado |
| P-05 | Solicitudes | 2 | Implementado |
| P-06 | Programación de viajes | 3 | Implementado |
| P-07 | Crear y editar viaje | 3 | Implementado |
| P-08 | Detalle de viaje | 3 | Implementado |
| P-09 | Línea de tiempo | 4 | Implementado |
| P-10 | Registrar evento e incidencia | 4 | Implementado |
| P-11 | Guía de remisión | 5 | Implementado |
| P-12 | Reportes operativos | 5 | Implementado |
| P-13 | Reporte para cliente | 5 | Implementado |
| P-14 | Bandeja por facturar | 6 | Implementado |
| P-15 | Facturas y servicios agrupados | 6 | Implementado |
| P-16 | Cartera y pagos | 6 | Implementado |
| P-17 | Catálogos | 2 | Implementado |
| P-18 | Importar Excel | 7 | Implementado |
| P-19 | Actividad e historial | 7 | Implementado |
| P-20 | Integraciones | 7 | Implementado |

## Base técnica de la Fase 1

| Elemento | Dónde | Estado |
|---|---|---|
| Persistencia versionada `portflow:v1` con reinicio por versión | servicios/almacenamiento.ts | Implementado |
| Restablecer datos demostrativos con confirmación | paginas/configuracion, ContextoApp.restablecer | Implementado |
| Generador con fechas relativas, 14 viajes y escenarios A a E | datos/generadorDatos.ts | Implementado |
| Componentes comunes: botones, insignias, tabla con orden y paginación, modales, notificaciones | componentes/ | Implementado |
| Rutas protegidas con redirección y aviso | rutas/RutaProtegida.tsx | Implementado |

## Decisiones de la Fase 2

| Decisión | Motivo |
|---|---|
| Clientes y elementos de catálogo se desactivan, no se eliminan | Conservan viajes, documentos e historial; dejan de ofrecerse en formularios nuevos |
| Los 12 hitos base son hitos del sistema: solo se edita su nombre | Definen la secuencia y el cierre por modalidad (RN-03 a RN-05); los eventos adicionales sí son configurables |
| Campos opcionales nuevos: tipo de carga del catálogo (solicitud y carga) y motivo de rechazo | El catálogo de tipos de carga debe alimentar los formularios; el rechazo queda documentado |
| El viaje convertido nace con cobro contra factura y valor $0.00 | La solicitud no contiene esos datos; se completan en P-07 (Fase 3) |

## Decisiones de la Fase 3

| Decisión | Motivo |
|---|---|
| El viaje pasa a Programado automáticamente al tener transportista, chofer, unidad, salida y llegada previstas | Coincide con la definición del estado en el documento (sección 5.1) |
| El motivo del ajuste solo se exige cuando el viaje ya no está en Solicitado | Antes de programarse no hay compromiso que modificar (RF-14) |
| No se cambia entre importación y exportación al editar | El código IMP o EXP es permanente (RF-54) |
| El calendario ubica cada viaje por su salida prevista | Los viajes sin fecha aparecen en el panel de pendientes de asignación |
| Contabilidad ve el listado de viajes y una consulta con datos mínimos y de cobro | Perfil con consulta limitada según la sección 2 del documento |

## Decisiones de la Fase 4

| Decisión | Motivo |
|---|---|
| Los hitos del sistema se registran en el orden de la modalidad; los eventos adicionales del catálogo, en cualquier momento | La secuencia determina el estado y el cierre (RF-18, RN-03 a RN-05) |
| El cierre se registra con Finalizar viaje, que crea el hito Cierre | Concentra la validación de puedeFinalizar y la observación por incidencias |
| La hora real no puede estar en el futuro; la hora prevista se sugiere desde los compromisos del viaje | El retraso se calcula contra el compromiso registrado (RN-08) |
| La disponibilidad de chofer y unidad cambia a En servicio al iniciar y a Disponible al finalizar | Disponibilidad ilustrativa coherente con la operación |
| Colores de gráficos como tokens del tema (grafico-1 a grafico-3), validados para daltonismo; tema con @theme static | Sin colores escritos a mano; la mostaza solo como dato destacado con etiqueta visible |
| El dashboard contable sigue provisional | Corresponde a la Fase 6 |

## Decisiones de la Fase 5

| Decisión | Motivo |
|---|---|
| Cada generación de guía crea una versión nueva con número GR-DEMO correlativo; la última es la vigente | Consulta histórica de guías por viaje (RF-34) |
| La guía exige asignación de recursos y no se genera para viajes cancelados | Los datos de transporte deben existir |
| El paquete documental es un PDF con índice, reporte compartible y guía vigente; los adjuntos se listan como referencia | El prototipo no almacena el contenido de archivos |
| Los reportes filtran por fecha de salida prevista | Mismo criterio que el dashboard y la programación |
| jsPDF 4.2.1 (sin avisos de seguridad) y xlsx 0.18.5 de npm con carga diferida | xlsx tiene avisos conocidos para archivos maliciosos; aceptado para el prototipo local (Fase 0) y se documenta en el README |

## Decisiones de la Fase 6

| Decisión | Motivo |
|---|---|
| El pago se registra y luego se valida; solo los validados reducen el saldo | Separa el registro de la verificación bancaria (RF-50, RN-12) |
| No se registra un pago mayor al saldo disponible (saldo menos pagos por validar) | Evita saldos negativos |
| Referencias de factura y de pago únicas | Evita registrar dos veces el mismo documento |
| El valor de la factura se sugiere con la suma de valores referenciales y puede ajustarse | El valor facturado es el emitido en el sistema contable (RF-47) |
| Vencimiento sugerido: 30 días a crédito y 8 días contra factura, editable | Plazos ilustrativos; la alerta usa diasAlertaVencimiento |
| Antigüedad de cartera en tramos: por vencer, 1 a 30, 31 a 60 y más de 60 días | Lectura habitual de cartera |
| Contífico se muestra en Cartera como integración futura sin conexión | RF-52 y CA-15; la pantalla de integraciones llega en la Fase 7 |

## Decisiones de la Fase 7

| Decisión | Motivo |
|---|---|
| Las muestras de importación se generan en el navegador con fechas desde hoy, en lugar de archivos fijos en public/muestras | Archivos fijos quedarían con fechas pasadas y generarían alertas de retraso falsas |
| La importación reutiliza los mismos validadores y operaciones que los formularios (esquemaCliente, esquemaViaje, crearCliente, guardarViaje) | Las reglas son idénticas a las del ingreso manual |
| Las filas con errores se omiten; las válidas se guardan juntas o ninguna | Resultado predecible y fácil de explicar |
| Los viajes importados quedan en Solicitado, sin recursos | Se asignan después en Programación |
| Cliente y lugares se reconocen por código, RUC o nombre; la modalidad y el cobro por texto | Tolera archivos con distintas convenciones |
| El único parámetro editable es la alerta de vencimiento (1 a 30 días) | Es el único parámetro de negocio configurable definido |

## Decisiones de la Fase 8

| Decisión | Motivo |
|---|---|
| Corrección del desbordamiento horizontal del resumen de reportes en tableta | Detectado en el barrido de 35 pantallas por ancho |
| README con instalación, perfiles, datos, supuestos, limitaciones y aviso de la dependencia xlsx | Entregable de cierre |
| Se mantiene PaginaPendiente como respaldo del enrutador | Todas las rutas tienen pantalla; solo aplica a rutas futuras |

