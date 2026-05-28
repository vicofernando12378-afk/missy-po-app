import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppFloat from '../shared/WhatsAppFloat'
import CartFloat from '../shared/CartFloat'
import CartDrawer from '../cart/CartDrawer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 print:p-0">
        <Outlet />
      </main>
      <div className="print:hidden">
        <Footer />
      </div>

      {/* Flotantes y overlays globales */}
      <div className="print:hidden">
        <WhatsAppFloat />
        <CartFloat />
        <CartDrawer />
      </div>
    </div>
  )
}
