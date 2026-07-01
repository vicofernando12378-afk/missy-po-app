import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { obtenerReclamaciones, resolverReclamacion } from '../../services';
import { db, auth } from '../../services/firebase';

const ESTADOS_CFG = {
  recibido:    { label: 'Recibido',     bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  en_revision: { label: 'En Revisión',  bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  respondido:  { label: 'Respondido',   bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  cerrado:     { label: 'Cerrado',      bg: 'bg-gray-100',   text: 'text-gray-700',    border: 'border-gray-200' },
};

export default function ReclamacionesDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [tabResolucion, setTabResolucion] = useState('devolucion'); // 'devolucion' | 'cambio' | 'personalizado'
  const [adminNotes, setAdminNotes] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const estado = filtro === 'todos' ? null : filtro;
      const data = await obtenerReclamaciones({ estado, limite: 50 });
      setItems(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar el listado de reclamos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtro]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleProcesarResolucion = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (tabResolucion === 'personalizado' && !adminNotes.trim()) {
      alert('Por favor, escribe la respuesta formal al cliente.');
      return;
    }

    setResolviendo(true);
    const adminUid = auth.currentUser?.uid || 'admin';
    const code = selectedItem.codigo || selectedItem.id;
    const cliente = selectedItem.cliente || {};
    const bien = selectedItem.bien || {};
    const clienteNombre = `${cliente.nombre} ${cliente.apellido}`;

    const resolutionData = {
      type: tabResolucion,
      adminNotes: tabResolucion === 'personalizado' ? adminNotes : `Resolución procesada mediante opción predefinida: ${tabResolucion === 'devolucion' ? 'Devolución aceptada' : 'Cambio de producto'}`,
      updatedBy: adminUid,
    };

    try {
      // 1. Actualizar el estado y resolución en Firestore
      await resolverReclamacion(selectedItem.id, {
        estado: 'respondido',
        resolution: resolutionData,
      });

      // 2. Componer e Inyectar correo HTML según la pestaña seleccionada
      let mailSubject = '';
      let mailHtml = '';

      if (tabResolucion === 'devolucion') {
        mailSubject = `Actualización de tu Reclamo N° ${code} - Devolución Aceptada`;
        mailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
            <h3 style="text-align: center; color: #374151;">Actualización de Reclamación</h3>
            <p>Hola <strong>${clienteNombre}</strong>,</p>
            <p>Hemos procesado tu reclamo sobre el producto <strong>${bien.descripcion || 'adquirido en nuestra tienda'}</strong>. Te informamos que tu solicitud de devolución ha sido <strong>Aceptada</strong>.</p>
            <p>Nuestro equipo se pondrá en contacto contigo vía telefónica a la brevedad para acordar el día, hora y la forma de entrega del producto afectado a nuestro repartidor, así como los detalles para realizar el reembolso de tu dinero.</p>
            <p style="margin-top: 30px;">Atentamente,<br><strong>El equipo de Missy & Po</strong></p>
          </div>
        `;
      } else if (tabResolucion === 'cambio') {
        mailSubject = `Actualización de tu Reclamo N° ${code} - Cambio de Producto`;
        mailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
            <h3 style="text-align: center; color: #374151;">Actualización de Reclamación</h3>
            <p>Hola <strong>${clienteNombre}</strong>,</p>
            <p>Hemos evaluado tu caso respecto al producto <strong>${bien.descripcion || 'adquirido en nuestra tienda'}</strong> y hemos aprobado un <strong>Cambio de Producto</strong>.</p>
            <p>En las próximas horas, un asesor de nuestra tienda se comunicará directamente contigo a tu número celular para coordinar la entrega de tu nuevo producto y el retiro del artículo afectado.</p>
            <p style="margin-top: 30px;">Atentamente,<br><strong>El equipo de Missy & Po</strong></p>
          </div>
        `;
      } else {
        mailSubject = `Resolución de tu Reclamo N° ${code}`;
        mailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
            <h3 style="text-align: center; color: #374151;">Resolución de Reclamación</h3>
            <p>Hola <strong>${clienteNombre}</strong>,</p>
            <p>Te escribimos para dar respuesta al reclamo ingresado respecto al bien contratado:</p>
            <div style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #f43f5e; border-radius: 4px; margin: 20px 0; font-style: italic; color: #4b5563;">
              ${adminNotes}
            </div>
            <p>Si tienes alguna duda adicional, puedes responder directamente a este correo o escribirnos a nuestros canales de soporte oficiales.</p>
            <p style="margin-top: 30px;">Atentamente,<br><strong>Dirección de Soporte Missy & Po</strong></p>
          </div>
        `;
      }

      await addDoc(collection(db, 'myp_correos'), {
        to: cliente.email,
        message: {
          subject: mailSubject,
          html: mailHtml,
        },
        creado_en: serverTimestamp(),
      });

      showToast('Resolución procesada y correo enviado con éxito');
      setSelectedItem(null);
      setAdminNotes('');
      cargar();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar la resolución.');
    } finally {
      setResolviendo(false);
    }
  };

  const formatFecha = (valor) => {
    if (!valor) return '—';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-gray-800 text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <span>✨</span> {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-gray-850">Reclamos y Quejas</h1>
          <p className="text-gray-450 text-sm mt-1">
            Atención de solicitudes registradas desde el Libro de Reclamaciones virtual.
          </p>
        </div>
        <button
          onClick={cargar}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          ['todos', 'Todos'],
          ['recibido', 'Recibidos'],
          ['en_revision', 'En Revisión'],
          ['respondido', 'Respondidos'],
          ['cerrado', 'Cerrados'],
        ].map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setFiltro(valor)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filtro === valor
                ? 'bg-white text-gray-800 shadow-sm border-gray-200'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 font-body">Cargando reclamos...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-gray-600 font-semibold">No hay reclamos en esta categoría</p>
          <p className="text-gray-450 text-sm mt-1">
            Los reclamos nuevos aparecerán aquí cuando los usuarios los envíen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map(r => {
            const estadoCfg = ESTADOS_CFG[r.estado] || ESTADOS_CFG.recibido;
            const cliente = r.cliente || {};
            const detalle = r.detalle || {};
            const bien = r.bien || {};

            return (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedItem(r);
                  setTabResolucion('devolucion');
                  setAdminNotes('');
                }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer hover:scale-[1.005] active:scale-[0.995]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800 text-sm">
                        {cliente.nombre} {cliente.apellido}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCfg.bg} ${estadoCfg.text} ${estadoCfg.border}`}>
                        {estadoCfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        #{r.codigo || r.id}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        📅 {formatFecha(r.creado_en)}
                        {cliente.email && <span className="ml-2">· ✉️ {cliente.email}</span>}
                        {cliente.telefono && <span className="ml-2">· 📞 {cliente.telefono}</span>}
                      </p>
                      <p>
                        📦 {bien.tipo || 'Producto'}
                        {bien.monto ? ` · S/ ${Number(bien.monto).toFixed(2)}` : ''}
                      </p>
                      <p className="truncate text-gray-700 font-medium">
                        📌 {detalle.tipo || 'Reclamo'}: {detalle.descripcion || 'Sin detalle.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-300 self-center hidden sm:inline">➡️</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL RESOLUTIVO GRANDE (LG MODAL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Cabecera Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>📄</span> Detalle de Reclamación
                </h2>
                <span className="text-xs font-mono text-gray-400">#{selectedItem.codigo || selectedItem.id}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-450 hover:text-gray-700 transition-colors flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-10">
              
              {/* Columna Izquierda (60%) */}
              <div className="md:col-span-6 p-6 space-y-6 border-r border-gray-100">
                {/* Bloque Identificación y Contacto */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">1. Datos del Cliente</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-700 border border-gray-100/50">
                    <p><strong>Nombre completo:</strong> {selectedItem.cliente?.nombre} {selectedItem.cliente?.apellido}</p>
                    <p><strong>Documento:</strong> {selectedItem.cliente?.tipoDoc || 'DNI'} - {selectedItem.cliente?.numDoc}</p>
                    <p><strong>Email:</strong> {selectedItem.cliente?.email}</p>
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <p><strong>Teléfono:</strong> {selectedItem.cliente?.telefono || '—'}</p>
                      {selectedItem.cliente?.telefono && (
                        <a
                          href={`https://wa.me/51${selectedItem.cliente.telefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloque Comercial del Bien */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">2. Detalle del Bien Contratado</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-700 border border-gray-100/50">
                    <p><strong>Tipo de Bien:</strong> {selectedItem.bien?.tipo || 'Producto'}</p>
                    <p><strong>Monto Reclamado:</strong> S/ {Number(selectedItem.bien?.monto || 0).toFixed(2)}</p>
                    <p><strong>Descripción del bien:</strong> {selectedItem.bien?.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>

                {/* Detalle del Reclamo */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">3. Cuerpo del Reclamo / Queja</h4>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm text-gray-700 border border-gray-100/50">
                    <p><strong>Tipo:</strong> <span className="font-semibold">{selectedItem.detalle?.tipo || 'Reclamo'}</span></p>
                    <p className="bg-white p-3 rounded-xl border border-gray-100 leading-relaxed text-gray-650">
                      {selectedItem.detalle?.descripcion || 'Sin descripción'}
                    </p>
                    <p><strong>Pedido/Solución solicitada por el usuario:</strong></p>
                    <p className="bg-white p-3 rounded-xl border border-gray-100 leading-relaxed text-coral font-medium">
                      {selectedItem.detalle?.pedido || 'Sin pedido específico.'}
                    </p>
                  </div>
                </div>

                {/* Galería de Evidencias (Placeholder) */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">4. Evidencias y Adjuntos</h4>
                  <div className="border-2 border-dashed border-gray-150 rounded-2xl p-6 text-center text-gray-400 text-xs">
                    📷 No se subieron evidencias fotográficas para este reclamo.
                  </div>
                </div>
              </div>

              {/* Columna Derecha (40%) */}
              <div className="md:col-span-4 p-6 bg-gray-50/50 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">⚙️ Procesar Resolución</h3>
                  
                  {/* Selector de Pestañas de Solución */}
                  <div className="flex border-b border-gray-200 mb-4 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTabResolucion('devolucion')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        tabResolucion === 'devolucion' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      💰 Reembolso
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabResolucion('cambio')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        tabResolucion === 'cambio' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      🔄 Cambio
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabResolucion('personalizado')}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        tabResolucion === 'personalizado' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      ✏️ Personalizar
                    </button>
                  </div>

                  {/* Informaciones de flujo */}
                  {tabResolucion === 'devolucion' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed mb-4">
                      💡 <strong>Reembolso:</strong> Se enviará un correo electrónico al cliente indicando que se procederá con la devolución del dinero previa entrega del bien al repartidor.
                    </div>
                  )}

                  {tabResolucion === 'cambio' && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-850 leading-relaxed mb-4">
                      💡 <strong>Cambio físico:</strong> Se notificará al cliente que un asesor de Missy & Po se comunicará para coordinar la logística del cambio de producto en su dirección.
                    </div>
                  )}

                  {tabResolucion === 'personalizado' && (
                    <div className="space-y-3 mb-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase">Respuesta Formal al Cliente</label>
                      <textarea
                        required
                        rows="6"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Escriba aquí los fundamentos técnicos o la solución alternativa basada en las evidencias..."
                        className="w-full p-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-coral text-xs bg-white resize-none shadow-inner"
                      ></textarea>
                    </div>
                  )}
                </div>

                {/* Botón de Confirmación */}
                <div className="pt-6 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={handleProcesarResolucion}
                    disabled={resolviendo}
                    className="w-full h-11 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 disabled:opacity-50"
                  >
                    {resolviendo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>
                          {tabResolucion === 'devolucion' && 'Confirmar y Procesar Reembolso'}
                          {tabResolucion === 'cambio' && 'Confirmar y Coordinar Cambio'}
                          {tabResolucion === 'personalizado' && 'Enviar Respuesta Personalizada'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
