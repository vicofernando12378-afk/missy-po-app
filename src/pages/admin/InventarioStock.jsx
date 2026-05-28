import { useState, useEffect } from 'react'
import { obtenerTodosProductosAdmin, actualizarStockProductoAdmin } from '../../services/firestore'

export default function InventarioStock() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [bajoStockOnly, setBajoStockOnly] = useState(false)

  // Estados locales temporales para inputs de stock
  // Clave: 'productId' (para simples) o 'productId-varianteIdx' (para variantes)
  const [stockInputs, setStockInputs] = useState({})
  const [loadingUpdates, setLoadingUpdates] = useState({})
  const [successUpdates, setSuccessUpdates] = useState({})
  const [errorUpdates, setErrorUpdates] = useState({})

  const cargarProductos = async () => {
    setLoading(true)
    try {
      const prods = await obtenerTodosProductosAdmin()
      setProductos(prods)

      // Inicializar inputs locales
      const inputs = {}
      prods.forEach(p => {
        if (p.variantes && p.variantes.length > 0) {
          p.variantes.forEach((v, idx) => {
            inputs[`${p.id}-${idx}`] = v.stock
          })
        } else {
          inputs[p.id] = p.stock || 0
        }
      })
      setStockInputs(inputs)
    } catch (e) {
      console.error('Error al cargar productos para inventario:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  // Modificar input localmente
  const handleInputChange = (key, val) => {
    const intVal = parseInt(val)
    setStockInputs(prev => ({
      ...prev,
      [key]: isNaN(intVal) ? '' : Math.max(0, intVal)
    }))
  }

  // Incrementar / Decrementar stock en input local
  const ajustarStockLocal = (key, delta) => {
    const current = parseInt(stockInputs[key]) || 0
    setStockInputs(prev => ({
      ...prev,
      [key]: Math.max(0, current + delta)
    }))
  }

  // Guardar stock de producto simple
  const handleGuardarStockSimple = async (productId) => {
    const nuevoStock = stockInputs[productId]
    if (nuevoStock === '') return

    setLoadingUpdates(prev => ({ ...prev, [productId]: true }))
    setErrorUpdates(prev => ({ ...prev, [productId]: '' }))
    setSuccessUpdates(prev => ({ ...prev, [productId]: false }))

    try {
      await actualizarStockProductoAdmin(productId, nuevoStock)
      setSuccessUpdates(prev => ({ ...prev, [productId]: true }))
      setTimeout(() => setSuccessUpdates(prev => ({ ...prev, [productId]: false })), 3000)
    } catch (e) {
      console.error(e)
      setErrorUpdates(prev => ({ ...prev, [productId]: 'Error al guardar.' }))
    } finally {
      setLoadingUpdates(prev => ({ ...prev, [productId]: false }))
    }
  }

  // Guardar stock de producto con variantes
  const handleGuardarStockVariante = async (product, varianteIdx) => {
    const key = `${product.id}-${varianteIdx}`
    const nuevoStock = stockInputs[key]
    if (nuevoStock === '') return

    setLoadingUpdates(prev => ({ ...prev, [key]: true }))
    setErrorUpdates(prev => ({ ...prev, [key]: '' }))
    setSuccessUpdates(prev => ({ ...prev, [key]: false }))

    try {
      // 1. Clonar variantes y actualizar el stock de la variante modificada
      const variantesClonadas = [...(product.variantes || [])]
      variantesClonadas[varianteIdx] = {
        ...variantesClonadas[varianteIdx],
        stock: nuevoStock
      }

      // 2. Recalcular el stock general del producto (suma de variantes)
      const nuevoStockGeneral = variantesClonadas.reduce((sum, v) => sum + (v.stock || 0), 0)

      // 3. Guardar en Firestore
      await actualizarStockProductoAdmin(product.id, nuevoStockGeneral, variantesClonadas)

      // 4. Actualizar el estado de productos en memoria para reflejar el cambio general
      setProductos(prev => prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            stock: nuevoStockGeneral,
            variantes: variantesClonadas
          }
        }
        return p
      }))

      setSuccessUpdates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setSuccessUpdates(prev => ({ ...prev, [key]: false })), 3000)
    } catch (e) {
      console.error(e)
      setErrorUpdates(prev => ({ ...prev, [key]: 'Error.' }))
    } finally {
      setLoadingUpdates(prev => ({ ...prev, [key]: false }))
    }
  }

  // Filtrado de productos
  const productosFiltrados = productos.filter(p => {
    const texto = busqueda.toLowerCase().trim()
    const cumpleTexto = !texto || 
      (p.nombre || '').toLowerCase().includes(texto) ||
      (p.sku || '').toLowerCase().includes(texto)

    const esBajoStock = p.stock < 5
    const cumpleBajoStock = !bajoStockOnly || esBajoStock

    return cumpleTexto && cumpleBajoStock
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-gray-850">Inventario de Stock</h1>
          <p className="text-gray-450 text-sm mt-1">Reabastece el inventario de productos y variantes del catálogo rápidamente.</p>
        </div>
        <button
          onClick={cargarProductos}
          className="px-4 py-2 bg-gray-150 hover:bg-gray-250 text-gray-700 rounded-xl text-sm font-semibold transition-all self-start md:self-auto"
        >
          🔄 Refrescar Catálogo
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-sm w-full sm:w-80"
        />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={bajoStockOnly}
            onChange={(e) => setBajoStockOnly(e.target.checked)}
            className="w-4 h-4 rounded text-coral border-gray-300 focus:ring-coral/20"
          />
          <span className="text-sm font-semibold text-gray-600">Mostrar solo bajo stock (&lt; 5 unidades)</span>
        </label>
      </div>

      {/* Tabla de Inventario */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4 font-body">Cargando inventario de tienda...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-4xl block mb-2">📦</span>
          <p className="text-gray-500 font-semibold">No se encontraron productos en el inventario</p>
          <p className="text-gray-400 text-sm mt-1">Intenta ajustando los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">SKU / Variante</th>
                  <th className="px-6 py-4 text-center">Stock Total</th>
                  <th className="px-6 py-4">Ajustar Stock</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {productosFiltrados.map((product) => {
                  const tieneVariantes = product.variantes && product.variantes.length > 0

                  return (
                    <tr key={product.id} className="align-top hover:bg-gray-50/10">
                      
                      {/* FOTO Y NOMBRE */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {product.imagenes && product.imagenes[0] ? (
                            <img
                              src={product.imagenes[0]}
                              alt={product.nombre}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                              🐾
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800 leading-snug">{product.nombre}</p>
                            <span className="text-[10px] text-gray-400">ID: {product.id}</span>
                            {product.stock < 5 && (
                              <span className="block mt-1.5 px-2 py-0.5 w-max rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ⚠️ Stock Crítico
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU / VARIANTES */}
                      <td className="px-6 py-4">
                        {!tieneVariantes ? (
                          <span className="font-mono text-xs text-gray-500">{product.sku || 'N/A'}</span>
                        ) : (
                          <div className="space-y-4">
                            {product.variantes.map((v, idx) => {
                              const key = `${product.id}-${idx}`
                              return (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-dashed border-gray-100 last:border-none">
                                  <div>
                                    <p className="font-mono text-xs text-gray-600 font-bold">{v.sku || `VAR-${idx}`}</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{Object.entries(v.atributos).map(([k, val]) => `${k}: ${val}`).join(', ')}</p>
                                    <p className="text-[10px] text-gray-450">Stock actual: <strong>{v.stock}</strong></p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>

                      {/* STOCK TOTAL */}
                      <td className="px-6 py-4 text-center font-semibold text-gray-800 text-base">
                        {product.stock || 0}
                      </td>

                      {/* AJUSTAR INPUTS */}
                      <td className="px-6 py-4">
                        {!tieneVariantes ? (
                          // Control Stock Producto Simple
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => ajustarStockLocal(product.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-250 rounded-lg text-gray-600 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={stockInputs[product.id] ?? ''}
                              onChange={(e) => handleInputChange(product.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-semibold focus:outline-none focus:border-coral bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => ajustarStockLocal(product.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-250 rounded-lg text-gray-600 font-bold"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          // Controles Stock de Variaciones
                          <div className="space-y-4 pt-1">
                            {product.variantes.map((v, idx) => {
                              const key = `${product.id}-${idx}`
                              return (
                                <div key={idx} className="flex items-center gap-1.5 h-[34px]">
                                  <button
                                    type="button"
                                    onClick={() => ajustarStockLocal(key, -1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={stockInputs[key] ?? ''}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-12 px-1.5 py-0.5 border border-gray-200 rounded-md text-center text-xs font-semibold focus:outline-none focus:border-coral bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => ajustarStockLocal(key, 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>

                      {/* BOTÓN DE ACCIÓN / STATUS */}
                      <td className="px-6 py-4 text-center">
                        {!tieneVariantes ? (
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <button
                              onClick={() => handleGuardarStockSimple(product.id)}
                              disabled={loadingUpdates[product.id]}
                              className="px-3.5 py-1.5 bg-coral text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-coral-dark transition-all disabled:bg-gray-300"
                            >
                              {loadingUpdates[product.id] ? '...' : 'Ajustar'}
                            </button>
                            {successUpdates[product.id] && <span className="text-[10px] text-emerald-600 font-bold">✓ Guardado</span>}
                            {errorUpdates[product.id] && <span className="text-[10px] text-rose-600 font-bold">{errorUpdates[product.id]}</span>}
                          </div>
                        ) : (
                          <div className="space-y-4 pt-1">
                            {product.variantes.map((v, idx) => {
                              const key = `${product.id}-${idx}`
                              return (
                                <div key={idx} className="flex flex-col items-center justify-center h-[34px]">
                                  <button
                                    onClick={() => handleGuardarStockVariante(product, idx)}
                                    disabled={loadingUpdates[key]}
                                    className="px-2.5 py-1 bg-coral text-white rounded-lg text-[10px] font-semibold hover:bg-coral-dark disabled:bg-gray-300 shadow-sm"
                                  >
                                    {loadingUpdates[key] ? '...' : 'Ajustar'}
                                  </button>
                                  {successUpdates[key] && <span className="text-[9px] text-emerald-600 font-bold">✓ Ok</span>}
                                  {errorUpdates[key] && <span className="text-[9px] text-rose-600 font-bold">Error</span>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
