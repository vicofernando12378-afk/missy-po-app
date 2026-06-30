import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Lazy loading de componentes admin
const AdminLayout = lazy(() => import('../../pages/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('../../pages/admin/AdminLoginPage'))
const PedidosDashboard = lazy(() => import('../../pages/admin/PedidosDashboard'))
const CajaDiaria = lazy(() => import('../../pages/admin/CajaDiaria'))
const InventarioStock = lazy(() => import('../../pages/admin/InventarioStock'))
const ConfiguracionEnviosCupones = lazy(() => import('../../pages/admin/ConfiguracionEnviosCupones'))
const ProductosCRUD = lazy(() => import('../../pages/admin/ProductosCRUD'))
const VentasDashboard = lazy(() => import('../../pages/admin/VentasDashboard'))
const ResenasDashboard = lazy(() => import('../../pages/admin/ResenasDashboard'))
const CVRMDashboard = lazy(() => import('../../pages/admin/CVRMDashboard'))

const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function AdminApp() {
  return (
    <BrowserRouter basename="/admin">
      <Suspense fallback={<AdminLoader />}>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<PedidosDashboard />} />
            <Route path="caja" element={<CajaDiaria />} />
            <Route path="inventario" element={<InventarioStock />} />
            <Route path="configuracion" element={<ConfiguracionEnviosCupones />} />
            <Route path="productos" element={<ProductosCRUD />} />
            <Route path="ventas" element={<VentasDashboard />} />
            <Route path="resenas" element={<ResenasDashboard />} />
            <Route path="cvrm" element={<CVRMDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
