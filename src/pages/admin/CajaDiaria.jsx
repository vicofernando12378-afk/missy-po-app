import { useState, useEffect } from 'react'
import { auth } from '../../services/firebase'
import {
  obtenerCajaActiva,
  abrirCajaDiaria,
  registrarTransaccionManual,
  cerrarCajaDiaria,
  obtenerHistorialCajas,
  obtenerVentasConfirmadasDia
} from '../../services/firestore'

export default function CajaDiaria() {
  const [caja, setCaja] = useState(null)
  const [ventasDia, setVentasDia] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Formularios
  const [montoApertura, setMontoApertura] = useState('')
  const [errorApertura, setErrorApertura] = useState('')
  const [loadingApertura, setLoadingApertura] = useState(false)

  const [tipoMovimiento, setTipoMovimiento] = useState('egreso')
  const [montoMovimiento, setMontoMovimiento] = useState('')
  const [conceptoMovimiento, setConceptoMovimiento] = useState('')
  const [errorMovimiento, setErrorMovimiento] = useState('')
  const [loadingMovimiento, setLoadingMovimiento] = useState(false)

  const [efectivoRealCierre, setEfectivoRealCierre] = useState('')
  const [errorCierre, setErrorCierre] = useState('')
  const [loadingCierre, setLoadingCierre] = useState(false)

  const adminEmail = auth.currentUser?.email || 'admin'

  const cargarDatosCaja = async () => {
    setLoading(true)
    try {
      // 1. Obtener caja activa
      const cajaActiva = await obtenerCajaActiva()
      setCaja(cajaActiva)

      if (cajaActiva) {
        // 2. Obtener ventas automáticas de hoy
        const ventas = await obtenerVentasConfirmadasDia(cajaActiva.id)
        setVentasDia(ventas)
      }

      // 3. Obtener historial de cajas
      const hist = await obtenerHistorialCajas(10)
      setHistorial(hist)
    } catch (e) {
      console.error('Error al cargar caja diaria:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatosCaja()
  }, [])

  // ACCIÓN: ABRIR CAJA
  const handleAbrirCaja = async (e) => {
    e.preventDefault()
    setErrorApertura('')
    setLoadingApertura(true)

    const montoFloat = parseFloat(montoApertura)
    if (isNaN(montoFloat) || montoFloat < 0) {
      setErrorApertura('Ingresa un monto inicial válido (mayor o igual a cero).')
      setLoadingApertura(false)
      return
    }

    try {
      const montoCents = Math.round(montoFloat * 100)
      await abrirCajaDiaria(montoCents, adminEmail)
      setMontoApertura('')
      await cargarDatosCaja()
    } catch (err) {
      console.error(err)
      setErrorApertura(err.message || 'Error al intentar abrir la caja.')
    } finally {
      setLoadingApertura(false)
    }
  }

  // ACCIÓN: REGISTRAR MOVIMIENTO MANUAL
  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault()
    setErrorMovimiento('')
    setLoadingMovimiento(true)

    const montoFloat = parseFloat(montoMovimiento)
    if (isNaN(montoFloat) || montoFloat <= 0) {
      setErrorMovimiento('Ingresa un monto válido mayor a cero.')
      setLoadingMovimiento(false)
      return
    }

    if (!conceptoMovimiento.trim()) {
      setErrorMovimiento('Ingresa el concepto del movimiento.')
      setLoadingMovimiento(false)
      return
    }

    try {
      const montoCents = Math.round(montoFloat * 100)
      const transaccion = {
        tipo: tipoMovimiento,
        monto: montoCents,
        concepto: conceptoMovimiento,
        creado_por: adminEmail
      }

      await registrarTransaccionManual(caja.id, transaccion)
      
      setMontoMovimiento('')
      setConceptoMovimiento('')
      await cargarDatosCaja()
    } catch (err) {
      console.error(err)
      setErrorMovimiento(err.message || 'Error al registrar el movimiento.')
    } finally {
      setLoadingMovimiento(false)
    }
  }

  // ACCIÓN: CERRAR CAJA
  const handleCerrarCaja = async (e) => {
    e.preventDefault()
    setErrorCierre('')
    setLoadingCierre(true)

    const montoFloat = parseFloat(efectivoRealCierre)
    if (isNaN(montoFloat) || montoFloat < 0) {
      setErrorCierre('Ingresa un monto de arqueo físico válido.')
      setLoadingCierre(false)
      return
    }

    try {
      const montoCents = Math.round(montoFloat * 100)
      await cerrarCajaDiaria(caja.id, montoCents, adminEmail)
      setEfectivoRealCierre('')
      await cargarDatosCaja()
    } catch (err) {
      console.error(err)
      setErrorCierre(err.message || 'Error al cerrar la caja.')
    } finally {
      setLoadingCierre(false)
    }
  }

  // CÁLCULOS FINANCIEROS (en Soles)
  const aperturaSoles = caja ? caja.monto_apertura / 100 : 0

  // Ventas automáticas desglosadas
  const ventasYapePlinSoles = ventasDia
    .filter(v => v.pago?.metodo === 'transferencia' || v.pago?.metodo === 'yape' || v.pago?.metodo === 'plin')
    .reduce((sum, v) => sum + (v.total_final || 0), 0) / 100

  const ventasTarjetaSoles = ventasDia
    .filter(v => v.pago?.metodo !== 'transferencia' && v.pago?.metodo !== 'yape' && v.pago?.metodo !== 'plin')
    .reduce((sum, v) => sum + (v.total_final || 0), 0) / 100

  const totalVentasAutoSoles = ventasYapePlinSoles + ventasTarjetaSoles

  // Transacciones manuales desglosadas
  const ingresosManualesSoles = caja
    ? (caja.transacciones_manuales || [])
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0) / 100
    : 0

  const egresosManualesSoles = caja
    ? (caja.transacciones_manuales || [])
        .filter(t => t.tipo === 'egreso')
        .reduce((sum, t) => sum + t.monto, 0) / 100
    : 0

  // Proyecciones
  const efectivoProyectadoSoles = aperturaSoles + ingresosManualesSoles - egresosManualesSoles
  const balanceNetoTotalSoles = efectivoProyectadoSoles + totalVentasAutoSoles - aperturaSoles

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-body">Cargando control de flujos de caja...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-brand text-3xl text-gray-850">Caja Diaria</h1>
        <p className="text-gray-450 text-sm mt-1">Lleva el arqueo, control de ingresos en efectivo y conciliación de billeteras digitales.</p>
      </div>

      {!caja ? (
        // ── PANTALLA DE APERTURA DE CAJA ──
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-150 shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="font-brand text-2xl text-gray-850 mb-2">Apertura de Caja Requerida</h2>
          <p className="text-gray-500 font-body text-sm mb-6">
            No existe ninguna caja diaria abierta para registrar las operaciones financieras hoy. Por favor, abre la caja ingresando el efectivo inicial en físico.
          </p>

          <form onSubmit={handleAbrirCaja} className="space-y-4">
            {errorApertura && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                ⚠️ {errorApertura}
              </div>
            )}
            
            <div className="text-left">
              <label className="block text-gray-700 font-semibold text-sm mb-1.5" htmlFor="montoApertura">
                Efectivo de Apertura (Soles)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">S/</span>
                <input
                  id="montoApertura"
                  type="number"
                  step="0.01"
                  required
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-800 text-lg font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingApertura}
              className="w-full py-3.5 px-4 bg-coral hover:bg-coral-dark text-white rounded-2xl font-semibold shadow-md shadow-coral/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loadingApertura ? 'Abriendo caja...' : '✓ Abrir Caja del Día'}
            </button>
          </form>
        </div>
      ) : (
        // ── PANTALLA DE CAJA ABIERTA (DASHBOARD FINANCIERO) ──
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda & Central: Balances y Transacciones */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Cabecera Caja Abierta */}
            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Caja Abierta
                </span>
                <h3 className="font-brand text-2xl text-gray-850 mt-1">Caja: {caja.id}</h3>
              </div>
              <div className="text-sm text-gray-500">
                <p><strong>Abierta por:</strong> {caja.abierta_por}</p>
                <p className="mt-0.5"><strong>Apertura:</strong> {new Date(caja.fecha_apertura.seconds ? caja.fecha_apertura.seconds * 1000 : caja.fecha_apertura).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* KPI Cards Finanzas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fondo Efectivo Inicial</p>
                <p className="text-3xl font-brand text-gray-850 mt-2">S/ {aperturaSoles.toFixed(2)}</p>
                <div className="h-1.5 w-12 bg-gray-300 rounded-full mt-3"></div>
              </div>

              <div className="p-6 bg-gradient-to-br from-emerald-50/20 to-white rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Efectivo Proyectado</p>
                <p className="text-3xl font-brand text-emerald-700 mt-2">S/ {efectivoProyectadoSoles.toFixed(2)}</p>
                <p className="text-[10px] text-gray-450 mt-2 leading-tight">Inicial + Ingresos Manuales - Egresos Manuales</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-50/20 to-white rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Billeteras & Pasarelas</p>
                <p className="text-3xl font-brand text-indigo-700 mt-2">S/ {totalVentasAutoSoles.toFixed(2)}</p>
                <div className="text-[10px] text-gray-450 mt-2 flex flex-col gap-0.5">
                  <span>📱 Yape/Plin: S/ {ventasYapePlinSoles.toFixed(2)}</span>
                  <span>💳 Tarjetas: S/ {ventasTarjetaSoles.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Transacciones del Día */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="font-brand text-xl text-gray-850">Movimientos de Efectivo Manuales</h3>
              
              {(caja.transacciones_manuales || []).length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-3xl block mb-2">💸</span>
                  <p className="text-gray-400 text-sm">No hay egresos o ingresos de efectivo manuales registrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
                        <th className="px-4 py-2">Hora</th>
                        <th className="px-4 py-2">Concepto</th>
                        <th className="px-4 py-2">Usuario</th>
                        <th className="px-4 py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(caja.transacciones_manuales || []).map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/30">
                          <td className="px-4 py-3 text-gray-450 text-xs">
                            {new Date(t.fecha.seconds ? t.fecha.seconds * 1000 : t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{t.concepto}</p>
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.25 rounded uppercase ${
                              t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">{t.creado_por}</td>
                          <td className={`px-4 py-3 text-right font-bold ${
                            t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {t.tipo === 'ingreso' ? '+' : '-'} S/ {(t.monto / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>

          {/* Columna Derecha: Formularios de Transacción y Cierre */}
          <div className="space-y-8">
            
            {/* Formulario de Transacción Manual */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-brand text-lg text-gray-850 mb-4">Registrar Movimiento de Efectivo</h3>

              <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                {errorMovimiento && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                    ⚠️ {errorMovimiento}
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold text-xs mb-1">Tipo de Movimiento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('egreso')}
                      className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all border ${
                        tipoMovimiento === 'egreso'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      🛑 Egreso (Salida)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('ingreso')}
                      className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all border ${
                        tipoMovimiento === 'ingreso'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      🟢 Ingreso (Entrada)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold text-xs mb-1.5" htmlFor="montoMovimiento">
                    Monto (Soles)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">S/</span>
                    <input
                      id="montoMovimiento"
                      type="number"
                      step="0.01"
                      required
                      value={montoMovimiento}
                      onChange={(e) => setMontoMovimiento(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold text-xs mb-1.5" htmlFor="conceptoMovimiento">
                    Concepto / Descripción
                  </label>
                  <input
                    id="conceptoMovimiento"
                    type="text"
                    required
                    value={conceptoMovimiento}
                    onChange={(e) => setConceptoMovimiento(e.target.value)}
                    placeholder="Ej: Pago de delivery de motorizado"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingMovimiento}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
                >
                  {loadingMovimiento ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
              </form>
            </div>

            {/* Formulario Cierre de Caja */}
            <div className="bg-gradient-to-br from-amber-50/20 to-white rounded-3xl border border-amber-100 shadow-sm p-6">
              <h3 className="font-brand text-lg text-gray-850 mb-2">Arqueo y Cierre de Caja</h3>
              <p className="text-gray-400 text-xs mb-4">Registra el efectivo físico real al terminar las operaciones comerciales de hoy.</p>

              <form onSubmit={handleCerrarCaja} className="space-y-4">
                {errorCierre && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                    ⚠️ {errorCierre}
                  </div>
                )}

                <div>
                  <label className="block text-gray-750 font-semibold text-xs mb-1.5" htmlFor="efectivoRealCierre">
                    Efectivo Físico Real en Caja
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-450 font-bold text-xs">S/</span>
                    <input
                      id="efectivoRealCierre"
                      type="number"
                      step="0.01"
                      required
                      value={efectivoRealCierre}
                      onChange={(e) => setEfectivoRealCierre(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white font-semibold text-gray-800"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Efectivo proyectado según sistema: <strong>S/ {efectivoProyectadoSoles.toFixed(2)}</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={loadingCierre}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-[0.98] transition-all disabled:bg-gray-300"
                >
                  {loadingCierre ? 'Cerrando caja...' : '🔒 Cerrar Caja Diaria'}
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* ── HISTORIAL DE CAJAS CERRADAS ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-brand text-xl text-gray-850 mb-4">Historial de Cajas Cerradas</h3>
        
        {historial.filter(h => h.estado === 'cerrada').length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <span className="text-4xl block mb-2">📜</span>
            <p className="text-gray-400 text-sm">No hay registros de cajas diarias anteriores cerradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3">Fecha de Caja</th>
                  <th className="px-6 py-3">Apertura (Efectivo)</th>
                  <th className="px-6 py-3">Cierre (Efectivo Real)</th>
                  <th className="px-6 py-3">Diferencia / Arqueo</th>
                  <th className="px-6 py-3">Responsables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-650">
                {historial.filter(h => h.estado === 'cerrada').map((h) => {
                  const apertura = h.monto_apertura / 100
                  const cierre = h.monto_cierre / 100
                  
                  // Calcular transacciones manuales de esa caja
                  const manualesIng = (h.transacciones_manuales || [])
                    .filter(t => t.tipo === 'ingreso')
                    .reduce((sum, t) => sum + t.monto, 0) / 100
                  const manualesEgr = (h.transacciones_manuales || [])
                    .filter(t => t.tipo === 'egreso')
                    .reduce((sum, t) => sum + t.monto, 0) / 100
                  
                  const proyeccionEfectivo = apertura + manualesIng - manualesEgr
                  const diferencia = cierre - proyeccionEfectivo

                  return (
                    <tr key={h.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-800">{h.id}</td>
                      <td className="px-6 py-4">S/ {apertura.toFixed(2)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">S/ {cierre.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {diferencia === 0 ? (
                          <span className="text-emerald-600 font-semibold">✓ Cuadrado</span>
                        ) : diferencia > 0 ? (
                          <span className="text-sky-600 font-semibold">Sobró: +S/ {diferencia.toFixed(2)}</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">Faltó: -S/ {Math.abs(diferencia).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5">
                        <p><strong>Apertura:</strong> {h.abierta_por}</p>
                        <p><strong>Cierre:</strong> {h.cerrada_por}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
