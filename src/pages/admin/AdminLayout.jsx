import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import AdminSidebar from '../../components/admin/AdminSidebar';
import { listenAuth, checkIsAdmin, logout } from '../../services/auth';
import { db } from '../../services/firebase';

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pedidosNuevos, setPedidosNuevos] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = listenAuth(async (currentUser) => {
      if (currentUser) {
        if (!isMounted) return;
        setUser(currentUser);
        try {
          const admin = await checkIsAdmin(currentUser);
          if (admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            await logout();
            navigate('/login', { replace: true });
          }
        } catch (err) {
          console.error('Error al verificar roles:', err);
          setIsAdmin(false);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  // ── BADGE: Escucha pedidos en estado 'recibido' en tiempo real ──
  // Unificación de campo: estado_pedido -> estado
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, 'myp_pedidos'),
      where('estado', '==', 'recibido'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setPedidosNuevos(snap.size);
    }, (err) => {
      console.error('Error en listener de pedidos:', err);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-body">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-red-100 p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="font-brand text-2xl text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-500 font-body mb-6">
            No tienes permisos de administrador para acceder a esta sección comercial.
          </p>
          <div className="space-y-3">
            <a
              href="/"
              className="w-full block py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all text-center"
            >
              Ir a la Tienda Pública
            </a>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/',               label: 'Pedidos',           icon: '📦', end: true, badge: pedidosNuevos },
    { path: '/ventas',         label: 'Ventas / KPIs',    icon: '📊' },
    { path: '/productos',      label: 'Catálogo',          icon: '🛍️' },
    { path: '/caja',           label: 'Caja Diaria',       icon: '💰' },
    { path: '/inventario',     label: 'Inventario',      icon: '🗂️' },
    { path: '/resenas',        label: 'Reseñas',           icon: '⭐' },
    { path: '/cvrm',           label: 'Club (CVRM)',       icon: '👥' },
    { path: '/configuracion',  label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 font-body text-gray-700">
      {/* Sidebar Desktop */}
      <AdminSidebar
        user={user}
        menuItems={menuItems}
        onLogout={handleLogout}
        isMobile={false}
      />

      {/* Sidebar Mobile */}
      <AdminSidebar
        user={user}
        menuItems={menuItems}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />

      {/* Contenedor de contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-650"
            >
              ☰
            </button>
            <span className="font-brand text-lg text-gray-800">Missy & Po Admin</span>
          </div>
          <span className="text-xl">🐶</span>
        </header>

        {/* Área de contenido del panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
