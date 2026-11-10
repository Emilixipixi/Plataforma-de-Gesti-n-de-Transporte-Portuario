import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

export const LIMITES_DIAS_ALERTA = { minimo: 1, maximo: 30 } as const

export function actualizarDiasAlerta(dias: number): Operacion<number> {
  return (datos, { usuarioCodigo }) => {
    if (!Number.isInteger(dias) || dias < LIMITES_DIAS_ALERTA.minimo || dias > LIMITES_DIAS_ALERTA.maximo) {
      return fallo(`Ingrese un número entero entre ${LIMITES_DIAS_ALERTA.minimo} y ${LIMITES_DIAS_ALERTA.maximo}.`)
    }
    const anterior = datos.configuracion.diasAlertaVencimiento
    if (anterior === dias) return exito(datos, [], dias, 'No hubo cambios que guardar.')
    return exito(
      { ...datos, configuracion: { ...datos.configuracion, diasAlertaVencimiento: dias } },
      [{ usuarioCodigo, accion: 'edicion', entidad: 'sistema', codigoEntidad: 'CONFIGURACION', descripcion: `Alerta de vencimiento de cartera cambiada de ${anterior} a ${dias} días.` }],
      dias,
    )
  }
}
