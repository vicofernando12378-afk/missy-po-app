/**
 * LeadCard.jsx — Draggable card for a single lead in the Kanban board.
 * Shows: name, pet, source icon, score badge, last interaction delta.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Source icon mapping
const SOURCE_ICONS = {
  whatsapp: '💬',
  telegram: '✈️',
  instagram: '📷',
  facebook: '👤',
  tiktok: '🎵',
  youtube: '▶️',
  web: '🌐',
  manual: '✏️',
  club: '⭐',
};

// Score color
function scoreColor(score) {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-100';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-gray-500 bg-gray-50 border-gray-100';
}

// Relative time helper
function relativeTime(ts) {
  if (!ts) return null;
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}m`;
  return 'ahora';
}

export default function LeadCard({ lead, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-coral/30 transition-all group select-none"
    >
      {/* Header: name + source icon */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-coral transition-colors">
            {lead.name}
          </p>
          {lead.petName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">🐾 {lead.petName}</p>
          )}
        </div>
        <span
          className="text-base flex-shrink-0"
          title={lead.source}
        >
          {SOURCE_ICONS[lead.source] || '❓'}
        </span>
      </div>

      {/* Contact snippet */}
      {(lead.email || lead.phone) && (
        <p className="text-[11px] text-gray-400 truncate mb-2">
          {lead.email || lead.phone}
        </p>
      )}

      {/* Footer: score + last interaction */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor(lead.score ?? 0)}`}>
          {lead.score ?? 0} pts
        </span>

        {lead.tags?.includes('club-migrado') && (
          <span className="text-[10px] bg-coral/10 text-coral font-semibold px-2 py-0.5 rounded-full">Club</span>
        )}
        {lead.tags?.includes('checkout-backfill') && (
          <span className="text-[10px] bg-blue-50 text-blue-500 font-semibold px-2 py-0.5 rounded-full">Compra</span>
        )}

        {lead.lastInteractionAt && (
          <span className="text-[10px] text-gray-300 ml-auto flex-shrink-0">
            {relativeTime(lead.lastInteractionAt)}
          </span>
        )}
      </div>
    </div>
  );
}
