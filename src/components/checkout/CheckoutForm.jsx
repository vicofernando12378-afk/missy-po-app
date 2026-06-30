import React, { useState, useRef, useEffect } from 'react'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, doc, addDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { auth } from '../../services/firebase'
import { crearPedidoConTransaccion } from '../../services'

import useCheckoutForm from '../../hooks/useCheckoutForm'
import useClubMembership from '../../hooks/useClubMembership'
import useShippingCalc from '../../hooks/useShippingCalc'

import ContactFields from './ContactFields'
import ShippingFields from './ShippingFields'
import DocumentFields from './DocumentFields'
import OrderSummary from './OrderSummary'
import CouponSection from './CouponSection'
import ClubSection from './ClubSection'
import PaymentMethods from './PaymentMethods'

import PaymentQrCulqi from './PaymentQrCulqi'
import PaymentMpBrick from './PaymentMpBrick'

export default function CheckoutForm({
  items,
  subtotal,
  total,
  couponCode,
  couponDiscount,
  applyCoupon,
  removeCoupon,
  clearCart
}) {
  const form = useCheckoutForm()
  const club = useClubMembership()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  const subtotalSoles = subtotal / 100
  const pointsDiscountCents = club.pointsApplied
    ? (club.clubConfig.tipoPremio === 'monto_fijo'
        ? (club.clubConfig.valorDescuento * 100)
        : Math.round(subtotal * (club.clubConfig.valorDescuento / 100)))
    : 0

  const totalWithDiscounts = Math.max(0, total - pointsDiscountCents)
  const totalWithDiscountsSoles = totalWithDiscounts / 100

  const { shippingConfig, costoEnvio, isArequipa } = useShippingCalc(form.departamento, totalWithDiscountsSoles)
  const costoEnvioCents = costoEnvio * 100
  const totalFinalCents = totalWithDiscounts + costoEnvioCents
  const totalFinalSoles = totalFinalCents / 100

  // Desglosar IGV (18%)
  const igvRate = 0.18
  const baseImponibleSoles = form.incluirImpuesto ? (totalFinalSoles / (1 + igvRate)) : totalFinalSoles
  const igvCalculadoSoles = form.incluirImpuesto ? (totalFinalSoles - baseImponibleSoles) : 0

  const [activePaymentModal, setActivePaymentModal] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const orderCompletedRef = useRef(false)

  // Autocompletar alias de mascota si se verificó socio
  useEffect(() => {
    if (club.clubMember && club.clubMember.nombre_mascota) {
      form.setNombreMascota(club.clubMember.nombre_mascota)
    }
  }, [club.clubMember])

  const handleAutocomplete = (mData) => {
    if (mData.nombre_tutor) {
      const parts = mData.nombre_tutor.split(' ')
      form.setNombre(parts[0] || '')
      form.setApellido(parts.slice(1).join(' ') || '')
    }
    if (mData.email) form.setEmail(mData.email)
    if (mData.celular) form.setCelular(mData.celular)
    if (mData.direccion) form.setDireccion(mData.direccion)
    if (mData.documento_tipo) form.setTipoDocumento(mData.documento_tipo)
    if (mData.documento_numero) form.setNumeroDocumento(mData.documento_numero)
    if (mData.departamento) form.setDepartamento(mData.departamento)
    if (mData.distrito) {
      if (mData.departamento === 'Arequipa') {
        form.setDistritoArequipa(mData.distrito)
      } else {
        form.setDistritoNacional(mData.distrito)
      }
    }
  }

  const handleCheckoutSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.validateForm()) return

    if (form.metodoPago === 'yape') {
      setActivePaymentModal('yape')
    } else if (form.metodoPago === 'tarjeta') {
      setActivePaymentModal('tarjeta')
    } else {
      await procesarCompraFinal({ metodo: 'Contra Entrega' })
    }
  }

  const procesarCompraFinal = async (datosPago) => {
    setIsSubmitting(true)
    form.setErrorMsg('')
    
    const orderData = {
      userId: currentUser?.uid || null,
      cliente: {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        celular: form.celular,
        documento_tipo: form.tipoDocumento,
        documento_numero: form.numeroDocumento
      },
      envio: {
        departamento: form.departamento,
        distrito: isArequipa ? form.distritoArequipa : form.distritoNacional,
        direccion: form.direccion,
        referencia: form.referencia,
        costo_envio: costoEnvioCents
      },
      comprobante: {
        con_impuesto: form.incluirImpuesto,
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
      total_final: totalFinalCents,
      cupon: couponCode || null,
      descuento_porcentaje: couponDiscount,
      puntos_canjeados: club.pointsApplied ? club.clubConfig.puntosRequeridos : 0,
      descuento_puntos_monto: pointsDiscountCents
    }

    try {
      const orderId = await crearPedidoConTransaccion(orderData)

      // CRM Club de Beneficios
      try {
        let finalMemberId = club.clubMember ? club.clubMember.id : null
        let finalMemberData = club.clubMember

        if (!finalMemberId) {
          const qCheck = query(collection(db, 'myp_club_miembros'), where('email', '==', form.email.trim().toLowerCase()))
          const snapCheck = await getDocs(qCheck)
          if (!snapCheck.empty) {
            finalMemberId = snapCheck.docs[0].id
            finalMemberData = { id: finalMemberId, ...snapCheck.docs[0].data() }
          }
        }

        const pointsEarned = Math.floor(totalFinalSoles / club.clubConfig.solesPorDiezPuntos) * 10
        const pointsRedeemed = club.pointsApplied ? club.clubConfig.puntosRequeridos : 0

        if (finalMemberId) {
          const currentPoints = finalMemberData.puntos || 0
          const newPoints = Math.max(0, currentPoints - pointsRedeemed + pointsEarned)

          const updateData = {
            puntos: newPoints,
            actualizado_en: serverTimestamp()
          }
          if (!finalMemberData.celular && form.celular) updateData.celular = form.celular
          if (!finalMemberData.direccion && form.direccion) updateData.direccion = form.direccion
          if (!finalMemberData.documento_tipo && form.tipoDocumento) updateData.documento_tipo = form.tipoDocumento
          if (!finalMemberData.documento_numero && form.numeroDocumento) updateData.documento_numero = form.numeroDocumento
          if (!finalMemberData.departamento && form.departamento) updateData.departamento = form.departamento
          if (!finalMemberData.distrito) {
            updateData.distrito = form.departamento === 'Arequipa' ? form.distritoArequipa : form.distritoNacional
          }

          await updateDoc(doc(db, 'myp_club_miembros', finalMemberId), updateData)

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
          // Registrar automáticamente en el Club
          const newMemberRef = await addDoc(collection(db, 'myp_club_miembros'), {
            nombre_tutor: `${form.nombre} ${form.apellido}`,
            nombre_mascota: form.nombreMascota.trim(),
            email: form.email.trim().toLowerCase(),
            celular: form.celular,
            direccion: form.direccion,
            documento_tipo: form.tipoDocumento,
            documento_numero: form.numeroDocumento,
            departamento: form.departamento,
            distrito: form.departamento === 'Arequipa' ? form.distritoArequipa : form.distritoNacional,
            benefit_origen: 'Registro Automático Compra',
            puntos: pointsEarned,
            creado_en: serverTimestamp()
          })
          
          finalMemberId = newMemberRef.id

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

      // Subida de comprobante Yape/Plin
      if (datosPago.metodo === 'Yape/Plin' && datosPago.comprobanteFile) {
        try {
          const storage = getStorage()
          const storageRefPath = `myp/comprobantes/${orderId}_recibo.jpg`
          const fileRef = ref(storage, storageRefPath)
          
          await uploadBytes(fileRef, datosPago.comprobanteFile)
          const downloadUrl = await getDownloadURL(fileRef)
          
          await updateDoc(doc(db, 'myp_pedidos', orderId), {
            'pago.recibo_url': downloadUrl
          })
        } catch (storageErr) {
          console.warn('⚠️ Error al subir comprobante a Storage:', storageErr)
        }
      }

      orderCompletedRef.current = true
      clearCart()
      if (typeof window !== 'undefined') {
        window.location.href = `/orden-confirmada/${orderId}`
      }
    } catch (err) {
      console.error('❌ Error en el procesamiento del pedido:', err)
      form.setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar el pedido.')
    } finally {
      setIsSubmitting(false)
      setActivePaymentModal(null)
    }
  }

  return (
    <>
      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <ContactFields
            nombre={form.nombre}
            setNombre={form.setNombre}
            apellido={form.apellido}
            setApellido={form.setApellido}
            email={form.email}
            setEmail={form.setEmail}
            celular={form.celular}
            setCelular={form.setCelular}
            nombreMascota={form.nombreMascota}
            setNombreMascota={form.setNombreMascota}
          />
          <ShippingFields
            departamento={form.departamento}
            setDepartamento={form.setDepartamento}
            distritoArequipa={form.distritoArequipa}
            setDistritoArequipa={form.setDistritoArequipa}
            distritoNacional={form.distritoNacional}
            setDistritoNacional={form.setDistritoNacional}
            direccion={form.direccion}
            setDireccion={form.setDireccion}
            referencia={form.referencia}
            setReferencia={form.setReferencia}
          />
          <DocumentFields
            tipoDocumento={form.tipoDocumento}
            setTipoDocumento={form.setTipoDocumento}
            numeroDocumento={form.numeroDocumento}
            handleDocumentoChange={form.handleDocumentoChange}
            setNumeroDocumento={form.setNumeroDocumento}
          />
        </div>

        <div className="space-y-6">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            pointsDiscountCents={pointsDiscountCents}
            costoEnvio={costoEnvio}
            totalFinalSoles={totalFinalSoles}
            incluirImpuesto={form.incluirImpuesto}
            setIncluirImpuesto={form.setIncluirImpuesto}
            baseImponibleSoles={baseImponibleSoles}
            igvCalculadoSoles={igvCalculadoSoles}
          />
          <CouponSection
            couponInput={form.couponInput}
            setCouponInput={form.setCouponInput}
            couponMsg={form.couponMsg}
            isApplyingCoupon={form.isApplyingCoupon}
            handleApplyCoupon={form.handleApplyCoupon}
            couponCode={couponCode}
            removeCoupon={removeCoupon}
            couponDiscount={couponDiscount}
          />
          <ClubSection
            clubConfig={club.clubConfig}
            clubMember={club.clubMember}
            setClubMember={club.setClubMember}
            verifyingMember={club.verifyingMember}
            pointsApplied={club.pointsApplied}
            verifyEmailInput={club.verifyEmailInput}
            setVerifyEmailInput={club.setVerifyEmailInput}
            verifyAliasInput={club.verifyAliasInput}
            setVerifyAliasInput={club.setVerifyAliasInput}
            verifyError={club.verifyError}
            handleManualVerify={club.handleManualVerify}
            applyPoints={club.applyPoints}
            removePoints={club.removePoints}
            total={total}
            onAutocompleteCallback={handleAutocomplete}
          />
          <PaymentMethods
            metodoPago={form.metodoPago}
            setMetodoPago={form.setMetodoPago}
          />

          {form.errorMsg && (
            <p className="text-xs text-red-500 font-body bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              ⚠️ {form.errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-coral transition hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Procesando...' : (form.metodoPago === 'contraentrega' ? 'Completar Compra contra entrega' : 'Continuar con el Pago')}
          </button>
        </div>
      </form>

      {activePaymentModal === 'yape' && (
        <PaymentQrCulqi
          total={totalFinalCents}
          onCancel={() => setActivePaymentModal(null)}
          onConfirm={procesarCompraFinal}
        />
      )}

      {activePaymentModal === 'tarjeta' && (
        <PaymentMpBrick
          total={totalFinalCents}
          onCancel={() => setActivePaymentModal(null)}
          onConfirm={procesarCompraFinal}
        />
      )}
    </>
  )
}
