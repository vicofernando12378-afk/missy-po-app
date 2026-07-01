import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';

import { resolverReclamacion, cerrarReclamacion } from '../../services';
import { db, auth } from '../../services/firebase';
import { SLA_DIAS_HABILES, calcularSLA, SLA_CFG } from '../../utils/sla';



const ESTADOS_CFG = {
  recibido:    { label: 'Recibido',     bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  en_revision: { label: 'En Revisión',  bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  respondido:  { label: 'Respondido',   bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  cerrado:     { label: 'Cerrado',      bg: 'bg-gray-100',   text: 'text-gray-700',    border: 'border-gray-200' },
};

const PRIORIDAD_CFG = {
  baja:     { label: 'Baja',     bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   icon: '🟢' },
  normal:   { label: 'Normal',   bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   icon: '🔵' },
  alta:     { label: 'Alta',     bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  icon: '🟡' },
  urgente:  { label: 'Urgente',  bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    icon: '🔴' },
};

export default function ReclamacionesDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [tabResolucion, setTabResolucion] = useState('devolucion'); // 'devolucion' | 'cambio' | 'personalizado'
  const [adminNotes, setAdminNotes] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  // ── ESCUCHA EN TIEMPO REAL ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    const base = collection(db, 'myp_reclamaciones');
    let q;
    if (filtro && filtro !== 'todos') {
      q = query(base, where('estado', '==', filtro), orderBy('creado_en', 'desc'), limit(100));
    } else {
      q = query(base, orderBy('creado_en', 'desc'), limit(100));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en),
        };
      });
      setItems(docs);
      setLoading(false);
    }, (err) => {
      console.error('Error al escuchar reclamaciones:', err);
      setError('No se pudo cargar el listado de reclamos.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filtro]);

  // ── KPIs calculados en tiempo real ──────────────────────────
  const kpis = useMemo(() => {
    const activos = items.filter(i => i.estado !== 'cerrado' && i.estado !== 'respondido');
    const sla = activos.map(i => calcularSLA(i.creado_en, i.estado));
    return {
      total: items.length,
      recibidos: items.filter(i => i.estado === 'recibido').length,
      enRevision: items.filter(i => i.estado === 'en_revision').length,
      respondidos: items.filter(i => i.estado === 'respondido').length,
      cerrados: items.filter(i => i.estado === 'cerrado').length,
      vencidos: sla.filter(s => s.tipo === 'vencido').length,
      porVencer: sla.filter(s => s.tipo === 'por_vencer' || s.tipo === 'critico').length,
    };
  }, [items]);

  // ── FILTRADO POR BÚSQUEDA, PRIORIDAD Y ESTADO ──────────────
  const itemsFiltrados = useMemo(() => {
    let filtered = items;
    // Excluir cerrados del panel principal (solo se ven en tab "Cerrados")
    if (filtro === 'cerrado') {
      filtered = filtered.filter(r => r.estado === 'cerrado');
    } else if (filtro === 'todos') {
      filtered = filtered.filter(r => r.estado !== 'cerrado');
    }
    if (filtroPrioridad !== 'todas') {
      filtered = filtered.filter(r => (r.prioridad || 'normal') === filtroPrioridad);
    }
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return filtered;
    return filtered.filter(r => {
      const codigo = (r.codigo || r.id || '').toLowerCase();
      const nombre = (r.cliente?.nombre || '').toLowerCase();
      const apellido = (r.cliente?.apellido || '').toLowerCase();
      const email = (r.cliente?.email || '').toLowerCase();
      const telefono = (r.cliente?.telefono || '').toLowerCase();
      const desc = (r.detalle?.descripcion || '').toLowerCase();
      const agente = (r.asignado_a || '').toLowerCase();
      return codigo.includes(texto) || nombre.includes(texto) || apellido.includes(texto)
        || email.includes(texto) || telefono.includes(texto) || desc.includes(texto) || agente.includes(texto);
    });
  }, [items, busqueda, filtroPrioridad]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdatePrioridad = async (id, prioridad) => {
    try {
      const ref = doc(db, 'myp_reclamaciones', id);
      await updateDoc(ref, { prioridad, actualizado_en: serverTimestamp() });
      showToast(`Prioridad actualizada a ${PRIORIDAD_CFG[prioridad]?.label || prioridad}`);
    } catch (err) {
      console.error('Error al actualizar prioridad:', err);
    }
  };

  const handleAsignarAgente = async (id, agente) => {
    try {
      const ref = doc(db, 'myp_reclamaciones', id);
      await updateDoc(ref, { asignado_a: agente, actualizado_en: serverTimestamp() });
      showToast(agente ? `Asignado a ${agente}` : 'Asignación removida');
    } catch (err) {
      console.error('Error al asignar agente:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Código', 'Estado', 'Prioridad', 'Cliente', 'Email', 'Teléfono', 'Tipo Bien', 'Monto', 'Tipo Reclamo', 'Descripción', 'Agente', 'Fecha Creación', 'SLA'];
    const rows = itemsFiltrados.map(r => {
      const sla = calcularSLA(r.creado_en, r.estado);
      const slaLabel = sla.tipo === 'cumplido' ? 'Cumplido' : sla.tipo === 'vencido' ? `Vencido (${Math.abs(sla.diasRestantes)}d)` : `${sla.diasRestantes}d restantes`;
      return [
        r.codigo || r.id,
        ESTADOS_CFG[r.estado]?.label || r.estado,
        PRIORIDAD_CFG[r.prioridad]?.label || 'Normal',
        `${r.cliente?.nombre || ''} ${r.cliente?.apellido || ''}`.trim(),
        r.cliente?.email || '',
        r.cliente?.telefono || '',
        r.bien?.tipo || 'Producto',
        r.bien?.monto || '0',
        r.detalle?.tipo || 'Reclamo',
        (r.detalle?.descripcion || '').replace(/"/g, '""'),
        r.asignado_a || '',
        r.creado_en ? new Date(r.creado_en).toLocaleDateString('es-PE') : '',
        slaLabel,
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reclamaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exportadas ${rows.length} reclamaciones`);
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
      // 1. Determinar estado según tipo de resolución
      const requiereConfirmacion = tabResolucion === 'devolucion' || tabResolucion === 'cambio';
      const estadoFinal = requiereConfirmacion ? 'respondido' : 'cerrado';

      // 2. Actualizar el estado y resolución en Firestore
      await resolverReclamacion(selectedItem.id, {
        estado: estadoFinal,
        resolution: {
          ...resolutionData,
          requiereConfirmacion,
          confirmadoPorCliente: !requiereConfirmacion,
        },
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
      // onSnapshot actualiza la lista automáticamente
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
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total',     value: kpis.total,      color: 'text-gray-800',   bg: 'bg-white' },
          { label: 'Recibidos', value: kpis.recibidos,   color: 'text-blue-700',   bg: 'bg-blue-50' },
          { label: 'En Revisión', value: kpis.enRevision, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Respondidos', value: kpis.respondidos, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Cerrados',  value: kpis.cerrados,    color: 'text-gray-500',   bg: 'bg-gray-100' },
          { label: 'Vencidos',  value: kpis.vencidos,    color: 'text-red-700',    bg: 'bg-red-50' },
          { label: 'Por Vencer', value: kpis.porVencer,  color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-2xl border border-gray-100 p-4 text-center`}>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Búsqueda + Export */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre, email, teléfono, agente..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-coral bg-white"
          />
        </div>
        <button
          onClick={handleExportCSV}
          className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shrink-0"
        >
          📥 Exportar CSV
        </button>
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
          <span className="text-gray-300 mx-1">|</span>
          {[
            ['todas', 'Todas'],
            ['urgente', '🔴 Urgente'],
            ['alta', '🟡 Alta'],
            ['normal', '🔵 Normal'],
            ['baja', '🟢 Baja'],
          ].map(([valor, label]) => (
            <button
              key={valor}
              onClick={() => setFiltroPrioridad(valor)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filtroPrioridad === valor
                  ? 'bg-white text-gray-800 shadow-sm border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
          {itemsFiltrados.map(r => {
            const estadoCfg = ESTADOS_CFG[r.estado] || ESTADOS_CFG.recibido;
            const cliente = r.cliente || {};
            const detalle = r.detalle || {};
            const bien = r.bien || {};
            const sla = calcularSLA(r.creado_en, r.estado);
            const slaCfg = SLA_CFG[sla.tipo] || SLA_CFG.al_dia;

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
                      {/* Badge Prioridad */}
                      {r.prioridad && r.prioridad !== 'normal' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORIDAD_CFG[r.prioridad]?.bg || 'bg-gray-50'} ${PRIORIDAD_CFG[r.prioridad]?.text || 'text-gray-600'} ${PRIORIDAD_CFG[r.prioridad]?.border || 'border-gray-200'}`}>
                          {PRIORIDAD_CFG[r.prioridad]?.icon} {PRIORIDAD_CFG[r.prioridad]?.label}
                        </span>
                      )}
                      {/* Badge SLA */}
                      {r.estado !== 'cerrado' && r.estado !== 'respondido' && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${slaCfg.bg} ${slaCfg.text} ${slaCfg.border}`}>
                          {slaCfg.icon} {sla.tipo === 'vencido' ? `Vencido (${Math.abs(sla.diasRestantes)}d)` : sla.tipo === 'critico' ? `${sla.diasRestantes}d restantes` : sla.tipo === 'por_vencer' ? `${sla.diasRestantes}d restantes` : `${sla.diasTranscurridos}/${SLA_DIAS_HABILES}d`}
                        </span>
                      )}
                      {r.asignado_a && (
                        <span className="text-[10px] text-gray-400">👤 {r.asignado_a}</span>
                      )}
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
                      {r.estado === 'respondido' && (
                        <p className="text-amber-600 font-semibold text-[11px]">
                          ⏳ Esperando confirmación del cliente
                        </p>
                      )}
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

                {/* Bloque SLA */}
                {selectedItem.estado !== 'cerrado' && selectedItem.estado !== 'respondido' && (() => {
                  const sla = calcularSLA(selectedItem.creado_en, selectedItem.estado);
                  const slaCfg = SLA_CFG[sla.tipo] || SLA_CFG.al_dia;
                  return (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">⚖️ Control SLA (15 días hábiles)</h4>
                      <div className={`rounded-2xl p-4 border ${slaCfg.bg} ${slaCfg.border} text-sm`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${slaCfg.text}`}>{slaCfg.icon} {slaCfg.label}</span>
                          <span className={`text-xs font-mono ${slaCfg.text}`}>{sla.diasTranscurridos} / {SLA_DIAS_HABILES} días hábiles</span>
                        </div>
                        <div className="mt-2 w-full bg-white rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sla.tipo === 'vencido' ? 'bg-red-500' : sla.tipo === 'critico' ? 'bg-orange-500' : sla.tipo === 'por_vencer' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min((sla.diasTranscurridos / SLA_DIAS_HABILES) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          {sla.tipo === 'vencido'
                            ? `Vencido hace ${Math.abs(sla.diasRestantes)} día${Math.abs(sla.diasRestantes) !== 1 ? 's' : ''} hábil${Math.abs(sla.diasRestantes) !== 1 ? 'es' : ''}. Responder a la brevedad.`
                            : `Faltan ${sla.diasRestantes} día${sla.diasRestantes !== 1 ? 's' : ''} hábil${sla.diasRestantes !== 1 ? 'es' : ''} para el vencimiento.`
                          }
                        </p>
                      </div>
                    </div>
                  );
                })()}

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

                {/* Galería de Evidencias */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">4. Evidencias y Adjuntos</h4>
                  {selectedItem.evidencias && selectedItem.evidencias.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedItem.evidencias.map((ev, idx) => (
                        <a key={idx} href={ev.url} target="_blank" rel="noopener noreferrer" className="block group">
                          <img
                            src={ev.url}
                            alt={ev.nombre || `Evidencia ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-coral transition-colors"
                          />
                          <p className="text-[10px] text-gray-400 truncate mt-1 group-hover:text-coral">{ev.nombre || `Evidencia ${idx + 1}`}</p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-150 rounded-2xl p-6 text-center text-gray-400 text-xs">
                      📷 No se subieron evidencias fotográficas para este reclamo.
                    </div>
                  )}
                </div>

                {/* Historial de Cambios de Estado */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📋 Historial de Cambios</h4>
                  {selectedItem.historial_estados && selectedItem.historial_estados.length > 0 ? (
                    <div className="space-y-2">
                      {selectedItem.historial_estados.map((h, idx) => {
                        const cfg = ESTADOS_CFG[h.estado] || ESTADOS_CFG.recibido;
                        const fecha = h.fecha ? new Date(h.fecha) : null;
                        const fechaStr = fecha ? fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                        return (
                          <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}>
                              {cfg.label}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-400">{fechaStr}</p>
                              {h.nota && <p className="text-xs text-gray-500 mt-0.5">{h.nota}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Sin cambios de estado registrados.</div>
                  )}
                </div>
              </div>

              {/* Columna Derecha (40%) */}
              <div className="md:col-span-4 p-6 bg-gray-50/50 flex flex-col justify-between">
                <div>
                  {/* Asignación y Prioridad */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Prioridad</label>
                      <select
                        value={selectedItem.prioridad || 'normal'}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdatePrioridad(selectedItem.id, val);
                          setSelectedItem(prev => ({ ...prev, prioridad: val }));
                        }}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-coral"
                      >
                        {Object.entries(PRIORIDAD_CFG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Agente Asignado</label>
                      <input
                        type="text"
                        value={selectedItem.asignado_a || ''}
                        onChange={(e) => setSelectedItem(prev => ({ ...prev, asignado_a: e.target.value }))}
                        onBlur={(e) => handleAsignarAgente(selectedItem.id, e.target.value.trim())}
                        placeholder="Nombre del agente..."
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  {/* Notas Internas (no visibles para el cliente) */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">🔒 Notas Internas (solo admin)</label>
                    <textarea
                      rows={2}
                      value={selectedItem.admin_notes || ''}
                      onChange={(e) => setSelectedItem(prev => ({ ...prev, admin_notes: e.target.value }))}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        const ref = doc(db, 'myp_reclamaciones', selectedItem.id);
                        updateDoc(ref, { admin_notes: val, actualizado_en: serverTimestamp() });
                      }}
                      placeholder="Notas internas, contexto adicional, seguimiento..."
                      className="w-full p-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-coral resize-none"
                    />
                  </div>

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
                  {selectedItem.estado === 'respondido' ? (
                    /* ── BARRA DE CONFIRMACIÓN PARA RESPONDIDOS ── */
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
                        ⏳ <strong>Esperando confirmación del cliente.</strong> Este caso requiere que el cliente confirme que recibió la devolución o cambio.
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            setResolviendo(true);
                            try {
                              await cerrarReclamacion(selectedItem.id, { motivo: 'confirmacion' });
                              showToast('Caso cerrado - confirmación recibida');
                              setSelectedItem(null);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setResolviendo(false);
                            }
                          }}
                          disabled={resolviendo}
                          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                        >
                          ✅ Confirmar y Cerrar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setResolviendo(true);
                            try {
                              await cerrarReclamacion(selectedItem.id, { motivo: 'sin_confirmacion' });
                              showToast('Caso cerrado sin confirmación');
                              setSelectedItem(null);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setResolviendo(false);
                            }
                          }}
                          disabled={resolviendo}
                          className="flex-1 h-11 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          🔒 Cerrar sin respuesta
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── BOTÓN NORMAL DE RESOLUCIÓN ── */
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
                            {tabResolucion === 'personalizado' && 'Enviar Respuesta y Cerrar'}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
