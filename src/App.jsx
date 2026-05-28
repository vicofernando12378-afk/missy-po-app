import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Vistas del Panel Administrativo
import AdminLayout from './pages/admin/AdminLayout'
import PedidosDashboard from './pages/admin/PedidosDashboard'
import CajaDiaria from './pages/admin/CajaDiaria'
import InventarioStock from './pages/admin/InventarioStock'
import ConfiguracionEnviosCupones from './pages/admin/ConfiguracionEnviosCupones'
import ProductosCRUD from './pages/admin/ProductosCRUD'
import VentasDashboard from './pages/admin/VentasDashboard'
import ResenasDashboard from './pages/admin/ResenasDashboard'

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
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PedidosDashboard />} />
          <Route path="caja" element={<CajaDiaria />} />
          <Route path="inventario" element={<InventarioStock />} />
          <Route path="configuracion" element={<ConfiguracionEnviosCupones />} />
          <Route path="productos" element={<ProductosCRUD />} />
          <Route path="ventas" element={<VentasDashboard />} />
          <Route path="resenas" element={<ResenasDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
