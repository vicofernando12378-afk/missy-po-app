import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppFloat from '../shared/WhatsAppFloat'
import CartFloat from '../shared/CartFloat'
import CartDrawer from '../cart/CartDrawer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Flotantes y overlays globales */}
      <WhatsAppFloat />
      <CartFloat />
      <CartDrawer />
    </div>
  )
}
