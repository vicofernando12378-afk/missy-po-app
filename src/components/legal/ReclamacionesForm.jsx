import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import useOrdersByUser from '../../hooks/useOrdersByUser';
import { validate, ReclamacionSchema } from '../../schemas';
import { listenAuth } from '../../services/auth';
import { db } from '../../services/firebase';
import useUserStore from '../../store/userStore';


const DEPARTAMENTOS_DATA = {
  Arequipa: {
    provincias: {
      Arequipa: [
        'Alto Selva Alegre',
        'Arequipa (Cercado)',
        'Cayma',
        'Cerro Colorado',
        'Characato',
        'Chiguata',
        'Jacobo Hunter',
        'José Luis Bustamante y Rivero',
        'La Joya',
        'Mariano Melgar',
        'Miraflores',
        'Mollebaya',
        'Paucarpata',
        'Pocsi',
        'Polobaya',
        'Quequeña',
        'Sabandía',
        'Sachaca',
        'Socabaya',
        'Tiabaya',
        'Uchumayo',
        'Vítor',
        'Yanahuara',
        'Yarabamba',
        'Yura',
      ],
      Camaná: ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Ocoña', 'Quilca', 'Samuel Pastor'],
      Caylloma: ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Coporaque', 'Huambo', 'Huanca', 'Ichupampa', 'Lari', 'Lluta', 'Maca', 'Madrigal', 'Majes', 'San Antonio de Chuca', 'Sibayo', 'Tapay', 'Tuti', 'Yanque'],
      Islay: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón'],
    },
  },
  Lima: {
    provincias: {
      Lima: [
        'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino',
        'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos', 'Lurigancho',
        'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
        'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
        'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
        'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo',
      ],
      Callao: ['Callao', 'Bellavista', 'Carmen de la Legua', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'],
    },
  },
};

export default function ReclamacionesForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDoc: 'DNI',
    numDoc: '',
    telefono: '',
    email: '',
    departamento: '',
    provincia: '',
    distrito: '',
    depOtro: '',
    provOtro: '',
    distOtro: '',
    tipoBien: 'Producto',
    montoReclamado: '',
    descripcionBien: '',
    tipoReclamo: 'Reclamo', // Reclamo o Queja
    detalleReclamo: '',
    pedidoConsumidor: '',
    autorizoNotif: false,
  });

  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Estados de Sesión y Pedidos
  const [authUser, setAuthUser] = useState(null);
  const { profile } = useUserStore();
  const { orders } = useOrdersByUser(authUser?.uid, authUser?.email);

  const [selectedProductKey, setSelectedProductKey] = useState('');
  const [accionPredefinida, setAccionPredefinida] = useState('');

  // Suscribirse a la autenticación de Firebase
  useEffect(() => {
    const unsubscribe = listenAuth((user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Autocompletar datos del perfil del cliente autenticado
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        nombre: prev.nombre || profile.nombre || '',
        apellido: prev.apellido || profile.apellido || '',
        telefono: prev.telefono || profile.telefono || '',
        email: prev.email || profile.email || '',
        tipoDoc: prev.tipoDoc || profile.tipoDoc || 'DNI',
        numDoc: prev.numDoc || profile.numDoc || '',
        departamento: prev.departamento || profile.ubigeo?.departamento || '',
        provincia: prev.provincia || profile.ubigeo?.provincia || '',
        distrito: prev.distrito || profile.ubigeo?.distrito || '',
      }));
    }
  }, [profile]);

  // Aplanar productos comprados de los pedidos del usuario
  const productosComprados = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const items = [];
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          items.push({
            id: `${order.codigo || order.id}-${item.id || item.nombre}`,
            pedidoCodigo: order.codigo || order.id,
            nombre: item.nombre,
            precio: (item.precio_unitario || item.precio || 0) / 100,
            cantidad: item.cantidad,
          });
        });
      }
    });
    return items;
  }, [orders]);

  // Limpiar campos relacionados si el usuario cambia el tipo de bien a Servicio
  useEffect(() => {
    if (formData.tipoBien === 'Servicio') {
      setSelectedProductKey('');
      setAccionPredefinida('');
      setFormData(prev => ({
        ...prev,
        montoReclamado: '',
        descripcionBien: '',
      }));
    }
  }, [formData.tipoBien]);

  // Manejar cambio de departamento
  useEffect(() => {
    if (formData.departamento && formData.departamento !== 'Otro') {
      const provs = Object.keys(DEPARTAMENTOS_DATA[formData.departamento]?.provincias || {});
      setProvincias(provs);
      setDistritos([]);
      setFormData(prev => ({ ...prev, provincia: '', distrito: '' }));
    } else {
      setProvincias([]);
      setDistritos([]);
    }
  }, [formData.departamento]);

  // Manejar cambio de provincia
  useEffect(() => {
    if (formData.departamento && formData.provincia && formData.departamento !== 'Otro') {
      const dists = DEPARTAMENTOS_DATA[formData.departamento].provincias[formData.provincia] || [];
      setDistritos(dists);
      setFormData(prev => ({ ...prev, distrito: '' }));
    } else {
      setDistritos([]);
    }
  }, [formData.provincia]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProductChange = (e) => {
    const key = e.target.value;
    setSelectedProductKey(key);
    if (key) {
      const prod = productosComprados.find(p => p.id === key);
      if (prod) {
        setFormData(prev => ({
          ...prev,
          montoReclamado: prod.precio.toFixed(2),
          descripcionBien: `Producto: ${prod.nombre} (Cantidad: ${prod.cantidad}) comprado en Pedido con Código: ${prod.pedidoCodigo}. `,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        montoReclamado: '',
        descripcionBien: '',
      }));
    }
  };

  const handleAccionPredefinidaChange = (accion) => {
    setAccionPredefinida(accion);
    if (accion !== 'Otro') {
      setFormData(prev => ({
        ...prev,
        pedidoConsumidor: accion,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pedidoConsumidor: '',
      }));
    }
  };

  const copyToClipboard = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalDep = formData.departamento === 'Otro' ? formData.depOtro : formData.departamento;
    const finalProv = formData.departamento === 'Otro' ? formData.provOtro : formData.provincia;
    const finalDist = formData.departamento === 'Otro' ? formData.distOtro : formData.distrito;

    const payloadParaValidar = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      tipoDoc: formData.tipoDoc.toUpperCase(),
      numDoc: formData.numDoc,
      telefono: formData.telefono,
      email: formData.email,
      departamento: finalDep,
      provincia: finalProv,
      distrito: finalDist,
      tipoBien: formData.tipoBien,
      montoReclamado: formData.montoReclamado === '' ? 0 : formData.montoReclamado,
      descripcionBien: formData.descripcionBien,
      tipoReclamo: formData.tipoReclamo,
      detalleReclamo: formData.detalleReclamo,
      pedidoConsumidor: formData.pedidoConsumidor,
      autorizoNotif: formData.autorizoNotif,
    };

    const validation = validate(ReclamacionSchema, payloadParaValidar);
    if (!validation.ok) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    const validatedData = validation.data;

    // Generar ID único para el reclamo
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `REC-${dateStr}-${rand}`;

    const payload = {
      codigo: code,
      cliente: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        tipoDoc: formData.tipoDoc,
        numDoc: validatedData.numDoc,
        telefono: validatedData.telefono,
        email: validatedData.email,
        ubigeo: {
          departamento: validatedData.departamento,
          provincia: validatedData.provincia,
          distrito: validatedData.distrito,
        },
      },
      bien: {
        tipo: validatedData.tipoBien,
        monto: validatedData.montoReclamado,
        descripcion: validatedData.descripcionBien,
      },
      detalle: {
        tipo: validatedData.tipoReclamo,
        descripcion: validatedData.detalleReclamo,
        pedido: validatedData.pedidoConsumidor,
      },
      estado: 'recibido',
      creado_en: new Date(),
    };

    try {
      // 1. Guardar reclamo
      await addDoc(collection(db, 'myp_reclamaciones'), {
        ...payload,
        creado_en: serverTimestamp(),
      });

      // 2. Insertar correo de constancia en myp_correos para Trigger Email
      await addDoc(collection(db, 'myp_correos'), {
        to: validatedData.email,
        message: {
          subject: `Constancia de Recepción de Reclamación - ${code}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
              <h3 style="text-align: center; color: #374151;">Constancia de Recepción de Reclamación</h3>
              <p>Hola <strong>${validatedData.nombre} ${validatedData.apellido}</strong>,</p>
              <p>Confirmamos la recepción de tu reclamación registrada el día de hoy en nuestro Libro de Reclamaciones Virtual.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6; font-size: 14px; color: #374151; line-height: 1.5;">
                <p style="margin: 0 0 8px 0;"><strong>Código de Ticket:</strong> <span style="font-family: monospace; color: #f43f5e; font-weight: bold;">${code}</span></p>
                <p style="margin: 0 0 8px 0;"><strong>Tipo de Reclamación:</strong> ${validatedData.tipoReclamo}</p>
                <p style="margin: 0 0 8px 0;"><strong>Bien Reclamado:</strong> ${validatedData.tipoBien}</p>
                <p style="margin: 0 0 8px 0;"><strong>Monto Reclamado:</strong> S/ ${Number(validatedData.montoReclamado).toFixed(2)}</p>
                <p style="margin: 0 0 8px 0;"><strong>Descripción del Bien:</strong> ${validatedData.descripcionBien}</p>
                <p style="margin: 0 0 8px 0;"><strong>Detalle del Reclamo/Queja:</strong> ${validatedData.detalleReclamo}</p>
                <p style="margin: 0;"><strong>Solución Solicitada (Pedido):</strong> ${validatedData.pedidoConsumidor}</p>
              </div>

              <p>De acuerdo con la normativa peruana, el plazo legal para la atención y respuesta de tu reclamo es de un máximo de <strong>15 días hábiles</strong>.</p>
              <p>Para hacer seguimiento de tu solicitud, puedes responder a este correo o escribirnos a nuestro WhatsApp de soporte oficial indicando tu número de ticket.</p>
              <p style="text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af;">Missy & Po Pet Shop - Coop. Universitaria i-1 Dpto 3, Arequipa, Perú</p>
            </div>
          `,
        },
        creado_en: serverTimestamp(),
      });

      setTicketId(code);
    } catch (err) {
      console.error('Error al guardar reclamo:', err);
      setError('Hubo un error al registrar tu reclamo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (ticketId) {
    const waText = encodeURIComponent(`Hola soporte de Missy & Po, deseo consultar el estado de mi reclamación con código ${ticketId}`);
    const waUrl = `https://wa.me/51999999999?text=${waText}`;

    return (
      <div className="text-center py-12 px-6 bg-green-50/40 rounded-3xl border border-green-100 max-w-2xl mx-auto shadow-sm">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reclamación Registrada con Éxito</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed max-w-md mx-auto">
          Hemos recibido tu solicitud. Conforme a la normativa peruana, te responderemos en un plazo máximo de <strong>15 días hábiles</strong>.
        </p>
        
        {/* Ticket interactivo */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 inline-flex flex-col items-center mb-8 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Código de Reclamo</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-bold text-coral">{ticketId}</span>
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-all active:scale-90"
              title="Copiar Código"
            >
              {copiado ? (
                <span className="text-xs font-semibold text-emerald-600">¡Copiado!</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 text-left text-xs text-gray-500 space-y-2 max-w-lg mx-auto">
          <p className="font-semibold text-gray-700 text-sm mb-2">📌 Canales de atención y seguimiento:</p>
          <p>📧 Se ha enviado una constancia digital con el detalle de tu reclamo a: <strong>{formData.email}</strong>.</p>
          <p>💬 Puedes hacerle seguimiento rápido a tu trámite escribiéndonos a nuestro canal de soporte técnico.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-ui font-semibold px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            💬 Consultar por WhatsApp
          </a>
          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-250 text-gray-700 font-ui font-semibold px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 shadow-sm max-w-3xl mx-auto">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          1. Identificación del Consumidor Reclamante
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellidos</label>
            <input
              type="text"
              name="apellido"
              required
              value={formData.apellido}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Documento</label>
            <div className="flex gap-2">
              <select
                name="tipoDoc"
                value={formData.tipoDoc}
                onChange={handleChange}
                className="h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white"
              >
                <option value="DNI">DNI</option>
                <option value="CE">C.E.</option>
                <option value="RUC">RUC</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
              <input
                type="text"
                name="numDoc"
                required
                value={formData.numDoc}
                onChange={handleChange}
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
                placeholder="Número de documento"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Celular / Teléfono</label>
            <input
              type="tel"
              name="telefono"
              required
              value={formData.telefono}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DIRECCIÓN / UBIGEO */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          2. Ubicación y Dirección
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Departamento</label>
            <select
              name="departamento"
              required
              value={formData.departamento}
              onChange={handleChange}
              className="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white"
            >
              <option value="">Selecciona...</option>
              <option value="Arequipa">Arequipa</option>
              <option value="Lima">Lima</option>
              <option value="Otro">Otro Departamento</option>
            </select>
          </div>

          {formData.departamento === 'Otro' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Especificar Dep.</label>
                <input
                  type="text"
                  name="depOtro"
                  required
                  value={formData.depOtro}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none text-sm"
                  placeholder="Ej: Cusco"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Especificar Prov. y Dist.</label>
                <input
                  type="text"
                  name="provOtro"
                  required
                  value={formData.provOtro}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none text-sm"
                  placeholder="Provincia, Distrito"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Provincia</label>
                <select
                  name="provincia"
                  required
                  disabled={!formData.departamento}
                  value={formData.provincia}
                  onChange={handleChange}
                  className="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {provincias.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Distrito</label>
                <select
                  name="distrito"
                  required
                  disabled={!formData.provincia}
                  value={formData.distrito}
                  onChange={handleChange}
                  className="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {distritos.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: DETALLE DEL BIEN CONTRATADO */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          3. Detalle del Bien Contratado
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo de Bien</label>
            <div className="flex gap-4 h-10 items-center">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoBien"
                  value="Producto"
                  checked={formData.tipoBien === 'Producto'}
                  onChange={handleChange}
                />
                Producto
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoBien"
                  value="Servicio"
                  checked={formData.tipoBien === 'Servicio'}
                  onChange={handleChange}
                />
                Servicio
              </label>
            </div>
          </div>

          {authUser && formData.tipoBien === 'Producto' && productosComprados.length > 0 && (
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Selecciona un producto de tus compras</label>
              <select
                value={selectedProductKey}
                onChange={handleProductChange}
                className="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white"
              >
                <option value="">-- Seleccionar producto comprado --</option>
                {productosComprados.map(p => (
                  <option key={p.id} value={p.id}>
                    [Pedido {p.pedidoCodigo}] {p.nombre} (S/ {p.precio.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Monto Reclamado (S/.)</label>
            <input
              type="number"
              step="0.01"
              name="montoReclamado"
              required
              value={formData.montoReclamado}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="0.00"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Descripción del Producto o Servicio</label>
            <textarea
              name="descripcionBien"
              required
              rows="2"
              value={formData.descripcionBien}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="Especifica el producto (ej: Collar Kiara, Alimento Canbo) o el servicio contratado..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: DETALLE DE LA RECLAMACIÓN */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          4. Detalle de la Reclamación y Pedido
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo de Reclamación</label>
            <div className="flex gap-6 h-10 items-center">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoReclamo"
                  value="Reclamo"
                  checked={formData.tipoReclamo === 'Reclamo'}
                  onChange={handleChange}
                />
                <strong>Reclamo:</strong> Disconformidad relacionada directamente a los productos o servicios adquiridos.
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoReclamo"
                  value="Queja"
                  checked={formData.tipoReclamo === 'Queja'}
                  onChange={handleChange}
                />
                <strong>Queja:</strong> Disconformidad no relacionada a los productos/servicios (ej: maltrato o mala atención).
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Detalle de la Queja o Reclamo</label>
            <textarea
              name="detalleReclamo"
              required
              rows="4"
              value={formData.detalleReclamo}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="Describe detalladamente los hechos ocurridos..."
            ></textarea>
          </div>

          <div>
            {formData.tipoBien === 'Producto' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Acción Solicitada (Pedido del Consumidor)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAccionPredefinidaChange('Devolución de dinero')}
                    className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                      accionPredefinida === 'Devolución de dinero'
                        ? 'border-coral bg-coral/5 text-coral shadow-sm font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    💰 Devolución de dinero
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccionPredefinidaChange('Cambio de producto')}
                    className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                      accionPredefinida === 'Cambio de producto'
                        ? 'border-coral bg-coral/5 text-coral shadow-sm font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    🔄 Cambio de producto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccionPredefinidaChange('Otro')}
                    className={`p-3 rounded-xl border text-sm font-semibold text-center transition-all ${
                      accionPredefinida === 'Otro'
                        ? 'border-coral bg-coral/5 text-coral shadow-sm font-bold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    ✏️ Especificar otra opción
                  </button>
                </div>

                {(accionPredefinida === 'Otro' || !accionPredefinida) && (
                  <div className="mt-2">
                    <textarea
                      name="pedidoConsumidor"
                      required
                      rows="3"
                      value={formData.pedidoConsumidor}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
                      placeholder="Especifica detalladamente la solución que solicitas..."
                    ></textarea>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pedido del Consumidor</label>
                <textarea
                  name="pedidoConsumidor"
                  required
                  rows="3"
                  value={formData.pedidoConsumidor}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
                  placeholder="Describe la solución o pedido solicitado para el servicio..."
                ></textarea>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TÉRMINOS LEGALES DE PROTECCIÓN */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
        <label className="flex gap-2 items-start cursor-pointer">
          <input
            type="checkbox"
            name="autorizoNotif"
            required
            checked={formData.autorizoNotif}
            onChange={handleChange}
            className="mt-1"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Declaro ser el titular del reclamo y autorizo a Missy & Po a utilizar mis datos personales de contacto para notificarme la respuesta a este reclamo mediante correo electrónico, conforme a la Ley N° 29733.
          </span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-semibold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* BOTÓN SUBMIT */}
      <div className="text-center sm:text-right border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 text-white font-ui font-semibold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Enviar Reclamación'}
        </button>
      </div>
    </form>
  );
}
