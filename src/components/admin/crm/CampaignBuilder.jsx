/**
 * CampaignBuilder.jsx — Email campaign creator and editor UI.
 * Allows drafting campaigns and triggering the sendCampaign cloud function.
 */
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { listSegments } from '../../../services/crmSegments';
import { db } from '../../../services/firebase';

const DEFAULT_TEMPLATE = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
  <h3 style="text-align: center; color: #374151;">¡Descuento Exclusivo para ti y tu Mascota! 🐾</h3>
  <p>Hola,</p>
  <p>Tenemos grandes novedades esta semana en nuestra tienda. Queremos regalarte un cupón especial del <strong>15% de descuento</strong> en toda nuestra línea de alimentos premium y juguetes.</p>
  
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6; text-align: center;">
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">Usa el código en el checkout:</p>
    <span style="font-family: monospace; font-size: 24px; color: #f43f5e; font-weight: bold; letter-spacing: 2px;">MISSYCLUB15</span>
  </div>

  <p>Este cupón es de un solo uso y es válido hasta fin de mes. ¡Disfrútalo!</p>
  <p>Si tienes alguna consulta, puedes escribirnos directamente respondiendo a este email o por nuestro WhatsApp.</p>
  <p style="text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af;">Missy & Po Pet Shop - Coop. Universitaria i-1 Dpto 3, Arequipa, Perú</p>
</div>
`;

export default function CampaignBuilder({ campaign, onSave, onCancel }) {
  const [name, setName] = useState(campaign?.name || '');
  const [segmentId, setSegmentId] = useState(campaign?.segmentId || '');
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [templateHtml, setTemplateHtml] = useState(campaign?.templateHtml || DEFAULT_TEMPLATE);
  
  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSegmentsList();
  }, []);

  async function loadSegmentsList() {
    setLoadingSegments(true);
    try {
      const data = await listSegments();
      setSegments(data);
      if (data.length > 0 && !segmentId) {
        setSegmentId(data[0].id);
      }
    } catch (err) {
      console.error('[CampaignBuilder] Error loading segments:', err);
    } finally {
      setLoadingSegments(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !segmentId || !subject.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        segmentId,
        subject: subject.trim(),
        templateHtml,
        channel: 'email',
        status: campaign?.status || 'borrador',
        stats: campaign?.stats || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      };
      await onSave(payload);
    } catch (err) {
      console.error('[CampaignBuilder] Error saving campaign:', err);
      alert('Error al guardar la campaña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-8 max-w-3xl mx-auto animate-scale-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">✉️</span>
        <div>
          <h3 className="font-brand text-2xl text-gray-800 leading-tight">
            {campaign ? 'Editar Campaña de Email' : 'Nueva Campaña de Email'}
          </h3>
          <p className="text-xs text-gray-400">
            Crea plantillas HTML premium y envíalas de forma masiva a tus segmentos.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Nombre de la Campaña *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Promo Aniversario Julio"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
          </div>

          {/* Segment selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Segmento Objetivo *
            </label>
            {loadingSegments ? (
              <div className="h-11 bg-gray-50 border border-gray-200 rounded-2xl animate-pulse flex items-center px-4 text-xs text-gray-400">
                Cargando segmentos...
              </div>
            ) : (
              <select
                value={segmentId}
                onChange={e => setSegmentId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
              >
                {segments.length === 0 && (
                  <option value="">No hay segmentos creados</option>
                )}
                {segments.map(seg => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name} ({seg.leadCount ?? 0} leads)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Email Subject */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
            Asunto del Correo *
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ej. Sorpresa para tu mejor amigo: ¡15% de descuento en juguetes! 🐶🎁"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
          />
        </div>

        {/* HTML Template Body */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
            Cuerpo del Correo (Plantilla HTML)
          </label>
          <textarea
            rows={12}
            required
            value={templateHtml}
            onChange={e => setTemplateHtml(e.target.value)}
            placeholder="Escribe tu HTML aquí..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral font-mono resize-y"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs cursor-pointer bg-transparent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !segmentId}
            className="px-6 py-2.5 bg-coral text-white rounded-xl font-bold text-xs transition-all hover:bg-coral-dark shadow-md cursor-pointer border-none disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Campaña 💾'}
          </button>
        </div>
      </form>
    </div>
  );
}
