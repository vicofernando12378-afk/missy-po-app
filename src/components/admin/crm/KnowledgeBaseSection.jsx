/**
 * KnowledgeBaseSection.jsx — Admin UI for managing the bot's knowledge base.
 * Covers: Business info, Policies, FAQ, Club Missy & Po.
 */

import { httpsCallable } from 'firebase/functions';
import { useState, useEffect } from 'react';

import { functions } from '../../../services/firebase';

const EMPTY_BIZ = {
  nombreNegocio: 'Missy & Po Pet Shop',
  descripcion: '',
  horario: '',
  direccion: '',
  telefono: '',
  whatsapp: '',
  email: '',
  redes: { instagram: '', facebook: '', youtube: '' },
};

const EMPTY_POLICIES = {
  envios: { Lima: '', Provincia: '', zonas: ['Lima', 'Callao', 'Provincia'] },
  pagos: { metodos: [], cuotas: '', anticipo: '' },
  devoluciones: { plazo: '', condiciones: '', proceso: '' },
  garantia: '',
  club: '',
};

const EMPTY_FAQ = { preguntas: [] };

const EMPTY_CLUB = { beneficios: '', puntos: '', requisitos: '', promociones: '' };

const FAQ_TEMPLATE = { q: '', a: '' };

export default function KnowledgeBaseSection() {
  const [tab, setTab] = useState('business');
  const [biz, setBiz] = useState(EMPTY_BIZ);
  const [policies, setPolicies] = useState(EMPTY_POLICIES);
  const [faq, setFaq] = useState(EMPTY_FAQ);
  const [club, setClub] = useState(EMPTY_CLUB);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function loadKnowledge() {
    setLoading(true);
    try {
      const getKnowledge = httpsCallable(functions, 'getKnowledge');
      const result = await getKnowledge();
      const data = result.data?.data || {};

      // Business Info normalization
      if (data.business_info) {
        setBiz({
          ...EMPTY_BIZ,
          ...data.business_info,
          redes: { ...EMPTY_BIZ.redes, ...data.business_info.redes }
        });
      }

      // Policies normalization
      if (data.policies) {
        const rawPol = data.policies;
        const normalizedEnvios = typeof rawPol.envios === 'string'
          ? { Lima: rawPol.envios, Provincia: '', zonas: [] }
          : { ...EMPTY_POLICIES.envios, ...rawPol.envios };

        const normalizedPagos = typeof rawPol.pagos === 'string'
          ? { metodos: [rawPol.pagos], cuotas: '', anticipo: '' }
          : { ...EMPTY_POLICIES.pagos, ...rawPol.pagos };

        const normalizedDevoluciones = typeof rawPol.devoluciones === 'string'
          ? { plazo: rawPol.devoluciones, condiciones: '', proceso: '' }
          : { ...EMPTY_POLICIES.devoluciones, ...rawPol.devoluciones };

        setPolicies({
          ...EMPTY_POLICIES,
          ...rawPol,
          envios: normalizedEnvios,
          pagos: normalizedPagos,
          devoluciones: normalizedDevoluciones
        });
      }

      // FAQ normalization
      if (data.faq) {
        const rawPreguntas = data.faq.preguntas || [];
        const normalizedPreguntas = rawPreguntas.map(p => ({
          q: p.q || p.pregunta || '',
          a: p.a || p.respuesta || ''
        }));
        setFaq({ preguntas: normalizedPreguntas });
      }

      // Club normalization
      if (data.club) {
        const rawClub = data.club;
        setClub({
          beneficios: Array.isArray(rawClub.beneficios) ? rawClub.beneficios.join('\n') : (rawClub.beneficios || ''),
          puntos: rawClub.puntos || '',
          requisitos: rawClub.requisitos || '',
          promociones: Array.isArray(rawClub.promociones) ? rawClub.promociones.join('\n') : (rawClub.promociones || '')
        });
      }
    } catch (err) {
      console.error('[KnowledgeBase] Load error:', err);
      setError('Error al cargar knowledge base.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(docId, data) {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const saveKnowledge = httpsCallable(functions, 'saveKnowledge');
      await saveKnowledge({ docId, data });
      setSuccess('Guardado correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[KnowledgeBase] Save error:', err);
      setError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'business', label: 'Negocio', icon: '🏪' },
    { id: 'policies', label: 'Políticas', icon: '📋' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'club', label: 'Club', icon: '⭐' },
  ];

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Cargando knowledge base...</div>;
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.id
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Status messages */}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

      {/* Business Info */}
      {tab === 'business' && (
        <div className="space-y-4">
          <Input label="Nombre del negocio" value={biz.nombreNegocio} onChange={v => setBiz({ ...biz, nombreNegocio: v })} />
          <Input label="Descripción" value={biz.descripcion} onChange={v => setBiz({ ...biz, descripcion: v })} textarea />
          <Input label="Horario" value={biz.horario} onChange={v => setBiz({ ...biz, horario: v })} placeholder="Lunes a Sábado 9am-7pm" />
          <Input label="Dirección" value={biz.direccion} onChange={v => setBiz({ ...biz, direccion: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" value={biz.telefono} onChange={v => setBiz({ ...biz, telefono: v })} />
            <Input label="WhatsApp" value={biz.whatsapp} onChange={v => setBiz({ ...biz, whatsapp: v })} />
          </div>
          <Input label="Email" value={biz.email} onChange={v => setBiz({ ...biz, email: v })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Instagram" value={biz.redes.instagram} onChange={v => setBiz({ ...biz, redes: { ...biz.redes, instagram: v } })} placeholder="@usuario" />
            <Input label="Facebook" value={biz.redes.facebook} onChange={v => setBiz({ ...biz, redes: { ...biz.redes, facebook: v } })} placeholder="URL o usuario" />
            <Input label="YouTube" value={biz.redes.youtube} onChange={v => setBiz({ ...biz, redes: { ...biz.redes, youtube: v } })} placeholder="URL o canal" />
          </div>
          <SaveBtn onClick={() => handleSave('business_info', biz)} saving={saving} />
        </div>
      )}

      {/* Policies */}
      {tab === 'policies' && (
        <div className="space-y-6">
          <Section title="Envíos">
            <Input label="Lima" value={policies.envios.Lima} onChange={v => setPolicies({ ...policies, envios: { ...policies.envios, Lima: v } })} textarea />
            <Input label="Provincia" value={policies.envios.Provincia} onChange={v => setPolicies({ ...policies, envios: { ...policies.envios, Provincia: v } })} textarea />
          </Section>
          <Section title="Pagos">
            <Input label="Métodos (separados por coma)" value={policies.pagos.metodos.join(', ')} onChange={v => setPolicies({ ...policies, pagos: { ...policies.pagos, metodos: v.split(',').map(s => s.trim()).filter(Boolean) } })} />
            <Input label="Cuotas" value={policies.pagos.cuotas} onChange={v => setPolicies({ ...policies, pagos: { ...policies.pagos, cuotas: v } })} />
            <Input label="Anticipo" value={policies.pagos.anticipo} onChange={v => setPolicies({ ...policies, pagos: { ...policies.pagos, anticipo: v } })} />
          </Section>
          <Section title="Devoluciones">
            <Input label="Plazo" value={policies.devoluciones.plazo} onChange={v => setPolicies({ ...policies, devoluciones: { ...policies.devoluciones, plazo: v } })} />
            <Input label="Condiciones" value={policies.devoluciones.condiciones} onChange={v => setPolicies({ ...policies, devoluciones: { ...policies.devoluciones, condiciones: v } })} textarea />
            <Input label="Proceso" value={policies.devoluciones.proceso} onChange={v => setPolicies({ ...policies, devoluciones: { ...policies.devoluciones, proceso: v } })} textarea />
          </Section>
          <Input label="Garantía" value={policies.garantia} onChange={v => setPolicies({ ...policies, garantia: v })} />
          <SaveBtn onClick={() => handleSave('policies', policies)} saving={saving} />
        </div>
      )}

      {/* FAQ */}
      {tab === 'faq' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Agregá preguntas frecuentes que el bot usará para responder a los clientes.</p>
          {faq.preguntas.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Pregunta {idx + 1}</span>
                <button
                  onClick={() => {
                    const newFaq = [...faq.preguntas];
                    newFaq.splice(idx, 1);
                    setFaq({ ...faq, preguntas: newFaq });
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
              <input
                type="text"
                value={item.q}
                onChange={e => {
                  const newFaq = [...faq.preguntas];
                  newFaq[idx] = { ...newFaq[idx], q: e.target.value };
                  setFaq({ ...faq, preguntas: newFaq });
                }}
                placeholder="Pregunta..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <textarea
                value={item.a}
                onChange={e => {
                  const newFaq = [...faq.preguntas];
                  newFaq[idx] = { ...newFaq[idx], a: e.target.value };
                  setFaq({ ...faq, preguntas: newFaq });
                }}
                placeholder="Respuesta..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              />
            </div>
          ))}
          <button
            onClick={() => setFaq({ ...faq, preguntas: [...faq.preguntas, { ...FAQ_TEMPLATE }] })}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-rose-400 hover:text-rose-500 transition"
          >
            + Agregar pregunta
          </button>
          <SaveBtn onClick={() => {
            const normalizedPreguntas = faq.preguntas.map(p => ({
              q: p.q,
              a: p.a,
              pregunta: p.q,
              respuesta: p.a
            }));
            handleSave('faq', { preguntas: normalizedPreguntas });
          }} saving={saving} />
        </div>
      )}

      {/* Club */}
      {tab === 'club' && (
        <div className="space-y-4">
          <Input label="Beneficios" value={club.beneficios} onChange={v => setClub({ ...club, beneficios: v })} textarea />
          <Input label="Sistema de puntos" value={club.puntos} onChange={v => setClub({ ...club, puntos: v })} textarea />
          <Input label="Requisitos para unirse" value={club.requisitos} onChange={v => setClub({ ...club, requisitos: v })} textarea />
          <Input label="Promociones activas" value={club.promociones} onChange={v => setClub({ ...club, promociones: v })} textarea />
          <SaveBtn onClick={() => handleSave('club', club)} saving={saving} />
        </div>
      )}
    </div>
  );
}

// ── SUB COMPONENTS ────────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, textarea }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ''}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ''}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="space-y-3 pl-3 border-l-2 border-rose-200">
        {children}
      </div>
    </div>
  );
}

function SaveBtn({ onClick, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="px-6 py-2 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 disabled:opacity-50 transition"
    >
      {saving ? 'Guardando...' : 'Guardar'}
    </button>
  );
}
