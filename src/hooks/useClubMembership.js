import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../services/firebase';

export default function useClubMembership() {
  const [clubConfig, setClubConfig] = useState({
    solesPorDiezPuntos: 10,
    tipoPremio: 'monto_fijo',
    valorDescuento: 10,
    puntosRequeridos: 200,
    minCompraAplicarCanje: 50,
  });

  const [clubMember, setClubMember] = useState(null);
  const [verifyingMember, setVerifyingMember] = useState(false);
  const [pointsApplied, setPointsApplied] = useState(false);

  // Verificación manual de Socio
  const [verifyEmailInput, setVerifyEmailInput] = useState('');
  const [verifyAliasInput, setVerifyAliasInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Cargar configuración de canje del club
  useEffect(() => {
    getDoc(doc(db, 'myp_config', 'club')).then(snap => {
      if (snap.exists()) {
        setClubConfig(snap.data());
      }
    }).catch(err => console.warn('Error loading club config:', err));
  }, []);

  const handleManualVerify = async (onSuccessCallback) => {
    if (!verifyEmailInput.trim() || !verifyAliasInput.trim()) {
      setVerifyError('Ingresa el correo y el alias de tu mascota.');
      return;
    }
    setVerifyingMember(true);
    setVerifyError('');
    try {
      const q = query(
        collection(db, 'myp_club_miembros'),
        where('email', '==', verifyEmailInput.trim().toLowerCase()),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Buscar coincidencia de mascota (case insensitive)
        const matchDoc = snap.docs.find(doc => 
          (doc.data().nombre_mascota || '').trim().toLowerCase() === verifyAliasInput.trim().toLowerCase(),
        );
        
        if (matchDoc) {
          const mData = matchDoc.data();
          const memberObj = { id: matchDoc.id, ...mData };
          setClubMember(memberObj);
          setVerifyError('');
          
          if (onSuccessCallback) {
            onSuccessCallback(memberObj);
          }
        } else {
          setVerifyError('El alias de la mascota no coincide.');
        }
      } else {
        setVerifyError('Socio no registrado en el Club.');
      }
    } catch (err) {
      console.warn('Error verifying manual member:', err);
      setVerifyError('Error al conectar con el servidor.');
    } finally {
      setVerifyingMember(false);
    }
  };

  const applyPoints = () => setPointsApplied(true);
  const removePoints = () => setPointsApplied(false);

  return {
    clubConfig,
    clubMember, setClubMember,
    verifyingMember,
    pointsApplied, setPointsApplied,
    verifyEmailInput, setVerifyEmailInput,
    verifyAliasInput, setVerifyAliasInput,
    verifyError, setVerifyError,
    handleManualVerify,
    applyPoints,
    removePoints,
  };
}
