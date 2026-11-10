# PORTFLOW — Fase 0: Análisis y arquitectura

Esta fase no incluye código de interfaz. Define qué se construye, cómo se organiza y en qué orden. Equivale a la "Fase 1" del prompt maestro; desde aquí la numeración de trabajo es Fase 0 a Fase 8.

Convenciones adoptadas para todo el proyecto:

- Nombres en español para variables, funciones, tipos, archivos y mensajes (`guardar`, `listar`, `buscar`, `eliminar`).
- Código sin comentarios en línea.
- Sin emojis en ninguna parte; solo iconos de Lucide.
- Entrega por pasos pequeños con confirmación al cerrar cada fase.

---

## 1. Síntesis del documento de requerimientos

**Qué es.** Un sistema centralizado para operaciones de transporte terrestre vinculadas a movimientos portuarios en Ecuador. Reemplaza el seguimiento disperso en Excel, correo y WhatsApp por una operación unificada, trazable y reportable.

**Qué no es.** No es optimización de rutas, no es rastreo GPS, no emite documentos tributarios, no integra Contífico ni Tracklink en esta fase.

**Entregable.** Prototipo visual y navegable para Operaciones y Contabilidad, con las pantallas P-01 a P-20, los recorridos F-01 a F-08 y datos ficticios coherentes. Después de validarlo con el cliente viene la propuesta técnica y económica.

**Usuarios.**

- Operaciones: 3 usuarios con permisos equivalentes. El monitoreo lo hace uno de ellos (no es un rol aparte).
- Contabilidad: acceso restringido a facturación, cartera y pagos.
- Cliente y transportista: no inician sesión; reciben guías y reportes descargables.

**Idea central.** El **viaje** es la unidad de seguimiento (RN-01). Todo lo demás (solicitud, eventos, incidencias, documentos, facturación) gira alrededor del código del viaje, que es único y aparece igual en todas las vistas (RF-54, RN-14).

**Tres modalidades** con cierre distinto:

- Importación contenedorizada: se cierra tras la devolución del contenedor.
- Importación de carga suelta: se cierra con la entrega confirmada.
- Exportación: se cierra con la entrega en puerto.

**Seis reglas que condicionan el diseño técnico.**

1. El retraso se calcula contra el compromiso registrado, no contra una meta universal (RN-08).
2. Una incidencia no bloquea el cierre, pero debe estar resuelta o con observación documentada (RN-09).
3. Saldo = valor de factura - pagos validados; cobrado solo con saldo cero (RN-12).
4. Sin anticipo obligatorio: contra factura o a crédito (RN-11).
5. Los reportes compartibles excluyen cartera y pagos (RN-13).
6. La guía es demostrativa y no equivale a documento tributario (RN-15).

---

## 2. Decisiones de arquitectura

| Tema | Decisión | Motivo |
|---|---|---|
| Lenguaje | React + Vite + TypeScript estricto | Decidido; tipos del dominio en una sola carpeta |
| Rutas | React Router | Filtros y paginación en la URL (`useSearchParams`) para volver sin perder contexto (CA-01) |
| Estado global | `ContextoApp` con un objeto `datos` y la función `aplicar` | Una sola fuente de verdad; fácil de reemplazar por una API |
| Lógica de negocio | Funciones puras en `servicios/operaciones/` que reciben `datos` y devuelven `datos` nuevo más una entrada de actividad | Probables sin interfaz; cada acción queda en el historial automáticamente |
| Persistencia | `localStorage` con clave `portflow:v1` y migración o reinicio por versión | Sobrevive a la recarga; reinicio con "Restablecer datos demostrativos" |
| Estados derivados | Estado de factura, retraso, "por facturar" y cumplimiento se **calculan**, no se guardan | Evita datos contradictorios |
| Contenedor | Se guarda dentro del viaje (`carga.contenedor`) | Cada contenedor pertenece a un viaje; la búsqueda global lo encuentra por ahí |
| Calendario | Vista mensual y semanal propia, sin librería | Menos dependencias; suficiente para la demostración |
| Gráficos | Recharts | Decidido en el prompt |
| Excel | SheetJS (`xlsx`) | Lectura de archivo, vista previa y exportación |
| PDF | jsPDF + jspdf-autotable; hoja de estilos de impresión para la guía | Exportación demostrativa con datos filtrados |
| Formularios | React Hook Form + Zod; tipos con `z.infer` | Validaciones sin duplicar tipos |
| Estilos | Tailwind CSS v4 con la paleta grafito y mostaza definida como tema (`@theme`) | Decidido; ya funcionó bien en otros proyectos. Los colores se usan como utilidades (`bg-barra`, `text-acento`), sin colores escritos a mano |

---

## 3. Estructura de carpetas

```
src/
  tipos/
  componentes/
    maquetacion/
    comunes/
    tablas/
    formularios/
    graficos/
    modales/
  paginas/
    acceso/ dashboard/ clientes/ solicitudes/ programacion/ viajes/
    seguimiento/ incidencias/ documentos/ reportes/ contabilidad/
    catalogos/ importacion/ actividad/ integraciones/ configuracion/
  contexto/
    ContextoAutenticacion.tsx
    ContextoApp.tsx
  hooks/
  servicios/
    almacenamiento.ts
    repositorio.ts
    exportacion.ts
    documentos.ts
    busqueda.ts
    actividad.ts
    operaciones/
  datos/
    generadorDatos.ts
  utilidades/
    calculos.ts
    validadores.ts
    formateadores.ts
    constantes.ts
    permisos.ts
  rutas/
  estilos/
    tema.css
public/
  muestras/
    importacion_viajes_demo.xlsx
    importacion_clientes_demo.xlsx
docs/
  requerimientos.md
  FASE-0_Analisis_y_Arquitectura.md
  TRAZABILIDAD.md
```

Reglas de la capa de servicios: los componentes nunca leen ni escriben `localStorage`; todo pasa por `servicios/`. Cuando exista una API REST solo cambia `repositorio.ts`.

---

## 4. Modelo de datos (tipos TypeScript)

Clave primaria de cada entidad: `codigo` (CLI-001, IMP-001, etc.). Las fechas se guardan como texto ISO.

```ts
export const PERFILES = ['operaciones', 'contabilidad'] as const
export type Perfil = (typeof PERFILES)[number]

export const MODALIDADES = [
  'importacion_contenedorizada',
  'importacion_suelta',
  'exportacion',
] as const
export type Modalidad = (typeof MODALIDADES)[number]

export const TIPOS_CARGA = ['contenedorizada', 'suelta'] as const
export type TipoCarga = (typeof TIPOS_CARGA)[number]

export const ESTADOS_VIAJE = [
  'solicitado',
  'programado',
  'en_ejecucion',
  'entregado_pendiente_devolucion',
  'finalizado',
  'cancelado',
] as const
export type EstadoViaje = (typeof ESTADOS_VIAJE)[number]

export const ESTADOS_SOLICITUD = ['recibida', 'aceptada', 'convertida', 'rechazada'] as const
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]

export const ESTADOS_INCIDENCIA = ['abierta', 'resuelta'] as const
export type EstadoIncidencia = (typeof ESTADOS_INCIDENCIA)[number]

export const ESTADOS_PAGO = ['registrado', 'validado'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const MODALIDADES_COBRO = ['contra_factura', 'credito'] as const
export type ModalidadCobro = (typeof MODALIDADES_COBRO)[number]

export type EstadoCatalogo = 'activo' | 'inactivo'

export interface Usuario {
  codigo: string
  nombre: string
  perfil: Perfil
  estado: EstadoCatalogo
}

export interface Cliente {
  codigo: string
  razonSocial: string
  identificacion: string
  contacto: string
  correo: string
  telefono: string
  estado: EstadoCatalogo
}

export interface Lugar {
  codigo: string
  nombre: string
  tipo: 'puerto' | 'deposito' | 'planta' | 'instalacion_cliente' | 'otro'
  ciudad: string
  estado: EstadoCatalogo
}

export interface Transportista {
  codigo: string
  razonSocial: string
  contacto: string
  telefono: string
  estado: EstadoCatalogo
}

export interface Chofer {
  codigo: string
  nombre: string
  identificacion: string
  telefono: string
  transportistaCodigo: string
  disponibilidad: 'disponible' | 'en_servicio' | 'no_disponible'
  estado: EstadoCatalogo
}

export interface Unidad {
  codigo: string
  placa: string
  tipo: string
  transportistaCodigo: string
  disponibilidad: 'disponible' | 'en_servicio' | 'mantenimiento'
  estado: EstadoCatalogo
}

export interface TipoCatalogo {
  codigo: string
  nombre: string
  estado: EstadoCatalogo
}

export interface TipoEvento extends TipoCatalogo {
  modalidades: Modalidad[]
  orden: number
}

export interface Evidencia {
  nombre: string
  tipo: string
  fecha: string
}

export interface Solicitud {
  codigo: string
  clienteCodigo: string
  modalidad: Modalidad
  tipoCarga: TipoCarga
  descripcionCarga: string
  origenCodigo: string
  destinoCodigo: string
  fechaRequerida: string
  indicacionesCliente: string
  observaciones: string
  estado: EstadoSolicitud
  viajeCodigo?: string
  fechaCreacion: string
  creadoPor: string
}

export interface Contenedor {
  tipo: string
  numero: string
}

export interface Carga {
  tipo: TipoCarga
  descripcion: string
  observaciones: string
  contenedor?: Contenedor
}

export interface PuntoRuta {
  orden: number
  lugarCodigo: string
  funcion: 'origen' | 'parada' | 'destino' | 'devolucion'
}

export interface CambioEstado {
  fecha: string
  estadoAnterior: EstadoViaje | null
  estadoNuevo: EstadoViaje
  usuarioCodigo: string
  motivo?: string
}

export interface AjusteProgramacion {
  fecha: string
  motivo: string
  usuarioCodigo: string
  campo: string
  valorAnterior: string
  valorNuevo: string
}

export interface Viaje {
  codigo: string
  solicitudCodigo?: string
  clienteCodigo: string
  modalidad: Modalidad
  estado: EstadoViaje
  carga: Carga
  origenCodigo: string
  destinoCodigo: string
  rutaPuntos: PuntoRuta[]
  transportistaCodigo?: string
  choferCodigo?: string
  unidadCodigo?: string
  salidaPrevista?: string
  llegadaPrevista?: string
  cierrePrevisto?: string
  salidaReal?: string
  llegadaReal?: string
  cierreReal?: string
  modalidadCobro: ModalidadCobro
  valorReferencial: number
  observaciones: string
  observacionCierre?: string
  motivoCancelacion?: string
  historialEstados: CambioEstado[]
  ajustesProgramacion: AjusteProgramacion[]
  creadoPor: string
  fechaCreacion: string
}

export interface Evento {
  codigo: string
  viajeCodigo: string
  tipoEventoCodigo: string
  ubicacion: string
  horaPrevista?: string
  horaReal?: string
  responsableCodigo: string
  comentario: string
  evidencias: Evidencia[]
}

export interface Incidencia {
  codigo: string
  viajeCodigo: string
  tipoIncidenciaCodigo: string
  fechaHora: string
  ubicacion: string
  descripcion: string
  responsableCodigo: string
  evidencias: Evidencia[]
  estado: EstadoIncidencia
  accionCorrectiva?: string
  fechaResolucion?: string
}

export interface DatosGuia {
  remitente: string
  destinatario: string
  identificacionDestinatario: string
  transportista: string
  chofer: string
  unidad: string
  placa: string
  origen: string
  destino: string
  carga: string
  contenedor?: string
  recorrido: string
}

export interface Documento {
  codigo: string
  viajeCodigo: string
  tipo: 'guia_remision' | 'conocimiento_embarque' | 'acta_entrega' | 'evidencia' | 'otro'
  numeroReferencial?: string
  fechaGeneracion: string
  emisor: string
  receptor: string
  nombreArchivo: string
  descripcion: string
  version: number
  datosGuia?: DatosGuia
  creadoPor: string
}

export interface Factura {
  codigo: string
  clienteCodigo: string
  viajeCodigos: string[]
  referencia: string
  fechaEmision: string
  fechaVencimiento: string
  valor: number
  modalidadCobro: ModalidadCobro
  creadoPor: string
}

export interface Pago {
  codigo: string
  facturaCodigo: string
  fecha: string
  valor: number
  referencia: string
  estado: EstadoPago
  validadorCodigo?: string
}

export interface Actividad {
  codigo: string
  usuarioCodigo: string
  fechaHora: string
  accion: string
  entidad: string
  codigoEntidad: string
  descripcion: string
}

export interface Configuracion {
  versionEsquema: number
  fechaBaseDemostracion?: string
  diasAlertaVencimiento: number
  contadores: Record<string, number>
  usuarioActivoCodigo: string
}

export interface DatosApp {
  usuarios: Usuario[]
  clientes: Cliente[]
  lugares: Lugar[]
  transportistas: Transportista[]
  choferes: Chofer[]
  unidades: Unidad[]
  tiposCarga: TipoCatalogo[]
  tiposEvento: TipoEvento[]
  tiposIncidencia: TipoCatalogo[]
  solicitudes: Solicitud[]
  viajes: Viaje[]
  eventos: Evento[]
  incidencias: Incidencia[]
  documentos: Documento[]
  facturas: Factura[]
  pagos: Pago[]
  actividad: Actividad[]
  configuracion: Configuracion
}
```

**Relaciones.**

- Cliente 1..n Solicitud; Solicitud 0..1 Viaje (al convertirse).
- Cliente 1..n Viaje; los viajes de un mismo cliente no comparten eventos ni documentos (RN-02).
- Viaje 1..n Evento, Incidencia y Documento.
- Factura n..n Viaje (solo del mismo cliente); Factura 1..n Pago.
- Transportista 1..n Chofer y Unidad.

---

## 5. Estados y transiciones

**Viaje.**

| Estado | Cómo se llega |
|---|---|
| solicitado | Se convierte una solicitud aceptada; aún sin asignación completa |
| programado | Tiene transportista, chofer, unidad y fechas previstas |
| en_ejecucion | Se registra el evento de salida |
| entregado_pendiente_devolucion | Solo contenedorizada: se registra la entrega y falta la devolución |
| finalizado | Se registra el cierre, con el último hito requerido de la modalidad cumplido |
| cancelado | Acción manual con motivo obligatorio |

"Con incidencia" no es un estado: es una etiqueta que se muestra mientras el viaje tenga incidencias abiertas.

**Secuencia de hitos por modalidad.**

| Modalidad | Secuencia |
|---|---|
| Importación contenedorizada | Salida de puerto, Llegada a cliente o planta, Descarga, Entrega, Devolución de contenedor, Cierre |
| Importación de carga suelta | Salida de puerto, Llegada a cliente o planta, Descarga, Entrega confirmada, Cierre |
| Exportación | Retiro de contenedor en depósito, Salida a cliente o planta, Llegada, Carga, Salida a puerto, Entrega en puerto, Cierre |

**Solicitud:** recibida, aceptada, convertida, rechazada. Solo una solicitud aceptada puede convertirse.

**Incidencia:** abierta, resuelta (con acción correctiva y fecha de resolución).

**Pago:** registrado, validado. Solo los validados reducen el saldo.

**Estados derivados (se calculan, no se almacenan).**

- Servicio: **por facturar** si el viaje está finalizado y no figura en ninguna factura; **facturado** en caso contrario.
- Factura: **cobrada** si saldo = 0; **vencida** si saldo > 0 y el vencimiento ya pasó; **pendiente / parcial** en el resto. Además un indicador **próxima a vencer** según `diasAlertaVencimiento`.
- Viaje retrasado: hora real mayor que la prevista, o, si no hay hora real, hora prevista de llegada ya superada.

---

## 6. Funciones de cálculo (`utilidades/calculos.ts`)

| Función | Qué hace |
|---|---|
| `desvioEnMinutos(prevista, real)` | Positivo = retraso; solo si hay ambos valores |
| `estaARetrasado(viaje, eventos, ahora)` | Aplica la regla RN-08 |
| `porcentajeCumplimiento(viajes, eventos)` | Entregas a tiempo sobre entregas con compromiso y hora real |
| `secuenciaDeHitos(modalidad)` | Devuelve los tipos de evento en orden |
| `estadoSiguienteTrasEvento(viaje, evento)` | Propone el nuevo estado del viaje |
| `hayAdvertenciaSolapamiento(viaje, viajes)` | Misma unidad o chofer con fechas superpuestas; solo advierte |
| `puedeFinalizar(viaje, eventos, incidencias)` | Exige hitos completos; con incidencias abiertas pide observación documentada |
| `estadoFacturacionServicio(viaje, facturas)` | Por facturar o facturado |
| `saldoDeFactura(factura, pagos)` | Valor menos pagos validados |
| `estadoDeFactura(factura, pagos, hoy)` | Cobrada, vencida o pendiente / parcial |
| `esProximaAVencer(factura, pagos, hoy, dias)` | Alerta de cartera |
| `siguienteCodigo(configuracion, prefijo)` | Genera IMP-003, FAC-005, etc. sin repetir |

---

## 7. Perfiles, permisos y rutas

`utilidades/permisos.ts` define un mapa de acciones por perfil (por ejemplo `clientes.escribir`, `viajes.escribir`, `incidencias.escribir`, `facturas.escribir`, `pagos.validar`) y la función `puede(perfil, accion)`. Las rutas protegidas redirigen y los botones no permitidos se ocultan o se deshabilitan con explicación.

| Ruta | Pantalla | Operaciones | Contabilidad |
|---|---|---|---|
| `/acceso` | P-01 | Sí | Sí |
| `/dashboard` | P-02 | Operativo | Contable |
| `/clientes`, `/clientes/:codigo` | P-03 | Total | Consulta |
| `/solicitudes/nueva` | P-04 | Sí | No |
| `/solicitudes` | P-05 | Sí | No |
| `/programacion` | P-06 | Sí | No |
| `/viajes/nuevo`, `/viajes/:codigo/editar` | P-07 | Sí | No |
| `/viajes`, `/viajes/:codigo` | P-08 | Total | Consulta limitada |
| `/seguimiento`, pestaña Seguimiento del viaje | P-09 | Sí | No |
| `/incidencias`, formulario de evento e incidencia | P-10 | Sí | No |
| `/documentos`, `/guias` | P-11 | Sí | No |
| `/reportes` | P-12 | Sí | No |
| `/reportes/cliente` | P-13 | Sí | No |
| `/contabilidad/por-facturar` | P-14 | Sin acceso | Total |
| `/contabilidad/facturas` | P-15 | Sin acceso | Total |
| `/contabilidad/cartera`, `/contabilidad/pagos` | P-16 | Sin acceso | Total |
| `/catalogos/:catalogo` | P-17 | Sí | No |
| `/importar` | P-18 | Sí | No |
| `/actividad` | P-19 | Sí | No |
| `/integraciones` | P-20 | Sí | Consulta |
| `/configuracion` | Configuración | Sí | No |

Los filtros, la búsqueda, el orden y la página de cada listado viven en la URL, de modo que volver desde el detalle de un viaje restaura el contexto (CA-01).

---

## 8. Capa de servicios

- `almacenamiento.ts`: lectura, escritura y reinicio de `portflow:v1`, con control de versión del esquema.
- `repositorio.ts`: operaciones genéricas `listar`, `obtener`, `guardar`, `eliminar` y `buscar` sobre `DatosApp`.
- `servicios/operaciones/`, una función pura por acción de negocio, cada una devuelve los datos nuevos y la entrada de actividad:
  - `convertirSolicitud`, `asignarRecursos`, `ajustarProgramacion`
  - `registrarEvento`, `registrarIncidencia`, `resolverIncidencia`
  - `finalizarViaje`, `cancelarViaje`
  - `generarGuia`, `adjuntarDocumento`
  - `agruparYFacturar`, `registrarPago`, `validarPago`
  - `importarClientes`, `importarViajes`
- `busqueda.ts`: búsqueda global por código de viaje, cliente, contenedor o placa.
- `exportacion.ts`: PDF y Excel con los datos filtrados.
- `documentos.ts`: armado de la guía y del paquete documental demostrativo.
- `actividad.ts`: construcción de entradas de actividad.

---

## 9. Plan de datos demostrativos

El generador `generadorDatos.ts` recibe una fecha base (hoy por defecto) y calcula todas las fechas con desplazamientos relativos, para que "servicios del día", "próximas llegadas", "vencida" y "próxima a vencer" funcionen siempre.

Volumen aproximado: 6 clientes, 4 transportistas, 8 choferes, 8 unidades, 12 lugares, 10 solicitudes, 14 viajes, 4 facturas, 5 pagos, 4 usuarios (3 operativos y 1 contable).

| Viaje | Cliente | Modalidad | Estado y propósito |
|---|---|---|---|
| IMP-001 | CLI-001 | Contenedorizada | Finalizado, a tiempo, con guía y devolución. Escenario A |
| IMP-002 | CLI-001 | Suelta | Finalizado, parada de 60 min, llegada tardía, incidencia resuelta. Escenario B |
| IMP-003 | CLI-002 | Contenedorizada | Entregado, pendiente de devolución |
| IMP-004 | CLI-003 | Suelta | En ejecución con incidencia abierta |
| IMP-005 | CLI-001 | Contenedorizada | En ejecución; segundo viaje simultáneo del mismo cliente (CA-02) |
| IMP-006 | CLI-004 | Suelta | Programado para mañana |
| IMP-007 | CLI-005 | Contenedorizada | Solicitado, sin asignación |
| IMP-008 | CLI-002 | Suelta | Finalizado, por facturar |
| IMP-009 | CLI-003 | Contenedorizada | Finalizado; factura vencida con saldo abierto. Escenario E |
| IMP-010 | CLI-004 | Suelta | Cancelado con motivo |
| IMP-011 | CLI-006 | Contenedorizada | Finalizado; factura próxima a vencer |
| EXP-001 | CLI-002 | Exportación | En ejecución, última etapa sin completar. Escenario C |
| EXP-002 | CLI-005 | Exportación | Programado |
| EXP-003 | CLI-004 | Exportación | Finalizado en puerto; factura cobrada |

Escenario D: FAC-001 agrupa IMP-001 e IMP-002 (mismo cliente) y tiene un pago parcial validado.

Archivos de muestra para Excel: uno de clientes y uno de viajes, con algunas filas con errores intencionales (identificación vacía, fecha inválida, cliente inexistente).

---

## 10. Plan de fases

| Fase | Contenido | Pantallas |
|---|---|---|
| 0 | Análisis y arquitectura (este documento) | n/a |
| 1 | Proyecto Vite + TypeScript, tokens de paleta, maquetación (sidebar, header, breadcrumbs), componentes comunes, perfiles y rutas protegidas, servicios, generador de datos, restablecer datos | P-01 |
| 2 | Clientes, solicitudes (con conversión a viaje) y catálogos | P-03, P-04, P-05, P-17 |
| 3 | Formulario de viaje, programación (lista y calendario), advertencia de solapamiento, ajustes con motivo, detalle del viaje, búsqueda global | P-06, P-07, P-08 |
| 4 | Línea de tiempo, eventos por modalidad, incidencias, desvío y cumplimiento, dashboard operativo | P-09, P-10, P-02 |
| 5 | Guía de remisión, documentos, paquete documental, reportes operativos y para cliente, exportación | P-11, P-12, P-13 |
| 6 | Por facturar, agrupación, facturas, cartera, pagos, dashboard contable | P-14, P-15, P-16 |
| 7 | Importar Excel, actividad, integraciones, configuración | P-18, P-19, P-20 |
| 8 | Validación de F-01 a F-08 y CA-01 a CA-17, responsive, README, trazabilidad final | Todas |

Cada fase termina con la aplicación compilando (`tsc --noEmit` y `npm run build` sin errores), el informe de fase y la matriz de trazabilidad actualizada.

---

## 11. Dependencias previstas

`react`, `react-dom`, `react-router-dom`, `lucide-react`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `xlsx`, `jspdf`, `jspdf-autotable`, `tailwindcss`, `@tailwindcss/vite`.

Riesgos y notas:

- El paquete `xlsx` publicado en npm es una versión antigua con avisos de seguridad conocidos para archivos maliciosos. Para un prototipo local que lee solo archivos de muestra es aceptable; se documentará en el README. Para producción se evaluará instalar desde el sitio oficial de SheetJS.
- La demostración depende de fechas relativas; el reinicio de datos debe usarse antes de cada presentación.

**Decisiones pendientes.** Ninguna. Estilos cerrado con Tailwind.

---

## 12. Supuestos adicionales de esta fase

Se suman a los de la sección 15 del prompt maestro:

1. Estados de solicitud: recibida, aceptada, convertida, rechazada (el documento no los enumera).
2. Estados de incidencia: abierta y resuelta.
3. El contenedor se guarda dentro del viaje.
4. El calendario es propio, sin librería externa.
5. Los tipos de lugar (puerto, depósito, planta, instalación de cliente) son un apoyo para los formularios.
