/**
 * SegmentBuilder.jsx — Segment rule creator UI with real-time lead count preview.
 * Translates input rules into crm_segments document payload.
 */
import { useState, useEffect, useMemo } from 'react';

import { listLeads } from '../../../services/crmLeads';
import { evaluateSegment } from '../../../services/crmSegments';

const FIELDS = [
  { value: 'stage', label: 'Etapa del Lead' },
  { value: 'source', label: 'Origen/Canal' },
  { value: 'score', label: 'Score (puntos crm)' },
  { value: 'points', label: 'Puntos Club' },
  { value: 'tags', label: 'Etiquetas (tags)' },
];

const OPERATORS = [
  { value: '==', label: 'Es igual a' },
  { value: '!=', label: 'Es diferente de' },
  { value: '>', label: 'Es mayor que' },
  { value: '>=', label: 'Es mayor o igual que' },
  { value: '<', label: 'Es menor que' },
  { value: '<=', label: 'Es menor o igual que' },
  { value: 'array-contains', label: 'Contiene etiqueta' },
];

export default function SegmentBuilder({ segment, onSave, onCancel }) {
  const [name, setName] = useState(segment?.name || '');
  const [description, setDescription] = useState(segment?.description || '');
  const [rules, setRules] = useState(segment?.rules || [{ field: 'stage', operator: '==', value: 'nuevo' }]);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeadsPreview();
  }, []);

  async function loadLeadsPreview() {
    setLoadingLeads(true);
    try {
      const data = await listLeads({ max: 500 });
      setLeads(data);
    } catch (err) {
      console.error('[SegmentBuilder] Error loading leads preview:', err);
    } finally {
      setLoadingLeads(false);
    }
  }

  // Real-time matched leads preview
  const matchedLeads = useMemo(() => {
    if (leads.length === 0 || rules.length === 0) return [];
    return leads.filter(lead => evaluateSegment(lead, rules));
  }, [leads, rules]);

  function handleAddRule() {
    setRules(prev => [...prev, { field: 'stage', operator: '==', value: 'nuevo' }]);
  }

  function handleRemoveRule(index) {
    if (rules.length === 1) return;
    setRules(prev => prev.filter((_, i) => i !== index));
  }

  function handleRuleChange(index, key, val) {
    setRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, [key]: val } : rule,
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        rules,
        leadIds: matchedLeads.map(l => l.id),
      };
      await onSave(payload);
    } catch (err) {
      console.error('[SegmentBuilder] Error saving:', err);
      alert('Hubo un error al guardar el segmento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm p-8 max-w-3xl mx-auto animate-scale-up">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏷️</span>
        <div>
          <h3 className="font-brand text-2xl text-gray-800 leading-tight">
            {segment ? 'Editar Segmento' : 'Crear Nuevo Segmento'}
          </h3>
          <p className="text-xs text-gray-400">
            Define las reglas para agrupar dinámicamente a tus leads y clientes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Nombre del Segmento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Miembros VIP Activos"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Descripción Corta
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej. Leads con score > 50 que provienen de instagram"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
          </div>
        </div>

        {/* Rules section */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase">
            Reglas de Segmentación (Filtros AND)
          </label>
          
          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {rules.map((rule, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-150 relative group">
                {/* Field */}
                <select
                  value={rule.field}
                  onChange={e => handleRuleChange(index, 'field', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-coral"
                >
                  {FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={rule.operator}
                  onChange={e => handleRuleChange(index, 'operator', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-coral"
                >
                  {OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Value */}
                <input
                  type="text"
                  required
                  value={rule.value}
                  onChange={e => handleRuleChange(index, 'value', e.target.value)}
                  placeholder="Valor a buscar..."
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-coral flex-1 min-w-[120px]"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveRule(index)}
                  disabled={rules.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors border-none bg-transparent text-sm"
                  title="Eliminar regla"
                >
                  🗑️
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRule}
              className="mt-2 text-xs text-coral font-bold flex items-center gap-1.5 hover:text-coral-dark transition-colors cursor-pointer border-none bg-transparent"
            >
              ➕ Agregar otra regla
            </button>
          </div>
        </div>

        {/* Real-time Preview */}
        <div className="bg-coral/5 rounded-2xl border border-coral/10 p-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm text-gray-800">Vista Previa en Tiempo Real</h4>
            <p className="text-xs text-gray-400 mt-0.5">Leads que coinciden actualmente con las reglas configuradas.</p>
          </div>
          <div className="text-right">
            {loadingLeads ? (
              <span className="text-xs text-gray-400 font-medium">Evaluando base de datos...</span>
            ) : (
              <span className="text-xl font-brand text-coral font-bold block">
                {matchedLeads.length} leads
              </span>
            )}
            <span className="text-[10px] text-gray-400">de un total de {leads.length} leads</span>
          </div>
        </div>

        {/* Action buttons */}
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
            disabled={saving || matchedLeads.length === 0}
            className="px-6 py-2.5 bg-coral text-white rounded-xl font-bold text-xs transition-all hover:bg-coral-dark shadow-md cursor-pointer border-none disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Segmento ✨'}
          </button>
        </div>
      </form>
    </div>
  );
}
