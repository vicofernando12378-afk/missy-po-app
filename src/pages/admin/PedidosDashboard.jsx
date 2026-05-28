import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { actualizarEstadoPedido, asignarRepartidorPedido } from '../../services/firestore'

export default function PedidosDashboard() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTexto, setFiltroTexto] = useState('')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  
  // Controles del visor de comprobantes
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Sub-formulario para registrar Courier
  const [courier, setCourier] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [trackingLink, setTrackingLink] = useState('')
  const [showCourierForm, setShowCourierForm] = useState(false)

  // Sub-formulario para registrar Repartidor
  const [showRepartidorForm, setShowRepartidorForm] = useState(false)
  const [repNombre, setRepNombre] = useState('')
  const [repCelular, setRepCelular] = useState('')
  const [repCompania, setRepCompania] = useState('')

  const [errorAccion, setErrorAccion] = useState('')
  const [loadingAccion, setLoadingAccion] = useState(false)

  useEffect(() => {
    setLoading(true)
    const q = query(collection(db, 'myp_pedidos'), orderBy('creado_en', 'desc'))
    
    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        creado_en: d.data().creado_en?.toDate() || new Date()
      }))
      setPedidos(docs)
      setLoading(false)
    }, (err) => {
      console.error('Error al escuchar pedidos:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calcular KPIs en tiempo real
  const kpis = {
    total: pedidos.length,
    recibidos: pedidos.filter(p => p.estado === 'recibido').length,
    preparando: pedidos.filter(p => p.estado === 'preparando').length,
    enviados: pedidos.filter(p => p.estado === 'enviado').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
  }

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const cumpleEstado = filtroEstado === 'todos' || p.estado === filtroEstado
    
    const texto = filtroTexto.toLowerCase().trim()
    const nombreCliente = (p.cliente?.nombre || '').toLowerCase()
    const emailCliente = (p.cliente?.email || '').toLowerCase()
    const telefonoCliente = (p.cliente?.celular || '').toLowerCase()     // FIX: celular (no telefono)
    const docCliente = (p.cliente?.documento_numero || '').toLowerCase() // FIX: documento_numero (no documento)
    const idPedido = p.id.toLowerCase()

    const cumpleTexto = !texto || 
      nombreCliente.includes(texto) || 
      emailCliente.includes(texto) || 
      telefonoCliente.includes(texto) ||
      docCliente.includes(texto) ||
      idPedido.includes(texto)

    return cumpleEstado && cumpleTexto
  })

  const abrirDetalle = (pedido) => {
    setPedidoSeleccionado(pedido)
    setZoom(1)
    setRotation(0)
    setCourier('')
    setTrackingCode('')
    setTrackingLink('')
    setShowCourierForm(false)

    // Reset repartidor
    setRepNombre(pedido.envio?.repartidor?.nombre || '')
    setRepCelular(pedido.envio?.repartidor?.celular || '')
    setRepCompania(pedido.envio?.repartidor?.compania || '')
    setShowRepartidorForm(false)
    setErrorAccion('')
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!pedidoSeleccionado) return
    setLoadingAccion(true)
    setErrorAccion('')

    try {
      const extraData = {}
      if (nuevoEstado === 'enviado') {
        if (!courier.trim()) {
          throw new Error('Debes ingresar al menos el nombre de la empresa de Courier.')
        }
        extraData.courier = courier
        extraData.tracking_code = trackingCode
        extraData.tracking_link = trackingLink
      }

      await actualizarEstadoPedido(pedidoSeleccionado.id, nuevoEstado, extraData)
      
      // Actualizar la selección local con los nuevos datos si es posible
      const index = pedidos.findIndex(p => p.id === pedidoSeleccionado.id)
      if (index !== -1) {
        setPedidoSeleccionado({
          ...pedidos[index],
          estado: nuevoEstado,
          pago: {
            ...pedidos[index].pago,
            estado: nuevoEstado === 'preparando' ? 'confirmado' : pedidos[index].pago.estado
          },
          envio: {
            ...pedidos[index].envio,
            ...extraData
          }
        })
      }
      setShowCourierForm(false)
    } catch (err) {
      console.error(err)
      setErrorAccion(err.message || 'Error al cambiar de estado.')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleAsignarRepartidor = async (e) => {
    e.preventDefault()
    if (!pedidoSeleccionado) return
    setLoadingAccion(true)
    setErrorAccion('')

    try {
      if (!repNombre.trim()) {
        throw new Error('Debes ingresar al menos el nombre del repartidor.')
      }

      const repData = {
        nombre: repNombre.trim(),
        celular: repCelular.trim(),
        compania: repCompania.trim()
      }

      await asignarRepartidorPedido(pedidoSeleccionado.id, repData)

      // Actualizar la selección local
      setPedidoSeleccionado(prev => ({
        ...prev,
        envio: {
          ...prev.envio,
          repartidor: repData
        }
      }))
      
      // También actualizar en la lista de pedidos en memoria para que no se pierda al recargar localmente antes de que se propague Firestore
      setPedidos(prev => prev.map(p => p.id === pedidoSeleccionado.id ? { ...p, envio: { ...p.envio, repartidor: repData } } : p))
      
      setShowRepartidorForm(false)
    } catch (err) {
      console.error(err)
      setErrorAccion(err.message || 'Error al asignar repartidor.')
    } finally {
      setLoadingAccion(false)
    }
  }

  const handleImprimirTicket = () => {
    window.print()
  }

  const handleExportarCSV = () => {
    if (pedidosFiltrados.length === 0) return

    // 1. Cabeceras del CSV
    const cabeceras = [
      'ID Pedido',
      'Fecha',
      'Cliente',
      'Celular',
      'DNI/RUC',
      'Direccion',
      'Distrito',
      'Metodo Pago',
      'Estado Pago',
      'Monto Total (S/)',
      'Estado Pedido',
      'Courier / Repartidor'
    ]

    // 2. Filas de datos
    const filas = pedidosFiltrados.map(p => {
      const fecha = p.creado_en ? p.creado_en.toLocaleString('es-PE') : ''
      const total = p.total_final 
        ? (p.total_final / 100).toFixed(2) 
        : (p.comprobante?.total ? (p.comprobante.total / 100).toFixed(2) : '0.00')
      
      const repartidor = p.envio?.repartidor?.nombre
        ? `${p.envio.repartidor.nombre} (${p.envio.repartidor.compania || 'Propio'})`
        : (p.envio?.courier || '—')

      return [
        p.id,
        fecha,
        p.cliente?.nombre || '—',
        p.cliente?.celular || '—',
        p.cliente?.documento_numero || '—',
        p.cliente?.direccion || '—',
        p.cliente?.distrito || '—',
        p.pago?.metodo || '—',
        p.pago?.estado || 'pendiente',
        total,
        p.estado || 'recibido',
        repartidor
      ]
    })

    // 3. Crear el contenido CSV
    const csvContent = [
      cabeceras.join(','),
      ...filas.map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // UTF-8 BOM para que Excel abra bien las tildes y caracteres hispanos
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pedidos_missy_po_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clases CSS para badges de estados
  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'recibido': return 'bg-amber-100 text-amber-800 border border-amber-200'
      case 'preparando': return 'bg-sky-100 text-sky-800 border border-sky-200'
      case 'enviado': return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
      case 'entregado': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      case 'cancelado': return 'bg-rose-100 text-rose-800 border border-rose-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <div className="space-y-8 print:p-0 print:space-y-0">
      {/* ── KPIs DE CONTROL ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
        {[
          { label: 'Total Pedidos', value: kpis.total, color: 'border-l-4 border-gray-400 bg-white' },
          { label: 'Recibidos', value: kpis.recibidos, color: 'border-l-4 border-amber-400 bg-amber-50/20' },
          { label: 'Preparando', value: kpis.preparando, color: 'border-l-4 border-sky-400 bg-sky-50/20' },
          { label: 'Enviados', value: kpis.enviados, color: 'border-l-4 border-indigo-400 bg-indigo-50/20' },
          { label: 'Entregados', value: kpis.entregados, color: 'border-l-4 border-emerald-400 bg-emerald-50/20' }
        ].map((kpi, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border border-gray-100 shadow-sm ${kpi.color}`}>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{kpi.label}</p>
            <p className="text-3xl font-brand text-gray-850 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── SECCIÓN CENTRAL: FILTROS Y LISTA ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-brand text-2xl text-gray-850">Pedidos Recibidos</h1>
            <p className="text-gray-400 text-sm mt-1">Controla los pedidos del catálogo y su pipeline de envío</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Buscador */}
            <input
              type="text"
              placeholder="Buscar cliente, DNI, celular..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-sm w-full sm:w-64"
            />
            {/* Selector de estados */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-sm w-full sm:w-48 bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="recibido">Recibidos</option>
              <option value="preparando">Preparando</option>
              <option value="enviado">Enviados</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
            {/* Botón Exportar CSV */}
            <button
              onClick={handleExportarCSV}
              disabled={pedidosFiltrados.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 rounded-xl border border-emerald-100 text-sm font-semibold transition-all active:scale-[0.98] shrink-0"
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-450 mt-4 font-body">Cargando transacciones comerciales...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-gray-500 font-semibold">No se encontraron pedidos</p>
            <p className="text-gray-400 text-sm mt-1">Intenta ajustando los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">ID Pedido</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Método de Pago</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{pedido.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {pedido.creado_en.toLocaleDateString()} {pedido.creado_en.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{pedido.cliente?.nombre}</p>
                      <p className="text-xs text-gray-400 leading-tight mt-0.5">{pedido.cliente?.celular}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 capitalize">{pedido.pago?.metodo?.toLowerCase() === 'transferencia' ? 'Yape/Plin' : (pedido.pago?.metodo || '—')}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        pedido.pago?.estado === 'confirmado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pedido.pago?.estado === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      S/ {((pedido.total_final || pedido.comprobante?.total || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${getBadgeClass(pedido.estado)}`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => abrirDetalle(pedido)}
                        className="px-3.5 py-1.5 bg-coral/10 hover:bg-coral text-coral hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE PEDIDO / FICHA IMPRIMIBLE ── */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible">
          {/* Backdrop (Oculto en impresión) */}
          <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity print:hidden" 
            onClick={() => setPedidoSeleccionado(null)}
          />
          
          <div className="flex min-h-screen items-center justify-center p-4 md:p-6 print:p-0">
            {/* Contenedor del Modal */}
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col md:flex-row print:shadow-none print:border-none print:rounded-none">
              
              {/* CERRAR BOTÓN (Oculto en impresión) */}
              <button 
                onClick={() => setPedidoSeleccionado(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-250 text-gray-500 rounded-full transition-all print:hidden"
              >
                ✕
              </button>

              {/* COLUMNA IZQUIERDA: Comprobante de Pago Yape/Plin (Oculto en impresión y solo si aplica) */}
              {(pedidoSeleccionado.pago?.metodo === 'Yape/Plin' || pedidoSeleccionado.pago?.metodo === 'transferencia') && (
                <div className="w-full md:w-2/5 bg-gray-50 border-r border-gray-100 p-6 flex flex-col items-center justify-center gap-4 print:hidden">
                  <h3 className="font-semibold text-gray-800 text-sm self-start">Comprobante de Transferencia:</h3>
                  
                  {/* FIX: URL guardada en pago.recibo_url, no en comprobante.url */}
                  {(pedidoSeleccionado.pago?.recibo_url || pedidoSeleccionado.comprobante?.url) ? (
                    <div className="relative w-full max-w-[280px] h-[400px] bg-white rounded-2xl border border-gray-200 shadow-inner overflow-hidden flex items-center justify-center">
                      <img
                        src={pedidoSeleccionado.pago?.recibo_url || pedidoSeleccionado.comprobante?.url}
                        alt="Comprobante de transferencia"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transition: 'transform 0.2s ease'
                        }}
                        className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[280px] h-[400px] bg-gray-150 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-6">
                      <span className="text-4xl mb-2">📸</span>
                      <p className="text-gray-400 text-sm">No se subió imagen del comprobante de transferencia.</p>
                    </div>
                  )}

                  {(pedidoSeleccionado.pago?.recibo_url || pedidoSeleccionado.comprobante?.url) && (
                    <div className="flex gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200">
                      <button 
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-150 rounded text-xs font-bold"
                        title="Reducir zoom"
                      >
                        🔍 -
                      </button>
                      <button 
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-150 rounded text-xs font-semibold"
                        title="Reestablecer zoom"
                      >
                        100%
                      </button>
                      <button 
                        onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-150 rounded text-xs font-bold"
                        title="Aumentar zoom"
                      >
                        🔍 +
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="px-2 py-1 bg-gray-50 hover:bg-gray-150 rounded text-xs font-semibold"
                        title="Rotar 90 grados"
                      >
                        🔄 Rotar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* COLUMNA DERECHA: Ficha de Pedido e Impresión */}
              <div className="flex-1 p-8 overflow-y-auto max-h-[85vh] print:max-h-none print:p-0">
                
                {/* Cabecera Ficha */}
                <div className="border-b border-gray-100 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-brand text-2xl text-gray-800">Ficha de Pedido</h2>
                      <p className="text-mono text-xs text-gray-400 mt-1">ID: {pedidoSeleccionado.id}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3.5 py-1.5 rounded-full capitalize ${getBadgeClass(pedidoSeleccionado.estado)}`}>
                      {pedidoSeleccionado.estado}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">
                    <strong>Fecha de compra:</strong> {pedidoSeleccionado.creado_en.toLocaleString()}
                  </p>
                </div>

                {/* Grid Información Cliente / Entrega */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Datos del Cliente:</h4>
                    <p className="text-sm font-semibold text-gray-800">{pedidoSeleccionado.cliente?.nombre}</p>
                    <p className="text-xs text-gray-500 mt-1"><strong>DNI/RUC:</strong> {pedidoSeleccionado.cliente?.documento_numero || 'No provisto'}</p>
                    <p className="text-xs text-gray-500"><strong>Email:</strong> {pedidoSeleccionado.cliente?.email}</p>
                    <p className="text-xs text-gray-500">
                      <strong>Celular:</strong> {pedidoSeleccionado.cliente?.celular}
                      <a 
                        href={`https://wa.me/51${(pedidoSeleccionado.cliente?.celular || '').replace(/\s+/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="ml-2 text-emerald-600 hover:text-emerald-800 font-semibold print:hidden"
                      >
                        💬 Chat WhatsApp
                      </a>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Dirección de Despacho:</h4>
                    <p className="text-sm text-gray-800">
                      {pedidoSeleccionado.envio?.departamento} - {pedidoSeleccionado.envio?.distrito}
                    </p>
                    <p className="text-xs text-gray-500 mt-1"><strong>Calle/Dirección:</strong> {pedidoSeleccionado.envio?.direccion}</p>
                    {pedidoSeleccionado.envio?.referencia && (
                      <p className="text-xs text-amber-700 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded inline-block">
                        <strong>Ref:</strong> {pedidoSeleccionado.envio.referencia}
                      </p>
                    )}
                  </div>

                  {pedidoSeleccionado.envio?.repartidor && (
                    <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <h4 className="text-xs text-coral font-bold uppercase tracking-wider mb-2">🏍️ Motorizado de Delivery Asignado:</h4>
                      <div className="bg-coral-50/10 border border-coral/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                        <div>
                          <strong>Nombre:</strong> {pedidoSeleccionado.envio.repartidor.nombre}
                        </div>
                        <div>
                          <strong>Celular:</strong> {pedidoSeleccionado.envio.repartidor.celular || 'No provisto'}
                          {pedidoSeleccionado.envio.repartidor.celular && (
                            <a 
                              href={`https://wa.me/51${pedidoSeleccionado.envio.repartidor.celular.replace(/\s+/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="ml-2 text-emerald-600 hover:text-emerald-800 font-semibold print:hidden"
                            >
                              💬 Chat
                            </a>
                          )}
                        </div>
                        <div>
                          <strong>Compañía:</strong> {pedidoSeleccionado.envio.repartidor.compania || 'No provisto'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Items */}
                <div className="py-6 border-b border-gray-100">
                  <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Detalle de Compra:</h4>
                  <div className="space-y-3">
                    {pedidoSeleccionado.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.nombre}</p>
                          {item.variante && item.variante !== 'default' && (
                            <p className="text-xs text-gray-400 capitalize">{item.variante}</p>
                          )}
                          <p className="text-xs text-gray-450 mt-0.5">Cant: {item.cantidad} x S/ {(item.precio_unitario || 0) / 100}</p>
                        </div>
                        <span className="font-semibold text-gray-800">
                          S/ {((item.precio_unitario || 0) * item.cantidad) / 100}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales */}
                <div className="py-6 border-b border-gray-100 flex flex-col items-end gap-1.5">
                  <div className="flex justify-between w-64 text-sm text-gray-500">
                    <span>Subtotal:</span>
                    {/* FIX: Leer total desde comprobante.total o total_final, descontar envío y sumar descuento */}
                    <span>S/ {((pedidoSeleccionado.total_final || pedidoSeleccionado.comprobante?.total || 0) / 100 - (pedidoSeleccionado.envio?.costo_envio || 0) / 100 + (pedidoSeleccionado.descuento || 0) / 100).toFixed(2)}</span>
                  </div>
                  
                  {pedidoSeleccionado.descuento > 0 && (
                    <div className="flex justify-between w-64 text-sm text-coral font-medium">
                      <span>Descuento ({pedidoSeleccionado.cupon}):</span>
                      <span>- S/ {pedidoSeleccionado.descuento / 100}</span>
                    </div>
                  )}

                  <div className="flex justify-between w-64 text-sm text-gray-500">
                    <span>Costo Envío:</span>
                    <span>{pedidoSeleccionado.envio?.costo_envio === 0 ? 'Gratis' : `S/ ${(pedidoSeleccionado.envio?.costo_envio || 0) / 100}`}</span>
                  </div>

                  <div className="flex justify-between w-64 text-base font-bold text-gray-850 border-t border-gray-100 pt-2 mt-1">
                    <span>Total Cancelado:</span>
                    <span>S/ {((pedidoSeleccionado.total_final || pedidoSeleccionado.comprobante?.total || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Historial de Cambios de Estado */}
                <div className="py-6 border-b border-gray-100 print:hidden">
                  <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Auditoría / Historial de Estados:</h4>
                  <div className="space-y-1.5">
                    {pedidoSeleccionado.historial_estados?.map((hist, index) => (
                      <p key={index} className="text-xs text-gray-450">
                        • Pedido marcado como <strong className="text-gray-600 uppercase">{hist.estado}</strong> por <em>{hist.modificado_por || 'admin'}</em> el {new Date(hist.fecha.seconds ? hist.fecha.seconds * 1000 : hist.fecha).toLocaleString()}
                      </p>
                    )) || (
                      <p className="text-xs text-gray-400 italic">No hay historial disponible para este pedido.</p>
                    )}
                  </div>
                </div>

                {/* SECCIÓN ACCIONES OPERATIVAS (Oculto en Impresión) */}
                <div className="py-6 space-y-4 print:hidden">
                  <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Acciones del Despacho:</h4>

                  {errorAccion && (
                    <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                      ⚠️ {errorAccion}
                    </div>
                  )}

                  {/* Formularios de Courier al marcar como Enviado */}
                  {showCourierForm && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      <p className="text-xs font-semibold text-gray-700">Registrar datos de Courier e tracking:</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">Courier (Olva Courier, Shalom, etc.) *</label>
                          <input
                            type="text"
                            required
                            value={courier}
                            onChange={(e) => setCourier(e.target.value)}
                            placeholder="Ej: Olva Courier"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">Nro de Tracking / Guía</label>
                          <input
                            type="text"
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            placeholder="Ej: 4578912"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Enlace de seguimiento (Opcional)</label>
                        <input
                          type="url"
                          value={trackingLink}
                          onChange={(e) => setTrackingLink(e.target.value)}
                          placeholder="https://track.olvacourier.com/..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => setShowCourierForm(false)}
                          className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-600"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleCambiarEstado('enviado')}
                          disabled={loadingAccion}
                          className="px-3.5 py-1.5 bg-coral hover:bg-coral-dark text-white rounded-xl text-xs font-semibold shadow-sm"
                        >
                          {loadingAccion ? 'Guardando...' : 'Confirmar Envío'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulario de Repartidor */}
                  {showRepartidorForm && (
                    <form onSubmit={handleAsignarRepartidor} className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 space-y-3">
                      <p className="text-xs font-semibold text-gray-700">Asignar Repartidor de Delivery (Local / Contra Entrega):</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">Nombre Repartidor *</label>
                          <input
                            type="text"
                            required
                            value={repNombre}
                            onChange={(e) => setRepNombre(e.target.value)}
                            placeholder="Ej: Carlos Ruiz"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">Celular Repartidor</label>
                          <input
                            type="tel"
                            value={repCelular}
                            onChange={(e) => setRepCelular(e.target.value)}
                            placeholder="Ej: 987654321"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">Compañía (Rappi, Propio, etc.)</label>
                          <input
                            type="text"
                            value={repCompania}
                            onChange={(e) => setRepCompania(e.target.value)}
                            placeholder="Ej: Rappi, PedidosYa, Propio"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRepartidorForm(false)}
                          className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-600"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loadingAccion}
                          className="px-3.5 py-1.5 bg-coral hover:bg-coral-dark text-white rounded-xl text-xs font-semibold shadow-sm"
                        >
                          {loadingAccion ? 'Guardando...' : 'Confirmar Asignación'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Acciones principales en base al estado */}
                  <div className="flex flex-wrap gap-2.5">
                    {pedidoSeleccionado.estado !== 'cancelado' && pedidoSeleccionado.estado !== 'entregado' && !showRepartidorForm && (
                      <button
                        onClick={() => setShowRepartidorForm(true)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
                      >
                        🏍️ Asignar/Editar Repartidor
                      </button>
                    )}

                    {pedidoSeleccionado.estado === 'recibido' && (
                      <button
                        onClick={() => handleCambiarEstado('preparando')}
                        disabled={loadingAccion}
                        className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        ✓ Confirmar Pago e Iniciar Preparación
                      </button>
                    )}

                    {pedidoSeleccionado.estado === 'preparando' && !showCourierForm && (
                      <button
                        onClick={() => setShowCourierForm(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
                      >
                        🚚 Registrar Envío / Courier
                      </button>
                    )}

                    {pedidoSeleccionado.estado === 'enviado' && (
                      <button
                        onClick={() => handleCambiarEstado('entregado')}
                        disabled={loadingAccion}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        🏠 Confirmar Entrega de Pedido
                      </button>
                    )}

                    {pedidoSeleccionado.estado !== 'entregado' && pedidoSeleccionado.estado !== 'cancelado' && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de cancelar este pedido? Se reestablecerá de inmediato el stock en el catálogo.')) {
                            handleCambiarEstado('cancelado')
                          }
                        }}
                        disabled={loadingAccion}
                        className="px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        ✕ Cancelar Pedido
                      </button>
                    )}

                    <button
                      onClick={handleImprimirTicket}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-[0.98] transition-all"
                    >
                      🖨️ Imprimir Ticket / Boleta
                    </button>
                  </div>
                </div>

                {/* ESTRUCTURA EXCLUSIVA PARA TICKET DE IMPRESIÓN (OCULTO EN PANTALLA) */}
                <div className="hidden print:block w-[80mm] text-xs font-mono p-4 text-black bg-white mx-auto leading-tight">
                  <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
                    <p className="font-bold text-sm">MISSY & PO PET SHOP</p>
                    <p>Ficha de Despacho Técnico</p>
                    <p>TICKET DE PREPARACIÓN</p>
                    <p className="mt-1 font-mono text-[9px]">ID: {pedidoSeleccionado.id}</p>
                  </div>

                  <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                    <p><strong>CLIENTE:</strong> {pedidoSeleccionado.cliente?.nombre}</p>
                    <p><strong>CELULAR:</strong> {pedidoSeleccionado.cliente?.celular}</p>
                    <p><strong>CIUDAD:</strong> {pedidoSeleccionado.envio?.departamento} - {pedidoSeleccionado.envio?.distrito}</p>
                    <p className="whitespace-normal"><strong>DIRECCIÓN:</strong> {pedidoSeleccionado.envio?.direccion}</p>
                    {pedidoSeleccionado.envio?.referencia && <p><strong>REF:</strong> {pedidoSeleccionado.envio.referencia}</p>}
                    {pedidoSeleccionado.envio?.repartidor && (
                      <div className="mt-1 border-t border-dotted border-gray-400 pt-1">
                        <p><strong>REPARTIDOR:</strong> {pedidoSeleccionado.envio.repartidor.nombre}</p>
                        {pedidoSeleccionado.envio.repartidor.celular && <p><strong>CEL REPART.:</strong> {pedidoSeleccionado.envio.repartidor.celular}</p>}
                        {pedidoSeleccionado.envio.repartidor.compania && <p><strong>EMPRESA:</strong> {pedidoSeleccionado.envio.repartidor.compania}</p>}
                      </div>
                    )}
                    <p className="mt-1 font-mono"><strong>FECHA:</strong> {pedidoSeleccionado.creado_en.toLocaleString()}</p>
                  </div>

                  <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                    <p className="font-bold border-b border-gray-300 pb-1 mb-1.5">PRODUCTOS:</p>
                    {pedidoSeleccionado.items?.map((item, idx) => (
                      <div key={idx} className="mb-2">
                        <div className="flex justify-between font-bold">
                          <span>{item.nombre}</span>
                          <span>x{item.cantidad}</span>
                        </div>
                        {item.variante && item.variante !== 'default' && (
                          <span className="text-[10px] text-gray-700 capitalize">└ {item.variante}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-right">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>S/ {((pedidoSeleccionado.total_final || pedidoSeleccionado.comprobante?.total || 0) / 100 - (pedidoSeleccionado.envio?.costo_envio || 0) / 100 + (pedidoSeleccionado.descuento || 0) / 100).toFixed(2)}</span>
                    </div>
                    {pedidoSeleccionado.descuento > 0 && (
                      <div className="flex justify-between text-coral">
                        <span>Desc ({pedidoSeleccionado.cupon}):</span>
                        <span>- S/ {pedidoSeleccionado.descuento / 100}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>{pedidoSeleccionado.envio?.costo_envio === 0 ? 'Gratis' : `S/ ${(pedidoSeleccionado.envio?.costo_envio || 0) / 100}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1 mt-1">
                      <span>TOTAL:</span>
                      <span>S/ {((pedidoSeleccionado.total_final || pedidoSeleccionado.comprobante?.total || 0) / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center mt-6 border-t border-dashed border-gray-400 pt-3">
                    <p className="font-bold">¡Gracias por tu preferencia!</p>
                    <p className="text-[9px] mt-0.5">Missy & Po Pet Shop | Huellas de Amor</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
