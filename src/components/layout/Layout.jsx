import { Outlet } from 'react-router-dom';

import CartDrawer from '../cart/CartDrawer';
import CartFloat from '../shared/CartFloat';
import WhatsAppFloat from '../shared/WhatsAppFloat';

import Footer from './Footer';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
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
  );
}
