# PORTFLOW — Matriz de trazabilidad

Actualizada al cierre de la Fase 2. La columna Fase indica cuándo queda completo cada elemento; "Parcial" significa que la lógica o los datos ya existen pero falta la pantalla de su fase. La validación completa se hace en la Fase 8.

Valores de estado: Pendiente, Implementado, Parcial, Demostrativo.

## Requerimientos funcionales

| ID | Requerimiento | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| RF-01 | Ficha de cliente | 2 | P-03: PaginaFormularioCliente, PaginaFichaCliente, operaciones/clientes | Implementado |
| RF-02 | Consulta de clientes y operaciones asociadas | 2 | P-03: búsqueda por nombre, código e identificación; ficha con solicitudes, viajes, servicios y documentos | Implementado |
| RF-03 | Requerimiento de transporte por cliente | 2 | P-04: PaginaFormularioSolicitud, operaciones/solicitudes | Implementado |
| RF-04 | Varias solicitudes y viajes abiertos por cliente | 3 | P-03 (ficha con viajes abiertos), P-05; programación en Fase 3 | Parcial |
| RF-05 | Fecha requerida, origen, destino, indicaciones | 2 | P-04 | Implementado |
| RF-06 | Convertir solicitud aceptada en operación | 2 | operaciones/solicitudes.convertirSolicitud, ModalConversionSolicitud | Implementado |
| RF-07 | Bandeja de solicitudes con filtros | 2 | P-05: filtros por cliente, fecha, tipo y estado en la URL | Implementado |
| RF-08 | Catálogos de transportistas, choferes y unidades | 2 | P-17: PanelCatalogo, operaciones/catalogos | Implementado |
| RF-09 | Tipo de carga y contenedor | 3 | P-07, carga.contenedor | Pendiente |
| RF-10 | Asignar transportista, chofer, vehículo y ruta | 3 | P-07, operaciones/asignarRecursos | Pendiente |
| RF-11 | Fechas previstas de salida, llegada y cierre | 3 | P-07 | Pendiente |
| RF-12 | Programación en lista o calendario y pendientes de asignación | 3 | P-06 | Pendiente |
| RF-13 | Aviso de solapamiento de unidad o chofer | 3 | calculos/hayAdvertenciaSolapamiento (cálculo listo; aviso en P-07 en Fase 3) | Parcial |
| RF-14 | Modificar programación con motivo y fecha | 3 | operaciones/ajustarProgramacion | Pendiente |
| RF-15 | Viaje de importación contenedorizada | 3 | P-07, P-08 | Pendiente |
| RF-16 | Viaje de importación de carga suelta | 3 | P-07, P-08 | Pendiente |
| RF-17 | Viaje de exportación | 3 | P-07, P-08 | Pendiente |
| RF-18 | Secuencia de etapas por modalidad | 3 | constantes/SECUENCIA_HITOS, calculos/secuenciaDeHitos | Parcial |
| RF-19 | Etapa con ubicación, evento y horas prevista y real | 4 | P-09 | Pendiente |
| RF-20 | Distinguir en ejecución, pendiente de devolución y cerrado | 4 | P-08, P-02 | Pendiente |
| RF-21 | Detalle de operación | 3 | P-08 | Pendiente |
| RF-22 | Eventos manuales en línea de tiempo | 4 | P-09, P-10 | Pendiente |
| RF-23 | Hitos predefinidos adaptados a la modalidad | 4 | P-17: catálogo de tipos de evento con secuencia por modalidad; registro en Fase 4 | Parcial |
| RF-24 | Paradas, esperas, demoras, incidentes y cambios de ruta | 4 | P-10 | Pendiente |
| RF-25 | Evidencias en eventos e incidencias | 4 | P-10 | Pendiente |
| RF-26 | Estado actual, último evento y responsable | 4 | P-08 | Pendiente |
| RF-27 | Hora estimada contra real y desvío | 4 | calculos/desvioEnMinutos | Pendiente |
| RF-28 | Indicador de entrega a tiempo | 4 | P-09, P-08 | Pendiente |
| RF-29 | Resaltar detenidas, retrasadas o con novedad | 4 | P-02, P-06, P-08 | Pendiente |
| RF-30 | Cerrar incidencias con acción correctiva | 4 | operaciones/resolverIncidencia | Pendiente |
| RF-31 | Historial de cambios de estado | 4 | P-08, historialEstados | Pendiente |
| RF-32 | Vista previa de guía de remisión | 5 | P-11 | Pendiente |
| RF-33 | Descarga de guía imprimible | 5 | P-11, documentos | Pendiente |
| RF-34 | Guías asociadas al viaje con fecha de generación | 5 | P-11, P-08 | Pendiente |
| RF-35 | Otros documentos con tipo | 5 | P-11 | Pendiente |
| RF-36 | Paquete documental del viaje | 5 | P-11, servicios/documentos | Pendiente |
| RF-37 | Panel con servicios del día, en ruta, entregados, retrasados y pendientes de cierre | 4 | P-02 | Pendiente |
| RF-38 | Filtros de indicadores | 4 | P-02, P-12 | Pendiente |
| RF-39 | Reporte por viaje | 5 | P-12 | Pendiente |
| RF-40 | Reporte semanal y mensual por cliente | 5 | P-13 | Pendiente |
| RF-41 | Previsto contra efectivo y observaciones de retraso | 5 | P-12, P-13 | Pendiente |
| RF-42 | Exportación a PDF y Excel | 5 | servicios/exportacion | Pendiente |
| RF-43 | Vista interna y versión para el cliente | 5 | P-12, P-13 | Pendiente |
| RF-44 | Operaciones finalizadas elegibles para facturar | 6 | calculos/estadoFacturacionServicio; alerta en notificaciones de Contabilidad | Parcial |
| RF-45 | Bandeja restringida para Contabilidad | 6 | P-14 | Pendiente |
| RF-46 | Agrupar servicios de un cliente | 6 | P-14, operaciones/agruparYFacturar | Pendiente |
| RF-47 | Registrar referencia, fecha y valor de factura | 6 | P-15 | Pendiente |
| RF-48 | Contra factura y a crédito, sin anticipo | 6 | modalidadCobro, P-07, P-15 | Pendiente |
| RF-49 | Vencimiento, saldo y estado de cartera | 6 | P-16 | Pendiente |
| RF-50 | Abonos, pagos parciales y cancelación total | 6 | P-16, operaciones/registrarPago y validarPago | Pendiente |
| RF-51 | Alertas de cartera próxima a vencer o vencida | 6 | calculos/esProximaAVencer; panel de notificaciones del encabezado (P-16 en Fase 6) | Parcial |
| RF-52 | Consulta futura de cartera desde Contífico y estado de sincronización | 7 | P-20 | Pendiente |
| RF-53 | Catálogos editables | 2 | P-17: listar, buscar, crear, editar, activar y desactivar en 7 catálogos; clientes en P-03 | Implementado |
| RF-54 | Identificador de viaje único en todas las vistas | 1 | calculos/siguienteCodigo, generadorDatos (IMP-xxx / EXP-xxx) | Implementado |
| RF-55 | Búsqueda global por código, cliente, contenedor o placa | 3 | maquetacion/BusquedaGlobal, servicios/busqueda (el detalle de destino llega en Fase 3) | Parcial |
| RF-56 | Importación desde Excel con vista previa | 7 | P-18 | Pendiente |
| RF-57 | Registro de actividad | 7 | servicios/actividad y ContextoApp.aplicar registran creación, edición, conversión, activación y desactivación; pantalla P-19 en Fase 7 | Parcial |
| RF-58 | Menú diferenciado por perfil | 1 | maquetacion/BarraLateral y menu, utilidades/permisos, rutas/RutaProtegida | Implementado |

## Reglas de negocio

| ID | Regla | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| RN-01 | El viaje es la unidad central | 3 | modelo Viaje vinculado a solicitud y cliente (conversión) | Parcial |
| RN-02 | Varias operaciones por cliente sin mezclar bitácoras | 3 | eventos y documentos por viajeCodigo | Pendiente |
| RN-03 | Contenedorizada se cierra tras la devolución | 4 | calculos/puedeFinalizar | Parcial |
| RN-04 | Carga suelta se cierra con la entrega confirmada | 4 | calculos/puedeFinalizar | Parcial |
| RN-05 | Exportación se cierra con entrega en puerto | 4 | calculos/puedeFinalizar | Parcial |
| RN-06 | Monitoreo manual, sin GPS | 4 | P-09, P-20 | Pendiente |
| RN-07 | Evento con fecha, hora, responsable y detalle, en orden cronológico | 4 | P-09 | Pendiente |
| RN-08 | Retraso contra compromiso registrado | 4 | calculos/estaRetrasado y desvioEnMinutos | Parcial |
| RN-09 | La incidencia no bloquea el cierre; debe resolverse o documentarse | 4 | calculos/puedeFinalizar (exige observación con incidencias abiertas) | Parcial |
| RN-10 | Contabilidad recibe servicios elegibles y los agrupa por cliente | 6 | P-14 | Pendiente |
| RN-11 | Pago contra factura o crédito, sin validar anticipo | 6 | modelo modalidadCobro; datos con ambas modalidades | Parcial |
| RN-12 | Pago parcial reduce saldo; cobrado solo con saldo cero | 6 | calculos/saldoDeFactura y estadoDeFactura | Parcial |
| RN-13 | Cartera y pagos fuera de reportes compartibles | 5 | P-13 | Pendiente |
| RN-14 | Mismo código de viaje y cliente en documentos y reportes | 5 | P-11, P-12, P-13 | Pendiente |
| RN-15 | Guía demostrativa, no tributaria | 5 | P-11, leyenda en la guía | Pendiente |

## Criterios de aceptación

| ID | Criterio | Fase | Dónde se implementa | Estado |
|---|---|---|---|---|
| CA-01 | Navegar del panel a un viaje y volver sin perder contexto | 3 | hooks/usarParametrosListado (filtros, orden y página en la URL); retorno tras el acceso | Parcial |
| CA-02 | Cliente con al menos dos viajes simultáneos independientes | 3 | datos: CLI-002 con IMP-003 y EXP-001 abiertos a la vez | Parcial |
| CA-03 | Importación contenedorizada exige devolución | 4 | secuenciaDeHitos | Pendiente |
| CA-04 | Carga suelta sin devolución; exportación finaliza en puerto | 4 | secuenciaDeHitos | Pendiente |
| CA-05 | Actualizar estado y eventos con hora y responsable | 4 | P-08, P-09 | Pendiente |
| CA-06 | Incidencia en la ficha y en los reportes | 5 | P-08, P-12 | Pendiente |
| CA-07 | Indicador a tiempo o retrasado acorde a las fechas | 4 | calculos | Pendiente |
| CA-08 | Guía con datos del mismo viaje, previsualizable y descargable | 5 | P-11 | Pendiente |
| CA-09 | Reporte semanal coherente con los viajes de muestra | 5 | P-13 | Pendiente |
| CA-10 | Filtros por fecha, cliente y modalidad modifican listados y cifras | 4 | P-02, P-05, P-06, P-12 | Pendiente |
| CA-11 | Contabilidad sin edición logística | 6 | permisos | Pendiente |
| CA-12 | Viaje finalizado en la bandeja contable y agrupable | 6 | P-14 | Pendiente |
| CA-13 | Abono parcial reduce saldo; saldo cero pasa a cobrado | 6 | P-16 | Pendiente |
| CA-14 | Viaje sin pago anticipado, contra factura o a crédito | 6 | modalidadCobro | Pendiente |
| CA-15 | Contífico y Tracklink como integraciones futuras | 7 | P-20 | Pendiente |
| CA-16 | Importación desde Excel con mapeo y vista previa | 7 | P-18 | Pendiente |
| CA-17 | Navegación adaptativa en escritorio y teléfono | 1 | maquetacion (menú lateral desplegable en móvil, tablas con desplazamiento); se valida en Fase 8 | Parcial |

## Recorridos de demostración

| ID | Recorrido | Fase en que queda completo | Pantallas | Estado |
|---|---|---|---|---|
| F-01 | Importación contenedorizada | 4 | P-03 a P-05 listos (cliente, solicitud, conversión); P-06 a P-10 pendientes | Parcial |
| F-02 | Importación de carga suelta | 4 | P-04 y P-05 listos; P-06 a P-10 pendientes | Parcial |
| F-03 | Exportación | 4 | P-04 y P-05 listos (solicitud de retiro de contenedor); P-06 a P-10 pendientes | Parcial |
| F-04 | Incidencia y retraso | 5 | P-08 a P-10, P-12 | Pendiente |
| F-05 | Reporte para cliente | 5 | P-13 | Pendiente |
| F-06 | Guía de remisión | 5 | P-11 | Pendiente |
| F-07 | Facturación y crédito | 6 | P-14 a P-16 | Pendiente |
| F-08 | Consolidación desde Excel | 7 | P-18 | Pendiente |

## Pantallas

| ID | Pantalla | Fase | Estado |
|---|---|---|---|
| P-01 | Acceso y selección de perfil | 1 | Implementado |
| P-02 | Dashboard operativo (y contable en Fase 6) | 4 | Pendiente |
| P-03 | Clientes | 2 | Implementado |
| P-04 | Nueva solicitud | 2 | Implementado |
| P-05 | Solicitudes | 2 | Implementado |
| P-06 | Programación de viajes | 3 | Pendiente |
| P-07 | Crear y editar viaje | 3 | Pendiente |
| P-08 | Detalle de viaje | 3 | Pendiente |
| P-09 | Línea de tiempo | 4 | Pendiente |
| P-10 | Registrar evento e incidencia | 4 | Pendiente |
| P-11 | Guía de remisión | 5 | Pendiente |
| P-12 | Reportes operativos | 5 | Pendiente |
| P-13 | Reporte para cliente | 5 | Pendiente |
| P-14 | Bandeja por facturar | 6 | Pendiente |
| P-15 | Facturas y servicios agrupados | 6 | Pendiente |
| P-16 | Cartera y pagos | 6 | Pendiente |
| P-17 | Catálogos | 2 | Implementado |
| P-18 | Importar Excel | 7 | Pendiente |
| P-19 | Actividad e historial | 7 | Pendiente |
| P-20 | Integraciones | 7 | Pendiente |

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
