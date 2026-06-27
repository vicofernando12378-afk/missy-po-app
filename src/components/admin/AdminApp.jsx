import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from '../../pages/admin/AdminLayout'
import PedidosDashboard from '../../pages/admin/PedidosDashboard'
import CajaDiaria from '../../pages/admin/CajaDiaria'
import InventarioStock from '../../pages/admin/InventarioStock'
import ConfiguracionEnviosCupones from '../../pages/admin/ConfiguracionEnviosCupones'
import ProductosCRUD from '../../pages/admin/ProductosCRUD'
import VentasDashboard from '../../pages/admin/VentasDashboard'
import ResenasDashboard from '../../pages/admin/ResenasDashboard'
import CVRMDashboard from '../../pages/admin/CVRMDashboard'

export default function AdminApp() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
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
    </BrowserRouter>
  )
}
