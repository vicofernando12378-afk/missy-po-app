import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const docRef = doc(db, 'myp_pedidos', orderId)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setOrder(snap.data())
        }
      } catch (err) {
        console.error('❌ Error al obtener pedido confirmación:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="py-32 text-center no-print">
        <div className="inline-block w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-body text-sm mt-4">Confirmando tu pedido en la base de datos...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center no-print">
        <span className="text-6xl block mb-4">💔</span>
        <h1 className="font-ui font-bold text-2xl text-gray-800 mb-2">Pedido no encontrado</h1>
        <p className="text-gray-500 font-body mb-8 text-sm">
          No pudimos localizar los datos del pedido <strong>#{orderId}</strong>. Verifica el enlace o contacta con soporte.
        </p>
        <Link to="/tienda" className="bg-coral text-white px-6 py-2.5 rounded-full font-ui font-semibold text-xs hover:bg-coral-dark">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const { cliente, envio, comprobante, pago, items, cupon, descuento_porcentaje } = order

  // WhatsApp pre-llenado enlace
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '51999999999'
  const itemsText = items.map(i => `- ${i.nombre} x${i.cantidad} (${i.variante !== 'default' ? i.variante : 'Base'})`).join('\n')
  
  const rawMessage = `¡Hola Missy & Po! 👋 Acabo de realizar un pedido en la web:
  
*ID del Pedido:* #${orderId}
*Cliente:* ${cliente.nombre} ${cliente.apellido} (${cliente.celular})
*Método de Pago:* ${pago.metodo} ${pago.operacion ? `(Op: ${pago.operacion})` : ''}
*Total de la Compra:* S/ ${(comprobante.total / 100).toFixed(2)}
*Envío a:* ${envio.departamento} - ${envio.distrito} (${envio.direccion})

*Productos:*
${itemsText}

Por favor confírmenme la recepción del pedido.`

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(rawMessage)}`

  // Base y IGV en Soles
  const totalSoles = comprobante.total / 100
  const subtotalSoles = comprobante.subtotal / 100
  const envioSoles = (envio.costo_envio || 0) / 100
  const igvSoles = (comprobante.igv || 0) / 100
  const baseSoles = totalSoles - igvSoles - envioSoles

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Helmet>
        <title>Confirmación de Pedido #{orderId} | Missy & Po</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Banner de Éxito */}
        <div className="text-center mb-10 no-print">
          <span className="text-6xl block mb-4 animate-bounce">🎉</span>
          <h1 className="font-ui font-bold text-3xl text-gray-800 mb-2">¡Gracias por tu compra!</h1>
          <p className="text-gray-500 font-body text-sm max-w-md mx-auto">
            Hemos recibido tu pedido con éxito. Por favor guarda tu número de orden y envíalo por WhatsApp para coordinar tu entrega de inmediato.
          </p>
        </div>

        {/* COMPROBANTE / TICKET (Listo para Imprimir A4 o Térmico) */}
        <div className="bg-white rounded-3xl border border-gray-250 p-6 sm:p-8 shadow-md relative overflow-hidden print-full print:border-0 print:shadow-none">
          {/* Decoración de ondas en cabecera */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-coral to-amber-300 no-print" />

          {/* Logo y Encabezado Ticket */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
            <div>
              <span className="font-brand text-3xl text-coral font-bold block">Missy & Po</span>
              <span className="text-[10px] font-body text-gray-400 block mt-0.5">Tienda de mascotas premium y accesorios</span>
              <span className="text-[10px] font-body text-gray-400 block">Arequipa, Perú - Envíos Nacionales</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="bg-coral/10 text-coral font-ui font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider block w-fit sm:ml-auto mb-1">
                Boleta de Venta
              </span>
              <span className="text-xs font-body text-gray-500 block">Orden ID: <strong>#{orderId}</strong></span>
              <span className="text-[10px] font-body text-gray-400 block">Fecha: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Datos del Cliente e Envío */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100 pb-6 mb-6 text-xs font-body">
            <div>
              <h4 className="font-ui font-bold text-gray-700 uppercase tracking-wider mb-2">Cliente</h4>
              <p className="text-gray-600 font-semibold">{cliente.nombre} {cliente.apellido}</p>
              <p className="text-gray-500 mt-1">Celular: {cliente.celular}</p>
              <p className="text-gray-500">Documento ({cliente.documento_tipo}): {cliente.documento_numero}</p>
              <p className="text-gray-500">Email: {cliente.email}</p>
            </div>
            <div>
              <h4 className="font-ui font-bold text-gray-700 uppercase tracking-wider mb-2">Despacho</h4>
              <p className="text-gray-600 font-semibold">{envio.departamento}</p>
              <p className="text-gray-500 mt-1">Ciudad/Distrito: {envio.distrito}</p>
              <p className="text-gray-500">Dirección: {envio.direccion}</p>
              {envio.referencia && <p className="text-gray-400 italic">Ref: {envio.referencia}</p>}
            </div>
          </div>

          {/* Lista de Productos del Ticket */}
          <div className="mb-6">
            <h4 className="font-ui font-bold text-xs text-gray-700 uppercase tracking-wider mb-3">Detalle del Pedido</h4>
            <div className="divide-y divide-gray-50">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-3 text-xs">
                  <div className="flex-1 pr-4">
                    <p className="font-ui font-bold text-gray-800 leading-snug">{item.nombre}</p>
                    {item.variante !== 'default' && (
                      <p className="text-[10px] text-coral font-ui font-semibold mt-0.5">{item.variante}</p>
                    )}
                    <p className="text-[10px] text-gray-400 font-body mt-0.5">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[90px]">
                    <p className="font-ui font-semibold text-gray-800">
                      S/ {((item.precio_unitario * item.cantidad) / 100).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-body">S/ {(item.precio_unitario / 100).toFixed(2)} x {item.cantidad}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales y Desglose de Pago */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between gap-6 items-start">
            {/* Método de pago info */}
            <div className="text-xs space-y-1">
              <span className="font-ui font-bold text-gray-700 uppercase tracking-wider block mb-1">Detalles de Pago</span>
              <p className="text-gray-600 font-semibold">Método: {pago.metodo}</p>
              {pago.operacion && <p className="text-gray-500">Operación: #{pago.operacion}</p>}
              <p className="text-gray-500">Estado del pago: <strong className={pago.estado === 'Pagado' ? 'text-green-600' : 'text-amber-600'}>{pago.estado}</strong></p>
            </div>

            {/* Sumario de costos */}
            <div className="w-full sm:w-60 text-xs space-y-2 font-body text-right">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold">S/ {subtotalSoles.toFixed(2)}</span>
              </div>
              
              {descuento_porcentaje > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Descuento ({descuento_porcentaje}%)</span>
                  <span>− S/ {((subtotalSoles * descuento_porcentaje) / 100).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Costo de Envío</span>
                <span className="font-semibold">{envioSoles === 0 ? 'Gratis' : `S/ ${envioSoles.toFixed(2)}`}</span>
              </div>

              {comprobante.con_impuesto ? (
                <>
                  <div className="flex justify-between text-gray-400 text-[10px]">
                    <span>Base Imponible</span>
                    <span>S/ {baseSoles.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[10px] pb-2 border-b border-gray-50">
                    <span>IGV (18%)</span>
                    <span>S/ {igvSoles.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-gray-400 text-[10px] pb-2 border-b border-gray-50">
                  <span>IGV (Exonerado)</span>
                  <span>S/ 0.00</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-gray-800 pt-1">
                <span>Total de Compra</span>
                <span className="text-base text-coral">S/ {totalSoles.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTONES DE CONTROL DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 no-print justify-center">
          {/* Botón WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 max-w-sm py-4 bg-green-500 text-white rounded-full font-ui font-bold text-sm text-center shadow-lg shadow-green-500/10 hover:shadow-green-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            id="whatsapp-confirm-btn"
          >
            <span className="text-lg">💬</span>
            Enviar Pedido a WhatsApp
          </a>

          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            className="flex-1 max-w-xs py-4 border border-gray-300 text-gray-700 rounded-full font-ui font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            id="print-invoice-btn"
          >
            <span>🖨️</span>
            Imprimir / Guardar PDF
          </button>

          {/* Botón Volver */}
          <Link
            to="/tienda"
            className="flex-1 max-w-xs py-4 bg-gray-900 text-white rounded-full font-ui font-semibold text-sm text-center hover:bg-gray-800 transition-colors flex items-center justify-center"
            id="back-shop-btn"
          >
            Volver a la Tienda
          </Link>
        </div>
      </div>
    </>
  )
}
