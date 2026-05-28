import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import useCartStore from '../store/cartStore'
import { crearPedidoConTransaccion, obtenerConfiguracionEnvio } from '../services/firestore'
import PaymentQrCulqi from '../components/checkout/PaymentQrCulqi'
import PaymentMpBrick from '../components/checkout/PaymentMpBrick'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const LIMA_REGIONS = [
  'Arequipa',
  'Lima',
  'Cusco',
  'La Libertad',
  'Piura',
  'Ancash',
  'Cajamarca',
  'Callao',
  'Ica',
  'Junín',
  'Lambayeque',
  'Loreto',
  'Puno',
  'Tacna',
  'Otros'
]

const AREQUIPA_DISTRICTS = [
  'Arequipa (Cercado)',
  'Cayma',
  'Yanahuara',
  'José Luis Bustamante y Rivero',
  'Selva Alegre',
  'Paucarpata',
  'Miraflores',
  'Socabaya',
  'Sachaca',
  'Tiabaya',
  'Hunter',
  'Mariano Melgar',
  'Sabandía',
  'Characato',
  'Chiguata',
  'Cerro Colorado'
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, total, couponCode, couponDiscount, clearCart } = useCartStore()

  // Envío Config
  const [shippingConfig, setShippingConfig] = useState({
    arequipaFreeLimit: 30,
    nationalFreeLimit: 100,
    arequipaFee: 10,
    nationalFee: 15
  })

  // Cargar configuración de envío
  useEffect(() => {
    obtenerConfiguracionEnvio().then(setShippingConfig)
  }, [])

  // Formulario Estados
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [celular, setCelular] = useState('')
  
  // Dirección Estados
  const [departamento, setDepartamento] = useState('Arequipa')
  const [distritoArequipa, setDistritoArequipa] = useState(AREQUIPA_DISTRICTS[0])
  const [distritoNacional, setDistritoNacional] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')

  // Comprobante Estados
  const [incluirImpuesto, setIncluirImpuesto] = useState(false) // con o sin IGV
  const [tipoDocumento, setTipoDocumento] = useState('DNI') // DNI o RUC
  const [numeroDocumento, setNumeroDocumento] = useState('')

  // Métodos de Pago
  const [metodoPago, setMetodoPago] = useState('contraentrega') // 'contraentrega', 'yape', 'tarjeta'
  const [activePaymentModal, setActivePaymentModal] = useState(null) // 'yape', 'tarjeta'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [orderCompleted, setOrderCompleted] = useState(false)
  const orderCompletedRef = useRef(false)

  // Validaciones
  const totalSoles = total / 100
  const isArequipa = departamento === 'Arequipa'

  // Calcular costo de envío dinámico
  const getCostoEnvio = () => {
    if (isArequipa) {
      return totalSoles >= shippingConfig.arequipaFreeLimit ? 0 : shippingConfig.arequipaFee
    } else {
      return totalSoles >= shippingConfig.nationalFreeLimit ? 0 : shippingConfig.nationalFee
    }
  }

  const costoEnvio = getCostoEnvio()
  const costoEnvioCents = costoEnvio * 100
  const totalFinalCents = total + costoEnvioCents
  const totalFinalSoles = totalFinalCents / 100

  // Desglosar IGV (18%) si está seleccionado
  const igvRate = 0.18
  const baseImponibleSoles = incluirImpuesto ? (totalFinalSoles / (1 + igvRate)) : totalFinalSoles
  const igvCalculadoSoles = incluirImpuesto ? (totalFinalSoles - baseImponibleSoles) : 0

  useEffect(() => {
    if (items.length === 0 && !orderCompletedRef.current) {
      navigate('/carrito')
    }
  }, [items, navigate])

  const handleDocumentoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (tipoDocumento === 'DNI' && val.length <= 8) {
      setNumeroDocumento(val)
    } else if (tipoDocumento === 'RUC' && val.length <= 11) {
      setNumeroDocumento(val)
    }
  }

  // Prevenir envío directo si faltan datos
  const validateForm = () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !celular.trim() || !direccion.trim() || !numeroDocumento.trim()) {
      setErrorMsg('Por favor completa todos los campos obligatorios (*).')
      return false
    }
    if (tipoDocumento === 'DNI' && numeroDocumento.length !== 8) {
      setErrorMsg('El DNI debe tener exactamente 8 dígitos.')
      return false
    }
    if (tipoDocumento === 'RUC' && numeroDocumento.length !== 11) {
      setErrorMsg('El RUC debe tener exactamente 11 dígitos.')
      return false
    }
    if (!isArequipa && !distritoNacional.trim()) {
      setErrorMsg('Por favor, indica tu ciudad/distrito.')
      return false
    }
    setErrorMsg('')
    return true
  }

  const handleCheckoutSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) return

    if (metodoPago === 'yape') {
      setActivePaymentModal('yape')
    } else if (metodoPago === 'tarjeta') {
      setActivePaymentModal('tarjeta')
    } else {
      // Pago contra entrega
      await procesarCompraFinal({ metodo: 'Contra Entrega' })
    }
  }

  // Lógica para registrar el pedido real en Firestore
  const procesarCompraFinal = async (datosPago) => {
    setIsSubmitting(true)
    setErrorMsg('')
    
    const regionText = departamento === 'Arequipa' ? `Arequipa - ${distritoArequipa}` : `${departamento} - ${distritoNacional}`

    const orderData = {
      cliente: {
        nombre,
        apellido,
        email,
        celular,
        documento_tipo: tipoDocumento,
        documento_numero: numeroDocumento
      },
      envio: {
        departamento,
        distrito: isArequipa ? distritoArequipa : distritoNacional,
        direccion,
        referencia,
        costo_envio: costoEnvioCents
      },
      comprobante: {
        con_impuesto: incluirImpuesto,
        igv: Math.round(igvCalculadoSoles * 100),
        subtotal: total,
        total: totalFinalCents
      },
      pago: {
        metodo: datosPago.metodo,
        operacion: datosPago.operacion || '',
        estado: datosPago.metodo === 'Contra Entrega' ? 'Pendiente' : 'Pagado',
        marca_tarjeta: datosPago.marca || '',
        ultimos_digitos_tarjeta: datosPago.ultimosDigitos || ''
      },
      items: items.map(i => ({
        id: i.id,
        sku: i.sku || i.id,
        nombre: i.nombre,
        precio_unitario: i.precio_unitario,
        cantidad: i.cantidad,
        variante: i.variante,
        imagen: i.imagen || ''
      })),
      estado: 'recibido',
      estado_pedido: 'recibido',
      cupon: couponCode || null,
      descuento_porcentaje: couponDiscount
    }

    try {
      // 1. Crear el pedido usando transacciones para el stock
      const orderId = await crearPedidoConTransaccion(orderData)

      // 2. Si el pago fue con Yape y se subió comprobante físico, subirlo a Firebase Storage
      if (datosPago.metodo === 'Yape/Plin' && datosPago.comprobanteFile) {
        try {
          const storage = getStorage()
          const storageRefPath = `myp/comprobantes/${orderId}_recibo.jpg`
          const fileRef = ref(storage, storageRefPath)
          
          await uploadBytes(fileRef, datosPago.comprobanteFile)
          const downloadUrl = await getDownloadURL(fileRef)
          
          // Actualizar el documento de pedido con la URL real de la imagen
          const { updateDoc, doc } = await import('firebase/firestore')
          const { db } = await import('../services/firebase')
          await updateDoc(doc(db, 'myp_pedidos', orderId), {
            'pago.recibo_url': downloadUrl
          })
        } catch (storageErr) {
          console.warn('⚠️ Error al subir comprobante a Storage:', storageErr)
        }
      }

      // 3. Limpiar carrito y redireccionar al éxito
      orderCompletedRef.current = true
      setOrderCompleted(true)
      clearCart()
      navigate(`/orden-confirmada/${orderId}`)
    } catch (err) {
      console.error('❌ Error en el procesamiento del pedido:', err)
      setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar el pedido.')
    } finally {
      setIsSubmitting(false)
      setActivePaymentModal(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Missy & Po Pet Shop</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="font-ui font-bold text-3xl text-gray-800 mb-8 text-center md:text-left">Finalizar Compra</h1>

        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* DETALLES DE ENVÍO Y COMPROBACIÓN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Datos Personales */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-ui font-bold text-base text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-50">
                👤 Datos de Contacto
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-nombre" className="text-xs font-ui font-bold text-gray-600 block mb-1">Nombre *</label>
                  <input
                    id="input-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral/25"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="input-apellido" className="text-xs font-ui font-bold text-gray-600 block mb-1">Apellido *</label>
                  <input
                    id="input-apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral/25"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-email" className="text-xs font-ui font-bold text-gray-600 block mb-1">Email *</label>
                  <input
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral/25"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="input-celular" className="text-xs font-ui font-bold text-gray-600 block mb-1">Celular *</label>
                  <input
                    id="input-celular"
                    type="tel"
                    maxLength={9}
                    value={celular}
                    onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral/25"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dirección de Entrega */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-ui font-bold text-base text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-50">
                📍 Dirección de Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="select-departamento" className="text-xs font-ui font-bold text-gray-600 block mb-1">Departamento *</label>
                  <select
                    id="select-departamento"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:border-coral"
                  >
                    {LIMA_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-distrito" className="text-xs font-ui font-bold text-gray-600 block mb-1">Distrito / Ciudad *</label>
                  {isArequipa ? (
                    <select
                      id="select-distrito"
                      value={distritoArequipa}
                      onChange={(e) => setDistritoArequipa(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:border-coral"
                    >
                      {AREQUIPA_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="select-distrito"
                      type="text"
                      value={distritoNacional}
                      onChange={(e) => setDistritoNacional(e.target.value)}
                      placeholder="Ej: Trujillo, Yanacancha..."
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="input-direccion" className="text-xs font-ui font-bold text-gray-600 block mb-1">Dirección Exacta *</label>
                <input
                  id="input-direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, Avenida, Nro de casa/dpto..."
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral"
                  required
                />
              </div>

              <div>
                <label htmlFor="input-referencia" className="text-xs font-ui font-bold text-gray-600 block mb-1">Referencia</label>
                <input
                  id="input-referencia"
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Frente a parque, portón de color..."
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral"
                />
              </div>
            </div>

            {/* Boleta de Venta */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="font-ui font-bold text-base text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-50">
                🧾 Comprobante de Pago
              </h2>

              {/* Impuesto (IGV) deshabilitado temporalmente */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="select-doc-tipo" className="text-xs font-ui font-bold text-gray-600 block mb-1">Tipo de Documento *</label>
                  <select
                    id="select-doc-tipo"
                    value={tipoDocumento}
                    onChange={(e) => { setTipoDocumento(e.target.value); setNumeroDocumento('') }}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:border-coral"
                  >
                    <option value="DNI">DNI (Persona Natural)</option>
                    <option value="RUC">RUC (Empresa)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-doc-num" className="text-xs font-ui font-bold text-gray-600 block mb-1">
                    Número de {tipoDocumento} *
                  </label>
                  <input
                    id="input-doc-num"
                    type="text"
                    value={numeroDocumento}
                    onChange={handleDocumentoChange}
                    placeholder={tipoDocumento === 'DNI' ? '8 dígitos' : '11 dígitos'}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:border-coral"
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA — RESUMEN & PAGO */}
          <div className="space-y-6">
            
            {/* Resumen Final */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-ui font-bold text-base text-gray-800 pb-2 border-b border-gray-50">Resumen del Pedido</h3>
              
              <div className="max-h-36 overflow-y-auto divide-y divide-gray-50 pr-1">
                {items.map(item => (
                  <div key={item._key} className="flex justify-between items-center py-2 text-xs">
                    <span className="font-body text-gray-600 line-clamp-1 flex-1 pr-3">
                      {item.nombre} <strong className="text-coral">x{item.cantidad}</strong>
                    </span>
                    <span className="font-ui font-semibold text-gray-700">
                      S/ {((item.precio_unitario * item.cantidad) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold">S/ {(subtotal / 100).toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Descuento</span>
                    <span>− S/ {((subtotal * couponDiscount) / 10000).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Envío ({isArequipa ? 'Arequipa' : 'Nacional'})</span>
                  <span className="font-semibold">{costoEnvio === 0 ? 'Gratis' : `S/ ${costoEnvio.toFixed(2)}`}</span>
                </div>
                
                {incluirImpuesto && (
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>IGV (18% incluido)</span>
                    <span>S/ {igvCalculadoSoles.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-gray-100">
                  <span>Total Final</span>
                  <span className="text-lg text-coral">S/ {totalFinalSoles.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Pasarela y Selección */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-ui font-bold text-base text-gray-800 pb-2 border-b border-gray-50">Método de Pago</h3>
              
              <div className="space-y-2.5">
                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all duration-200
                                  ${metodoPago === 'contraentrega' ? 'border-coral bg-coral/5 ring-1 ring-coral' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="method"
                    value="contraentrega"
                    checked={metodoPago === 'contraentrega'}
                    onChange={() => setMetodoPago('contraentrega')}
                    className="text-coral focus:ring-coral"
                  />
                  <div>
                    <span className="text-xs font-ui font-bold text-gray-800 block">Pago contra entrega</span>
                    <span className="text-[10px] text-gray-400 font-body block">Efectivo o POS al recibir tu compra</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all duration-200
                                  ${metodoPago === 'yape' ? 'border-coral bg-coral/5 ring-1 ring-coral' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="method"
                    value="yape"
                    checked={metodoPago === 'yape'}
                    onChange={() => setMetodoPago('yape')}
                    className="text-coral focus:ring-coral"
                  />
                  <div>
                    <span className="text-xs font-ui font-bold text-gray-800 block">Yape / Plin</span>
                    <span className="text-[10px] text-gray-400 font-body block">Transferencia directa con QR dinámico</span>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all duration-200
                                  ${metodoPago === 'tarjeta' ? 'border-coral bg-coral/5 ring-1 ring-coral' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="method"
                    value="tarjeta"
                    checked={metodoPago === 'tarjeta'}
                    onChange={() => setMetodoPago('tarjeta')}
                    className="text-coral focus:ring-coral"
                  />
                  <div>
                    <span className="text-xs font-ui font-bold text-gray-800 block">Mercado Pago</span>
                    <span className="text-[10px] text-gray-400 font-body block">Tarjeta Visa, Mastercard, AMEX o Diners</span>
                  </div>
                </label>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-body bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  ⚠️ {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gray-900 text-white rounded-full font-ui font-bold text-sm hover:bg-coral transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  metodoPago === 'contraentrega' ? 'Completar Compra contra entrega' : 'Continuar con el Pago'
                )}
              </button>
            </div>

          </div>
        </form>

        {/* MODAL QR YAPE / PLIN */}
        {activePaymentModal === 'yape' && (
          <PaymentQrCulqi
            total={totalFinalCents}
            onCancel={() => setActivePaymentModal(null)}
            onConfirm={procesarCompraFinal}
          />
        )}

        {/* MODAL TARJETA MERCADO PAGO */}
        {activePaymentModal === 'tarjeta' && (
          <PaymentMpBrick
            total={totalFinalCents}
            onCancel={() => setActivePaymentModal(null)}
            onConfirm={procesarCompraFinal}
          />
        )}
      </div>
    </>
  )
}
