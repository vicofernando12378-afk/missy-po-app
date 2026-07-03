/**
 * LeadsKanban.jsx — Full Kanban board for CRM leads pipeline.
 * Uses @dnd-kit for drag-and-drop between stage columns.
 * Includes filters: source, tag, score range.
 */
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, useEffect, useMemo } from 'react';

import { listLeads, updateLeadStage, LEAD_STAGES, LEAD_SOURCES } from '../../../services/crmLeads';

import LeadCard from './LeadCard';

// Column configuration
const COLUMNS = [
  { id: 'nuevo',          label: 'Nuevo',           color: 'bg-gray-100',   dot: 'bg-gray-400' },
  { id: 'contactado',     label: 'Contactado',       color: 'bg-blue-50',    dot: 'bg-blue-400' },
  { id: 'calificado',     label: 'Calificado',       color: 'bg-amber-50',   dot: 'bg-amber-400' },
  { id: 'en_seguimiento', label: 'En Seguimiento',   color: 'bg-purple-50',  dot: 'bg-purple-400' },
  { id: 'cliente',        label: 'Cliente',          color: 'bg-green-50',   dot: 'bg-green-400' },
  { id: 'perdido',        label: 'Perdido',          color: 'bg-red-50',     dot: 'bg-red-400' },
];

function KanbanColumn({ column, leads, onLeadClick }) {
  return (
    <div className={`flex-shrink-0 w-64 rounded-3xl ${column.color} p-3 flex flex-col gap-2`}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <span className={`w-2 h-2 rounded-full ${column.dot}`} />
        <span className="font-semibold text-xs text-gray-600 uppercase tracking-wider">
          {column.label}
        </span>
        <span className="ml-auto text-xs font-bold text-gray-400">{leads.length}</span>
      </div>

      {/* Droppable list */}
      <SortableContext
        items={leads.map(l => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[120px]">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
            />
          ))}
        </div>
      </SortableContext>

      {leads.length === 0 && (
        <div className="text-xs text-gray-300 text-center py-4 font-medium italic">
          Sin leads
        </div>
      )}
    </div>
  );
}

export default function LeadsKanban({ onLeadClick }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  // Filters
  const [filterSource, setFilterSource] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterScoreMin, setFilterScoreMin] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await listLeads({ max: 500 });
      setLeads(data);
    } catch (err) {
      console.error('[LeadsKanban] Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (filterSource && l.source !== filterSource) return false;
      if (filterTag && !l.tags?.includes(filterTag)) return false;
      if (filterScoreMin && (l.score ?? 0) < parseInt(filterScoreMin)) return false;
      return true;
    });
  }, [leads, filterSource, filterTag, filterScoreMin]);

  // Group by stage
  const byStage = useMemo(() => {
    const map = {};
    for (const col of COLUMNS) map[col.id] = [];
    for (const lead of filteredLeads) {
      const stage = LEAD_STAGES.includes(lead.stage) ? lead.stage : 'nuevo';
      map[stage].push(lead);
    }
    return map;
  }, [filteredLeads]);

  // Find which column a lead id belongs to
  function findStageForLead(leadId) {
    for (const [stage, stageLeads] of Object.entries(byStage)) {
      if (stageLeads.find(l => l.id === leadId)) return stage;
    }
    return null;
  }

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over) return;

    // 'over' can be a lead id (card) or a column id
    const fromStage = findStageForLead(active.id);
    // Determine target stage: if over.id is a column id → that column; else find the column of that card
    const toStage = LEAD_STAGES.includes(over.id)
      ? over.id
      : findStageForLead(over.id);

    if (!fromStage || !toStage || fromStage === toStage) return;

    // Optimistic update
    setLeads(prev => prev.map(l =>
      l.id === active.id ? { ...l, stage: toStage } : l,
    ));

    try {
      await updateLeadStage(active.id, toStage);
    } catch (err) {
      console.error('[LeadsKanban] Error updating stage:', err);
      // Rollback
      setLeads(prev => prev.map(l =>
        l.id === active.id ? { ...l, stage: fromStage } : l,
      ));
    }
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  const KNOWN_TAGS = ['club-migrado', 'checkout-backfill', 'instagram', 'facebook', 'youtube', 'telegram'];

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm font-medium">Cargando pipeline de leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtros</span>

        {/* Source filter */}
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
        >
          <option value="">Todas las fuentes</option>
          {LEAD_SOURCES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Tag filter */}
        <select
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
        >
          <option value="">Todos los tags</option>
          {KNOWN_TAGS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Score min filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Score mín.</span>
          <input
            type="number"
            min="0"
            max="100"
            value={filterScoreMin}
            onChange={e => setFilterScoreMin(e.target.value)}
            placeholder="0"
            className="w-16 text-xs border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
          />
        </div>

        {/* Clear filters */}
        {(filterSource || filterTag || filterScoreMin) && (
          <button
            onClick={() => { setFilterSource(''); setFilterTag(''); setFilterScoreMin(''); }}
            className="text-xs text-coral font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}

        {/* Total count */}
        <span className="ml-auto text-xs text-gray-400 font-medium">
          {filteredLeads.length} de {leads.length} leads
        </span>

        {/* Refresh */}
        <button
          onClick={loadLeads}
          className="text-xs text-gray-500 hover:text-coral transition-colors bg-transparent border-none cursor-pointer font-medium"
          title="Refrescar"
        >
          🔄
        </button>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                leads={byStage[col.id] || []}
                onLeadClick={onLeadClick || (() => {})}
              />
            ))}
          </div>

          {/* Drag overlay: renders floating card while dragging */}
          <DragOverlay>
            {activeLead ? (
              <div className="opacity-95 rotate-1 scale-105">
                <LeadCard lead={activeLead} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
