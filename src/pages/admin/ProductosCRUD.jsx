import { useState, useEffect, useCallback } from 'react'
import { obtenerTodosProductosAdmin, eliminarProducto } from '../../services/firestore'
import ProductoFormModal from '../../components/admin/ProductoFormModal'

// ============================================================
// PRODUCTOS CRUD — Gestión del Catálogo de Productos
// Missy & Po Pet Shop | Admin Panel
// ============================================================

export default function ProductosCRUD() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('todos') // 'todos' | 'activo' | 'inactivo'

  const [modalOpen, setModalOpen] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null) // null = crear nuevo
  const [eliminandoId, setEliminandoId] = useState(null)

  const cargarProductos = useCallback(async () => {
    setLoading(true)
    try {
      const prods = await obtenerTodosProductosAdmin()
      setProductos(prods)
    } catch (e) {
      console.error('Error al cargar productos:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarProductos() }, [cargarProductos])

  // Categorías únicas detectadas en el catálogo
  const categoriasUnicas = [...new Set(productos.flatMap(p => p.categorias || []))].sort()

  // Filtrado combinado
  const productosFiltrados = productos.filter(p => {
    const texto = busqueda.toLowerCase().trim()
    const cumpleTexto = !texto ||
      (p.nombre || '').toLowerCase().includes(texto) ||
      (p.sku || '').toLowerCase().includes(texto)
    const cumpleCat = !filtroCategoria || (p.categorias || []).includes(filtroCategoria)
    const cumpleActivo =
      filtroActivo === 'todos' ||
      (filtroActivo === 'activo' && p.activo) ||
      (filtroActivo === 'inactivo' && !p.activo)
    return cumpleTexto && cumpleCat && cumpleActivo
  })

  const handleNuevoProducto = () => {
    setProductoEditar(null)
    setModalOpen(true)
  }

  const handleEditarProducto = (producto) => {
    setProductoEditar(producto)
    setModalOpen(true)
  }

  const handleEliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar permanentemente "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`)) return
    setEliminandoId(producto.id)
    try {
      await eliminarProducto(producto.id)
      setProductos(prev => prev.filter(p => p.id !== producto.id))
    } catch (e) {
      console.error(e)
      alert('Error al eliminar el producto.')
    } finally {
      setEliminandoId(null)
    }
  }

  const handleSaved = () => {
    setModalOpen(false)
    setProductoEditar(null)
    cargarProductos()
  }

  const statsActivos = productos.filter(p => p.activo).length
  const statsBajoStock = productos.filter(p => (p.stock || 0) < 5).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-gray-850">Catálogo de Productos</h1>
          <p className="text-gray-450 text-sm mt-1">
            Crea, edita y gestiona todos los productos de la tienda.
          </p>
        </div>
        <button
          onClick={handleNuevoProducto}
          className="flex items-center gap-2 px-5 py-2.5 bg-coral text-white rounded-2xl font-semibold text-sm shadow-md shadow-coral/20 hover:bg-coral-dark transition-all active:scale-[0.98] self-start md:self-auto"
        >
          ✨ Nuevo Producto
        </button>
      </div>

      {/* KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Productos', value: productos.length, icon: '📦', color: 'bg-gray-50 border-gray-100' },
          { label: 'Activos', value: statsActivos, icon: '✅', color: 'bg-emerald-50 border-emerald-100' },
          { label: 'Inactivos', value: productos.length - statsActivos, icon: '⏸️', color: 'bg-gray-50 border-gray-100' },
          { label: 'Bajo Stock (<5)', value: statsBajoStock, icon: '⚠️', color: 'bg-amber-50 border-amber-100' },
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-2xl border ${kpi.color} flex items-center gap-3`}>
            <span className="text-2xl">{kpi.icon}</span>
            <div>
              <p className="text-xl font-brand text-gray-850">{kpi.value}</p>
              <p className="text-[11px] text-gray-450 font-semibold">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral text-sm w-full sm:w-72"
        />
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-coral w-full sm:w-auto"
        >
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[['todos', 'Todos'], ['activo', 'Activos'], ['inactivo', 'Inactivos']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltroActivo(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtroActivo === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={cargarProductos}
          className="ml-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
        >
          🔄 Refrescar
        </button>
      </div>

      {/* Tabla de Productos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 font-body">Cargando catálogo de productos...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-5xl block mb-3">🛍️</span>
          <p className="text-gray-600 font-semibold">
            {productos.length === 0 ? 'No hay productos aún' : 'Sin resultados para tu búsqueda'}
          </p>
          {productos.length === 0 && (
            <button
              onClick={handleNuevoProducto}
              className="mt-4 px-6 py-2.5 bg-coral text-white rounded-xl text-sm font-bold hover:bg-coral-dark transition-all"
            >
              ✨ Crear primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4">Categorías</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productosFiltrados.map(producto => {
                  const precioFinal = producto.precio_oferta || producto.precio_regular || 0
                  const tieneOferta = !!producto.precio_oferta
                  return (
                    <tr key={producto.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Producto */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {producto.imagenes?.[0] ? (
                            <img
                              src={producto.imagenes[0]}
                              alt={producto.nombre}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🐾</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate max-w-[180px]">{producto.nombre}</p>
                            <p className="text-[11px] text-gray-400 font-mono truncate">/{producto.slug}</p>
                            {producto.variantes?.length > 0 && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {producto.variantes.length} variantes
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{producto.sku || '—'}</td>

                      {/* Precio */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">S/ {parseFloat(precioFinal).toFixed(2)}</p>
                        {tieneOferta && (
                          <p className="text-[11px] text-gray-400 line-through">
                            S/ {parseFloat(producto.precio_regular).toFixed(2)}
                          </p>
                        )}
                        {producto.precio_compra !== undefined && producto.precio_compra !== null && (
                          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            Costo: S/ {parseFloat(producto.precio_compra).toFixed(2)}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          (producto.stock || 0) < 5
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {producto.stock ?? 0}
                        </span>
                      </td>

                      {/* Categorías */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(producto.categorias || []).slice(0, 2).map(cat => (
                            <span key={cat} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                              {cat}
                            </span>
                          ))}
                          {(producto.categorias || []).length > 2 && (
                            <span className="text-[10px] text-gray-400">+{producto.categorias.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                          producto.activo
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {producto.activo ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(producto)}
                            disabled={eliminandoId === producto.id}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {eliminandoId === producto.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProductoFormModal
          producto={productoEditar}
          onClose={() => { setModalOpen(false); setProductoEditar(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
