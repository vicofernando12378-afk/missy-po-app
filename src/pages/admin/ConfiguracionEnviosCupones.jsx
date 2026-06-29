import { useState, useEffect } from 'react'
import {
  obtenerConfiguracionEnvio,
  guardarConfiguracionEnvio,
  obtenerCupones,
  crearCupon,
  actualizarEstadoCupon,
  eliminarCupon
} from '../../services/firestore'
import { validate, CouponSchema, ShippingConfigSchema } from '../../schemas'


export default function ConfiguracionEnviosCupones() {
  // Configuración de envíos
  const [shippingConfig, setShippingConfig] = useState({
    arequipaFee: '',
    arequipaFreeLimit: '',
    nationalFee: '',
    nationalFreeLimit: ''
  })
  const [loadingShipping, setLoadingShipping] = useState(true)
  const [errorShipping, setErrorShipping] = useState('')
  const [successShipping, setSuccessShipping] = useState(false)

  // Cupones
  const [cupones, setCupones] = useState([])
  const [loadingCupones, setLoadingCupones] = useState(true)
  
  // Formulario Cupones
  const [codigoCupon, setCodigoCupon] = useState('')
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('')
  const [compraMinima, setCompraMinima] = useState('')
  const [errorCupon, setErrorCupon] = useState('')
  const [successCupon, setSuccessCupon] = useState(false)

  const cargarConfiguracion = async () => {
    setLoadingShipping(true)
    try {
      const config = await obtenerConfiguracionEnvio()
      setShippingConfig({
        arequipaFee: config.arequipaFee,
        arequipaFreeLimit: config.arequipaFreeLimit,
        nationalFee: config.nationalFee,
        nationalFreeLimit: config.nationalFreeLimit
      })
    } catch (e) {
      console.error('Error al cargar configuración de envíos:', e)
    } finally {
      setLoadingShipping(false)
    }
  }

  const cargarCupones = async () => {
    setLoadingCupones(true)
    try {
      const lista = await obtenerCupones()
      setCupones(lista)
    } catch (e) {
      console.error('Error al cargar cupones:', e)
    } finally {
      setLoadingCupones(false)
    }
  }

  useEffect(() => {
    cargarConfiguracion()
    cargarCupones()
  }, [])

  // GUARDAR CONFIGURACIÓN DE ENVÍOS
  const handleGuardarShipping = async (e) => {
    e.preventDefault()
    setErrorShipping('')
    setSuccessShipping(false)

    const validation = validate(ShippingConfigSchema, shippingConfig)
    if (!validation.ok) {
      setErrorShipping(validation.error)
      return
    }

    try {
      await guardarConfiguracionEnvio(validation.data)
      setSuccessShipping(true)
      setTimeout(() => setSuccessShipping(false), 3000)
    } catch (err) {
      console.error(err)
      setErrorShipping('Error al intentar guardar las tarifas de envío.')
    }
  }

  // CREAR NUEVO CUPÓN
  const handleCrearCupon = async (e) => {
    e.preventDefault()
    setErrorCupon('')
    setSuccessCupon(false)

    const payload = {
      codigo: codigoCupon,
      descuento: descuentoPorcentaje,
      compraMinima: compraMinima === '' ? 0 : compraMinima
    }

    const validation = validate(CouponSchema, payload)
    if (!validation.ok) {
      setErrorCupon(validation.error)
      return
    }

    try {
      const parsedData = validation.data
      await crearCupon(parsedData.codigo, parsedData.descuento, parsedData.compraMinima)
      setCodigoCupon('')
      setDescuentoPorcentaje('')
      setCompraMinima('')
      setSuccessCupon(true)
      setTimeout(() => setSuccessCupon(false), 3000)
      await cargarCupones()
    } catch (err) {
      console.error(err)
      setErrorCupon(err.message || 'Error al intentar crear el cupón.')
    }
  }

  // CAMBIAR ESTADO CUPÓN
  const handleToggleCupon = async (cuponId, estadoActual) => {
    try {
      await actualizarEstadoCupon(cuponId, !estadoActual)
      setCupones(prev => prev.map(c => c.id === cuponId ? { ...c, activo: !estadoActual } : c))
    } catch (e) {
      console.error('Error al cambiar estado del cupón:', e)
    }
  }

  // ELIMINAR CUPÓN
  const handleEliminarCupon = async (cuponId) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el cupón "${cuponId}"?`)) return
    try {
      await eliminarCupon(cuponId)
      setCupones(prev => prev.filter(c => c.id !== cuponId))
    } catch (e) {
      console.error('Error al eliminar cupón:', e)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-brand text-3xl text-gray-850">Configuraciones Comerciales</h1>
        <p className="text-gray-450 text-sm mt-1">Ajusta los costos de envío a nivel nacional y crea cupones de descuento promocionales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Configuración de Envíos */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 self-start">
          <h2 className="font-brand text-xl text-gray-850 mb-2">Costos y Límites de Envío</h2>
          <p className="text-gray-400 text-xs mb-6">Configura las tarifas de despacho para Arequipa y el resto del Perú.</p>

          {loadingShipping ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-450 mt-3 font-body">Cargando tarifas...</p>
            </div>
          ) : (
            <form onSubmit={handleGuardarShipping} className="space-y-5">
              {errorShipping && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                  ⚠️ {errorShipping}
                </div>
              )}
              {successShipping && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-bold">
                  ✓ Tarifas actualizadas correctamente.
                </div>
              )}

              {/* Arequipa */}
              <div className="space-y-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-coral uppercase tracking-wider">Despacho Arequipa (Local)</p>
                <div>
                  <label className="block text-gray-700 text-xs mb-1.5" htmlFor="arequipaFee">Costo de Envío</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">S/</span>
                    <input
                      id="arequipaFee"
                      type="number"
                      step="0.1"
                      required
                      value={shippingConfig.arequipaFee}
                      onChange={(e) => setShippingConfig({ ...shippingConfig, arequipaFee: e.target.value })}
                      className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-coral bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs mb-1.5" htmlFor="arequipaFreeLimit">Compra mínima para Envío Gratis</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">S/</span>
                    <input
                      id="arequipaFreeLimit"
                      type="number"
                      step="1"
                      required
                      value={shippingConfig.arequipaFreeLimit}
                      onChange={(e) => setShippingConfig({ ...shippingConfig, arequipaFreeLimit: e.target.value })}
                      className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-coral bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Nacional */}
              <div className="space-y-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Despacho Nacional (Provincias)</p>
                <div>
                  <label className="block text-gray-700 text-xs mb-1.5" htmlFor="nationalFee">Costo de Envío</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">S/</span>
                    <input
                      id="nationalFee"
                      type="number"
                      step="0.1"
                      required
                      value={shippingConfig.nationalFee}
                      onChange={(e) => setShippingConfig({ ...shippingConfig, nationalFee: e.target.value })}
                      className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-coral bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs mb-1.5" htmlFor="nationalFreeLimit">Compra mínima para Envío Gratis</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">S/</span>
                    <input
                      id="nationalFreeLimit"
                      type="number"
                      step="1"
                      required
                      value={shippingConfig.nationalFreeLimit}
                      onChange={(e) => setShippingConfig({ ...shippingConfig, nationalFreeLimit: e.target.value })}
                      className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-coral bg-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
              >
                Guardar Tarifas de Envío
              </button>
            </form>
          )}
        </div>

        {/* Columna Derecha: Gestión de Cupones */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Formulario Crear Cupón */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-brand text-xl text-gray-850 mb-1">Crear Cupón de Descuento</h2>
            <p className="text-gray-400 text-xs mb-5">Habilita códigos promocionales para la tienda.</p>

            <form onSubmit={handleCrearCupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              
              <div className="sm:col-span-1">
                <label className="block text-gray-700 font-semibold text-xs mb-1.5" htmlFor="codigoCupon">Código</label>
                <input
                  id="codigoCupon"
                  type="text"
                  required
                  placeholder="Ej: PETWEEK"
                  value={codigoCupon}
                  onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:border-coral bg-white text-gray-800 font-bold"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-gray-700 font-semibold text-xs mb-1.5" htmlFor="descuentoPorcentaje">Descuento (%)</label>
                <div className="relative">
                  <input
                    id="descuentoPorcentaje"
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="10"
                    value={descuentoPorcentaje}
                    onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white text-gray-800"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">%</span>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-gray-700 font-semibold text-xs mb-1.5" htmlFor="compraMinima">Monto Mínimo (Soles)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">S/</span>
                  <input
                    id="compraMinima"
                    type="number"
                    step="1"
                    placeholder="Opcional"
                    value={compraMinima}
                    onChange={(e) => setCompraMinima(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-coral bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-coral hover:bg-coral-dark text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
                >
                  Crear Cupón
                </button>
              </div>

              {errorCupon && (
                <div className="col-span-1 sm:col-span-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 mt-2">
                  ⚠️ {errorCupon}
                </div>
              )}
              {successCupon && (
                <div className="col-span-1 sm:col-span-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 font-bold mt-2">
                  ✓ Cupón promocional creado con éxito.
                </div>
              )}
            </form>
          </div>

          {/* Listado de Cupones */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-brand text-xl text-gray-850 mb-4">Cupones Creados</h2>
            
            {loadingCupones ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-450 mt-3 font-body">Cargando cupones...</p>
              </div>
            ) : cupones.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-3xl block mb-2">🎟️</span>
                <p className="text-gray-450 text-sm">No hay cupones promocionales registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2 text-center">Descuento</th>
                      <th className="px-4 py-2">Compra Mínima</th>
                      <th className="px-4 py-2 text-center">Activo</th>
                      <th className="px-4 py-2 text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-650">
                    {cupones.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/20">
                        <td className="px-4 py-3 font-mono font-bold text-gray-800">{c.id}</td>
                        <td className="px-4 py-3 text-center font-semibold text-coral">{c.descuento}% desc.</td>
                        <td className="px-4 py-3">
                          {c.compra_minima > 0 ? `S/ ${(c.compra_minima / 100).toFixed(2)}` : 'Sin compra mínima'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleCupon(c.id, c.activo)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                              c.activo
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {c.activo ? 'Habilitado' : 'Desactivado'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleEliminarCupon(c.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Eliminar cupón permanentemente"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
