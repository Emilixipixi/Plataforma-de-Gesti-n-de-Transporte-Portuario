import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Power, PowerOff } from 'lucide-react'
import type { Cliente, EstadoCatalogo } from '@/tipos/dominio'
import { ESTADOS_CATALOGO } from '@/tipos/dominio'
import { usarApp } from '@/hooks/usarApp'
import { usarAutenticacion } from '@/hooks/usarAutenticacion'
import { usarNotificaciones } from '@/hooks/usarNotificaciones'
import { usarOperacion } from '@/hooks/usarOperacion'
import { usarParametrosListado } from '@/hooks/usarParametrosListado'
import { EncabezadoPagina } from '@/componentes/comunes/EncabezadoPagina'
import { Boton, BotonIcono } from '@/componentes/comunes/Boton'
import { Insignia, InsigniaEstadoCatalogo } from '@/componentes/comunes/Insignia'
import { Tabla, type Columna } from '@/componentes/tablas/Tabla'
import { CampoBusqueda } from '@/componentes/formularios/CampoBusqueda'
import { Selector } from '@/componentes/formularios/Selector'
import { ModalConfirmacion } from '@/componentes/modales/ModalConfirmacion'
import { ModalNuevoCliente } from '@/componentes/clientes/ModalNuevoCliente'
import { coincideTexto } from '@/servicios/repositorio'
import { viajesDeCliente } from '@/servicios/consultas'
import { cambiarEstadoCliente } from '@/servicios/operaciones/clientes'
import { esViajeAbierto } from '@/utilidades/calculos'
import { ETIQUETAS_ESTADO_CATALOGO, opcionesDe } from '@/utilidades/constantes'
import { explicacionSinPermiso } from '@/utilidades/permisos'

export default function PaginaClientes() {
  const { datos } = usarApp()
  const { puede, perfil } = usarAutenticacion()
  const { notificar } = usarNotificaciones()
  const ejecutar = usarOperacion()
  const navegar = useNavigate()
  const listado = usarParametrosListado({ ordenPredeterminado: 'codigo' })
  const [cambioEstado, establecerCambioEstado] = useState<{ cliente: Cliente; estado: EstadoCatalogo } | null>(null)
  const [creando, establecerCreando] = useState(false)
  const puedeEscribir = puede('clientes.escribir')

  const estado = listado.filtro('estado')
  const filas = datos.clientes.filter(
    (c) => (!estado || c.estado === estado) && coincideTexto(listado.busqueda, [c.codigo, c.razonSocial, c.identificacion, c.contacto]),
  )

  const conteoViajes = (codigo: string) => {
    const viajes = viajesDeCliente(datos, codigo)
    return { total: viajes.length, abiertos: viajes.filter(esViajeAbierto).length }
  }

  const columnas: Columna<Cliente>[] = [
    { clave: 'codigo', titulo: 'Código', valorOrden: (c) => c.codigo, celda: (c) => <span className="font-mono font-semibold whitespace-nowrap">{c.codigo}</span> },
    {
      clave: 'razonSocial',
      titulo: 'Razón social',
      valorOrden: (c) => c.razonSocial,
      celda: (c) => (
        <Link to={`/clientes/${c.codigo}`} onClick={(e) => e.stopPropagation()} className="font-medium text-texto hover:underline underline-offset-2">
          {c.razonSocial}
        </Link>
      ),
    },
    { clave: 'identificacion', titulo: 'Identificación', valorOrden: (c) => c.identificacion, celda: (c) => <span className="tabular-nums">{c.identificacion}</span>, ocultarEnMovil: true },
    {
      clave: 'contacto',
      titulo: 'Contacto',
      valorOrden: (c) => c.contacto,
      ocultarEnMovil: true,
      celda: (c) => (
        <span className="block leading-tight">
          <span className="block">{c.contacto}</span>
          <span className="block text-xs text-texto-secundario">{c.telefono}</span>
        </span>
      ),
    },
    {
      clave: 'viajes',
      titulo: 'Viajes',
      alinear: 'centro',
      valorOrden: (c) => conteoViajes(c.codigo).abiertos,
      celda: (c) => {
        const { total, abiertos } = conteoViajes(c.codigo)
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="tabular-nums">{total}</span>
            {abiertos > 0 && <Insignia tono="info">{abiertos} {abiertos === 1 ? 'abierto' : 'abiertos'}</Insignia>}
          </span>
        )
      },
    },
    { clave: 'estado', titulo: 'Estado', valorOrden: (c) => c.estado, celda: (c) => <InsigniaEstadoCatalogo estado={c.estado} /> },
  ]

  const confirmarCambio = () => {
    if (!cambioEstado) return
    const resultado = ejecutar(cambiarEstadoCliente(cambioEstado.cliente.codigo, cambioEstado.estado))
    if (resultado.ok) notificar('exito', `Cliente ${cambioEstado.estado === 'activo' ? 'activado' : 'desactivado'}`, cambioEstado.cliente.razonSocial)
    else notificar('error', 'No se pudo cambiar el estado', resultado.error)
    establecerCambioEstado(null)
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Busque por nombre, código o identificación y consulte las operaciones de cada cliente."
        acciones={
          <Boton
            variante="primario"
            icono={Plus}
            onClick={() => establecerCreando(true)}
            motivoDeshabilitado={puedeEscribir ? undefined : explicacionSinPermiso(perfil)}
          >
            Nuevo cliente
          </Boton>
        }
      />
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
        <CampoBusqueda className="md:w-96" valor={listado.busqueda} onCambiar={listado.establecerBusqueda} marcador="Buscar por nombre, código o identificación" />
        <Selector etiqueta="Estado" textoTodos="Todos" value={estado} onChange={(e) => listado.establecerFiltro('estado', e.target.value)} opciones={opcionesDe(ETIQUETAS_ESTADO_CATALOGO, ESTADOS_CATALOGO)} className="md:w-44" />
        {listado.hayFiltros && <Boton variante="fantasma" onClick={listado.limpiar}>Limpiar filtros</Boton>}
      </div>
      <Tabla
        etiqueta="Clientes"
        columnas={columnas}
        filas={filas}
        claveFila={(c) => c.codigo}
        listado={listado}
        onFila={(c) => navegar(`/clientes/${c.codigo}`)}
        acciones={(c) => (
          <span className="inline-flex gap-0.5">
            <BotonIcono icono={Eye} etiqueta={`Ver ficha de ${c.razonSocial}`} onClick={() => navegar(`/clientes/${c.codigo}`)} />
            {puedeEscribir && (
              <>
                <BotonIcono icono={Pencil} etiqueta={`Editar ${c.razonSocial}`} onClick={() => navegar(`/clientes/${c.codigo}/editar`)} />
                <BotonIcono
                  icono={c.estado === 'activo' ? PowerOff : Power}
                  etiqueta={c.estado === 'activo' ? `Desactivar ${c.razonSocial}` : `Activar ${c.razonSocial}`}
                  onClick={() => establecerCambioEstado({ cliente: c, estado: c.estado === 'activo' ? 'inactivo' : 'activo' })}
                />
              </>
            )}
          </span>
        )}
      />
      <ModalConfirmacion
        abierto={cambioEstado !== null}
        titulo={cambioEstado?.estado === 'activo' ? 'Activar cliente' : 'Desactivar cliente'}
        mensaje={
          cambioEstado?.estado === 'activo'
            ? `${cambioEstado.cliente.razonSocial} volverá a estar disponible para nuevas solicitudes y viajes.`
            : `${cambioEstado?.cliente.razonSocial ?? ''} dejará de aparecer en los formularios de nuevas solicitudes y viajes. Sus operaciones e historial se conservan.`
        }
        textoConfirmar={cambioEstado?.estado === 'activo' ? 'Activar' : 'Desactivar'}
        peligroso={cambioEstado?.estado === 'inactivo'}
        onConfirmar={confirmarCambio}
        onCancelar={() => establecerCambioEstado(null)}
      />
      <ModalNuevoCliente abierto={creando} onCerrar={() => establecerCreando(false)} />
    </>
  )
}
