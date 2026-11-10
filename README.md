# PORTFLOW

Prototipo web de Gestión de Transporte Portuario: importaciones, exportaciones, seguimiento de viajes, documentación, facturación y cobranzas.

Muestra el flujo completo desde la solicitud del transporte hasta el cierre operativo y el seguimiento de facturación y cartera, con datos ilustrativos coherentes que comparten todas las pantallas. Es un prototipo navegable para validar el alcance con el cliente: no tiene backend ni integraciones reales.

## Tecnologías

| Uso | Herramienta |
|---|---|
| Interfaz | React 19 + TypeScript 5.9 (modo estricto) |
| Compilación | Vite 7 |
| Estilos | Tailwind CSS v4 (tema en `src/estilos/tema.css`) |
| Navegación | React Router 7 (páginas con carga diferida) |
| Formularios y validación | React Hook Form + Zod 4 |
| Gráficos | Recharts 3 |
| Iconos | Lucide |
| PDF | jsPDF 4 + jspdf-autotable |
| Excel | SheetJS (xlsx), carga diferida |
| Persistencia | `localStorage` del navegador |

## Instalación y ejecución

Requiere Node.js 20 o superior.

```
npm install
npm run dev        (servidor de desarrollo en http://localhost:5173)
npm run build      (verifica tipos con tsc y compila en dist/)
npm run preview    (sirve la compilación)
```

## Perfiles de acceso

No hay autenticación real: en la pantalla de acceso se elige el perfil.

| Perfil | Usuario demostrativo | Acceso |
|---|---|---|
| Operaciones | Andrea Salazar (también Diego Paredes y Mónica Vera) | Clientes, solicitudes, viajes, programación, seguimiento, incidencias, documentos, guías, reportes, catálogos, importación, actividad, integraciones y configuración |
| Contabilidad | Patricia León | Dashboard contable, por facturar, facturas, cartera, pagos; consulta de clientes y viajes; integraciones |

Operaciones no accede al menú de Contabilidad; Contabilidad no edita información logística.

## Funcionalidades

- **Dashboard (P-02):** operativo con servicios del día, en ruta, entregas, retrasos, incidencias y cumplimiento; contable con por facturar, facturado, cobrado, cartera vencida y próxima a vencer.
- **Clientes, solicitudes y catálogos (P-03 a P-05, P-17):** fichas, bandeja de solicitudes con aceptación, rechazo y conversión a viaje; catálogos editables que alimentan los formularios.
- **Viajes y programación (P-06 a P-08):** viajes IMP-xxx y EXP-xxx con carga, contenedor, ruta de puntos operativos, asignación de transportista, chofer y unidad, aviso de solapamiento y calendario semanal o mensual.
- **Seguimiento e incidencias (P-09, P-10):** hitos manuales por modalidad con hora real y responsable, estados automáticos, retraso contra compromiso, incidencias con resolución, finalización con validaciones.
- **Documentos y reportes (P-11 a P-13):** guía de remisión demostrativa con versiones, adjuntos, paquete documental en PDF, reportes operativos, reporte por viaje y reporte semanal o mensual para cliente en versión interna o compartible. Exportación a PDF y Excel.
- **Facturación y cartera (P-14 a P-16):** agrupación de servicios finalizados por cliente, registro de facturas (referencia, fecha, valor, vencimiento), pagos parciales con validación, saldo, antigüedad y alertas de vencimiento.
- **Administración (P-18 a P-20):** importación desde Excel con vista previa, mapeo de columnas y validación; registro de actividad; Contífico y Tracklink como integraciones futuras; parámetros y restablecimiento de datos.
- **Transversal:** búsqueda global por código, cliente, contenedor o placa; filtros y orden en la URL para volver sin perder el contexto; notificaciones por perfil; diseño adaptable a escritorio, tableta y teléfono.

## Datos demostrativos

Al iniciar por primera vez se genera un conjunto estable: 6 clientes, 12 lugares, 4 transportistas, 8 choferes, 8 unidades, 10 solicitudes, 14 viajes con sus eventos, incidencias y documentos, 4 facturas y 5 pagos. Las fechas son relativas al día de la generación, de modo que siempre hay servicios del día, viajes en ruta, una factura vencida y otra próxima a vencer.

Escenarios incluidos: importación contenedorizada completa (IMP-001), importación suelta con retraso e incidencia (IMP-002), dos viajes simultáneos de un mismo cliente (IMP-003 y EXP-001), exportación finalizada en puerto (EXP-003), factura agrupada con pago parcial (FAC-001), factura vencida (FAC-002) y factura cobrada (FAC-004).

Los cambios se guardan en el navegador. Antes de cada presentación conviene usar **Configuración > Restablecer datos demostrativos** para que los escenarios coincidan con la fecha actual.

### Archivos de muestra para importar

En **Importar Excel** están los botones "Usar archivo de muestra" y "Descargar muestra" para clientes y viajes. Las muestras se generan al momento con fechas a partir de hoy e incluyen filas con errores intencionales (correo inválido, identificación repetida, contenedor mal escrito, cliente inexistente, fechas incoherentes) para mostrar la validación.

## Estructura

```
src/
  tipos/          modelo de dominio (dominio.ts)
  datos/          generador de datos demostrativos
  servicios/      almacenamiento, repositorio, consultas, reportes, contabilidad,
                  documentos, exportación, importación y operaciones/ (únicas que modifican datos)
  contexto/       estado de la aplicación, sesión y notificaciones
  hooks/          acceso al estado, operaciones, alertas y parámetros de listado en la URL
  componentes/    maquetación, tablas, formularios, gráficos, modales y componentes por módulo
  paginas/        una carpeta por módulo (acceso, dashboard, clientes, ... contabilidad, importacion)
  rutas/          definición de rutas, permisos por ruta y enrutador
  utilidades/     constantes, cálculos derivados, validadores, fechas, formatos, permisos y colores
  estilos/        tema de Tailwind
docs/
  requerimientos.md, FASE-0_Analisis_y_Arquitectura.md, TRAZABILIDAD.md, VALIDACION.md
```

Los componentes no acceden a `localStorage`: todo cambio pasa por una operación de `servicios/operaciones`, que valida, guarda y registra la actividad. Los estados derivados (retraso, por facturar, saldo, estado de factura) se calculan y no se almacenan.

## Supuestos del prototipo

1. El código de viaje es IMP-xxx o EXP-xxx; aparece igual en todas las vistas, documentos y reportes.
2. "Próxima a vencer" = 7 días antes del vencimiento, configurable en Configuración.
3. Un pago mayor al saldo disponible se rechaza; solo los pagos validados reducen el saldo.
4. Moneda USD, fechas dd/mm/aaaa y hora de Ecuador (UTC-5).
5. Cuatro usuarios demostrativos (3 operativos y 1 contable) sin autenticación real.
6. Los archivos adjuntos y evidencias son ilustrativos: se registran nombre y tipo, no el contenido.

## Limitaciones

- Sin backend ni base de datos: los datos viven en el navegador y no se comparten entre equipos.
- La guía de remisión es demostrativa y no constituye un documento tributario autorizado; no hay facturación electrónica ni conexión con el SRI.
- Contífico y Tracklink se presentan como integraciones futuras; no hay GPS, mapas ni datos en vivo.
- La importación desde Excel crea viajes en estado Solicitado, sin asignación de recursos.
- **Aviso de dependencia:** la versión de SheetJS publicada en npm (xlsx 0.18.5) tiene avisos de seguridad conocidos (contaminación de prototipos y ReDoS) al procesar archivos maliciosos, sin corrección en npm. Se acepta para este prototipo local, que lee archivos elegidos por el usuario; para producción se recomienda la distribución oficial de SheetJS (cdn.sheetjs.com) o procesar los archivos en el servidor.

## Próximos pasos

- Backend con base de datos, autenticación y roles reales.
- Integración con Contífico para cartera y referencias contables, y con Tracklink para apoyo al seguimiento.
- Almacenamiento real de documentos y evidencias.
- Emisión de guías y comprobantes conforme a la normativa del SRI, si el alcance lo requiere.
- Notificaciones por correo de vencimientos e incidencias.

## Documentación

- `docs/TRAZABILIDAD.md`: relación de cada RF, RN, CA, F y P con su implementación y estado.
- `docs/VALIDACION.md`: resultado de la validación final de recorridos y criterios de aceptación.
