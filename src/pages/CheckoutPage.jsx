import { useState, useEffect, useRef } from 'react'
import useCartStore from '../store/cartStore'
import { crearPedidoConTransaccion, obtenerConfiguracionEnvio } from '../services/firestore'
import PaymentQrCulqi from '../components/checkout/PaymentQrCulqi'
import PaymentMpBrick from '../components/checkout/PaymentMpBrick'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, getDoc, getDocs, collection, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

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
  const { items, subtotal, total, couponCode, couponDiscount, applyCoupon, removeCoupon, clearCart } = useCartStore()

  // Configuración de Canje de Club
  const [clubConfig, setClubConfig] = useState({
    solesPorDiezPuntos: 10,
    tipoPremio: 'monto_fijo',
    valorDescuento: 10,
    puntosRequeridos: 200,
    minCompraAplicarCanje: 50
  })

  // Socio Miembro
  const [clubMember, setClubMember] = useState(null)
  const [verifyingMember, setVerifyingMember] = useState(false)
  const [pointsApplied, setPointsApplied] = useState(false)

  // Verificación manual de Socio
  const [verifyEmailInput, setVerifyEmailInput] = useState('')
  const [verifyAliasInput, setVerifyAliasInput] = useState('')
  const [verifyError, setVerifyError] = useState('')

  // Campo de registro para nueva membresía / Alias
  const [nombreMascota, setNombreMascota] = useState('')

  // Autocompletar alias de mascota si se verificó socio
  useEffect(() => {
    if (clubMember && clubMember.nombre_mascota) {
      setNombreMascota(clubMember.nombre_mascota)
    }
  }, [clubMember])

  // Cupón Estados locales
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  // Cargar configuración de canje del club
  useEffect(() => {
    getDoc(doc(db, 'myp_config', 'club')).then(snap => {
      if (snap.exists()) {
        setClubConfig(snap.data())
      }
    }).catch(err => console.warn('Error loading club config:', err))
  }, [])

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

  const handleManualVerify = async () => {
    if (!verifyEmailInput.trim() || !verifyAliasInput.trim()) {
      setVerifyError('Ingresa el correo y el alias de tu mascota.')
      return
    }
    setVerifyingMember(true)
    setVerifyError('')
    try {
      const q = query(
        collection(db, 'myp_club_miembros'),
        where('email', '==', verifyEmailInput.trim().toLowerCase())
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        // Buscar coincidencia de mascota (case insensitive)
        const matchDoc = snap.docs.find(doc => 
          (doc.data().nombre_mascota || '').trim().toLowerCase() === verifyAliasInput.trim().toLowerCase()
        )
        
        if (matchDoc) {
          const mData = matchDoc.data()
          setClubMember({ id: matchDoc.id, ...mData })
          setVerifyError('')
          
          // Autocompletar el formulario de compra con los datos del socio
          if (mData.nombre_tutor) {
            const parts = mData.nombre_tutor.split(' ')
            setNombre(parts[0] || '')
            setApellido(parts.slice(1).join(' ') || '')
          }
          if (mData.email) setEmail(mData.email)
          if (mData.celular) setCelular(mData.celular)
          if (mData.direccion) setDireccion(mData.direccion)
          if (mData.documento_tipo) setTipoDocumento(mData.documento_tipo)
          if (mData.documento_numero) setNumeroDocumento(mData.documento_numero)
          if (mData.departamento) setDepartamento(mData.departamento)
          if (mData.distrito) {
            if (mData.departamento === 'Arequipa') {
              setDistritoArequipa(mData.distrito)
            } else {
              setDistritoNacional(mData.distrito)
            }
          }
        } else {
          setVerifyError('El alias de la mascota no coincide.')
        }
      } else {
        setVerifyError('Socio no registrado en el Club.')
      }
    } catch (err) {
      console.warn('Error verifying manual member:', err)
      setVerifyError('Error al conectar con el servidor.')
    } finally {
      setVerifyingMember(false)
    }
  }
  
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
  const isArequipa = departamento === 'Arequipa'

  // Calcular descuento de puntos si están aplicados
  const subtotalSoles = subtotal / 100
  const pointsDiscountCents = pointsApplied
    ? (clubConfig.tipoPremio === 'monto_fijo'
        ? (clubConfig.valorDescuento * 100)
        : Math.round(subtotal * (clubConfig.valorDescuento / 100)))
    : 0

  // Total acumulado después de todos los descuentos (cupón y puntos)
  const totalWithDiscounts = Math.max(0, total - pointsDiscountCents)
  const totalWithDiscountsSoles = totalWithDiscounts / 100

  // Calcular costo de envío dinámico
  const getCostoEnvio = () => {
    if (isArequipa) {
      return totalWithDiscountsSoles >= shippingConfig.arequipaFreeLimit ? 0 : shippingConfig.arequipaFee
    } else {
      return totalWithDiscountsSoles >= shippingConfig.nationalFreeLimit ? 0 : shippingConfig.nationalFee
    }
  }

  const costoEnvio = getCostoEnvio()
  const costoEnvioCents = costoEnvio * 100
  const totalFinalCents = totalWithDiscounts + costoEnvioCents
  const totalFinalSoles = totalFinalCents / 100

  // Desglosar IGV (18%) si está seleccionado
  const igvRate = 0.18
  const baseImponibleSoles = incluirImpuesto ? (totalFinalSoles / (1 + igvRate)) : totalFinalSoles
  const igvCalculadoSoles = incluirImpuesto ? (totalFinalSoles - baseImponibleSoles) : 0

  useEffect(() => {
    if (items.length === 0 && !orderCompletedRef.current) {
      if (typeof window !== 'undefined') {
        window.location.href = '/carrito'
      }
    }
  }, [items])

  const handleDocumentoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (tipoDocumento === 'DNI' && val.length <= 8) {
      setNumeroDocumento(val)
    } else if (tipoDocumento === 'RUC' && val.length <= 11) {
      setNumeroDocumento(val)
    }
  }

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault()
    if (!couponInput.trim()) return
    setIsApplyingCoupon(true)
    const result = await applyCoupon(couponInput)
    setCouponMsg(result)
    if (result.success) setCouponInput('')
    setIsApplyingCoupon(false)
    setTimeout(() => setCouponMsg(null), 3000)
  }

  // Prevenir envío directo si faltan datos
  const validateForm = () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !celular.trim() || !direccion.trim() || !numeroDocumento.trim() || !nombreMascota.trim()) {
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
      total_final: totalFinalCents,      // Campo raíz para acceso rápido desde el admin
      cupon: couponCode || null,
      descuento_porcentaje: couponDiscount,
      puntos_canjeados: pointsApplied ? clubConfig.puntosRequeridos : 0,
      descuento_puntos_monto: pointsDiscountCents
    }

    try {
      // 1. Crear el pedido usando transacciones para el stock
      const orderId = await crearPedidoConTransaccion(orderData)

      // 1.5. Lógica CRM del Club de Beneficios (Registro Automático, Acumulación y Canjes)
      try {
        let finalMemberId = clubMember ? clubMember.id : null
        let finalMemberData = clubMember

        // Buscar si ya existe un socio con este correo (por si no se verificó antes)
        if (!finalMemberId) {
          const qCheck = query(collection(db, 'myp_club_miembros'), where('email', '==', email.trim().toLowerCase()))
          const snapCheck = await getDocs(qCheck)
          if (!snapCheck.empty) {
            finalMemberId = snapCheck.docs[0].id
            finalMemberData = { id: finalMemberId, ...snapCheck.docs[0].data() }
          }
        }

        const pointsEarned = Math.floor(totalFinalSoles / clubConfig.solesPorDiezPuntos) * 10
        const pointsRedeemed = pointsApplied ? clubConfig.puntosRequeridos : 0

        if (finalMemberId) {
          // El socio existe: actualizar saldo de puntos y enriquecer campos de perfil faltantes
          const currentPoints = finalMemberData.puntos || 0
          const newPoints = Math.max(0, currentPoints - pointsRedeemed + pointsEarned)

          const updateData = {
            puntos: newPoints,
            actualizado_en: serverTimestamp()
          }
          // Enriquecimiento de datos si no existen
          if (!finalMemberData.celular && celular) updateData.celular = celular
          if (!finalMemberData.direccion && direccion) updateData.direccion = direccion
          if (!finalMemberData.documento_tipo && tipoDocumento) updateData.documento_tipo = tipoDocumento
          if (!finalMemberData.documento_numero && numeroDocumento) updateData.documento_numero = numeroDocumento
          if (!finalMemberData.departamento && departamento) updateData.departamento = departamento
          if (!finalMemberData.distrito) {
            updateData.distrito = departamento === 'Arequipa' ? distritoArequipa : distritoNacional
          }

          await updateDoc(doc(db, 'myp_club_miembros', finalMemberId), updateData)

          // Registrar logs transaccionales
          if (pointsRedeemed > 0) {
            await addDoc(collection(db, 'myp_club_miembros', finalMemberId, 'puntos_logs'), {
              puntos: -pointsRedeemed,
              motivo: `Canje por descuento en pedido #${orderId}`,
              creado_en: serverTimestamp()
            })
          }
          if (pointsEarned > 0) {
            await addDoc(collection(db, 'myp_club_miembros', finalMemberId, 'puntos_logs'), {
              puntos: pointsEarned,
              motivo: `Puntos ganados por compra en pedido #${orderId}`,
              creado_en: serverTimestamp()
            })
          }
        } else {
          // El socio NO existe: registrar automáticamente en el Club
          const newMemberRef = await addDoc(collection(db, 'myp_club_miembros'), {
            nombre_tutor: `${nombre} ${apellido}`,
            nombre_mascota: nombreMascota.trim(),
            email: email.trim().toLowerCase(),
            celular: celular,
            direccion: direccion,
            documento_tipo: tipoDocumento,
            documento_numero: numeroDocumento,
            departamento: departamento,
            distrito: departamento === 'Arequipa' ? distritoArequipa : distritoNacional,
            benefit_origen: 'Registro Automático Compra',
            puntos: pointsEarned,
            creado_en: serverTimestamp()
          })
          
          finalMemberId = newMemberRef.id

          // Log de bienvenida con sus primeros puntos
          if (pointsEarned > 0) {
            await addDoc(collection(db, 'myp_club_miembros', finalMemberId, 'puntos_logs'), {
              puntos: pointsEarned,
              motivo: `Puntos acumulados por primera compra en pedido #${orderId}`,
              creado_en: serverTimestamp()
            })
          }
        }
      } catch (crmErr) {
        console.warn('⚠️ Error en la automatización de CRM del Club:', crmErr)
      }

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
      if (typeof window !== 'undefined') {
        window.location.href = `/orden-confirmada/${orderId}`
      }
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-nombre-mascota" className="text-xs font-ui font-bold text-gray-600 block mb-1">Nombre de tu mascota (Alias) *</label>
                  <input
                    id="input-nombre-mascota"
                    type="text"
                    value={nombreMascota}
                    onChange={(e) => setNombreMascota(e.target.value)}
                    placeholder="Ej. Missy (Para tu registro en el Club)"
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
                    <span>Descuento Cupón ({couponDiscount}%)</span>
                    <span>− S/ {((subtotal * couponDiscount) / 10000).toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscountCents > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Descuento Club ({clubConfig.puntosRequeridos} pts)</span>
                    <span>− S/ {(pointsDiscountCents / 100).toFixed(2)}</span>
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

            {/* Card: Cupones y Club de Lealtad */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-brand text-base text-gray-800 pb-2 border-b border-gray-50 flex items-center gap-2">
                🎟️ Descuentos y Club
              </h3>

              {/* Sección de Cupón de Descuento */}
              <div className="space-y-2">
                <span className="text-[11px] font-ui font-semibold text-gray-500 block uppercase tracking-wider">¿Tienes un cupón?</span>
                {couponCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-150 rounded-2xl px-4 py-2.5">
                    <div className="min-w-0">
                      <span className="text-xs font-ui font-bold text-green-700 block">Cupón: {couponCode}</span>
                      <span className="text-[10px] font-body text-green-600 block">Descuento de {couponDiscount}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-500 hover:text-red-600 font-ui font-semibold cursor-pointer bg-transparent border-none"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Ej: BIENVENIDO10"
                      className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-xs font-body text-gray-700 focus:outline-none focus:border-coral"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="px-4 h-10 rounded-xl bg-gray-900 text-white text-xs font-ui font-semibold hover:bg-coral transition-colors disabled:opacity-50 cursor-pointer border-none"
                    >
                      {isApplyingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {couponMsg && (
                  <p className={`text-[10px] font-body mt-1 pl-2 ${couponMsg.success ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMsg.success ? '¡Cupón aplicado con éxito!' : couponMsg.message}
                  </p>
                )}
              </div>

              {/* Sección de Club de Beneficios (Puntos) */}
              <div className="border-t border-gray-50 pt-4 space-y-3">
                <span className="text-[11px] font-ui font-semibold text-gray-500 block uppercase tracking-wider">Club Missy & Po</span>
                
                {verifyingMember ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-3.5 h-3.5 border-2 border-coral border-t-transparent rounded-full animate-spin"></div>
                    <span>Verificando membresía...</span>
                  </div>
                ) : clubMember ? (
                  <div className="space-y-2">
                    <div className="bg-coral/5 border border-coral/10 rounded-2xl p-3 text-xs">
                      <span className="block font-bold text-gray-800">🐾 ¡Hola, tutor de {clubMember.nombre_mascota}!</span>
                      <span className="block text-gray-500 mt-0.5">Tienes <strong className="text-coral">{clubMember.puntos || 0} puntos</strong> disponibles.</span>
                    </div>

                    {pointsApplied ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-150 rounded-2xl px-4 py-2.5">
                        <div className="min-w-0">
                          <span className="text-xs font-ui font-bold text-green-700 block">Puntos Canjeados: {clubConfig.puntosRequeridos} pts</span>
                          <span className="text-[10px] font-body text-green-600 block">
                            Descuento de {clubConfig.tipoPremio === 'monto_fijo' ? `S/ ${clubConfig.valorDescuento}` : `${clubConfig.valorDescuento}%`} aplicado
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPointsApplied(false)}
                          className="text-xs text-red-500 hover:text-red-600 font-ui font-semibold cursor-pointer bg-transparent border-none"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {subtotalSoles < clubConfig.minCompraAplicarCanje ? (
                          <p className="text-[10px] text-amber-600 font-body bg-amber-50/50 border border-amber-100 rounded-xl px-2.5 py-1.5 leading-normal">
                            ⚠️ Monto mínimo de compra para canjear puntos es **S/ {clubConfig.minCompraAplicarCanje.toFixed(2)}** (tu subtotal: S/ {subtotalSoles.toFixed(2)}).
                          </p>
                        ) : (clubMember.puntos || 0) < clubConfig.puntosRequeridos ? (
                          <p className="text-[10px] text-gray-400 font-body bg-gray-50 border border-gray-150 rounded-xl px-2.5 py-1.5 leading-normal">
                            Necesitas al menos **{clubConfig.puntosRequeridos} puntos** para realizar un canje.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setPointsApplied(true)
                              alert("¡Puntos canjeados y descuento aplicado a tu pedido! ✨")
                            }}
                            className="w-full py-2.5 bg-coral text-white rounded-xl text-xs font-ui font-bold hover:bg-coral-dark shadow-sm transition-all cursor-pointer border-none"
                          >
                            Canjear {clubConfig.puntosRequeridos} puntos 🌟
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-150 shadow-inner">
                    <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wide">
                      ¿Eres socio del Club? Verifica tus datos:
                    </span>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Correo registrado del socio"
                        value={verifyEmailInput}
                        onChange={(e) => setVerifyEmailInput(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs font-body focus:outline-none focus:border-coral bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Nombre de tu mascota (Alias)"
                        value={verifyAliasInput}
                        onChange={(e) => setVerifyAliasInput(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-xs font-body focus:outline-none focus:border-coral bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleManualVerify}
                        className="w-full py-2 bg-gray-900 hover:bg-coral text-white rounded-xl text-[11px] font-ui font-bold transition-all cursor-pointer border-none"
                      >
                        Verificar y Cargar Puntos 🐾
                      </button>
                    </div>
                    {verifyError && (
                      <p className="text-[10px] text-red-500 font-body pl-1">
                        ⚠️ {verifyError}
                      </p>
                    )}
                  </div>
                )}
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
