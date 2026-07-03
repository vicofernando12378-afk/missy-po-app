import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import CampaignBuilder from '../../components/admin/crm/CampaignBuilder';
import CampaignList from '../../components/admin/crm/CampaignList';
import LeadDetailDrawer from '../../components/admin/crm/LeadDetailDrawer';
import LeadsKanban from '../../components/admin/crm/LeadsKanban';
import SegmentBuilder from '../../components/admin/crm/SegmentBuilder';
import SegmentList from '../../components/admin/crm/SegmentList';
import TelegramAgentPanel from '../../components/admin/crm/TelegramAgentPanel';
import ClubMembersTab from '../../components/admin/CVRMTabs/ClubMembersTab';
import PointsTab from '../../components/admin/CVRMTabs/PointsTab';
import { db } from '../../services/firebase';

// Configuración de pestañas
const TABS = [
  { id: 'miembros', label: 'Miembros del Club', icon: '👥', active: true },
  { id: 'leads', label: 'Seguimiento de Leads', icon: '🎯', active: true, tooltip: 'Carrito abandonado, consultas WhatsApp, registros del club' },
  { id: 'campanas', label: 'Campañas & Email', icon: '✉️', active: true },
  { id: 'puntos', label: 'Puntos & Lealtad', icon: '⭐', active: true },
  { id: 'segmentacion', label: 'Segmentación', icon: '🏷️', active: true },
  { id: 'bot_telegram', label: 'Agente Telegram', icon: '🤖', active: true },
];


export default function CVRMDashboard() {
  const [activeTab, setActiveTab] = useState('miembros');
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    tutor: '',
    mascota: '',
    email: '',
    benefit: 'Registro Manual Admin',
  });

  // Popups/Modales del Socio
  const [detailMember, setDetailMember] = useState(null);
  const [editMember, setEditMember] = useState(null);

  // Configuración del club y puntos
  const [configClub, setConfigClub] = useState({
    solesPorDiezPuntos: 10,
    tipoPremio: 'monto_fijo',
    valorDescuento: 10,
    puntosRequeridos: 200,
    minCompraAplicarCanje: 50,
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Asignar puntos
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [pointsToAward, setPointsToAward] = useState('');
  const [awardReason, setAwardReason] = useState('Campaña Redes Sociales');
  const [savingPoints, setSavingPoints] = useState(false);

  // CRM Leads drawer
  const [selectedLead, setSelectedLead] = useState(null);

  // CRM Segments & Campaigns state
  const [currentSegment, setCurrentSegment] = useState(null); // null = list, {} = new, object = edit
  const [currentCampaign, setCurrentCampaign] = useState(null); // null = list, {} = new, object = edit

  // Búsqueda interactiva y ordenamiento alfabético de socio en asignación de puntos
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchFilteredMiembros = miembros
    .filter(m => {
      const q = memberSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (m.nombre_tutor || '').toLowerCase().includes(q) ||
        (m.nombre_mascota || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.nombre_tutor || '').localeCompare(b.nombre_tutor || ''));

  // 1. Cargar miembros del Club en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'myp_club_miembros'),
      orderBy('creado_en', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({
        id: doc.id,
        puntos: 0, // default if not present
        ...doc.data(),
      }));
      setMiembros(docs);
      setLoading(false);
    }, (err) => {
      console.error('Error al obtener miembros del club:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Cargar configuración del club
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'myp_config', 'club'));
        if (snap.exists()) {
          const data = snap.data();
          setConfigClub({
            solesPorDiezPuntos: data.solesPorDiezPuntos ?? 10,
            tipoPremio: data.tipoPremio ?? 'monto_fijo',
            valorDescuento: data.valorDescuento ?? 10,
            puntosRequeridos: data.puntosRequeridos ?? 200,
            minCompraAplicarCanje: data.minCompraAplicarCanje ?? 50,
          });
        }
      } catch (err) {
        console.error('Error al cargar config del club:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // 3. Filtrar miembros por búsqueda
  const filteredMiembros = miembros.filter(m => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (m.nombre_tutor || '').toLowerCase().includes(query) ||
      (m.nombre_mascota || '').toLowerCase().includes(query) ||
      (m.email || '').toLowerCase().includes(query) ||
      (m.benefit_origen || '').toLowerCase().includes(query)
    );
  });

  // 4. Eliminar miembro
  const handleDelete = async (id, tutor, mascota) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${tutor} (mascota: ${mascota}) del Club?`)) return;
    try {
      await deleteDoc(doc(db, 'myp_club_miembros', id));
    } catch (err) {
      console.error('Error al eliminar miembro:', err);
      alert('No se pudo eliminar al miembro. Por favor, intenta de nuevo.');
    }
  };

  // 5. Agregar miembro manualmente
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.tutor.trim() || !newMember.mascota.trim() || !newMember.email.trim()) {
      alert('Por favor rellena todos los campos obligatorios.');
      return;
    }

    setSavingMember(true);
    try {
      await addDoc(collection(db, 'myp_club_miembros'), {
        nombre_tutor: newMember.tutor.trim(),
        nombre_mascota: newMember.mascota.trim(),
        email: newMember.email.trim(),
        benefit_origen: newMember.benefit || 'Registro Manual Admin',
        puntos: 0,
        creado_en: serverTimestamp(),
      });

      setShowAddModal(false);
      setNewMember({ tutor: '', mascota: '', email: '', benefit: 'Registro Manual Admin' });
    } catch (err) {
      console.error('Error al agregar miembro:', err);
      alert('Error al agregar miembro manualmente.');
    } finally {
      setSavingMember(false);
    }
  };

  // 5.5 Editar miembro
  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    if (!editMember.nombre_tutor.trim() || !editMember.nombre_mascota.trim() || !editMember.email.trim()) {
      alert('Por favor rellena los campos obligatorios.');
      return;
    }
    setSavingMember(true);
    try {
      await updateDoc(doc(db, 'myp_club_miembros', editMember.id), {
        nombre_tutor: editMember.nombre_tutor.trim(),
        nombre_mascota: editMember.nombre_mascota.trim(),
        email: editMember.email.trim(),
        celular: editMember.celular || '',
        direccion: editMember.direccion || '',
        documento_tipo: editMember.documento_tipo || 'DNI',
        documento_numero: editMember.documento_numero || '',
        departamento: editMember.departamento || '',
        distrito: editMember.distrito || '',
        benefit_origen: editMember.benefit_origen || 'General',
        actualizado_en: serverTimestamp(),
      });
      setEditMember(null);
      alert('Socio actualizado con éxito.');
    } catch (err) {
      console.error('Error al editar miembro:', err);
      alert('Error al guardar cambios.');
    } finally {
      setSavingMember(false);
    }
  };

  // 6. Guardar Configuración de Puntos
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await setDoc(doc(db, 'myp_config', 'club'), {
        solesPorDiezPuntos: parseFloat(configClub.solesPorDiezPuntos) || 0,
        tipoPremio: configClub.tipoPremio,
        valorDescuento: parseFloat(configClub.valorDescuento) || 0,
        puntosRequeridos: parseInt(configClub.puntosRequeridos) || 0,
        minCompraAplicarCanje: parseFloat(configClub.minCompraAplicarCanje) || 0,
        actualizado_en: serverTimestamp(),
      }, { merge: true });
      alert('Configuración de puntos guardada correctamente.');
    } catch (err) {
      console.error('Error al guardar la configuración:', err);
      alert('Error al guardar la configuración.');
    } finally {
      setSavingConfig(false);
    }
  };

  // 7. Otorgar Puntos de Regalo / Lealtad
  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert('Por favor selecciona un miembro.');
      return;
    }
    const pointsNum = parseInt(pointsToAward);
    if (isNaN(pointsNum) || pointsNum === 0) {
      alert('Por favor ingresa una cantidad de puntos válida (distinta de cero).');
      return;
    }

    setSavingPoints(true);
    try {
      const memberRef = doc(db, 'myp_club_miembros', selectedMemberId);
      const memberDoc = miembros.find(m => m.id === selectedMemberId);
      if (!memberDoc) throw new Error('Miembro no encontrado');

      const currentPoints = parseInt(memberDoc.puntos) || 0;
      const newPoints = currentPoints + pointsNum;

      // 1. Actualizar puntos acumulados en la ficha del socio
      await updateDoc(memberRef, {
        puntos: newPoints,
        actualizado_en: serverTimestamp(),
      });

      // 2. Guardar registro en el historial de puntos (subcolección puntos_logs)
      await addDoc(collection(db, 'myp_club_miembros', selectedMemberId, 'puntos_logs'), {
        puntos: pointsNum,
        motivo: awardReason.trim(),
        creado_en: serverTimestamp(),
      });

      alert(`Se han asignado ${pointsNum} puntos a ${memberDoc.nombre_tutor} con éxito.`);
      setPointsToAward('');
      setSelectedMemberId('');
      setMemberSearchQuery('');
      setAwardReason('Campaña Redes Sociales');
    } catch (err) {
      console.error('Error al asignar puntos:', err);
      alert('Error al asignar puntos al socio.');
    } finally {
      setSavingPoints(false);
    }
  };

  // 8. Exportar a CSV
  const handleExportCSV = () => {
    if (miembros.length === 0) {
      alert('No hay miembros para exportar.');
      return;
    }

    const headers = ['Nombre Tutor', 'Mascota (Alias)', 'Email', 'Beneficio Origen', 'Puntos Acumulados', 'Fecha Registro'];
    const rows = miembros.map(m => [
      m.nombre_tutor || '',
      m.nombre_mascota || '',
      m.email || '',
      m.benefit_origen || '',
      m.puntos || 0,
      m.creado_en ? new Date(m.creado_en.seconds * 1000).toLocaleString('es-PE') : 'Sin fecha',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `miembros_club_missypo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contar registros de hoy
  const registrosHoy = miembros.filter(m => {
    if (!m.creado_en) return false;
    const date = new Date(m.creado_en.seconds * 1000);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  // Obtener ranking de socios ordenados por puntos desc
  const rankingMiembros = [...miembros].sort((a, b) => (parseInt(b.puntos) || 0) - (parseInt(a.puntos) || 0));

  // 9. Guardar / Editar Segmento
  const handleSaveSegment = async (payload) => {
    try {
      if (currentSegment?.id) {
        // Edit existing segment
        const segRef = doc(db, 'crm_segments', currentSegment.id);
        await updateDoc(segRef, {
          name: payload.name,
          description: payload.description,
          rules: payload.rules,
          leadIds: payload.leadIds,
          leadCount: payload.leadIds.length,
          lastComputedAt: serverTimestamp(),
        });
        alert('Segmento actualizado correctamente.');
      } else {
        // Create new segment
        await addDoc(collection(db, 'crm_segments'), {
          name: payload.name,
          description: payload.description,
          rules: payload.rules,
          leadIds: payload.leadIds,
          leadCount: payload.leadIds.length,
          lastComputedAt: serverTimestamp(),
        });
        alert('Segmento creado con éxito.');
      }
      setCurrentSegment(null); // Return to list view
    } catch (err) {
      console.error('[CVRMDashboard] Error saving segment:', err);
      alert('Error al guardar el segmento.');
    }
  };

  // 10. Guardar / Editar Campaña
  const handleSaveCampaign = async (payload) => {
    try {
      if (currentCampaign?.id) {
        // Edit existing campaign
        const campRef = doc(db, 'crm_campaigns', currentCampaign.id);
        await updateDoc(campRef, {
          name: payload.name,
          segmentId: payload.segmentId,
          subject: payload.subject,
          templateHtml: payload.templateHtml,
          updatedAt: serverTimestamp(),
        });
        alert('Campaña actualizada correctamente.');
      } else {
        // Create new campaign
        await addDoc(collection(db, 'crm_campaigns'), {
          name: payload.name,
          segmentId: payload.segmentId,
          subject: payload.subject,
          templateHtml: payload.templateHtml,
          channel: 'email',
          status: 'borrador',
          stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert('Campaña creada con éxito.');
      }
      setCurrentCampaign(null); // Return to list view
    } catch (err) {
      console.error('[CVRMDashboard] Error saving campaign:', err);
      alert('Error al guardar la campaña.');
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-coral uppercase tracking-wider">
            <span>👥</span> CVRM / Gestión del Club
          </div>
          <h1 className="font-brand text-3xl text-gray-800 leading-tight">
            Club Visitor Relationship Manager
          </h1>
          <p className="text-sm text-gray-400">
            Monitorea el crecimiento de tu comunidad, capta leads y fideliza a los tutores de mascotas.
          </p>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral text-white rounded-2xl hover:bg-coral-dark font-semibold text-sm transition-all shadow-md shadow-coral/10 cursor-pointer border-none"
          >
            ✨ Agregar Miembro
          </button>
        </div>
      </div>

      {/* Menú de Pestañas */}
      <div className="border-b border-gray-200 flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.active && setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all relative group cursor-pointer ${
              activeTab === tab.id
                ? 'border-coral text-coral bg-coral/5 rounded-t-2xl'
                : tab.active
                  ? 'border-transparent text-gray-500 hover:text-gray-800'
                  : 'border-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {!tab.active && (
              <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1">
                Próximamente
              </span>
            )}
            {tab.tooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded-xl shadow-lg z-30 leading-snug">
                {tab.tooltip}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Contenido según Pestaña Activa */}
      {activeTab === 'miembros' && (
        <ClubMembersTab
          miembros={miembros}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredMiembros={filteredMiembros}
          setDetailMember={setDetailMember}
          setEditMember={setEditMember}
          handleDelete={handleDelete}
          registrosHoy={registrosHoy}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          newMember={newMember}
          setNewMember={setNewMember}
          savingMember={savingMember}
          handleAddMemberSubmit={handleAddMemberSubmit}
          handleExportCSV={handleExportCSV}
          detailMember={detailMember}
          editMember={editMember}
          handleEditMemberSubmit={handleEditMemberSubmit}
        />
      )}

      {/* Pestaña: Seguimiento de Leads — CRM Kanban */}
      {activeTab === 'leads' && (
        <>
          <LeadsKanban onLeadClick={setSelectedLead} />
          {selectedLead && (
            <LeadDetailDrawer
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onLeadUpdated={() => setSelectedLead(null)}
            />
          )}
        </>
      )}

      {/* UNUSED — replaced by ClubMembersTab — kept to satisfy original structure reference */}
      {false && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Miembros</p>
                <h3 className="text-3xl font-brand text-gray-800 mt-1">{miembros.length}</h3>
              </div>
              <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral text-2xl">
                👥
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrados Hoy</p>
                <h3 className="text-3xl font-brand text-green-600 mt-1">+{registrosHoy}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 text-2xl">
                📈
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen de Conversión</p>
                <h3 className="text-lg font-semibold text-gray-800 mt-2 truncate max-w-[180px]">
                  {miembros.length > 0 
                    ? [...new Set(miembros.map(m => m.benefit_origen).filter(Boolean))]
                        .map(b => ({ name: b, count: miembros.filter(m => m.benefit_origen === b).length }))
                        .sort((a,b) => b.count - a.count)[0]?.name || 'Web'
                    : 'Ninguno'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-2xl">
                📍
              </div>
            </div>
          </div>

          {/* Listado de Miembros */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Buscador */}
            <div className="p-6 border-b border-gray-50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por tutor, mascota, correo o beneficio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 text-sm font-medium">Cargando comunidad...</p>
              </div>
            ) : filteredMiembros.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <div className="text-5xl">🐾</div>
                <h4 className="text-gray-800 font-semibold text-base">No se encontraron miembros</h4>
                <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Prueba cambiando los filtros de búsqueda o agrega un miembro manualmente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Tutor</th>
                      <th className="px-6 py-4">Mascota (Alias)</th>
                      <th className="px-6 py-4">Contacto</th>
                      <th className="px-6 py-4">Beneficio de Interés</th>
                      <th className="px-6 py-4 text-center">Puntos</th>
                      <th className="px-6 py-4">Registro</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredMiembros.map((miembro) => (
                      <tr key={miembro.id} className="hover:bg-gray-50/50 transition-colors">
                        <td 
                          onClick={() => setDetailMember(miembro)}
                          className="px-6 py-4 font-semibold text-gray-800 cursor-pointer hover:text-coral hover:underline"
                          title="Click para ver ficha completa del socio"
                        >
                          {miembro.nombre_tutor}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/5 text-coral rounded-full text-xs font-bold font-ui">
                            🐾 {miembro.nombre_mascota}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {miembro.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                            {miembro.benefit_origen || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-700">
                          {miembro.puntos || 0}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                          {miembro.creado_en 
                            ? new Date(miembro.creado_en.seconds * 1000).toLocaleDateString('es-PE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <button
                            onClick={() => setEditMember({
                              id: miembro.id,
                              nombre_tutor: miembro.nombre_tutor || '',
                              nombre_mascota: miembro.nombre_mascota || '',
                              email: miembro.email || '',
                              celular: miembro.celular || '',
                              direccion: miembro.direccion || '',
                              documento_tipo: miembro.documento_tipo || 'DNI',
                              documento_numero: miembro.documento_numero || '',
                              departamento: miembro.departamento || '',
                              distrito: miembro.distrito || '',
                              benefit_origen: miembro.benefit_origen || 'General',
                            })}
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                            title="Editar socio"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(miembro.id, miembro.nombre_tutor, miembro.nombre_mascota)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                            title="Dar de baja miembro"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña: Puntos y Lealtad */}
      {activeTab === 'puntos' && (
        <PointsTab
          configClub={configClub}
          setConfigClub={setConfigClub}
          loadingConfig={loadingConfig}
          savingConfig={savingConfig}
          handleSaveConfig={handleSaveConfig}
          miembros={miembros}
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          pointsToAward={pointsToAward}
          setPointsToAward={setPointsToAward}
          awardReason={awardReason}
          setAwardReason={setAwardReason}
          savingPoints={savingPoints}
          handleAwardPoints={handleAwardPoints}
          memberSearchQuery={memberSearchQuery}
          setMemberSearchQuery={setMemberSearchQuery}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          searchFilteredMiembros={searchFilteredMiembros}
          rankingMiembros={rankingMiembros}
        />
      )}

      {/* UNUSED — replaced by PointsTab — kept to satisfy original structure reference */}
      {false && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: Configuración de Reglas (Acumulación y Canje) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Panel 1: Reglas de Puntos y Club */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
                    ⚙️ Reglas de Puntos y Club
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Establece las tasas de acumulación de puntos del club de beneficios.
                  </p>

                  {loadingConfig ? (
                    <div className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                          Monto de Compra en Soles por cada 10 puntos ganados
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          required
                          value={configClub.solesPorDiezPuntos}
                          onChange={(e) => setConfigClub(prev => ({ ...prev, solesPorDiezPuntos: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                          placeholder="Ej. 10"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingConfig}
                        className="w-full py-3.5 mt-2 bg-gray-850 hover:bg-gray-900 text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-gray-850/10 text-sm"
                      >
                        {savingConfig ? 'Guardando...' : 'Guardar Configuración 💾'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Panel 2: Reglas de Canje y Cupones (Nuevo) */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
                    🎟️ Reglas de Canje y Cupones
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Configura los valores de conversión y condiciones para que los clientes canjeen sus puntos.
                  </p>

                  {loadingConfig ? (
                    <div className="py-8 text-center">
                      <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                          Tipo de Premio
                        </label>
                        <select
                          value={configClub.tipoPremio}
                          onChange={(e) => setConfigClub(prev => ({ ...prev, tipoPremio: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                        >
                          <option value="monto_fijo">Monto Fijo (S/.)</option>
                          <option value="porcentaje">Porcentaje (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                          Valor del Descuento
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          required
                          value={configClub.valorDescuento}
                          onChange={(e) => setConfigClub(prev => ({ ...prev, valorDescuento: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                          placeholder="Ej. 10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                          Puntos Requeridos
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={configClub.puntosRequeridos}
                          onChange={(e) => setConfigClub(prev => ({ ...prev, puntosRequeridos: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                          placeholder="Ej. 200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                          Monto Mínimo de Compra para aplicar canje (S/.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          required
                          value={configClub.minCompraAplicarCanje}
                          onChange={(e) => setConfigClub(prev => ({ ...prev, minCompraAplicarCanje: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                          placeholder="Ej. 50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingConfig}
                        className="w-full py-3.5 mt-2 bg-gray-850 hover:bg-gray-900 text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-gray-850/10 text-sm"
                      >
                        {savingConfig ? 'Guardando...' : 'Guardar Configuración 💾'}
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>

            {/* Panel 2: Otorgar Puntos (Campaña, Redes Sociales, Concursos) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
                  ✨ Otorgar Puntos de Regalo y Lealtad
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Premia a tus socios por interactuar en redes, ganar sorteos o campañas específicas.
                </p>

                <form onSubmit={handleAwardPoints} className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Seleccionar Socio Miembro
                    </label>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Escribe para buscar por tutor, mascota o correo..."
                        value={memberSearchQuery}
                        onChange={(e) => {
                          setMemberSearchQuery(e.target.value);
                          setDropdownOpen(true);
                          if (selectedMemberId) {
                            setSelectedMemberId('');
                          }
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      />
                      
                      {/* Icono de estado / limpiar */}
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-gray-400">
                        {selectedMemberId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberId('');
                              setMemberSearchQuery('');
                            }}
                            className="text-gray-400 hover:text-gray-600 font-bold bg-transparent border-none cursor-pointer text-xs p-1"
                          >
                            ✕
                          </button>
                        ) : (
                          <span className="text-xs">🔍</span>
                        )}
                      </div>
                    </div>

                    {/* Dropdown flotante con resultados */}
                    {dropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setDropdownOpen(false)}
                        />
                        
                        <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-gray-150 rounded-2xl shadow-xl z-20 divide-y divide-gray-50 animate-fade-in">
                          {searchFilteredMiembros.length === 0 ? (
                            <div className="px-4 py-3.5 text-xs text-gray-400 text-center font-medium">
                              No se encontraron socios
                            </div>
                          ) : (
                            searchFilteredMiembros.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMemberId(m.id);
                                  setMemberSearchQuery(`${m.nombre_tutor} (Mascota: ${m.nombre_mascota}) - ${m.email}`);
                                  setDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-xs hover:bg-coral/5 transition-colors cursor-pointer border-none block ${
                                  selectedMemberId === m.id ? 'bg-coral/10 font-semibold text-coral' : 'text-gray-700 bg-white'
                                }`}
                              >
                                <span className="font-semibold text-gray-805 block">
                                  {m.nombre_tutor} <span className="text-gray-400 font-normal">({m.email})</span>
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">
                                  🐾 Mascota: <span className="font-semibold text-coral">{m.nombre_mascota}</span> | Saldo: <span className="font-bold text-gray-600">{m.puntos || 0} pts</span>
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        Puntos a Asignar (pueden ser negativos para restar)
                      </label>
                      <input
                        type="number"
                        required
                        value={pointsToAward}
                        onChange={(e) => setPointsToAward(e.target.value)}
                        placeholder="Ej. 100 o -50"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                        Motivo / Campaña / Concurso
                      </label>
                      <input
                        type="text"
                        required
                        value={awardReason}
                        onChange={(e) => setAwardReason(e.target.value)}
                        placeholder="Ej. Sorteo Instagram Aniversario"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPoints}
                    className="w-full py-3.5 mt-2 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-coral/15 text-sm font-ui"
                  >
                    {savingPoints ? 'Procesando...' : 'Otorgar Puntos al Socio ✨'}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Ranking de Socios */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-brand text-lg text-gray-800">🥇 Ranking de Socios Missy & Po</h3>
                <p className="text-xs text-gray-400">Tabla de clasificación ordenada por los puntos acumulados por lealtad.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-20">Rango</th>
                    <th className="px-6 py-4">Tutor</th>
                    <th className="px-6 py-4">Mascota (Alias)</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Origen Club</th>
                    <th className="px-6 py-4 text-center">Puntos Acumulados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {rankingMiembros.map((miembro, index) => {
                    const rank = index + 1;
                    let medal = '';
                    if (rank === 1) medal = '🥇';
                    else if (rank === 2) medal = '🥈';
                    else if (rank === 3) medal = '🥉';

                    return (
                      <tr key={miembro.id} className={`hover:bg-gray-50/50 transition-colors ${rank <= 3 ? 'bg-amber-50/10' : ''}`}>
                        <td className="px-6 py-4 text-center font-bold text-base">
                          {medal ? (
                            <span title={`Rango ${rank}`} className="text-xl">{medal}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">{rank}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {miembro.nombre_tutor}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/5 text-coral rounded-full text-xs font-bold font-ui">
                            🐾 {miembro.nombre_mascota}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {miembro.email}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-400">
                          {miembro.benefit_origen || 'General'}
                        </td>
                        <td className="px-6 py-4 text-center font-black text-coral text-base">
                          {miembro.puntos || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña: Segmentación */}
      {activeTab === 'segmentacion' && (
        currentSegment ? (
          <SegmentBuilder
            segment={currentSegment.id ? currentSegment : null}
            onSave={handleSaveSegment}
            onCancel={() => setCurrentSegment(null)}
          />
        ) : (
          <SegmentList
            onCreateNew={() => setCurrentSegment({})}
            onEditSegment={setCurrentSegment}
          />
        )
      )}

      {/* Pestaña: Campañas & Email */}
      {activeTab === 'campanas' && (
        currentCampaign ? (
          <CampaignBuilder
            campaign={currentCampaign.id ? currentCampaign : null}
            onSave={handleSaveCampaign}
            onCancel={() => setCurrentCampaign(null)}
          />
        ) : (
          <CampaignList
            onCreateNew={() => setCurrentCampaign({})}
            onEditCampaign={setCurrentCampaign}
          />
        )
      )}

      {/* Pestaña: Agente Telegram */}
      {activeTab === 'bot_telegram' && (
        <TelegramAgentPanel />
      )}

      {/* Otras Pestañas: En Construcción */}
      {activeTab !== 'miembros' && activeTab !== 'puntos' && activeTab !== 'leads' && activeTab !== 'segmentacion' && activeTab !== 'campanas' && activeTab !== 'bot_telegram' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="text-6xl">🚀</div>
          <h3 className="text-xl font-brand text-gray-800">Sección en Construcción</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Estamos integrando funcionalidades CRM premium (embudos de carritos abandonados e historial completo de interacciones) para optimizar la retención de clientes.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-coral/10 text-coral font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
              Módulo de Comercio Electrónico
            </span>
          </div>
        </div>
      )}



      {/* Modal de Registro Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-8 relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >
              ✕
            </button>

            <div className="inline-flex items-center gap-1.5 bg-red-50 text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 text-coral border border-red-200/20">
              👥 CVRM Admin
            </div>

            <h3 className="font-brand text-2xl mb-1 text-gray-800">
              Registrar Miembro
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Añade un tutor y su mascota directamente al Club de Beneficios.
            </p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre del tutor</label>
                <input
                  type="text"
                  required
                  value={newMember.tutor}
                  onChange={(e) => setNewMember(prev => ({ ...prev, tutor: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre de la Mascota (Alias)</label>
                <input
                  type="text"
                  required
                  value={newMember.mascota}
                  onChange={(e) => setNewMember(prev => ({ ...prev, mascota: e.target.value }))}
                  placeholder="Ej. Firulais"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. juan@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Origen / Beneficio</label>
                <select
                  value={newMember.benefit}
                  onChange={(e) => setNewMember(prev => ({ ...prev, benefit: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                >
                  <option value="Registro Manual Admin">Registro Manual Admin</option>
                  <option value="Missy & Po Puntos">Missy & Po Puntos</option>
                  <option value="Descuentos Exclusivos">Descuentos Exclusivos</option>
                  <option value="Regalo de Cumpleaños">Regalo de Cumpleaños</option>
                  <option value="Acceso Anticipado">Acceso Anticipado</option>
                  <option value="Contenido Missy & Po TV">Contenido Missy & Po TV</option>
                  <option value="Atención Prioritaria">Atención Prioritaria</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingMember}
                className="w-full py-4.5 mt-2 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
              >
                {savingMember ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  'Registrar Miembro ✨'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ficha de Detalles del Socio */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-8 relative animate-scale-up">
            <button
              onClick={() => setDetailMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🐾</span>
              <div>
                <h3 className="font-brand text-2xl text-gray-800 leading-tight">
                  Ficha del Socio
                </h3>
                <p className="text-xs text-gray-400">
                  Historial y datos consolidados del Club.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-body border-t border-b border-gray-150 py-4 my-4 leading-relaxed">
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Tutor</span>
                <span className="text-gray-850 font-bold block">{detailMember.nombre_tutor || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Mascota</span>
                <span className="text-coral font-bold block">🐾 {detailMember.nombre_mascota || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Correo Electrónico</span>
                <span className="text-gray-800 font-medium block truncate" title={detailMember.email}>{detailMember.email || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Celular</span>
                <span className="text-gray-800 font-medium block">{detailMember.celular || 'No registrado'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 font-semibold uppercase block">Dirección de Entrega</span>
                <span className="text-gray-800 font-medium block">
                  {detailMember.direccion ? (
                    `${detailMember.direccion}${detailMember.distrito ? `, ${detailMember.distrito}` : ''}${detailMember.departamento ? `, ${detailMember.departamento}` : ''}`
                  ) : 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Documento de Identidad</span>
                <span className="text-gray-800 font-medium block">
                  {detailMember.documento_tipo && detailMember.documento_numero 
                    ? `${detailMember.documento_tipo}: ${detailMember.documento_numero}` 
                    : 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Puntos Acumulados</span>
                <span className="text-lg font-black text-coral block">{detailMember.puntos || 0} pts</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Origen del Registro</span>
                <span className="text-gray-800 font-medium block bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-lg inline-block">
                  {detailMember.benefit_origen || 'General'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold uppercase block">Fecha de Registro</span>
                <span className="text-gray-800 font-medium block">
                  {detailMember.creado_en 
                    ? new Date(detailMember.creado_en.seconds * 1000).toLocaleString('es-PE') 
                    : 'No disponible'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailMember(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-coral text-white rounded-xl font-bold text-xs shadow transition-all cursor-pointer border-none"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Socio */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-8 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-brand text-2xl text-gray-800 leading-tight">
                  Editar Socio
                </h3>
                <p className="text-xs text-gray-400">
                  Modifica los datos del tutor y de la mascota en el Club.
                </p>
              </div>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Nombre del tutor *</label>
                  <input
                    type="text"
                    required
                    value={editMember.nombre_tutor}
                    onChange={(e) => setEditMember(prev => ({ ...prev, nombre_tutor: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Nombre de la Mascota *</label>
                  <input
                    type="text"
                    required
                    value={editMember.nombre_mascota}
                    onChange={(e) => setEditMember(prev => ({ ...prev, nombre_mascota: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={editMember.email}
                    onChange={(e) => setEditMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Celular</label>
                  <input
                    type="tel"
                    value={editMember.celular}
                    onChange={(e) => setEditMember(prev => ({ ...prev, celular: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Dirección</label>
                  <input
                    type="text"
                    value={editMember.direccion}
                    onChange={(e) => setEditMember(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Departamento</label>
                  <input
                    type="text"
                    value={editMember.departamento}
                    onChange={(e) => setEditMember(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Distrito / Ciudad</label>
                  <input
                    type="text"
                    value={editMember.distrito}
                    onChange={(e) => setEditMember(prev => ({ ...prev, distrito: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Tipo de Documento</label>
                  <select
                    value={editMember.documento_tipo}
                    onChange={(e) => setEditMember(prev => ({ ...prev, documento_tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral bg-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Número Documento</label>
                  <input
                    type="text"
                    value={editMember.documento_numero}
                    onChange={(e) => setEditMember(prev => ({ ...prev, documento_numero: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-500 uppercase mb-1">Origen / Beneficio</label>
                <select
                  value={editMember.benefit_origen}
                  onChange={(e) => setEditMember(prev => ({ ...prev, benefit_origen: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral bg-white"
                >
                  <option value="Registro Manual Admin">Registro Manual Admin</option>
                  <option value="Registro Automático Compra">Registro Automático Compra</option>
                  <option value="Missy & Po Puntos">Missy & Po Puntos</option>
                  <option value="Descuentos Exclusivos">Descuentos Exclusivos</option>
                  <option value="Regalo de Cumpleaños">Regalo de Cumpleaños</option>
                  <option value="Acceso Anticipado">Acceso Anticipado</option>
                  <option value="Contenido Missy & Po TV">Contenido Missy & Po TV</option>
                  <option value="Atención Prioritaria">Atención Prioritaria</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="px-5 py-2 border border-gray-200 text-gray-500 rounded-xl font-bold cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="px-6 py-2 bg-coral text-white rounded-xl font-bold transition-all hover:bg-coral-dark shadow-md cursor-pointer border-none"
                >
                  {savingMember ? 'Guardando...' : 'Guardar Cambios 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
