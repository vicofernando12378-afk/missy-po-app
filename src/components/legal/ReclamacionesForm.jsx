import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
        'Yura'
      ],
      Camaná: ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Ocoña', 'Quilca', 'Samuel Pastor'],
      Caylloma: ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Coporaque', 'Huambo', 'Huanca', 'Ichupampa', 'Lari', 'Lluta', 'Maca', 'Madrigal', 'Majes', 'San Antonio de Chuca', 'Sibayo', 'Tapay', 'Tuti', 'Yanque'],
      Islay: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón']
    }
  },
  Lima: {
    provincias: {
      Lima: [
        'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino',
        'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos', 'Lurigancho',
        'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
        'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
        'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
        'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
      ],
      Callao: ['Callao', 'Bellavista', 'Carmen de la Legua', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla']
    }
  }
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
    autorizoNotif: false
  });

  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);

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
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Generar ID único para el reclamo
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `REC-${dateStr}-${rand}`;

    const finalDep = formData.departamento === 'Otro' ? formData.depOtro : formData.departamento;
    const finalProv = formData.departamento === 'Otro' ? formData.provOtro : formData.provincia;
    const finalDist = formData.departamento === 'Otro' ? formData.distOtro : formData.distrito;

    const payload = {
      codigo: code,
      cliente: {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipoDoc: formData.tipoDoc,
        numDoc: formData.numDoc,
        telefono: formData.telefono,
        email: formData.email,
        ubigeo: {
          departamento: finalDep,
          provincia: finalProv,
          distrito: finalDist
        }
      },
      bien: {
        tipo: formData.tipoBien,
        monto: parseFloat(formData.montoReclamado) || 0,
        descripcion: formData.descripcionBien
      },
      detalle: {
        tipo: formData.tipoReclamo,
        descripcion: formData.detalleReclamo,
        pedido: formData.pedidoConsumidor
      },
      estado: 'recibido',
      creado_en: new Date()
    };

    try {
      await addDoc(collection(db, 'myp_reclamaciones'), {
        ...payload,
        creado_en: serverTimestamp()
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
    return (
      <div class="text-center py-12 px-4 bg-green-50/50 rounded-2xl border border-green-100 max-w-2xl mx-auto">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Reclamo Registrado Exitosamente</h2>
        <p class="text-gray-600 mb-6">
          Tu reclamación ha sido registrada. De acuerdo a ley peruana, te responderemos en un plazo máximo de 15 días hábiles.
        </p>
        <div class="bg-white p-4 rounded-xl border border-gray-100 inline-block mb-6 shadow-sm">
          <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Código de Reclamo</p>
          <p class="text-lg font-mono font-bold text-coral">{ticketId}</p>
        </div>
        <div>
          <a
            href="/"
            class="inline-flex items-center gap-2 bg-coral text-white font-ui font-semibold px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
            style="background-color: var(--color-coral)"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 shadow-sm max-w-3xl mx-auto">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
      <div>
        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          1. Identificación del Consumidor Reclamante
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellidos</label>
            <input
              type="text"
              name="apellido"
              required
              value={formData.apellido}
              onChange={handleChange}
              class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Documento</label>
            <div class="flex gap-2">
              <select
                name="tipoDoc"
                value={formData.tipoDoc}
                onChange={handleChange}
                class="h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white"
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
                class="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
                placeholder="Número de documento"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Celular / Teléfono</label>
            <input
              type="tel"
              name="telefono"
              required
              value={formData.telefono}
              onChange={handleChange}
              class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DIRECCIÓN / UBIGEO */}
      <div>
        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          2. Ubicación y Dirección
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Departamento</label>
            <select
              name="departamento"
              required
              value={formData.departamento}
              onChange={handleChange}
              class="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white"
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
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Especificar Dep.</label>
                <input
                  type="text"
                  name="depOtro"
                  required
                  value={formData.depOtro}
                  onChange={handleChange}
                  class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none text-sm"
                  placeholder="Ej: Cusco"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Especificar Prov. y Dist.</label>
                <input
                  type="text"
                  name="provOtro"
                  required
                  value={formData.provOtro}
                  onChange={handleChange}
                  class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none text-sm"
                  placeholder="Provincia, Distrito"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Provincia</label>
                <select
                  name="provincia"
                  required
                  disabled={!formData.departamento}
                  value={formData.provincia}
                  onChange={handleChange}
                  class="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white disabled:opacity-50"
                >
                  <option value="">Selecciona...</option>
                  {provincias.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Distrito</label>
                <select
                  name="distrito"
                  required
                  disabled={!formData.provincia}
                  value={formData.distrito}
                  onChange={handleChange}
                  class="w-full h-10 px-2 rounded-lg border border-gray-200 focus:outline-none text-sm bg-white disabled:opacity-50"
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
        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          3. Detalle del Bien Contratado
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo de Bien</label>
            <div class="flex gap-4 h-10 items-center">
              <label class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoBien"
                  value="Producto"
                  checked={formData.tipoBien === 'Producto'}
                  onChange={handleChange}
                />
                Producto
              </label>
              <label class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
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
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Monto Reclamado (S/.)</label>
            <input
              type="number"
              step="0.01"
              name="montoReclamado"
              required
              value={formData.montoReclamado}
              onChange={handleChange}
              class="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="0.00"
            />
          </div>
          <div class="sm:col-span-3">
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Descripción del Producto o Servicio</label>
            <textarea
              name="descripcionBien"
              required
              rows="2"
              value={formData.descripcionBien}
              onChange={handleChange}
              class="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="Especifica el producto (ej: Collar Kiara, Alimento Canbo) o el servicio contratado..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: DETALLE DE LA RECLAMACIÓN */}
      <div>
        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
          4. Detalle de la Reclamación y Pedido
        </h3>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipo de Reclamación</label>
            <div class="flex gap-6 h-10 items-center">
              <label class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="tipoReclamo"
                  value="Reclamo"
                  checked={formData.tipoReclamo === 'Reclamo'}
                  onChange={handleChange}
                />
                <strong>Reclamo:</strong> Disconformidad relacionada directamente a los productos o servicios adquiridos.
              </label>
              <label class="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
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
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Detalle de la Queja o Reclamo</label>
            <textarea
              name="detalleReclamo"
              required
              rows="4"
              value={formData.detalleReclamo}
              onChange={handleChange}
              class="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="Describe detalladamente los hechos ocurridos..."
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Pedido del Consumidor</label>
            <textarea
              name="pedidoConsumidor"
              required
              rows="3"
              value={formData.pedidoConsumidor}
              onChange={handleChange}
              class="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 text-sm"
              placeholder="¿Qué solución solicitas? (Ej: Cambio de producto, devolución del dinero)..."
            ></textarea>
          </div>
        </div>
      </div>

      {/* TÉRMINOS LEGALES DE PROTECCIÓN */}
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
        <label class="flex gap-2 items-start cursor-pointer">
          <input
            type="checkbox"
            name="autorizoNotif"
            required
            checked={formData.autorizoNotif}
            onChange={handleChange}
            class="mt-1"
          />
          <span class="text-xs text-gray-500 leading-relaxed">
            Declaro ser el titular del reclamo y autorizo a Missy & Po a utilizar mis datos personales de contacto para notificarme la respuesta a este reclamo mediante correo electrónico, conforme a la Ley N° 29733.
          </span>
        </label>
      </div>

      {error && (
        <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-semibold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* BOTÓN SUBMIT */}
      <div class="text-center sm:text-right border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={loading}
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 text-white font-ui font-semibold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Enviar Reclamación'}
        </button>
      </div>
    </form>
  );
}
