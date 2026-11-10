# PROMPT MAESTRO v3 — PORTFLOW

## Prototipo web de Gestión de Transporte Portuario
Importaciones · Exportaciones · Seguimiento de viajes · Documentación · Facturación y cobranzas

---

## 0. MODO DE TRABAJO (LEER PRIMERO)

Este proyecto se construye **por fases, una a la vez**. Son 9 fases, numeradas de la **Fase 0 a la Fase 8** (sección 17).

**Estado actual:** la Fase 0 (análisis y arquitectura) ya está realizada y aprobada. Sus documentos están en `docs/`: `FASE-0_Analisis_y_Arquitectura.md` y `TRAZABILIDAD.md`. Léelos antes de empezar; son la referencia de arquitectura, tipos, estados, rutas y datos. Comienzas por la **Fase 1**.

Reglas del modo de trabajo:

1. Trabaja solo en la fase que se te indique. No adelantes módulos de fases posteriores.
2. Al terminar cada fase, entrega el informe descrito en la sección 18 y **detente** hasta recibir la aprobación explícita ("aprobada la fase N").
3. Cada fase debe dejar la aplicación en un estado que compile, se ejecute sin errores y sea navegable.
4. Si detectas un error que puedes corregir directamente dentro de la fase, corrígelo sin pedir autorización.
5. Si surge una decisión no definida que cambie el alcance, haz **una** pregunta concreta antes de implementarla. No inventes respuestas para decisiones críticas.
6. Los supuestos listados en la sección 15 ya están decididos para el prototipo; no los vuelvas a preguntar.
7. Prioriza calidad sobre velocidad, pero no agregues funcionalidades fuera del alcance.
8. Dentro de cada fase trabaja en pasos pequeños y confirma al cerrar cada paso.

---

## 1. ROL Y OBJETIVO

Actúa como desarrollador senior Full Stack especializado en React, diseño UX/UI, sistemas empresariales y logística portuaria.

Desarrolla desde cero un **prototipo web navegable, moderno y funcional** para presentar a un cliente empresarial de transporte terrestre vinculado a movimientos portuarios en Ecuador.

No es un sistema genérico de transporte. Es una solución específica para la operación descrita en el documento de requerimientos.

El prototipo debe permitir que el cliente comprenda:

- Cómo se registran las solicitudes de transporte.
- Cómo se programan y asignan los viajes.
- Cómo se controlan importaciones y exportaciones.
- Cómo se registran hitos, paradas, retrasos e incidencias.
- Cómo se generan y consultan los documentos.
- Cómo se presentan los reportes operativos y para clientes.
- Cómo se controlan los servicios por facturar, los pagos y la cartera a crédito.
- Cómo se diferencian los permisos de Operaciones y Contabilidad.

La demostración debe mostrar el ciclo completo:

**Solicitud → Programación → Viaje → Seguimiento → Entrega → Cierre → Facturación → Pago.**

Debe diferenciar siempre lo demostrativo de una integración real. No presentes funcionalidades futuras como implementadas.

---

## 2. FUENTE DE VERDAD Y PRECEDENCIA

La fuente principal es el documento de requerimientos. Está en el repositorio como:

- `docs/requerimientos.md` (versión en Markdown, usar esta para leer)
- `docs/FASE-0_Analisis_y_Arquitectura.md` y `docs/TRAZABILIDAD.md` (resultado de la Fase 0, ya aprobado)
- `Requerimientos_Prototipo_Gestion_Transporte_Portuario_Importaciones_Exportaciones.docx` (original)

Antes de escribir código:

1. Lee el documento completo.
2. Conserva los identificadores: RF-01 a RF-58, RN-01 a RN-15, CA-01 a CA-17, F-01 a F-08, P-01 a P-20.
3. **Si este prompt y el documento se contradicen, prevalece el documento**, salvo en decisiones de stack, estructura de código y diseño visual, donde prevalece este prompt.
4. No omitas requerimientos por parecer secundarios.
5. Si algo no puede implementarse completamente, represéntalo de forma visual y navegable, indicando su alcance demostrativo.
6. No inventes procesos tributarios, permisos, integraciones, reglas de facturación ni funcionalidades GPS que no estén definidas.

---

## 3. REFERENCIAS VISUALES Y FUNCIONALES

Úsalas solo como inspiración conceptual de cómo se organizan los sistemas de logística:

- **NEXTRADE** (https://nextrade.ec/): dashboard, importaciones/exportaciones, gestión documental, indicadores, alertas, trazabilidad.
- **DrayMate** (https://draymate.com/): programación de viajes, asignación de transportistas, unidades, choferes, contenedores.
- **EzModal** (https://ezmodal.com/): operaciones portuarias, órdenes, contenedores, seguimiento, documentación.

No copies identidad visual, logotipos, textos comerciales ni diseño propietario. No afirmes tener acceso a sus sistemas internos. El prototipo debe tener identidad visual propia.

---

## 4. IDENTIDAD DEL PROYECTO

- Nombre del prototipo: **PORTFLOW**
- Nombre descriptivo: Gestión de Transporte Portuario
- Subtítulo: Importaciones · Exportaciones · Operaciones · Documentación

PORTFLOW debe aparecer en: pantalla de acceso, sidebar, dashboard, encabezados y pantallas principales. No uses "CraftifyPortalSAAS" como nombre del producto.

---

## 5. STACK Y ARQUITECTURA

Frontend:

- React + Vite + **TypeScript** en modo estricto (`"strict": true`).
- Prohibido `any` salvo justificación puntual comentada. Todas las entidades, estados y props se tipan.
- Los tipos del dominio (Cliente, Solicitud, Viaje, Evento, Incidencia, Documento, Factura, Pago, Usuario, etc.) viven en `src/tipos/` y son la única definición de cada entidad.
- Si se usa Zod, los tipos de formulario se derivan con `z.infer` para no duplicarlos.
- Estados, modalidades y tipos se definen como uniones literales o `as const` y alimentan formularios, filtros y badges.
- React Router.
- **Tailwind CSS v4** con el plugin `@tailwindcss/vite`. La paleta se define en `src/estilos/tema.css` con `@theme` y se usa mediante utilidades. Sin otros frameworks de UI.
- Lucide React (iconos).
- Recharts (gráficos).
- React Hook Form y Zod, si resultan convenientes.
- XLSX (SheetJS) para importar y exportar Excel.
- jsPDF (y jspdf-autotable) para exportar PDF, más una hoja de estilos de impresión para la guía.

Persistencia demostrativa:

- `localStorage`, con una **clave versionada** (por ejemplo `portflow:v1`) y una función de migración o reinicio si cambia la versión del esquema.
- Todas las entidades persisten: clientes, solicitudes, viajes, transportistas, choferes, unidades, contenedores, eventos, incidencias, documentos, facturas, pagos, usuarios, lugares, catálogos, actividad y configuración.
- Los datos creados durante la demostración se conservan al recargar la página.
- Debe existir un botón **"Restablecer datos demostrativos"** (en Configuración) que regenere el conjunto inicial con confirmación.

Backend: no se desarrolla. El código debe quedar organizado para conectar luego una API REST: toda lectura y escritura pasa por la capa `servicios/`, nunca directo desde los componentes. No simules conexiones con servicios externos.

Estructura (definida en la Fase 0; no un único `App.tsx`):

```
src/
  tipos/ dominio.ts
  componentes/ maquetacion/ comunes/ tablas/ formularios/ graficos/ modales/
  paginas/ acceso/ dashboard/ clientes/ solicitudes/ programacion/ viajes/
           seguimiento/ incidencias/ documentos/ reportes/ contabilidad/
           catalogos/ importacion/ actividad/ integraciones/ configuracion/
  contexto/ ContextoAutenticacion.tsx ContextoApp.tsx
  hooks/
  servicios/ almacenamiento.ts repositorio.ts exportacion.ts documentos.ts
             busqueda.ts actividad.ts operaciones/
  datos/ generadorDatos.ts
  utilidades/ calculos.ts validadores.ts formateadores.ts constantes.ts permisos.ts
  rutas/
  estilos/ tema.css
public/
  muestras/ importacion_viajes_demo.xlsx importacion_clientes_demo.xlsx
docs/
```

Las listas (estados, modalidades, tipos, catálogos) se definen **una sola vez** (`constantes.ts` o catálogos persistidos) y alimentan todos los formularios y filtros. Prohibido duplicar listas dentro de componentes.

---

## 6. CONVENCIONES GENERALES

- Idioma de la interfaz: **español (Ecuador)**.
- Moneda: **USD**, formato `$1,250.00`.
- Fechas: `dd/mm/aaaa`; horas en formato 24 h. Zona horaria de Ecuador.
- **No uses emojis** en ninguna parte (interfaz, textos, código, datos). Usa iconos de Lucide.
- **Nombres en español** para variables, funciones, tipos, componentes, archivos y mensajes (`guardar`, `listar`, `buscar`, `eliminar`).
- **Sin comentarios en línea** en el código.
- Todos los datos son ficticios con nombres genéricos; no los asocies a empresas reales de manera que parezcan operaciones auténticas.

Identificadores únicos y consistentes:

| Entidad | Formato |
|---|---|
| Cliente | CLI-001 |
| Solicitud | SOL-001 |
| **Viaje (importación)** | **IMP-001** |
| **Viaje (exportación)** | **EXP-001** |
| Transportista | TRA-001 |
| Chofer | CHO-001 |
| Unidad | UNI-001 |
| Evento | EVT-001 |
| Incidencia | INC-001 |
| Documento / guía | DOC-001 |
| Factura | FAC-001 |
| Pago | PAG-001 |
| Lugar | LUG-001 |
| Usuario | USR-001 |

**El código del viaje es IMP-xxx o EXP-xxx.** No existe un código `VIA-`. Ese mismo código aparece en todas las vistas, documentos, reportes y la bandeja contable (RF-54, RN-14). Las importaciones contenedorizadas y de carga suelta comparten la secuencia IMP.

---

## 7. PERFILES Y PERMISOS

Pantalla de acceso (P-01): seleccionar **Operaciones** o **Contabilidad**. No hay autenticación real. La selección modifica efectivamente menú, rutas y acciones disponibles. Cliente y transportista no inician sesión: reciben guías y reportes descargables.

**Usuarios demostrativos (para actividad, eventos y responsables):**

- Operaciones (3 usuarios con permisos equivalentes): USR-001, USR-002, USR-003 (nombres genéricos). El perfil puede alternar entre ellos desde el header para que el registro de actividad muestre distintos responsables.
- Contabilidad (1 usuario): USR-004.

La cuenta de monitoreo no es un rol adicional: sus tareas las realiza uno de los tres usuarios operativos.

| Área | Operaciones | Contabilidad |
|---|---|---|
| Dashboard operativo | Sí | No |
| Dashboard contable | No | Sí |
| Clientes | Crear, editar, consultar | Solo consulta |
| Solicitudes, Programación, Viajes | Crear, editar, cerrar | No |
| Detalle de viaje | Completo | Consulta limitada (datos mínimos del viaje y cliente) |
| Seguimiento e incidencias | Crear, editar, resolver | No |
| Documentos y guías | Sí | No |
| Reportes operativos y para cliente | Sí | No |
| Reportes contables demostrativos | No | Sí |
| Por facturar, Facturas, Cartera, Pagos | Sin acceso | Crear, editar, validar |
| Catálogos | Sí | No |
| Importar Excel, Actividad, Integraciones, Configuración | Sí | No (Integraciones: solo consulta) |

Contabilidad **no** puede crear viajes, modificar transportistas, choferes ni programación, ni editar incidencias. Los botones no permitidos se ocultan o se deshabilitan con explicación, y las rutas protegidas redirigen.

---

## 8. SIDEBAR Y NAVEGACIÓN

Layout: sidebar izquierda, header superior, área principal, breadcrumbs, título, descripción, acciones, filtros, tablas, formularios, paneles de detalle y modales.

Header: nombre del sistema, **búsqueda global**, notificaciones, perfil (con selector de usuario y cambio de perfil), acceso a configuración.

**Búsqueda global (RF-55):** busca viajes por código, cliente, número de contenedor o placa, y navega al detalle del viaje.

Menú:

- **Principal:** Dashboard.
- **Operaciones:** Clientes, Solicitudes, Viajes, Programación, Seguimiento, Incidencias.
- **Documentación:** Documentos, Guías de remisión, Reportes.
- **Contabilidad:** Por facturar, Facturas, Cartera, Pagos.
- **Administración:** Catálogos, Importar Excel, Actividad, Integraciones, Configuración.

Cada elemento navega a una pantalla real. Sin enlaces vacíos.

**Contexto de navegación (CA-01):** al ir del dashboard o de un listado a un viaje y volver, se conservan filtros, búsqueda, página y orden.

---

## 9. MODELO DE DATOS Y ESTADOS

Campos mínimos por entidad (sección 8 del documento):

- **Cliente:** código, razón social, identificación, contacto, correo, teléfono, estado.
- **Solicitud:** código, cliente, tipo de operación, carga, origen, destino, fecha requerida, indicaciones del cliente y observaciones, estado.
- **Viaje:** código, solicitud, cliente, modalidad, fechas y horas previstas (salida, llegada, cierre) y reales, transportista, chofer, unidad, ruta de puntos operativos, contenedor, valor referencial, modalidad de cobro, estado, motivo de cancelación si aplica.
- **Contenedor / carga:** carga suelta o contenedorizada, tipo de contenedor, número, descripción, observaciones.
- **Etapa / evento:** viaje, tipo, ubicación, hora prevista, hora real, responsable, comentario, evidencia opcional.
- **Incidencia:** viaje, tipo, fecha, hora, ubicación, descripción, responsable, evidencia, estado, acción correctiva, fecha de resolución.
- **Guía / documento:** viaje, tipo, número referencial, fecha de generación, emisor, receptor, archivo, versión.
- **Factura:** cliente, viajes, referencia, fecha, vencimiento, valor, saldo, estado.
- **Pago:** factura, fecha, valor, referencia, validador, estado (registrado o validado).
- **Recurso:** transportista, chofer, placa/unidad, contacto, disponibilidad ilustrativa.

### Estados del viaje
Solicitado · Programado · En ejecución · Entregado / pendiente devolución · Finalizado · Cancelado.
**Con incidencia** es una etiqueta transversal visible en cualquier etapa mientras exista una incidencia no resuelta. **Cancelado** exige motivo documentado.

### Estados de facturación y cobranza
- Servicio: **Por facturar**, **Facturado**.
- Factura: **Pendiente / parcial** (saldo abierto, con cero o varios abonos), **Vencido** (saldo pendiente y vencimiento sobrepasado), **Cobrado** (saldo en cero con pago validado).

### Tipos de solicitud / modalidad
Importación contenedorizada · Importación de carga suelta · Exportación.

### Modalidad de cobro (RF-48, RN-11)
Contra factura · A crédito. Es un campo visible en viaje y factura. **No existe validación de anticipo previo a la salida.**

---

## 10. REGLAS DE NEGOCIO Y CÁLCULOS

Implementa RN-01 a RN-15. Interpretación operativa:

- El viaje es la unidad central (RN-01). Un cliente puede tener varios viajes simultáneos con bitácoras y documentos independientes (RN-02).
- **Cierre por modalidad:** contenedorizada se cierra tras la devolución del contenedor; carga suelta con la entrega confirmada; exportación con la entrega en puerto, sin trámites aduaneros posteriores (RN-03, RN-04, RN-05).
- **Secuencias:**
  - Importación contenedorizada: Salida de puerto → Llegada a cliente/planta → Descarga → Entrega → Devolución de contenedor → Cierre. Queda "Entregado / pendiente devolución" hasta registrar la devolución.
  - Importación de carga suelta: Salida de puerto → Llegada a cliente/planta → Descarga → Entrega → Cierre. Sin devolución.
  - Exportación: Retiro de contenedor en depósito → Llegada a cliente/planta → Carga → Salida a puerto → Entrega en puerto → Cierre.
  Cada modalidad tiene una secuencia visual diferente. Sin optimización de rutas.
- Monitoreo **manual** por hitos; nunca se muestra como GPS en tiempo real (RN-06).
- Cada evento incluye fecha, hora, responsable y detalle, y se ordena cronológicamente (RN-07).
- **Retraso (RN-08):** se determina comparando la hora real contra el compromiso registrado en el viaje; no existe una meta universal.
  - `desvío = hora real - hora prevista` (minutos, positivo = retraso).
  - A tiempo: real menor o igual a prevista. Retrasado: real mayor a prevista.
  - Solo se calcula cuando existen ambos valores.
  - **Cumplimiento %** = entregas a tiempo / entregas con compromiso y hora real registrada.
- **Incidencias (RN-09):** una incidencia no bloquea sola el cierre; antes de finalizar debe estar resuelta o tener una observación documentada. Cerrar una incidencia exige acción correctiva y fecha de resolución.
- Se resaltan visualmente las operaciones detenidas, retrasadas o con novedad no resuelta (RF-29).
- Cada cambio de estado se guarda en un **historial visible dentro del viaje** (RF-31).
- **Solapamiento (RF-13):** al asignar la misma unidad o chofer a viajes superpuestos se muestra un aviso visible, **sin bloquear** el guardado.
- **Cambio de programación (RF-14):** exige registrar motivo y fecha del ajuste; queda en el historial y en Actividad.
- **Elegibilidad para facturar (RN-10, RF-44):** un viaje finalizado y aún no incluido en una factura aparece en "Por facturar".
- **Agrupación:** solo servicios del mismo cliente. Se bloquea la mezcla de clientes con mensaje claro.
- **Saldo (RN-12)** = valor de factura - pagos **validados**. Pago parcial reduce saldo; saldo cero cambia a **Cobrado**; saldo pendiente con vencimiento pasado muestra **Vencido**.
- **Cartera próxima a vencer (RF-51):** alerta visual cuando faltan N días para el vencimiento (N configurable, por defecto 7).
- No se permiten pagos mayores al saldo (ver supuestos).
- Los reportes compartibles con clientes **no** incluyen cartera, pagos ni observaciones contables privadas (RN-13).
- Guías y reportes de una operación muestran siempre el mismo código de viaje y cliente (RN-14).
- La guía de remisión es demostrativa y lleva la leyenda: **"Documento demostrativo de transporte. No constituye un documento tributario autorizado."** (RN-15).
- Eliminación: confirmación obligatoria. Los viajes finalizados se cancelan o desactivan; no se eliminan.

---

## 11. PANTALLAS (P-01 a P-20)

Cada pantalla usa datos reales del prototipo. Sin pantallas vacías, sin lorem ipsum, sin botones decorativos.

**P-01 Acceso / selección de perfil.** Operaciones o Contabilidad, con marca PORTFLOW y aviso de que es un prototipo demostrativo.

**P-02 Dashboard operativo (RF-37, RF-38).**
- Indicadores: servicios del día, viajes programados, en ejecución (en ruta), entregas realizadas, pendientes de devolución, pendientes de cierre, finalizados, retrasados, incidencias abiertas.
- Gráficos: operaciones por modalidad, viajes por estado, cumplimiento, actividad semanal, distribución importaciones/exportaciones.
- Paneles: próximas llegadas, operaciones activas, incidencias pendientes, viajes sin asignación, últimos eventos.
- Acciones rápidas: nueva solicitud, crear viaje, registrar incidencia, consultar programación, abrir reportes.
- Filtros por rango de fechas, cliente, modalidad, transportista y estado, que recalculan indicadores y gráficos. Todo se calcula desde los datos.
- Dashboard contable para Contabilidad: por facturar, facturado, cartera pendiente, vencida y próxima a vencer.

**P-03 Clientes (RF-01, RF-02).** Listar, buscar por nombre, código e identificación, filtrar, crear, editar. Ficha con información general, solicitudes, viajes, servicios, documentos y resumen de operaciones.

**P-04 Nueva solicitud / P-05 Solicitudes (RF-03 a RF-07).** Formulario: cliente, tipo de operación, tipo de carga, descripción, origen, destino, fecha requerida, indicaciones del cliente, observaciones, estado. Bandeja con código, cliente, modalidad, origen, destino, fecha, estado y acciones; filtros por cliente, fecha, tipo y estado. Convertir una solicitud aceptada en viaje conserva los datos, genera un código único y actualiza el estado de la solicitud.

**P-06 Programación (RF-12).** Vista lista y calendario, filtros, ordenamiento, acceso al detalle y panel de operaciones pendientes de asignación. Columnas: viaje, fecha, hora, cliente, modalidad, transportista, chofer, unidad, origen, destino, estado.

**P-07 Crear / editar viaje (RF-08 a RF-11, RF-14).** Campos: solicitud, cliente, modalidad, carga, tipo y número de contenedor, origen, destino, ruta de puntos operativos, transportista, chofer, unidad, fecha y hora previstas de salida, llegada y cierre, modalidad de cobro, valor referencial, observaciones. Validaciones de campos, fechas, asignaciones y solapamiento (solo aviso).

**P-08 Detalle de viaje (RF-21, RF-26).**
- Encabezado: código, cliente, modalidad, estado, fecha, transportista, unidad, chofer.
- Resumen: origen, destino, carga, contenedor, fecha prevista, fecha real, último evento, responsable.
- Pestañas: Resumen, Seguimiento, Incidencias, Documentos, Reportes, Información administrativa (incluye historial de estados).
- Acciones funcionales: editar, registrar evento, registrar incidencia, generar guía, consultar documentos, finalizar, cancelar.

**P-09 Línea de tiempo (RF-19, RF-22, RF-23, RF-27, RF-28).** Evento, ubicación, fecha, hora prevista, hora real, desvío, responsable, observación. Hitos predefinidos adaptados a la modalidad. Indicador a tiempo / retrasado.

**P-10 Registrar evento / incidencia (RF-24, RF-25, RF-30).** Tipos: demora, parada, espera, problema mecánico, problema operativo, cambio de ruta, documentación, entrega, otro. Adjuntar evidencia (archivo ilustrativo) tanto en eventos como en incidencias. Cierre de incidencia con acción correctiva y fecha de resolución.

**P-11 Guía de remisión y documentos (RF-32 a RF-36).** Número referencial, fecha de generación, remitente, destinatario, identificación, transportista, chofer, unidad, placa, origen, destino, carga, contenedor, recorrido, código de viaje, emisor, receptor, versión. Vista previa, impresión, descarga demostrativa, consulta histórica de guías por viaje. Adjuntar otros documentos (nombre, tipo, fecha, descripción, viaje). **Descargar paquete documental del viaje** (demostrativo).

**P-12 Reportes operativos / P-13 Reporte para cliente (RF-39 a RF-43).**
- Operativos por viajes, clientes, modalidad, transportistas, estados, fecha, cumplimiento e incidencias, con filtros por fechas, cliente, modalidad, transportista y estado.
- Reporte por viaje: código, cliente, modalidad, origen, destino, recursos, etapas, horas previstas y reales, desvío, incidencias, observaciones, cumplimiento.
- Reporte **semanal y mensual** por cliente: servicios realizados, en ejecución, retrasados, entregas a tiempo, incidencias, consolidado.
- Vista interna detallada y versión compartible separadas (sin cartera, pagos ni observaciones contables).
- Exportación demostrativa a PDF y Excel que contiene los datos filtrados.

**P-14 Por facturar / P-15 Facturas / P-16 Cartera y pagos (RF-44 a RF-52).**
- Por facturar: código, cliente, modalidad, fecha de finalización, servicio, valor, estado. Selección y agrupación por cliente con subtotal; registro de referencia, fecha, valor y vencimiento. Sin facturas fiscales reales.
- Facturas: código, cliente, viajes, referencia, fecha, vencimiento, valor, saldo, estado, modalidad de cobro.
- Cartera: cliente, factura, fecha, vencimiento, valor, abonos, saldo, estado, alertas de próxima a vencer y vencida.
- Pagos: registrar pago (fecha, referencia, valor, factura), validar (validador y estado).

**P-17 Catálogos (RF-08, RF-53).** Transportistas, choferes, unidades, clientes, lugares, tipos de carga, **tipos de evento / hitos**, tipos de incidencia. Cada uno: listar, buscar, crear, editar, activar y desactivar. Alimentan los formularios.

**P-18 Importar Excel (RF-56).** Pasos: selección de archivo (incluye archivo de muestra descargable), vista previa, identificación de columnas, mapeo, validación con tratamiento visual de errores, confirmación, resultado. Importa clientes o viajes y los datos aparecen en los listados. La muestra incluye algunas filas con errores intencionales.

**P-19 Actividad / historial (RF-57).** Usuario, fecha, hora, acción, entidad, código y descripción. Se registran creación, edición, conversión, asignación, cambio de programación, evento, incidencia, documento, factura y pago, generados por acciones reales del prototipo.

**P-20 Integraciones (RF-52).**
- **Contífico:** nombre, descripción, estado **"Pendiente de integración"**, funcionalidad prevista (consulta de cartera, vencimientos, referencias contables), información que podría consultarse, estado de sincronización ("Sin sincronizar").
- **Tracklink:** nombre, descripción, estado **"Pendiente de integración"**, funcionalidad prevista. Seguirá siendo el sistema externo de GPS; el prototipo no muestra mapas ni posiciones.
- No afirmar conexión activa, no inventar credenciales ni APIs.

---

## 12. DATOS DEMOSTRATIVOS

Conjunto inicial **estable, coherente y relacionado**. Si un viaje aparece en el dashboard, existe en la lista de viajes con los mismos datos; si aparece en un reporte, coincide; si está finalizado, aparece en la bandeja contable cuando corresponde.

Referencias geográficas ilustrativas: Puerto de Guayaquil, Posorja, Guayaquil, Durán, Quito, instalaciones de clientes, depósitos de contenedores.

**Escenarios obligatorios (sección 10 del documento):**

| Escenario | Datos | Resultado esperado |
|---|---|---|
| A · Importación con contenedor | IMP-001: Puerto → Cliente → Depósito de devolución, entrega en plazo | Línea de tiempo completa, guía y reporte con entrega a tiempo |
| B · Importación suelta | IMP-002: Puerto → Planta, parada de 60 min, llegada posterior a la hora prevista | Incidencia, indicador de retraso y explicación en reporte |
| C · Exportación | EXP-001: Depósito → Cliente → Puerto, pendiente de última confirmación | En ejecución, última etapa sin completar |
| D · Dos servicios del mismo cliente | IMP-001 e IMP-002 del mismo cliente, montos referenciales | Agrupación en bandeja contable, factura y pago parcial visible |
| E · Cartera vencida | Factura de muestra con vencimiento pasado y saldo abierto | Fila vencida y tarjeta de saldo pendiente |

Además:

- Al menos un cliente con **dos o más viajes simultáneos** con seguimiento independiente (CA-02).
- Al menos un viaje en cada estado del viaje, una solicitud en cada estado, un viaje sin asignación, una factura próxima a vencer, una cobrada y una cancelada con motivo.
- Viajes de ambas modalidades de cobro (contra factura y a crédito), ninguno con anticipo.
- Catálogos con datos suficientes: transportistas, choferes, unidades, lugares, tipos de carga, tipos de evento, tipos de incidencia.

**Fechas relativas:** el generador de datos calcula todas las fechas **relativas a la fecha del día** (o a una "fecha base de demostración" configurable), de modo que "servicios del día", "próximas llegadas", "vencido" y "próximo a vencer" funcionen siempre. "Restablecer datos demostrativos" regenera con la fecha vigente.

---

## 13. RECORRIDOS DE DEMOSTRACIÓN (F-01 A F-08)

Deben funcionar de principio a fin sin errores:

- **F-01 Importación contenedorizada:** registrar cliente y solicitud → programar → asignar chofer, unidad y contenedor → salida de puerto → llegada a cliente → entrega → devolución de contenedor → cierre.
- **F-02 Importación de carga suelta:** crear solicitud → transporte puerto–cliente → hitos de entrega → finalizar sin devolución.
- **F-03 Exportación:** solicitar retiro de contenedor → asignar recursos → paso por cliente/planta → entrega en puerto → finalizar.
- **F-04 Incidencia y retraso:** abrir viaje en curso → agregar parada o inconveniente con hora → comparar contra hora prevista → resolver incidencia → verla en el reporte.
- **F-05 Reporte para cliente:** filtrar por cliente y semana → entregados, en ruta y a tiempo → generar vista → descargar ejemplo.
- **F-06 Guía de remisión:** abrir viaje → completar campos documentales → visualizar guía → descargar versión de ejemplo.
- **F-07 Facturación y crédito:** cerrar viaje → ver por facturar → agrupar con otro viaje del cliente → registrar factura → pago parcial → verificar saldo y vencimiento → cancelar saldo.
- **F-08 Consolidación desde Excel:** seleccionar archivo demostrativo → mapear columnas → vista previa → confirmar → ver datos en listados.

---

## 14. CRITERIOS DE ACEPTACIÓN Y TRAZABILIDAD

Verifica CA-01 a CA-17 del documento. En particular:

- Navegar del dashboard a un viaje y volver sin perder contexto.
- Dos viajes simultáneos independientes por cliente.
- Contenedorizada exige devolución; carga suelta no; exportación finaliza en puerto.
- Eventos actualizan estado y seguimiento, con hora y responsable.
- Incidencias visibles en la ficha y en reportes.
- Indicador a tiempo / retrasado coherente con las fechas.
- Guía con datos del mismo viaje; reportes coherentes; filtros funcionales.
- Contabilidad restringida; finalizados visibles por facturar; agrupación por cliente.
- Pago parcial reduce saldo; saldo cero cambia a Cobrado; sin anticipo obligatorio.
- Integraciones presentadas como futuras; importación con vista previa; navegación responsive.

**Matriz de trazabilidad (obligatoria):** mantén `docs/TRAZABILIDAD.md` (ya existe una versión inicial de la Fase 0) con una tabla que relacione cada **RF, RN, CA, F y P** con la pantalla, componente o servicio que lo implementa y su estado (implementado, parcial, demostrativo). Se actualiza al cierre de cada fase y es la evidencia de que no se omitió nada.

---

## 15. SUPUESTOS DE PROTOTIPO (YA DECIDIDOS)

El documento no los define; se adoptan para el prototipo y se marcan como supuestos en la interfaz o el README cuando corresponda:

1. Código de viaje IMP-xxx / EXP-xxx (sin `VIA-`).
2. Los tipos de incidencia son los listados en P-10.
3. "Próxima a vencer" = 7 días antes del vencimiento, configurable.
4. Un pago mayor al saldo se rechaza con mensaje; no genera saldo negativo.
5. Dashboard y reportes contables demostrativos para Contabilidad.
6. Moneda USD y formato de fecha dd/mm/aaaa.
7. Cuatro usuarios demostrativos (3 operativos, 1 contable) sin autenticación real.
8. Estados de solicitud: recibida, aceptada, convertida, rechazada. Estados de incidencia: abierta y resuelta.
9. El contenedor se guarda dentro del viaje y el calendario es propio, sin librería externa.
10. Operaciones no tiene acceso al menú de Contabilidad.

---

## 16. DISEÑO UX/UI Y RESPONSIVE

Debe parecer un software empresarial de uso diario, no una landing page ni una plantilla genérica.

- **Paleta oficial: grafito y mostaza.** Es una decisión cerrada; no propongas otra. Define estos colores en `src/estilos/tema.css` con `@theme` de Tailwind v4 y úsalos solo mediante utilidades (`bg-barra`, `text-acento`, `bg-fondo`, etc.); no escribas colores a mano en los componentes:

```css
@import "tailwindcss";

@theme {
  --color-barra: #14171A;
  --color-barra-hover: #1F2428;
  --color-acento: #E2A829;
  --color-acento-hover: #C98F14;
  --color-acento-suave: #FBF1D9;
  --color-fondo: #F4F5F7;
  --color-superficie: #FFFFFF;
  --color-borde: #E1E4E8;
  --color-texto: #1B1F23;
  --color-texto-secundario: #5B6470;
  --color-primario: #1F2328;
  --color-sobre-primario: #FFFFFF;
  --color-info: #2F6FA8;
  --color-info-fondo: #E6F0F8;
  --color-exito: #1E5E3B;
  --color-exito-fondo: #E3F3EA;
  --color-pendiente: #7A5200;
  --color-pendiente-fondo: #FFF3D6;
  --color-peligro: #8E2A1F;
  --color-peligro-fondo: #FBE7E4;
}
```

- Reglas de uso de la paleta:
  - Negro grafito solo en sidebar y header; el área de trabajo es clara.
  - La mostaza es solo acento: logo, ítem activo del menú, anillo de foco, dato destacado en gráficos. **Nunca como texto sobre fondo claro** y **nunca como relleno de botones principales**.
  - Los botones principales son grafito con texto blanco; los secundarios, con borde.
  - Los estados conservan su color universal: verde = completado, ámbar claro = pendiente, rojo = incidencia, azul = información. Esto evita que la marca se confunda con un estado.
  - Verifica contraste de texto suficiente (mínimo 4.5:1) en todas las combinaciones.
- Sin gradientes excesivos, sombras fuertes, tarjetas gigantes ni colores saturados. Sin emojis.
- Estados con badges consistentes en todo el sistema.
- Tablas profesionales con búsqueda, filtros, ordenamiento, paginación y acciones por fila.
- Escritorio: sidebar visible, formularios en columnas. Tablet: sidebar adaptable, tablas con scroll horizontal. Móvil: sidebar como menú, formularios de una columna, botones accesibles, información vertical.
- Todos los botones funcionan. Modales de confirmación para eliminar, cerrar, cancelar y finalizar. Notificaciones (toasts) tras cada acción.

---

## 17. PLAN DE FASES

| Fase | Contenido | Pantallas | Criterio de salida |
|---|---|---|---|
| **0. Análisis y arquitectura (realizada y aprobada)** | Lectura completa, síntesis, modelo de datos, rutas, permisos, matriz de trazabilidad inicial, plan técnico. Sin código de interfaz. Incluye el diseño de los tipos TypeScript del dominio. | — | Síntesis y arquitectura aprobadas. |
| **1. Base técnica, diseño y datos** | Proyecto Vite + React + TypeScript estricto, tipos del dominio, estilos y tokens (Tailwind y paleta grafito y mostaza de la sección 16), layout (sidebar, header, breadcrumbs), componentes comunes (tablas, badges, modales, toasts), perfiles y rutas protegidas, capa de servicios, localStorage versionado, generador de datos (escenarios A a E, fechas relativas), restablecer datos. | P-01 | App navegable con ambos perfiles y datos cargados. |
| **2. Clientes, solicitudes y catálogos** | CRUD de clientes con ficha; solicitudes con filtros y conversión a viaje; catálogos centralizados que alimentan formularios. | P-03, P-04, P-05, P-17 | Una solicitud se convierte en viaje conservando datos. |
| **3. Programación y viajes** | Formulario de viaje, programación en lista y calendario, avisos de solapamiento, cambio de programación con motivo, tres modalidades con secuencias distintas, detalle de viaje con pestañas, búsqueda global. | P-06, P-07, P-08 | F-01 a F-03 hasta el punto de crear y asignar. |
| **4. Seguimiento, incidencias y dashboard** | Línea de tiempo, eventos por modalidad, cálculo de desvío y cumplimiento, incidencias, estados transversales, historial de estados, dashboard operativo con filtros y gráficos. | P-09, P-10, P-02 | F-01 a F-04 completos. |
| **5. Documentación y reportes** | Guía de remisión (vista previa, impresión, descarga, histórico), documentos adjuntos, paquete documental, reportes operativos, por viaje, semanal y mensual por cliente, versión compartible, exportación PDF y Excel. | P-11, P-12, P-13 | F-05 y F-06 completos. |
| **6. Contabilidad y cobranzas** | Dashboard contable, por facturar, agrupación, facturas, cartera, pagos y validación, alertas de vencimiento, restricciones de perfil. | P-14, P-15, P-16 | F-07 completo; CA-11 a CA-14. |
| **7. Administración e integraciones** | Importación desde Excel con mapeo y errores, actividad, integraciones futuras, configuración. | P-18, P-19, P-20 | F-08 completo; CA-15 y CA-16. |
| **8. Validación, responsive y cierre** | Ejecución de F-01 a F-08 y CA-01 a CA-17, corrección de errores, revisión responsive, consistencia de datos, README, matriz de trazabilidad final. | Todas | Informe de validación sin errores importantes. |

**Prioridad si el tiempo es limitado:** las fases 0 a 6 sostienen los recorridos F-01, F-04 y F-07, que son los esenciales para la demostración comercial.

---

## 18. FORMATO DE ENTREGA POR FASE

Al terminar cada fase, entrega:

1. Resumen de lo implementado.
2. Archivos creados o modificados.
3. Requisitos cubiertos (RF, RN, CA, F, P) y matriz de trazabilidad actualizada.
4. Cómo probarlo (pasos concretos en el navegador).
5. Limitaciones o supuestos de la fase.
6. Resultado de las validaciones ejecutadas: verificación de tipos sin errores (`tsc --noEmit`), `npm run build` exitoso, ejecución y recorridos probados.
7. Siguiente fase propuesta.

Luego **detente y espera la aprobación**.

---

## 19. ENTREGABLE FINAL

- Prototipo web funcional y navegable.
- Código fuente React organizado.
- Datos demostrativos coherentes y archivos de muestra para importación.
- `README.md` con: descripción, tecnologías, instalación, ejecución, estructura, funcionalidades, perfiles, datos demostrativos, limitaciones y próximos pasos.
- `docs/TRAZABILIDAD.md`.

Instrucciones de ejecución:

```
npm install
npm run dev
npm run build   (compila y verifica tipos)
```

No es necesario generar ZIP ni paquete descargable.

---

## 20. RESTRICCIONES (NO DESARROLLAR EN ESTA FASE DE PROTOTIPO)

GPS en tiempo real · Integración real con Tracklink · Integración real con Contífico · Emisión tributaria electrónica o cumplimiento SRI · Optimización de rutas · Despacho automático o multiparada · Aplicación móvil nativa · Inteligencia artificial · Automatizaciones externas · Envío real de WhatsApp o correo · Autenticación empresarial · Backend productivo · Módulos innecesarios.

No cambies reglas de negocio. No inventes integraciones. No reemplaces funcionalidades por botones decorativos.

---

## 21. INSTRUCCIÓN FINAL

La Fase 0 ya está hecha. Lee `docs/requerimientos.md`, `docs/FASE-0_Analisis_y_Arquitectura.md` y `docs/TRAZABILIDAD.md`, y comienza por la **Fase 1**, en estos pasos pequeños (confirma al cerrar cada uno):

1. Proyecto Vite + React + TypeScript estricto, Tailwind v4 con la paleta en `tema.css`, tipos del dominio, constantes y permisos.
2. Capa de servicios, almacenamiento versionado y generador de datos demostrativos (14 viajes, escenarios A a E).
3. Contextos, rutas protegidas y funciones de cálculo.
4. Maquetación (sidebar, header, breadcrumbs), componentes comunes y pantalla de acceso (P-01).

El objetivo es presentar al cliente una propuesta visual y funcional clara de su futuro sistema de Gestión de Transporte Portuario, respetando completamente el documento de requerimientos y diferenciando siempre lo demostrativo de una integración real.
