import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProductPage from './pages/ProductPage';
import StorePage from './pages/StorePage';

// Lazy loads (admin)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const PedidosDashboard = lazy(() => import('./pages/admin/PedidosDashboard'));
const CajaDiaria = lazy(() => import('./pages/admin/CajaDiaria'));
const InventarioStock = lazy(() => import('./pages/admin/InventarioStock'));
const ConfiguracionEnviosCupones = lazy(() => import('./pages/admin/ConfiguracionEnviosCupones'));
const ProductosCRUD = lazy(() => import('./pages/admin/ProductosCRUD'));
const VentasDashboard = lazy(() => import('./pages/admin/VentasDashboard'));
const ResenasDashboard = lazy(() => import('./pages/admin/ResenasDashboard'));
const ReclamacionesDashboard = lazy(() => import('./pages/admin/ReclamacionesDashboard'));

const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de la Tienda Pública */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tienda" element={<StorePage />} />
          <Route path="producto/:slug" element={<ProductPage />} />
          <Route path="carrito" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orden-confirmada/:orderId" element={<OrderConfirmationPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Rutas del Panel de Administración */}
        <Route path="/admin" element={
          <Suspense fallback={<AdminLoader />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route index element={<Suspense fallback={<AdminLoader />}><PedidosDashboard /></Suspense>} />
          <Route path="caja" element={<Suspense fallback={<AdminLoader />}><CajaDiaria /></Suspense>} />
          <Route path="inventario" element={<Suspense fallback={<AdminLoader />}><InventarioStock /></Suspense>} />
          <Route path="configuracion" element={<Suspense fallback={<AdminLoader />}><ConfiguracionEnviosCupones /></Suspense>} />
          <Route path="productos" element={<Suspense fallback={<AdminLoader />}><ProductosCRUD /></Suspense>} />
          <Route path="ventas" element={<Suspense fallback={<AdminLoader />}><VentasDashboard /></Suspense>} />
          <Route path="resenas" element={<Suspense fallback={<AdminLoader />}><ResenasDashboard /></Suspense>} />
          <Route path="reclamaciones" element={<Suspense fallback={<AdminLoader />}><ReclamacionesDashboard /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
