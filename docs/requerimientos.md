**CLEARMINDS   /   ESPECIFICACIÓN PARA PROTOTIPO**

DOCUMENTO DE REQUERIMIENTOS

Plataforma de Gestión
de Transporte Portuario

Importaciones · Exportaciones · Seguimiento de viajes · Documentos · Cobranzas

Especificación funcional para el levantamiento de un prototipo visual y navegable, basada en la reunión comercial con Eric (Guayaquil, Ecuador).

| **CONTROL DEL DOCUMENTO** | **DEFINICIÓN** |
| --- | --- |
| **Proyecto** | Sistema centralizado para operaciones de transporte terrestre vinculadas a movimientos portuarios |
| **Propósito** | Sustituir el seguimiento disperso en hojas de Excel por una operación unificada, trazable y reportable |
| **Enfoque** | Operación logística y trazabilidad por hitos; no es una herramienta de optimización de rutas ni de rastreo GPS |
| **Usuarios** | Tres usuarios internos con permisos operativos equivalentes; perfil adicional de Contabilidad con acceso restringido |
| **Entregable solicitado** | Prototipo de navegación y propuesta de alcance técnico/económico posterior a su revisión |
| **Versión / base** | V1.0 · Reunión de levantamiento transcrita el 9 de noviembre de 2026 |

# 1. Resumen ejecutivo

La empresa gestiona movimientos terrestres de carga vinculados a importaciones y exportaciones. La operación se concentra en viajes entre puerto, planta o instalaciones del cliente y, cuando corresponda, devolución de contenedores. Actualmente registra servicios, estados y novedades principalmente en hojas de cálculo, con comunicaciones por correo y WhatsApp.

La solución propuesta permitirá registrar solicitudes de clientes, programar transportistas y unidades, controlar cada viaje con una bitácora cronológica de eventos, generar documentos de traslado y producir reportes operativos para clientes. Contabilidad contará con una bandeja de servicios por facturar, registro/validación de pagos y visibilidad de saldos a crédito. Se mantendrán como sistemas externos Contífico para la gestión contable y Tracklink para el rastreo GPS.

## 1.1 Objetivo del prototipo

Mostrar un flujo completo y comprensible desde la solicitud del transporte hasta su cierre operativo y seguimiento de facturación, usando datos ilustrativos coherentes. Todas las pantallas deben compartir la misma información demostrativa y permitir navegar entre fichas, estados y reportes.

## 1.2 Alcance que debe representarse

Gestión de clientes, solicitudes y múltiples operaciones simultáneas por cliente.

Viajes de importación de carga contenedorizada, importación de carga suelta y exportación.

Asignación de transportista, chofer, unidad, tipo/número de contenedor, origen, destino y fechas.

Registro manual de hitos, paradas, retrasos, incidencias, evidencias y horas reales.

Guía de remisión descargable, reportes por viaje/cliente y consolidado semanal.

Bandeja contable de facturación, pagos y cartera a crédito, con referencia a Contífico.

# 2. Usuarios y permisos

| **Perfil** | **Capacidades en el prototipo** |
| --- | --- |
| **Administrador / Operaciones (3 usuarios)** | Acceso equivalente a clientes, solicitudes, planificación, viajes, bitácora, documentos y reportes; puede crear, editar y cerrar operaciones, además de actualizar eventos de monitoreo. |
| **Contabilidad** | Acceso a servicios listos para facturar, registro de referencias de factura, cartera, vencimientos y pagos. Consulta datos mínimos del viaje y cliente; no modifica la planificación ni la bitácora. |
| **Cliente y transportista** | No requieren iniciar sesión en el alcance inicial. Reciben guías y reportes generados por la plataforma a través de descarga o envío externo. |

La cuenta de monitoreo no es un rol adicional: sus tareas las realiza uno de los tres usuarios operativos. En el prototipo debe existir una vista administrativa común y una vista simplificada para Contabilidad.

# 3. Requerimientos funcionales

Cada identificador describe una función visible y verificable en la demostración. En el prototipo se ilustran sus resultados mediante registros de ejemplo; la persistencia real y las integraciones no forman parte obligatoria de esta fase.

## 3.1 Clientes, solicitudes y órdenes de transporte

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-01** | Registrar ficha de cliente con razón social, identificación, contacto, correo y teléfono. |
| **RF-02** | Consultar clientes por nombre, código o identificación y visualizar sus operaciones asociadas. |
| **RF-03** | Crear un requerimiento de transporte por cliente, tipo de operación y descripción de carga. |
| **RF-04** | Permitir múltiples solicitudes y viajes abiertos para un mismo cliente, identificados individualmente. |
| **RF-05** | Registrar fecha requerida, origen, destino, observaciones e indicaciones del cliente. |
| **RF-06** | Convertir una solicitud aceptada en una operación planificable sin volver a digitar sus datos. |
| **RF-07** | Mostrar una bandeja de solicitudes con filtros por cliente, fecha, tipo y estado. |

## 3.2 Recursos y programación

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-08** | Mantener catálogos de transportistas, choferes y unidades con información básica. |
| **RF-09** | Registrar tipo de carga: contenedorizada o suelta; tipo y número de contenedor si aplica. |
| **RF-10** | Asignar transportista, chofer, vehículo y ruta de puntos operativos a cada viaje. |
| **RF-11** | Definir fecha y hora previstas de salida, llegada y cierre del servicio. |
| **RF-12** | Visualizar programación por lista o calendario y operaciones pendientes de asignación. |
| **RF-13** | Mostrar un aviso de posible solapamiento al asignar la misma unidad/chofer a viajes superpuestos. |
| **RF-14** | Permitir modificar la programación registrando motivo y fecha del ajuste. |

## 3.3 Modalidades de importación y exportación

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-15** | Crear viaje de importación contenedorizada: puerto → cliente/planta → devolución de contenedor. |
| **RF-16** | Crear viaje de importación de carga suelta: puerto → cliente/planta, sin devolución obligatoria. |
| **RF-17** | Crear viaje de exportación: retiro de contenedor → cliente/planta → entrega en puerto. |
| **RF-18** | Mostrar secuencia de etapas correspondiente al tipo de operación, sin optimización de rutas. |
| **RF-19** | Registrar en cada etapa ubicación, evento, fecha/hora prevista y fecha/hora efectiva. |
| **RF-20** | Distinguir viajes en ejecución, pendientes de devolución y cerrados. |
| **RF-21** | Visualizar el detalle de una operación con datos de carga, asignación, etapas y documentación. |

## 3.4 Monitoreo por hitos, incidencias y tiempos

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-22** | Registrar eventos manuales en una línea de tiempo con usuario, tipo, observación y hora. |
| **RF-23** | Ofrecer hitos predefinidos: salida, llegada a origen, carga, salida a destino, llegada, descarga y cierre; adaptar según modalidad. |
| **RF-24** | Registrar paradas, esperas, demoras, incidentes y cambios de ruta operacional. |
| **RF-25** | Adjuntar evidencias o archivos ilustrativos a eventos e incidencias del viaje. |
| **RF-26** | Mostrar estado actual, último evento y responsable del registro en cada operación. |
| **RF-27** | Distinguir hora estimada de hora real y calcular desvío cuando haya ambos valores. |
| **RF-28** | Mostrar indicador de entrega a tiempo cuando exista un compromiso de fecha/hora. |
| **RF-29** | Resaltar operaciones detenidas, retrasadas o con novedad no resuelta. |
| **RF-30** | Permitir cerrar incidencias con una acción correctiva y fecha de resolución. |
| **RF-31** | Conservar historial visible de cambios de estado para trazabilidad administrativa. |

## 3.5 Documentación de transporte

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-32** | Generar una vista previa de guía de remisión con datos de remitente, destinatario, carga, transportista, vehículo y recorrido. |
| **RF-33** | Descargar la guía en formato imprimible para compartir con cliente y chofer. |
| **RF-34** | Conservar las guías asociadas al viaje y mostrar su fecha de generación. |
| **RF-35** | Adjuntar otros documentos del servicio y distinguir su tipo. |
| **RF-36** | Permitir descargar un paquete documental del viaje de forma demostrativa. |

## 3.6 Reportes operativos y para clientes

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-37** | Mostrar panel con servicios del día, en ruta, entregados, retrasados y pendientes de cierre. |
| **RF-38** | Filtrar indicadores por rango de fechas, cliente, modalidad, transportista y estado. |
| **RF-39** | Generar reporte por viaje con etapas, marcas horarias, novedades y cumplimiento del plazo. |
| **RF-40** | Generar reporte semanal/mensual por cliente con servicios realizados y entregas a tiempo. |
| **RF-41** | Comparar fecha/hora prevista versus efectiva y presentar observaciones de retraso. |
| **RF-42** | Permitir exportación demostrativa de reportes a PDF y Excel. |
| **RF-43** | Separar vista interna detallada y versión para compartir con el cliente, sin datos internos innecesarios. |

## 3.7 Contabilidad, facturación y cartera

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-44** | Identificar operaciones finalizadas y elegibles para facturación. |
| **RF-45** | Mostrar bandeja restringida para Contabilidad con cliente, viaje, fecha, servicio y valor registrado. |
| **RF-46** | Permitir agrupar varios servicios de un cliente como candidatos a una factura. |
| **RF-47** | Registrar referencia, fecha y valor de factura emitida; no emitir facturas fiscales reales en el prototipo. |
| **RF-48** | Representar modalidades de cobro contra factura y a crédito, sin obligar anticipo al iniciar viaje. |
| **RF-49** | Registrar vencimiento de crédito, saldo pendiente y estado de cartera. |
| **RF-50** | Registrar y validar abonos, pagos parciales o cancelación total con fecha y referencia. |
| **RF-51** | Mostrar alertas visuales de cartera próxima a vencer o vencida. |
| **RF-52** | Representar la futura consulta de cartera desde Contífico y su estado de sincronización. |

## 3.8 Configuración, consulta y transición desde Excel

| **ID** | **Requerimiento para el prototipo** |
| --- | --- |
| **RF-53** | Mantener catálogos editables de clientes, vehículos, choferes, transportistas, lugares e incidencias. |
| **RF-54** | Usar un identificador de viaje único en todas las vistas y documentos. |
| **RF-55** | Ofrecer búsqueda global de viajes por código, cliente, contenedor o placa. |
| **RF-56** | Mostrar pantalla de importación inicial de datos desde Excel con vista previa de columnas. |
| **RF-57** | Disponer de registro de actividad: usuario, fecha y acción administrativa relevante. |
| **RF-58** | Ofrecer accesos diferenciados a menú operativo y menú contable conforme al perfil. |

# 4. Reglas operativas y de negocio

| **Regla** | **Definición** |
| --- | --- |
| **RN-01** | El viaje es la unidad central de seguimiento y puede estar vinculado a una solicitud y a un cliente. |
| **RN-02** | Un cliente puede tener varias importaciones/exportaciones simultáneas sin mezclar bitácoras ni documentos. |
| **RN-03** | Importación contenedorizada se cierra tras la devolución del contenedor, cuando dicha etapa aplique. |
| **RN-04** | Importación de carga suelta se cierra con entrega confirmada al cliente/planta. |
| **RN-05** | Exportación se cierra con entrega del contenedor o carga al puerto; no contempla trámites aduaneros posteriores. |
| **RN-06** | El monitoreo inicial es manual por hitos. No se debe mostrar como posición GPS en tiempo real. |
| **RN-07** | Cada evento incluye fecha, hora, responsable y detalle; se ordena cronológicamente. |
| **RN-08** | Un retraso se determina comparando fecha/hora real contra compromiso registrado, no por una meta universal inventada. |
| **RN-09** | Una incidencia no bloquea por sí sola el cierre; debe quedar resuelta o con observación documentada. |
| **RN-10** | Contabilidad recibe servicios elegibles para facturar y puede agruparlos por cliente. |
| **RN-11** | Los servicios pueden operar con pago contra factura o crédito; no hay validación obligatoria de anticipo previo a salida. |
| **RN-12** | Un pago parcial disminuye el saldo. El estado cobrado aplica solo si el saldo queda en cero. |
| **RN-13** | Los datos sensibles de cartera y pagos no se incluyen por defecto en reportes compartibles con clientes. |
| **RN-14** | Los documentos y reportes de una operación muestran siempre el mismo código de viaje y cliente. |
| **RN-15** | Una guía de remisión de demostración no equivale a un documento tributario autorizado ni a emisión electrónica ante el SRI. |

# 5. Estados y estructura de seguimiento

## 5.1 Estados del viaje

| **Estado** | **Descripción visible** |
| --- | --- |
| **Solicitado** | Requerimiento recibido sin asignación operativa completa. |
| **Programado** | Transportista, unidad y ruta definidos; pendiente de iniciar. |
| **En ejecución** | Operación iniciada y con bitácora de hitos en curso. |
| **Entregado / pendiente devolución** | Carga entregada al cliente; resta devolución de contenedor cuando aplica. |
| **Finalizado** | Se cumplió el último hito requerido según modalidad. |
| **Con incidencia** | Etiqueta transversal visible durante cualquier etapa de la operación. |
| **Cancelado** | Solicitud/viaje interrumpido con motivo documentado. |

## 5.2 Estados de facturación y cobranza

| **Estado** | **Interpretación** |
| --- | --- |
| **Por facturar** | Servicio finalizado listo para revisión contable. |
| **Facturado** | Factura registrada en la plataforma con referencia y fecha. |
| **Pendiente / parcial** | Saldo abierto, con cero o varios abonos registrados. |
| **Vencido** | Saldo pendiente y fecha límite sobrepasada. |
| **Cobrado** | Saldo cancelado y pago validado. |

# 6. Pantallas y navegación del prototipo

| **ID** | **Pantalla** | **Qué debe mostrar** |
| --- | --- | --- |
| **P-01** | Acceso / selección de perfil | Ingreso ilustrativo como Operaciones o Contabilidad. |
| **P-02** | Dashboard operativo | KPIs, próximas llegadas, incidencias, viajes activos y accesos rápidos. |
| **P-03** | Clientes | Listado, búsqueda, ficha y viajes asociados. |
| **P-04** | Nueva solicitud | Formulario de requerimiento de transporte. |
| **P-05** | Solicitudes | Bandeja filtrable con estados y conversión a viaje. |
| **P-06** | Programación de viajes | Listado/calendario con asignaciones y compromisos. |
| **P-07** | Crear / editar viaje | Modalidad, origen-destino, tipo carga, transportista, chofer, unidad y contenedor. |
| **P-08** | Detalle de viaje | Resumen integral de operación, etapas y pestañas asociadas. |
| **P-09** | Línea de tiempo | Hitos cronológicos, horas previstas/reales y usuario que registró. |
| **P-10** | Registrar evento / incidencia | Formulario de novedad, retraso, parada o entrega con evidencia. |
| **P-11** | Guía de remisión | Vista previa, descarga y archivos asociados. |
| **P-12** | Reportes operativos | Dashboard de desempeño con filtros y exportación. |
| **P-13** | Reporte para cliente | Formato compartible por viaje y consolidado semanal. |
| **P-14** | Bandeja por facturar | Vista del contador de servicios listos para cobro. |
| **P-15** | Facturas y servicios agrupados | Referencias de facturas y asociación con viajes. |
| **P-16** | Cartera y pagos | Vencimientos, saldos, abonos y validaciones. |
| **P-17** | Catálogos | Choferes, unidades, transportistas, lugares y tipos de eventos. |
| **P-18** | Importar Excel | Carga demostrativa, mapeo de columnas y validaciones. |
| **P-19** | Actividad / historial | Registro de acciones por operación. |
| **P-20** | Conectores | Tarjetas descriptivas para Contífico y Tracklink, sin conexión activa. |

# 7. Recorridos de demostración obligatorios

## F-01 | Importación contenedorizada

Registrar cliente y solicitud → programar transporte → asignar chofer/unidad/contenedor → registrar salida de puerto → llegada a cliente → entrega de carga → devolución de contenedor → cierre.

## F-02 | Importación de carga suelta

Crear solicitud → registrar transporte puerto–cliente → documentar hitos de entrega → finalizar sin devolución de contenedor.

## F-03 | Exportación

Solicitar retiro de contenedor → asignar recursos → registrar paso por cliente/planta → registrar entrega en puerto → finalizar.

## F-04 | Incidencia / retraso

Abrir viaje en curso → agregar parada o inconveniente con hora → comparar contra hora prevista → resolver incidencia → visualizarla en reporte.

## F-05 | Reporte para cliente

Filtrar viajes por cliente y semana → ver entregados, en ruta y a tiempo → generar vista de reporte → descargar ejemplo.

## F-06 | Guía de remisión

Abrir un viaje → completar campos documentales → visualizar formato de guía → descargar versión de ejemplo para chofer/cliente.

## F-07 | Facturación y crédito

Cerrar viaje → ver servicio por facturar → agrupar con otro viaje del cliente → registrar factura → registrar pago parcial → verificar saldo/vencimiento → cancelar saldo.

## F-08 | Consolidación desde Excel

Entrar a importación → seleccionar archivo demostrativo → mapear columnas → ver previsualización → confirmar datos de ejemplo en listados.

# 8. Datos mínimos por entidad

| **Entidad** | **Campos que deben visualizarse** |
| --- | --- |
| **Cliente** | Código, razón social, identificación, contacto, correo, teléfono, estado. |
| **Solicitud** | Código, cliente, tipo operación, carga, origen/destino, fecha requerida, notas, estado. |
| **Viaje** | Código, solicitud, modalidad, fechas previstas/reales, transportista, chofer, unidad, estado, valor. |
| **Contenedor / carga** | Carga suelta o contenedorizada, tipo, número de contenedor, descripción, observaciones. |
| **Etapa / evento** | Viaje, tipo, ubicación, hora programada, hora efectiva, responsable, comentario. |
| **Incidencia** | Viaje, categoría, fecha/hora, descripción, evidencia, estado, solución. |
| **Guía / documento** | Viaje, tipo, número referencial, fecha, emisor, receptor, archivo, versión. |
| **Factura / cuenta** | Cliente, viaje(s), número/referencia, fecha, vencimiento, monto, saldo, estado. |
| **Pago** | Factura, fecha, valor, referencia, validador y estado. |
| **Recurso** | Transportista, chofer, placa/unidad, contacto, disponibilidad ilustrativa. |

# 9. Criterios de aceptación del prototipo

| **ID** | **Validación observable** |
| --- | --- |
| **CA-01** | Se puede navegar desde el panel hasta cualquier viaje y volver sin perder el contexto. |
| **CA-02** | Un cliente tiene al menos dos viajes simultáneos con datos y seguimiento independientes. |
| **CA-03** | El recorrido de importación contenedorizada exige representar la devolución de contenedor. |
| **CA-04** | La carga suelta concluye sin etapa de devolución, y exportación finaliza en puerto. |
| **CA-05** | Cada viaje permite ver y actualizar visualmente su estado y eventos con hora y responsable. |
| **CA-06** | Una incidencia queda reflejada en la ficha y en los reportes del viaje. |
| **CA-07** | El indicador a tiempo / retrasado se corresponde con las fechas del ejemplo. |
| **CA-08** | La guía muestra información del mismo viaje y puede previsualizarse/descargarse como demostración. |
| **CA-09** | El reporte semanal del cliente presenta datos coherentes con los viajes de muestra. |
| **CA-10** | Los filtros por fecha, cliente y modalidad modifican los listados o cifras ilustrativas. |
| **CA-11** | La cuenta de Contabilidad accede a servicios por facturar, pagos y cartera, no a editar logística. |
| **CA-12** | Un viaje finalizado aparece en la bandeja contable; puede agruparse con otro del mismo cliente. |
| **CA-13** | Un abono parcial reduce saldo y un saldo cero cambia el estado a cobrado. |
| **CA-14** | Un viaje puede iniciar sin pago anticipado y quedar bajo modalidad contra factura o crédito. |
| **CA-15** | Las conexiones Contífico y Tracklink aparecen como integraciones futuras, no como datos en vivo. |
| **CA-16** | La importación desde Excel se representa con mapeo y vista previa comprensible. |
| **CA-17** | La navegación funciona de forma adaptativa en escritorio y teléfono para revisar estados. |

# 10. Guion de datos de demostración

Usar registros ficticios con nombres genéricos para enseñar un caso realista, sin asociarlos a clientes o transportistas reales. Las fechas y cantidades ilustrativas deben ser coherentes entre los listados, las líneas de tiempo, los reportes y las cifras contables.

| **Escenario** | **Datos ilustrativos** | **Resultado esperado** |
| --- | --- | --- |
| **A · Importación con contenedor** | Viaje IMP-001 · Puerto → Cliente → Depósito de devolución · entrega en plazo. | Timeline completo, guía y reporte de entrega a tiempo. |
| **B · Importación suelta** | Viaje IMP-002 · Puerto → Planta · parada de 60 minutos y llegada posterior a la hora prevista. | Incidencia, indicador de retraso y explicación en reporte. |
| **C · Exportación** | Viaje EXP-001 · Depósito → Cliente → Puerto · pendiente de última confirmación. | Tablero como en ejecución y última etapa sin completar. |
| **D · Dos servicios del mismo cliente** | Viajes IMP-001 e IMP-002 de un mismo cliente · montos referenciales. | Agrupación en bandeja contable, factura y pago parcial visible. |
| **E · Cartera vencida** | Factura de muestra con vencimiento pasado y saldo abierto. | Fila vencida y tarjeta de saldo pendiente. |

# 11. Límites de la fase de prototipo y decisiones de diseño

Para esta primera entrega se implementará una representación navegable y consistente de los procesos. Estas delimitaciones permiten diseñar directamente sin depender de accesos externos:

Contífico: mostrar una pantalla de integración prevista para consultar cartera, vencimientos y referencias contables. No asumir que la API, permisos o sincronización están habilitados.

Tracklink: el cliente ya utiliza este sistema para GPS. La nueva aplicación mostrará estados operativos registrados por usuarios; no replicará mapas ni posiciones en tiempo real.

Guías de remisión: usar un formato documental de ejemplo para descarga. La emisión tributaria electrónica, autorizaciones y cumplimiento con SRI requieren definición y validación en implementación, no se presentan como aprobados.

Excel: demostrar importación por columnas y tratamiento visual de errores; la migración real y limpieza de históricos se planificarán para desarrollo.

Reportes: filtros y exportación visual con datos coherentes. No requieren conexión a una base operativa real durante el prototipo.

Inteligencia artificial: no es una prioridad acordada para la primera versión. La atención debe centrarse en centralización y trazabilidad de la operación.

Ruteo: no se requiere optimización algorítmica ni despacho multiparada; se registrarán secuencias operativas conocidas de puerto, planta/cliente y devolución.

Comunicación externa: entregar documentos/reportes descargables. Mensajería automática por WhatsApp o correo no fue definida como obligatoria en la reunión.

# 12. Entregables y siguiente etapa

El equipo de diseño debe entregar una navegación coherente para los perfiles Operaciones y Contabilidad, pantallas P-01 a P-20, los recorridos F-01 a F-08 y conjuntos de datos ficticios alineados. Debe poder demostrarse el ciclo completo de una importación, una exportación y un cobro con crédito.

Después de validar visualmente el prototipo con el cliente, corresponde preparar la propuesta de implementación: arquitectura, alcance técnico, integraciones efectivas, cronograma y presupuesto. En la reunión se planteó una demostración para el día siguiente a las 16:00, sujeta a la convocatoria acordada.

**CRITERIO DE CIERRE  **El prototipo debe resolver claramente el “qué hace” y el “cómo se usa” el sistema, diferenciando siempre lo demostrativo de una integración real. No se presupone acceso a Contífico, Tracklink ni emisión tributaria certificada.

Gestión de transporte portuario  ·  Versión 1.0  ·  Página