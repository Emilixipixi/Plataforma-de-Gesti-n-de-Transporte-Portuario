import type { Cliente, EstadoCatalogo } from '@/tipos/dominio'
import { guardar, obtener } from '@/servicios/repositorio'
import { siguienteCodigo } from '@/utilidades/calculos'
import { PREFIJOS } from '@/utilidades/constantes'
import { identificacionDisponible, MENSAJES, type EntradaCliente } from '@/utilidades/validadores'
import { exito, fallo, type Operacion } from '@/servicios/operaciones/tipos'

function normalizar(entrada: EntradaCliente): Omit<Cliente, 'codigo'> {
  return {
    razonSocial: entrada.razonSocial.trim(),
    identificacion: entrada.identificacion.trim(),
    contacto: entrada.contacto.trim(),
    correo: entrada.correo.trim().toLowerCase(),
    telefono: entrada.telefono.trim(),
    estado: entrada.estado,
  }
}

export function crearCliente(entrada: EntradaCliente): Operacion<Cliente> {
  return (datos, { usuarioCodigo }) => {
    if (!identificacionDisponible(entrada.identificacion, datos.clientes)) return fallo(MENSAJES.identificacionDuplicada)
    const { codigo, configuracion } = siguienteCodigo(datos.configuracion, PREFIJOS.cliente)
    const cliente: Cliente = { codigo, ...normalizar(entrada) }
    return exito(
      { ...guardar(datos, 'clientes', cliente), configuracion },
      [{ usuarioCodigo, accion: 'creacion', entidad: 'cliente', codigoEntidad: codigo, descripcion: `Cliente ${cliente.razonSocial} registrado.` }],
      cliente,
    )
  }
}

export function editarCliente(codigo: string, entrada: EntradaCliente): Operacion<Cliente> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, 'clientes', codigo)
    if (!actual) return fallo(`El cliente ${codigo} no existe.`)
    if (!identificacionDisponible(entrada.identificacion, datos.clientes, codigo)) return fallo(MENSAJES.identificacionDuplicada)
    const cliente: Cliente = { codigo, ...normalizar(entrada) }
    const cambios = (Object.keys(cliente) as (keyof Cliente)[]).filter((campo) => cliente[campo] !== actual[campo])
    if (cambios.length === 0) return exito(datos, [], actual, 'No hubo cambios que guardar.')
    return exito(
      guardar(datos, 'clientes', cliente),
      [{ usuarioCodigo, accion: 'edicion', entidad: 'cliente', codigoEntidad: codigo, descripcion: `Cliente actualizado (${cambios.length} ${cambios.length === 1 ? 'campo' : 'campos'}).` }],
      cliente,
    )
  }
}

export function cambiarEstadoCliente(codigo: string, estado: EstadoCatalogo): Operacion<Cliente> {
  return (datos, { usuarioCodigo }) => {
    const actual = obtener(datos, 'clientes', codigo)
    if (!actual) return fallo(`El cliente ${codigo} no existe.`)
    const cliente: Cliente = { ...actual, estado }
    return exito(
      guardar(datos, 'clientes', cliente),
      [{ usuarioCodigo, accion: estado === 'activo' ? 'activacion' : 'desactivacion', entidad: 'cliente', codigoEntidad: codigo, descripcion: `Cliente ${estado === 'activo' ? 'activado' : 'desactivado'}.` }],
      cliente,
    )
  }
}
